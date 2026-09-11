"use strict";

require("dotenv").config();

const Database = require("../src/database/database");

const EXPECTED_TARGET = "alert-friendship-production";
const KEEP_LOGIN_EMAIL = (process.env.KEEP_LOGIN_EMAIL || "admin@cater.local").trim();

const OPERATIONAL_TABLES = [
  "attachments",
  "approval_history",
  "cash_requisition_settlements",
  "supplier_receipts",
  "payment_vouchers",
  "cash_requisitions",
  "stock_return_items",
  "stock_returns",
  "wastage_records",
  "production_batch_items",
  "production_batches",
  "store_issue_items",
  "store_issues",
  "kitchen_requisition_items",
  "kitchen_requisitions",
  "physical_stock_count_items",
  "physical_stock_counts",
  "stock_adjustment_items",
  "stock_adjustments",
  "stock_movements",
  "stock_batches",
  "inventory_balances",
  "supplier_invoices",
  "goods_received_note_items",
  "goods_received_notes",
  "purchase_order_items",
  "purchase_orders",
  "purchase_requisition_items",
  "purchase_requisitions",
  "contract_items",
  "contract_schedules",
  "contracts",
  "client_locations",
  "clients",
  "products",
  "suppliers",
  "consumption_reports",
  "audit_logs",
];

async function countRows(db, table) {
  const row = await db.get(`SELECT COUNT(*)::int AS count FROM ${table}`);
  return row.count;
}

async function main() {
  const db = new Database();

  try {
    if (process.env.CONFIRM_CLEAR_LIVE_DATA !== "YES") {
      throw new Error(
        "Refusing to clear data without CONFIRM_CLEAR_LIVE_DATA=YES. This command is destructive."
      );
    }

    if (process.env.NODE_ENV !== "production") {
      throw new Error("Refusing to clear data unless NODE_ENV=production.");
    }

    if (process.env.CLEAR_LIVE_DATA_TARGET !== EXPECTED_TARGET) {
      throw new Error(
        `Refusing to clear an unverified database. Set CLEAR_LIVE_DATA_TARGET=${EXPECTED_TARGET}.`
      );
    }

    if (!KEEP_LOGIN_EMAIL) {
      throw new Error("KEEP_LOGIN_EMAIL must identify the login to preserve.");
    }

    const databaseIdentity = await db.get(
      "SELECT current_database() AS database, current_user AS user"
    );

    const admin = await db.get(
      "SELECT id, username, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [KEEP_LOGIN_EMAIL]
    );

    if (!admin) {
      throw new Error(
        `The login ${KEEP_LOGIN_EMAIL} was not found; refusing to clear the database.`
      );
    }

    const before = {};
    for (const table of OPERATIONAL_TABLES) {
      before[table] = await countRows(db, table);
    }
    before.users = await countRows(db, "users");

    await db.transaction(async (tx) => {
      await tx.exec(`TRUNCATE TABLE ${OPERATIONAL_TABLES.join(", ")} RESTART IDENTITY CASCADE`);

      // Keep the one login account and remove seeded/demo staff accounts.
      await tx.exec("DELETE FROM user_roles WHERE user_id <> ?", [admin.id]);
      await tx.exec("DELETE FROM users WHERE id <> ?", [admin.id]);

      // Leave the profile usable but remove demo-company details.
      await tx.exec(
        `UPDATE business_profile
         SET business_name = 'Cater ERP',
             business_phone = NULL,
             business_location = NULL,
             owner_email = NULL,
             business_type = 'catering',
             logo_data = NULL,
             logo_mime_type = NULL,
             updated_at = NOW()`
      );

      // Start live document numbering from the beginning of the current year.
      await tx.exec(
        `UPDATE numbering_series
         SET current_year = EXTRACT(YEAR FROM CURRENT_DATE),
             current_month = EXTRACT(MONTH FROM CURRENT_DATE),
             current_number = 0,
             updated_at = NOW()`
      );

      // Make sure the retained login still has the full administrator role.
      await tx.exec(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT ?, r.id
         FROM roles r
         WHERE r.code = 'admin'
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [admin.id]
      );
    });

    const after = {};
    for (const table of OPERATIONAL_TABLES) {
      after[table] = await countRows(db, table);
    }
    after.users = await countRows(db, "users");
    const retainedLogin = await db.get(
      "SELECT id, username, email, is_active FROM users WHERE id = ?",
      [admin.id]
    );
    const retainedRole = await db.get(
      `SELECT r.code
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = ? AND r.code = 'admin'`,
      [admin.id]
    );

    const hasOperationalRows = Object.values(after).some((count) => count !== 0);
    if (hasOperationalRows || after.users !== 1 || !retainedLogin || !retainedRole) {
      throw new Error("Cleanup verification failed; inspect the database before using it live.");
    }

    console.log(JSON.stringify({
      success: true,
      target: process.env.CLEAR_LIVE_DATA_TARGET,
      database: databaseIdentity,
      retainedLogin,
      before,
      after,
    }, null, 2));
  } finally {
    await db.pool.end();
  }
}

main().catch((error) => {
  console.error("Failed to clear live data:", error);
  process.exit(1);
});
