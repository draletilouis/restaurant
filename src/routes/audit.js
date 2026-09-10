const express = require("express");

const { requireAuth } = require("../middleware/auth");

function createAuditRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const rows = await db.all(
        `SELECT al.*, u.full_name AS actor_name
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.actor_user_id
         ORDER BY al.created_at DESC
         LIMIT 300`
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createAuditRoutes;
