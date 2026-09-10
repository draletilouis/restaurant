const request = require("supertest");
const { resetTestDatabase } = require("./helpers/test-db");

jest.setTimeout(30000);

describe("Configuration workspace", () => {
  let app;
  let db;
  let agent;

  beforeAll(async () => {
    await resetTestDatabase();
    ({ app, db } = require("../server"));
    agent = request.agent(app);
  });

  afterAll(async () => {
    if (db?.pool) {
      await db.pool.end();
    }
  });

  test("serves seeded configuration definitions and reference data", async () => {
    const loginResponse = await agent.post("/api/auth/login").send({
      username: "admin",
      password: "admin123",
    });
    expect(loginResponse.status).toBe(200);

    const configurationsResponse = await agent.get("/api/configurations");
    expect(configurationsResponse.status).toBe(200);
    expect(configurationsResponse.body.success).toBe(true);

    const configurationTypes = configurationsResponse.body.data.types.map((entry) => entry.key);
    expect(configurationTypes).toEqual(
      expect.arrayContaining([
        "units",
        "product-categories",
        "stores",
        "departments",
        "statuses",
        "numbering-series",
        "approval-workflows",
        "payment-terms",
        "delivery-types",
        "expense-categories",
        "tax-settings",
        "notification-rules",
      ])
    );

    const statuses = configurationsResponse.body.data.rowsByType.statuses;
    expect(statuses.some((entry) => entry.module_key === "purchase_requisition" && entry.status_code === "approved")).toBe(true);

    const numberingSeries = configurationsResponse.body.data.rowsByType["numbering-series"];
    expect(numberingSeries.some((entry) => entry.document_key === "purchase_order" && entry.prefix === "PO")).toBe(true);

    const referenceResponse = await agent.get("/api/master-data/reference-data");
    expect(referenceResponse.status).toBe(200);
    expect(referenceResponse.body.data.departments.some((entry) => entry.code === "kitchen")).toBe(true);
    expect(referenceResponse.body.data.paymentTerms.some((entry) => entry.name === "30 days")).toBe(true);
    expect(referenceResponse.body.data.deliveryTypes.some((entry) => entry.code === "lunch")).toBe(true);
    expect(referenceResponse.body.data.statuses.some((entry) => entry.module_key === "contracts" && entry.status_code === "active")).toBe(
      true
    );
  });
});
