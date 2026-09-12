const express = require("express");

const { requireAuth } = require("../middleware/auth");
const {
  CONFIG_DEFINITIONS,
  createConfigurationRow,
  getDefinition,
  listConfigurationBundle,
  listConfigurationRows,
  deleteConfigurationRow,
  toggleConfigurationRow,
  updateConfigurationRow,
} = require("../services/configuration-service");

function createConfigurationsRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const bundle = await listConfigurationBundle(db);
      res.json({
        success: true,
        data: {
          definitions: Object.values(CONFIG_DEFINITIONS).map(({ key, label, description }) => ({ key, label, description })),
          ...bundle,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:type", async (req, res, next) => {
    try {
      const definition = getDefinition(req.params.type);
      const rows = await listConfigurationRows(db, req.params.type);
      const auditTrail = await db.all(
        `SELECT al.*, u.full_name AS actor_name
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.actor_user_id
         WHERE al.entity_type = ?
         ORDER BY al.created_at DESC
         LIMIT 50`,
        [definition.key]
      );
      res.json({ success: true, data: { definition, rows, auditTrail } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:type", async (req, res, next) => {
    try {
      const row = await createConfigurationRow(db, req.params.type, req.body, req.session.user.id);
      res.status(201).json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  });

  router.put("/:type/:id", async (req, res, next) => {
    try {
      const row = await updateConfigurationRow(db, req.params.type, req.params.id, req.body, req.session.user.id);
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:type/:id/toggle", async (req, res, next) => {
    try {
      const row = await toggleConfigurationRow(db, req.params.type, req.params.id, req.body.isActive !== false, req.session.user.id);
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:type/:id", async (req, res, next) => {
    try {
      const row = await deleteConfigurationRow(db, req.params.type, req.params.id, req.session.user.id);
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createConfigurationsRoutes;
