require("dotenv").config();

const { Pool } = require("pg");

class Database {
  constructor() {
    const configuredPoolMax = Number.parseInt(process.env.PG_POOL_MAX || "", 10);
    const poolMax = Number.isFinite(configuredPoolMax) && configuredPoolMax > 0 ? configuredPoolMax : 10;
    const databaseName =
      process.env.NODE_ENV === "test" && process.env.POSTGRES_DB_TEST
        ? process.env.POSTGRES_DB_TEST
        : process.env.POSTGRES_DB || "cater_phase_one";

    const config = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
          max: poolMax,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        }
      : {
          host: process.env.POSTGRES_HOST || "localhost",
          port: Number.parseInt(process.env.POSTGRES_PORT || "5432", 10),
          database: databaseName,
          user: process.env.POSTGRES_USER || "postgres",
          password: process.env.POSTGRES_PASSWORD,
          ssl: process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : false,
          max: poolMax,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        };

    this.config = config;
    this.pool = new Pool(config);
    this.pool.on("error", (error) => {
      console.error("Unexpected database pool error:", error);
    });
  }

  static toPgSql(sql) {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  async exec(sql, params = []) {
    return this.pool.query(Database.toPgSql(sql), params);
  }

  async run(sql, params = []) {
    const result = await this.pool.query(Database.toPgSql(sql), params);
    return {
      changes: result.rowCount,
      rows: result.rows,
    };
  }

  async get(sql, params = []) {
    const result = await this.pool.query(Database.toPgSql(sql), params);
    return result.rows[0] || null;
  }

  async all(sql, params = []) {
    const result = await this.pool.query(Database.toPgSql(sql), params);
    return result.rows;
  }

  async transaction(work) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const tx = {
        exec: async (sql, params = []) => client.query(Database.toPgSql(sql), params),
        run: async (sql, params = []) => {
          const result = await client.query(Database.toPgSql(sql), params);
          return { changes: result.rowCount, rows: result.rows };
        },
        get: async (sql, params = []) => {
          const result = await client.query(Database.toPgSql(sql), params);
          return result.rows[0] || null;
        },
        all: async (sql, params = []) => {
          const result = await client.query(Database.toPgSql(sql), params);
          return result.rows;
        },
      };
      const output = await work(tx);
      await client.query("COMMIT");
      return output;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Database;
