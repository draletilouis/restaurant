const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");

function createReceivablesRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const invoices = await db.all(
        `SELECT i.*, c.name AS customer_name
         FROM invoices i
         INNER JOIN customers c ON c.id = i.customer_id
         WHERE i.balance_due > 0
         ORDER BY i.due_date NULLS LAST, i.id DESC`
      );
      res.json({ success: true, data: invoices });
    } catch (error) {
      next(error);
    }
  });

  router.get("/payments", async (req, res, next) => {
    try {
      const payments = await db.all(
        `SELECT cp.*, c.name AS customer_name, i.invoice_number
         FROM customer_payments cp
         INNER JOIN customers c ON c.id = cp.customer_id
         LEFT JOIN invoices i ON i.id = cp.invoice_id
         ORDER BY cp.id DESC`
      );
      res.json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  });

  router.post("/payments", async (req, res, next) => {
    try {
      const { customerId, invoiceId, paymentDate, amount, paymentMethod, reference, notes } = req.body;
      const payment = await db.transaction(async (tx) => {
        const result = await tx.exec(
          `INSERT INTO customer_payments (
             customer_id, invoice_id, payment_date, amount, payment_method, reference, notes, created_by
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING *`,
          [
            customerId,
            invoiceId || null,
            paymentDate,
            amount,
            paymentMethod || null,
            reference || null,
            notes || null,
            req.session.user.id,
          ]
        );

        if (invoiceId) {
          await tx.exec(
            `UPDATE invoices
             SET balance_due = GREATEST(balance_due - ?, 0),
                 status = CASE WHEN balance_due - ? <= 0 THEN 'paid' ELSE status END
             WHERE id = ?`,
            [amount, amount, invoiceId]
          );
        }

        return result.rows[0];
      });

      await logAudit(db, req.session.user.id, "create", "customer_payment", payment.id, req.body);
      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createReceivablesRoutes;
