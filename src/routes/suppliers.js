const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");

function createSuppliersRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const suppliers = await db.all("SELECT * FROM suppliers ORDER BY name");
      res.json({ success: true, data: suppliers });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const { name, contactPerson, phone, email, address, paymentTerms } = req.body;
      const result = await db.exec(
        `INSERT INTO suppliers (name, contact_person, phone, email, address, payment_terms)
         VALUES (?, ?, ?, ?, ?, ?)
         RETURNING *`,
        [name, contactPerson || null, phone || null, email || null, address || null, paymentTerms || null]
      );
      await logAudit(db, req.session.user.id, "create", "supplier", result.rows[0].id, req.body);
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createSuppliersRoutes;
