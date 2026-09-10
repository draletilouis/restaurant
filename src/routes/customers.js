const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");

function createCustomersRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const customers = await db.all("SELECT * FROM customers ORDER BY name");
      res.json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const { name, contactPerson, phone, email, address, billingTerms } = req.body;
      const result = await db.exec(
        `INSERT INTO customers (name, contact_person, phone, email, address, billing_terms)
         VALUES (?, ?, ?, ?, ?, ?)
         RETURNING *`,
        [name, contactPerson || null, phone || null, email || null, address || null, billingTerms || null]
      );
      await logAudit(db, req.session.user.id, "create", "customer", result.rows[0].id, req.body);
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createCustomersRoutes;
