require("dotenv").config();

const express = require("express");
const session = require("express-session");
const createPgSessionStore = require("connect-pg-simple");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const bodyParser = require("body-parser");
const path = require("path");

const Database = require("./src/database/database");
const { ensureDatabaseExists, initializeDatabase, seedDemoData } = require("./src/database/schema");
const { registerRoutes } = require("./src/routes");
const { getUserWithAccess } = require("./src/services/system-service");

const app = express();
const db = new Database();
const port = Number.parseInt(process.env.PORT || "3000", 10);
const configuredOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const railwayPublicOrigin = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : null;
const allowedOrigins = new Set(
  [...configuredOrigins, railwayPublicOrigin].filter(Boolean),
);

function isSameOriginRequest(req) {
  const requestOrigin = req.get("origin");
  if (!requestOrigin) return true;

  try {
    const originUrl = new URL(requestOrigin);
    const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const requestProtocol = forwardedProtocol || req.protocol;
    return originUrl.protocol === `${requestProtocol}:` && originUrl.host === req.get("host");
  } catch {
    return false;
  }
}
const dbReady = (async () => {
  await ensureDatabaseExists(db.config);
  await initializeDatabase(db);
  // Demo data is opt-in for production. A client deployment must never be
  // populated with sample records just because a seed flag was omitted.
  const shouldSeedDemoData =
    process.env.SEED_DEMO_DATA === "true" ||
    (process.env.NODE_ENV !== "production" && process.env.SKIP_DEMO_SEED !== "true");
  if (shouldSeedDemoData) {
    await seedDemoData(db);
  }
})();

app.set("trust proxy", 1);
app.locals.dbReady = dbReady;

app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (error) {
    next(error);
  }
});

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
const corsOptions = {
  origin(origin, callback) {
    if (!origin || process.env.NODE_ENV !== "production") {
      callback(null, true);
      return;
    }
    callback(allowedOrigins.has(origin) ? null : new Error("Not allowed by CORS"), true);
  },
  credentials: true,
};

app.use((req, res, next) => {
  if (isSameOriginRequest(req)) {
    next();
    return;
  }
  cors(corsOptions)(req, res, next);
});
app.use(compression());
app.use(bodyParser.json({ limit: "4mb" }));
app.use(bodyParser.urlencoded({ extended: false, limit: "4mb" }));

const usePgSessionStore = process.env.NODE_ENV === "production" || process.env.USE_PG_SESSION === "true";
const sessionStore = usePgSessionStore
  ? new (createPgSessionStore(session))({
      pool: db.pool,
      tableName: "session",
      createTableIfMissing: true,
    })
  : new session.MemoryStore();

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "dev-secret-only",
    resave: false,
    saveUninitialized: false,
    name: "cater.sid",
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: process.env.NODE_ENV === "production" ? "1d" : 0,
    etag: true,
  })
);

// Refresh access before authorization so role changes apply to existing sessions.
app.use("/api", async (req, res, next) => {
  try {
    if (req.session?.user) {
      const user = await getUserWithAccess(db, req.session.user.id);
      req.session.user = user?.isActive ? user : null;
    }
    next();
  } catch (error) { next(error); }
});

registerRoutes(app, { db });

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

if (require.main === module) {
  dbReady
    .then(() => {
      app.listen(port, () => {
        console.log(`Cater ERP listening on port ${port}`);
      });
    })
    .catch((error) => {
      console.error("Failed to initialize Cater ERP database:", error);
      process.exit(1);
    });
}

module.exports = { app, db, dbReady };
