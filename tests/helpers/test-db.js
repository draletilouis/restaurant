process.env.NODE_ENV = "test";
process.env.POSTGRES_DB_TEST = process.env.POSTGRES_DB_TEST || "cater_phase_one_test";

const Database = require("../../src/database/database");
const { ensureDatabaseExists, initializeDatabase, seedDemoData } = require("../../src/database/schema");

async function resetTestDatabase({ seedDemo = true } = {}) {
  const db = new Database();
  await ensureDatabaseExists(db.config);
  await initializeDatabase(db, { reset: true });
  if (seedDemo) {
    await seedDemoData(db);
  }
  await db.pool.end();
}

module.exports = {
  resetTestDatabase,
};
