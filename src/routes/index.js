const createAuthRoutes = require("./auth");
const createMasterDataRoutes = require("./master-data");
const createContractsRoutes = require("./contracts");
const createProcurementRoutes = require("./procurement");
const createProcurementSystemRoutes = require("./procurement-system");
const createApprovalsRoutes = require("./approvals");
const createInventoryRoutes = require("./inventory");
const createKitchenRoutes = require("./kitchen");
const createConsumptionRoutes = require("./consumption");
const createDashboardRoutes = require("./dashboard");
const createAuditRoutes = require("./audit");
const createSettingsRoutes = require("./settings");
const createConfigurationsRoutes = require("./configurations");
const createReportsRoutes = require("./reports");
const createDocumentRoutes = require("./documents");

function registerRoutes(app, dependencies) {
  const { db } = dependencies;

  app.get("/health", async (req, res, next) => {
    try {
      await db.exec("SELECT 1");
      res.json({ success: true, status: "ok" });
    } catch (error) {
      next(error);
    }
  });

  app.use("/api/auth", createAuthRoutes(db));
  app.use("/api/master-data", createMasterDataRoutes(db));
  app.use("/api/contracts", createContractsRoutes(db));
  app.use("/api/procurement", createProcurementRoutes(db));
  app.use("/api/procurement-system", createProcurementSystemRoutes(db));
  app.use("/api/approvals", createApprovalsRoutes(db));
  app.use("/api/inventory", createInventoryRoutes(db));
  app.use("/api/kitchen", createKitchenRoutes(db));
  app.use("/api/consumption", createConsumptionRoutes(db));
  app.use("/api/dashboard", createDashboardRoutes(db));
  app.use("/api/audit", createAuditRoutes(db));
  app.use("/api/configurations", createConfigurationsRoutes(db));
  app.use("/api/settings", createSettingsRoutes(db));
  app.use("/api/reports", createReportsRoutes(db));
  app.use("/api/documents", createDocumentRoutes(db));
}

module.exports = {
  registerRoutes,
};
