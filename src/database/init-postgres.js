require("dotenv").config();

const Database = require("./database");
const { ensureDatabaseExists, initializeDatabase, seedDemoData } = require("./schema");

async function main() {
  const db = new Database();
  try {
    await ensureDatabaseExists(db.config);
    await initializeDatabase(db, {
      reset: process.argv.includes("--reset"),
    });
    await seedDemoData(db);
    console.log("Cater Phase 1 database initialized successfully.");
  } finally {
    await db.pool.end();
  }
}

main().catch((error) => {
  console.error("Failed to initialize Cater Phase 1 database:", error);
  process.exit(1);
});
