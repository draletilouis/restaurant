"use strict";

require("dotenv").config();

const fs = require("fs");
const Database = require("../src/database/database");

const EXPECTED_TARGET = "alert-friendship-production";
const CLEANUP_OPERATION_KEY = "alert-friendship-live-data-cleanup-v1";

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

async function countOperationalRows(db) {
  const counts = {};
  for (const table of OPERATIONAL_TABLES) {
    counts[table] = await countRows(db, table);
  }
  counts.users = await countRows(db, "users");
  return counts;
}

function validateEnvironment() {
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

  const keepLoginEmail = (process.env.KEEP_LOGIN_EMAIL || "admin@cater.local").trim();
  if (!keepLoginEmail) {
    throw new Error("KEEP_LOGIN_EMAIL must identify the login to preserve.");
  }

  return keepLoginEmail;
}

async function ensureMaintenanceTable(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS maintenance_runs (
      operation_key VARCHAR(160) PRIMARY KEY,
      completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    )
  `);
}

function removeRuntimeScript() {
  try {
    fs.unlinkSync(__filename);
    return true;
  } catch (error) {
    console.warn(`Cleanup completed, but the runtime script could not be removed: ${error.message}`);
    return false;
  }
}

async function run({ db: providedDb, removeScriptAfterSuccess } = {}) {
  const db = providedDb || new Database();
  const ownsDatabase = !providedDb;
  const keepLoginEmail = validateEnvironment();
  const shouldRemoveScript =
    removeScriptAfterSuccess === true || process.env.REMOVE_SCRIPT_AFTER_SUCCESS === "YES";

  try {
    await ensureMaintenanceTable(db);

    const databaseIdentity = await db.get(
      "SELECT current_database() AS database, current_user AS user"
    );

    const result = await db.transaction(async (tx) => {
      // Serialize concurrent deploys or restarts so the cleanup can only win once.
      await tx.exec("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))", [CLEANUP_OPERATION_KEY]);

      const previousRun = await tx.get(
        "SELECT completed_at, metadata FROM maintenance_runs WHERE operation_key = ?",
        [CLEANUP_OPERATION_KEY]
      );
      if (previousRun) {
        return {
          alreadyCompleted: true,
          completedAt: previousRun.completed_at,
          metadata: previousRun.metadata,
        };
      }

      const admin = await tx.get(
        "SELECT id, username, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
        [keepLoginEmail]
      );

      if (!admin) {
        throw new Error(
          `The login ${keepLoginEmail} was not found; refusing to clear the database.`
        );
      }

      const before = await countOperationalRows(tx);

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

      const after = await countOperationalRows(tx);
      const retainedLogin = await tx.get(
        "SELECT id, username, email, is_active FROM users WHERE id = ?",
        [admin.id]
      );
      const retainedRole = await tx.get(
        `SELECT r.code
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = ? AND r.code = 'admin'`,
        [admin.id]
      );

      const hasOperationalRows = OPERATIONAL_TABLES.some((table) => after[table] !== 0);
      if (
        hasOperationalRows ||
        after.users !== 1 ||
        !retainedLogin ||
        !retainedLogin.is_active ||
        !retainedRole
      ) {
        throw new Error("Cleanup verification failed; the transaction will be rolled back.");
      }

      const completedAt = new Date().toISOString();
      await tx.exec(
        `INSERT INTO maintenance_runs (operation_key, completed_at, metadata)
         VALUES (?, ?, ?::jsonb)`,
        [
          CLEANUP_OPERATION_KEY,
          completedAt,
          JSON.stringify({ target: process.env.CLEAR_LIVE_DATA_TARGET, keepLoginEmail }),
        ]
      );

      return { alreadyCompleted: false, completedAt, before, after, retainedLogin };
    });

    const output = {
      success: true,
      target: process.env.CLEAR_LIVE_DATA_TARGET,
      database: databaseIdentity,
      operation: CLEANUP_OPERATION_KEY,
      ...result,
    };

    if (shouldRemoveScript) {
      output.scriptRemoved = removeRuntimeScript();
    }

    console.log(JSON.stringify(output, null, 2));
    return output;
  } finally {
    if (ownsDatabase) {
      await db.pool.end();
    }
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error("Failed to clear live data:", error);
    process.exit(1);
  });
}

module.exports = { EXPECTED_TARGET, CLEANUP_OPERATION_KEY, run };
