const express = require("express");

const { requireAuth } = require("../middleware/auth");

function normalizeRange(query, fallbackDays) {
  const endDate = query.endDate || new Date().toISOString().slice(0, 10);
  const end = new Date(endDate);
  const start = query.startDate
    ? new Date(query.startDate)
    : new Date(end.getTime() - fallbackDays * 24 * 60 * 60 * 1000);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate,
  };
}

function createConsumptionRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  async function buildProductConsumptionRows(range) {
    return db.all(
      `WITH purchased AS (
         SELECT grni.product_id, COALESCE(SUM(grni.quantity_received), 0) AS purchased_quantity
         FROM goods_received_note_items grni
         INNER JOIN goods_received_notes grn ON grn.id = grni.goods_received_note_id
         WHERE grn.receipt_date BETWEEN ? AND ?
         GROUP BY grni.product_id
       ),
       issued AS (
         SELECT sii.product_id, COALESCE(SUM(sii.issued_quantity), 0) AS issued_quantity
         FROM store_issue_items sii
         INNER JOIN store_issues si ON si.id = sii.store_issue_id
         WHERE si.issue_date BETWEEN ? AND ?
         GROUP BY sii.product_id
       ),
       returned AS (
         SELECT sri.product_id, COALESCE(SUM(sri.quantity_returned), 0) AS returned_quantity
         FROM stock_return_items sri
         INNER JOIN stock_returns sr ON sr.id = sri.stock_return_id
         WHERE sr.return_date BETWEEN ? AND ?
         GROUP BY sri.product_id
       ),
       wasted AS (
         SELECT wr.product_id, COALESCE(SUM(wr.quantity), 0) AS wastage_quantity
         FROM wastage_records wr
         WHERE wr.record_date BETWEEN ? AND ?
         GROUP BY wr.product_id
       ),
       production AS (
         SELECT pbi.product_id,
                COALESCE(SUM(pb.actual_output), 0) AS actual_output,
                COALESCE(SUM(pbi.quantity_consumed), 0) AS actual_usage
         FROM production_batch_items pbi
         INNER JOIN production_batches pb ON pb.id = pbi.production_batch_id
         WHERE pb.production_date BETWEEN ? AND ?
         GROUP BY pbi.product_id
       ),
       balances AS (
         SELECT ib.product_id, COALESCE(SUM(ib.quantity_on_hand), 0) AS remaining_quantity
         FROM inventory_balances ib
         GROUP BY ib.product_id
       )
       SELECT p.id AS product_id,
              p.name AS product_name,
              COALESCE(purchased.purchased_quantity, 0) AS purchased_quantity,
              COALESCE(issued.issued_quantity, 0) AS issued_quantity,
              COALESCE(returned.returned_quantity, 0) AS returned_quantity,
              COALESCE(wasted.wastage_quantity, 0) AS wastage_quantity,
              COALESCE(balances.remaining_quantity, 0) AS remaining_quantity,
              COALESCE(issued.issued_quantity, 0) - COALESCE(returned.returned_quantity, 0) - COALESCE(wasted.wastage_quantity, 0) AS consumed_quantity,
              CASE
                WHEN COALESCE(issued.issued_quantity, 0) > 0
                  THEN ROUND((COALESCE(wasted.wastage_quantity, 0) / COALESCE(issued.issued_quantity, 0)) * 100, 2)
                ELSE 0
              END AS wastage_rate,
              CASE
                WHEN COALESCE(production.actual_output, 0) > 0
                  THEN ROUND(
                    (
                      COALESCE(issued.issued_quantity, 0) -
                      COALESCE(returned.returned_quantity, 0) -
                      COALESCE(wasted.wastage_quantity, 0)
                    ) / COALESCE(production.actual_output, 0),
                    4
                  )
                ELSE 0
              END AS consumption_per_unit,
              COALESCE(production.actual_usage, 0) AS actual_usage,
              COALESCE(production.actual_output, 0) AS actual_output
       FROM products p
       LEFT JOIN purchased ON purchased.product_id = p.id
       LEFT JOIN issued ON issued.product_id = p.id
       LEFT JOIN returned ON returned.product_id = p.id
       LEFT JOIN wasted ON wasted.product_id = p.id
       LEFT JOIN balances ON balances.product_id = p.id
       LEFT JOIN production ON production.product_id = p.id
       ORDER BY consumed_quantity DESC, p.name`,
      [
        range.startDate,
        range.endDate,
        range.startDate,
        range.endDate,
        range.startDate,
        range.endDate,
        range.startDate,
        range.endDate,
        range.startDate,
        range.endDate,
      ]
    );
  }

  router.get("/products", async (req, res, next) => {
    try {
      const range = normalizeRange(req.query, 30);
      const data = await buildProductConsumptionRows(range);
      res.json({ success: true, data, range });
    } catch (error) {
      next(error);
    }
  });

  router.get("/daily", async (req, res, next) => {
    try {
      const range = normalizeRange(req.query, 7);
      const data = await db.all(
        `SELECT production_date AS report_date,
                COALESCE(SUM(actual_output), 0) AS total_output,
                COALESCE(SUM(wastage_quantity), 0) AS total_wastage
         FROM production_batches
         WHERE production_date BETWEEN ? AND ?
         GROUP BY production_date
         ORDER BY production_date`,
        [range.startDate, range.endDate]
      );
      res.json({ success: true, data, range });
    } catch (error) {
      next(error);
    }
  });

  router.get("/weekly", async (req, res, next) => {
    try {
      const range = normalizeRange(req.query, 35);
      const data = await db.all(
        `SELECT DATE_TRUNC('week', production_date)::date AS week_start,
                COALESCE(SUM(actual_output), 0) AS total_output,
                COALESCE(SUM(wastage_quantity), 0) AS total_wastage
         FROM production_batches
         WHERE production_date BETWEEN ? AND ?
         GROUP BY DATE_TRUNC('week', production_date)
         ORDER BY week_start`,
        [range.startDate, range.endDate]
      );
      res.json({ success: true, data, range });
    } catch (error) {
      next(error);
    }
  });

  router.get("/monthly", async (req, res, next) => {
    try {
      const range = normalizeRange(req.query, 180);
      const data = await db.all(
        `SELECT DATE_TRUNC('month', production_date)::date AS month_start,
                COALESCE(SUM(actual_output), 0) AS total_output,
                COALESCE(SUM(wastage_quantity), 0) AS total_wastage
         FROM production_batches
         WHERE production_date BETWEEN ? AND ?
         GROUP BY DATE_TRUNC('month', production_date)
         ORDER BY month_start`,
        [range.startDate, range.endDate]
      );
      res.json({ success: true, data, range });
    } catch (error) {
      next(error);
    }
  });

  router.get("/variance", async (req, res, next) => {
    try {
      const range = normalizeRange(req.query, 30);
      const products = await buildProductConsumptionRows(range);
      const data = products.map((row) => ({
        ...row,
        variance_quantity: Number(row.consumed_quantity || 0) - Number(row.actual_usage || 0),
      }));
      res.json({ success: true, data, range });
    } catch (error) {
      next(error);
    }
  });

  router.get("/wastage", async (req, res, next) => {
    try {
      const range = normalizeRange(req.query, 30);
      const data = await db.all(
        `SELECT wr.*, p.name AS product_name
         FROM wastage_records wr
         INNER JOIN products p ON p.id = wr.product_id
         WHERE wr.record_date BETWEEN ? AND ?
         ORDER BY wr.record_date DESC`,
        [range.startDate, range.endDate]
      );
      res.json({ success: true, data, range });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createConsumptionRoutes;
