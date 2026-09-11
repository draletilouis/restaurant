process.env.POSTGRES_DB_TEST = "cater_user_roles_test";
const request = require("supertest");
const { resetTestDatabase } = require("./helpers/test-db");
const { assertNotSelfApproval } = require("../src/services/approval-service");

jest.setTimeout(30000);

describe("Multiple user roles", () => {
  let app, db, admin, member, userId;
  const password = "roles-test-password";

  beforeAll(async () => {
    if (process.env.DATABASE_URL) throw new Error("Role tests require the isolated local test database.");
    await resetTestDatabase();
    ({ app, db } = require("../server"));
    admin = request.agent(app);
    expect((await admin.post("/api/auth/login").send({ username: "admin", password: "admin123" })).status).toBe(200);
  });

  afterAll(async () => { await db?.pool.end(); });

  test("creates one account with combined permissions and deduplicated roles", async () => {
    const response = await admin.post("/api/auth/users").send({
      fullName: "Multiple Roles Test", username: "multiple_roles_test", password,
      roleCodes: ["store_manager", "kitchen_supervisor", "store_manager"],
    });
    expect(response.status).toBe(201);
    userId = response.body.data.id;
    expect(response.body.data.roles.sort()).toEqual(["kitchen_supervisor", "store_manager"]);
    expect(response.body.data.permissions).toEqual(["kitchen_requisitions.approve", "stock_adjustments.approve"]);
    expect(new Set(response.body.data.permissions).size).toBe(response.body.data.permissions.length);
    member = request.agent(app);
    expect((await member.post("/api/auth/login").send({ username: "multiple_roles_test", password })).status).toBe(200);
    expect((await member.get("/api/inventory/balances")).status).toBe(200);
    const audit = await db.get("SELECT details FROM audit_logs WHERE entity_type = 'user' AND entity_id = ? AND action = 'create'", [userId]);
    expect(audit.details.roleCodes.sort()).toEqual(["kitchen_supervisor", "store_manager"]);
  });

  test("rejects invalid selections atomically on create and update", async () => {
    for (const roleCodes of [[], "manager", ["manager", "missing_role"], [null]]) {
      expect((await admin.post("/api/auth/users").send({ fullName: "Invalid Roles", username: "invalid_roles_test", password, roleCodes })).status).toBe(400);
      expect((await admin.put(`/api/auth/users/${userId}/roles`).send({ roleCodes })).status).toBe(400);
    }
    expect(await db.get("SELECT id FROM users WHERE username = 'invalid_roles_test'")).toBeNull();
    expect((await member.get("/api/auth/me")).body.user.roles.sort()).toEqual(["kitchen_supervisor", "store_manager"]);
  });

  test("requires administration rights and keeps the self-approval rule for multiple roles", async () => {
    expect((await member.put(`/api/auth/users/${userId}/roles`).send({ roleCodes: ["admin"] })).status).toBe(403);
    expect((await request(app).put(`/api/auth/users/${userId}/roles`).send({ roleCodes: ["admin"] })).status).toBe(401);
    const user = (await member.get("/api/auth/me")).body.user;
    expect(() => assertNotSelfApproval({ session: { user } }, { requested_by: userId })).toThrow("cannot approve their own");
  });

  test("updates existing sessions, revokes removed permissions, and audits before/after roles", async () => {
    const response = await admin.put(`/api/auth/users/${userId}/roles`).send({ roleCodes: ["finance_officer", "manager"] });
    expect(response.status).toBe(200);
    const current = (await member.get("/api/auth/me")).body.user;
    expect(current.roles.sort()).toEqual(["finance_officer", "manager"]);
    expect(current.permissions).toEqual([
      "payment_vouchers.approve",
      "procurement_requisitions.approve",
      "stock_adjustments.approve",
      "cash_requisitions.release",
      "cash_requisitions.settle",
    ]);
    expect((await member.get("/api/inventory/balances")).status).toBe(200);
    const audit = await db.get("SELECT details FROM audit_logs WHERE entity_type = 'user' AND entity_id = ? AND action = 'update'", [userId]);
    expect(audit.details.previousRoleCodes.sort()).toEqual(["kitchen_supervisor", "store_manager"]);
    expect(audit.details.roleCodes.sort()).toEqual(["finance_officer", "manager"]);
  });

  test("keeps the last active admin and validates target users", async () => {
    const adminId = (await admin.get("/api/auth/me")).body.user.id;
    expect((await admin.put(`/api/auth/users/${adminId}/roles`).send({ roleCodes: ["manager"] })).status).toBe(400);
    expect((await admin.put("/api/auth/users/not-an-id/roles").send({ roleCodes: ["manager"] })).status).toBe(400);
    expect((await admin.put("/api/auth/users/2147483647/roles").send({ roleCodes: ["manager"] })).status).toBe(404);
    expect((await admin.get("/api/auth/me")).body.user.roles).toContain("admin");
  });
});
