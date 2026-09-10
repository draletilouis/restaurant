const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { applyStockAdjustment, getInventoryBalance } = require("../services/inventory-service");
const { getNextSequence } = require("../services/system-service");
const { getStatus } = require("../services/status-service");

function createInventoryRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/balances", async (req, res, next) => {
    try {
      const balances = await db.all(
        `SELECT ib.*, p.name AS product_name, p.minimum_stock_level, p.reorder_level,
                pc.name AS category_name, sl.name AS store_name
         FROM inventory_balances ib
         INNER JOIN products p ON p.id = ib.product_id
         LEFT JOIN product_categories pc ON pc.id = p.product_category_id
         INNER JOIN store_locations sl ON sl.id = ib.store_location_id
         ORDER BY p.name, sl.name`
      );
      res.json({ success: true, data: balances });
    } catch (error) {
      next(error);
    }
  });

  router.get("/movements", async (req, res, next) => {
    try {
      const movements = await db.all(
        `SELECT sm.*, p.name AS product_name, sl.name AS store_name, sb.batch_number
         FROM stock_movements sm
         INNER JOIN products p ON p.id = sm.product_id
         INNER JOIN store_locations sl ON sl.id = sm.store_location_id
         LEFT JOIN stock_batches sb ON sb.id = sm.stock_batch_id
         ORDER BY sm.created_at DESC
         LIMIT 500`
      );
      res.json({ success: true, data: movements });
    } catch (error) {
      next(error);
    }
  });

  router.get("/batches", async (req, res, next) => {
    try {
      const batches = await db.all(
        `SELECT sb.*, p.name AS product_name, sl.name AS store_name, s.name AS supplier_name
         FROM stock_batches sb
         INNER JOIN products p ON p.id = sb.product_id
         INNER JOIN store_locations sl ON sl.id = sb.store_location_id
         LEFT JOIN suppliers s ON s.id = sb.supplier_id
         ORDER BY sb.expiry_date NULLS LAST, sb.created_at DESC`
      );
      res.json({ success: true, data: batches });
    } catch (error) {
      next(error);
    }
  });

  router.post("/products", async (req, res, next) => {
    try {
      const {
        name,
        sku,
        productType = "Raw Material",
        productCategoryId,
        unitOfMeasureId,
        minimumStockLevel = 0,
        reorderLevel = 0,
        standardCost = 0,
        isPerishable = false,
        defaultSupplierId,
        status = "Active",
        description,
      } = req.body;

      const result = await db.exec(
        `INSERT INTO products
           (name, sku, product_type, product_category_id, unit_of_measure_id, minimum_stock_level, reorder_level, standard_cost, is_perishable, default_supplier_id, status, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`,
        [
          name,
          sku || null,
          productType,
          productCategoryId || null,
          unitOfMeasureId || null,
          minimumStockLevel,
          reorderLevel,
          standardCost,
          Boolean(isPerishable),
          defaultSupplierId || null,
          status,
          description || null,
        ]
      );
      await logAudit(db, req.session.user.id, "create", "product", result.rows[0].id, req.body);
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.put("/products/:id", async (req, res, next) => {
    try {
      const {
        name,
        sku,
        productType = "Raw Material",
        productCategoryId,
        unitOfMeasureId,
        minimumStockLevel = 0,
        reorderLevel = 0,
        standardCost = 0,
        isPerishable = false,
        defaultSupplierId,
        status = "Active",
        description,
      } = req.body;

      const result = await db.exec(
        `UPDATE products
         SET name = ?, sku = ?, product_type = ?, product_category_id = ?, unit_of_measure_id = ?, minimum_stock_level = ?,
             reorder_level = ?, standard_cost = ?, is_perishable = ?, default_supplier_id = ?, status = ?, description = ?, updated_at = NOW()
         WHERE id = ?
         RETURNING *`,
        [
          name,
          sku || null,
          productType,
          productCategoryId || null,
          unitOfMeasureId || null,
          minimumStockLevel,
          reorderLevel,
          standardCost,
          Boolean(isPerishable),
          defaultSupplierId || null,
          status,
          description || null,
          req.params.id,
        ]
      );
      await logAudit(db, req.session.user.id, "update", "product", Number(req.params.id), req.body);
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.post("/stock-adjustments", async (req, res, next) => {
    try {
      const draftStatus = await getStatus(db, "stock_adjustment", "draft", { fallbackName: "Draft" });
      const adjustment = await db.transaction(async (tx) => {
        const adjustmentNumber = await getNextSequence(
          { ...db, get: tx.get.bind(tx) },
          "stockAdjustmentPrefix",
          "stock_adjustments"
        );
        const headerResult = await tx.exec(
          `INSERT INTO stock_adjustments
             (adjustment_number, store_location_id, adjustment_date, reason, status_id, status, requested_by, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING *`,
          [
            adjustmentNumber,
            req.body.storeLocationId,
            req.body.adjustmentDate,
            req.body.reason,
            draftStatus?.id || null,
            draftStatus?.status_name || "Draft",
            req.session.user.id,
            req.body.notes || null,
          ]
        );

        for (const item of req.body.items || []) {
          await tx.exec(
            `INSERT INTO stock_adjustment_items
               (stock_adjustment_id, product_id, quantity_delta)
             VALUES (?, ?, ?)`,
            [headerResult.rows[0].id, item.productId, item.quantityDelta]
          );
        }

        return headerResult.rows[0];
      });

      await logAudit(db, req.session.user.id, "create", "stock_adjustment", adjustment.id, req.body);
      res.status(201).json({ success: true, data: adjustment });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/stock-adjustments/:id/approve",
    async (req, res, next) => {
      try {
        const adjustment = await db.get("SELECT * FROM stock_adjustments WHERE id = ?", [req.params.id]);
        if (!adjustment) {
          res.status(404).json({ success: false, message: "Stock adjustment not found" });
          return;
        }
        const approvedStatus = await getStatus(db, "stock_adjustment", "approved", { fallbackName: "Approved" });

        await db.transaction(async (tx) => {
          const items = await tx.all("SELECT * FROM stock_adjustment_items WHERE stock_adjustment_id = ?", [req.params.id]);
          for (const item of items) {
            const product = await tx.get("SELECT standard_cost, is_perishable FROM products WHERE id = ?", [item.product_id]);
            await applyStockAdjustment(tx, {
              productId: item.product_id,
              storeLocationId: adjustment.store_location_id,
              quantityDelta: item.quantity_delta,
              unitCost: product?.standard_cost || 0,
              batchNumber: `ADJ-${req.params.id}-${item.id}`,
              adjustmentDate: adjustment.adjustment_date,
              referenceId: adjustment.id,
              notes: adjustment.notes,
              createdBy: req.session.user.id,
            });
          }

          await tx.exec(
            `UPDATE stock_adjustments
             SET status_id = ?, status = ?, approved_by = ?, updated_at = NOW()
             WHERE id = ?`,
            [approvedStatus?.id || null, approvedStatus?.status_name || "Approved", req.session.user.id, req.params.id]
          );
        });

        await logAudit(db, req.session.user.id, "approve", "stock_adjustment", Number(req.params.id), {});
        const refreshed = await db.get("SELECT * FROM stock_adjustments WHERE id = ?", [req.params.id]);
        res.json({ success: true, data: refreshed });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/stock-adjustments/:id/reject",
    async (req, res, next) => {
      try {
        const adjustment = await db.get("SELECT * FROM stock_adjustments WHERE id = ?", [req.params.id]);
        if (!adjustment) {
          res.status(404).json({ success: false, message: "Stock adjustment not found" });
          return;
        }
        const rejectedStatus = await getStatus(db, "stock_adjustment", "rejected", { fallbackName: "Rejected" });
        const result = await db.exec(
          `UPDATE stock_adjustments
           SET status_id = ?, status = ?, notes = COALESCE(notes, '') || ?, updated_at = NOW()
           WHERE id = ?
           RETURNING *`,
          [
            rejectedStatus?.id || null,
            rejectedStatus?.status_name || "Rejected",
            `\nRejected reason: ${req.body.reason || "Not specified"}`,
            req.params.id,
          ]
        );
        await logAudit(db, req.session.user.id, "reject", "stock_adjustment", Number(req.params.id), req.body);
        res.json({ success: true, data: result.rows[0] });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get("/stock-adjustments", async (req, res, next) => {
    try {
      const rows = await db.all(
        `SELECT sa.*, sl.name AS store_name, u.full_name AS requested_by_name, a.full_name AS approved_by_name,
                COALESCE(COUNT(sai.id), 0)::int AS item_count
         FROM stock_adjustments sa
         INNER JOIN store_locations sl ON sl.id = sa.store_location_id
         LEFT JOIN users u ON u.id = sa.requested_by
         LEFT JOIN users a ON a.id = sa.approved_by
         LEFT JOIN stock_adjustment_items sai ON sai.stock_adjustment_id = sa.id
         GROUP BY sa.id, sl.name, u.full_name, a.full_name
         ORDER BY sa.created_at DESC`
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.post("/physical-stock-counts", async (req, res, next) => {
    try {
      const count = await db.transaction(async (tx) => {
        const countNumber = await getNextSequence({ ...db, get: tx.get.bind(tx) }, "physicalCountPrefix", "physical_stock_counts");
        const approvedStatus = await getStatus(tx, "physical_stock_count", "approved", { fallbackName: "Approved" });
        const headerResult = await tx.exec(
          `INSERT INTO physical_stock_counts
             (count_number, store_location_id, count_date, status_id, status, counted_by, approved_by, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING *`,
          [
            countNumber,
            req.body.storeLocationId,
            req.body.countDate,
            approvedStatus?.id || null,
            approvedStatus?.status_name || "Approved",
            req.session.user.id,
            req.session.user.id,
            req.body.notes || null,
          ]
        );

        for (const item of req.body.items || []) {
          const currentBalance = await getInventoryBalance(tx, item.productId, req.body.storeLocationId);
          const systemQuantity = Number(currentBalance.quantity_on_hand || 0);
          const countedQuantity = Number(item.countedQuantity || 0);
          const varianceQuantity = countedQuantity - systemQuantity;

          await tx.exec(
            `INSERT INTO physical_stock_count_items
               (physical_stock_count_id, product_id, system_quantity, counted_quantity, variance_quantity)
             VALUES (?, ?, ?, ?, ?)`,
            [headerResult.rows[0].id, item.productId, systemQuantity, countedQuantity, varianceQuantity]
          );

          if (Math.abs(varianceQuantity) > 0.0001) {
            const product = await tx.get("SELECT standard_cost FROM products WHERE id = ?", [item.productId]);
            await applyStockAdjustment(tx, {
              productId: item.productId,
              storeLocationId: req.body.storeLocationId,
              quantityDelta: varianceQuantity,
              unitCost: product?.standard_cost || 0,
              batchNumber: `CNT-${headerResult.rows[0].id}-${item.productId}`,
              adjustmentDate: req.body.countDate,
              referenceId: headerResult.rows[0].id,
              notes: "Physical count correction",
              createdBy: req.session.user.id,
            });
          }
        }

        return headerResult.rows[0];
      });

      await logAudit(db, req.session.user.id, "perform", "physical_stock_count", count.id, req.body);
      res.status(201).json({ success: true, data: count });
    } catch (error) {
      next(error);
    }
  });

  router.get("/physical-stock-counts", async (req, res, next) => {
    try {
      const rows = await db.all(
        `SELECT psc.*, sl.name AS store_name, u.full_name AS counted_by_name, a.full_name AS approved_by_name,
                COALESCE(COUNT(psci.id), 0)::int AS item_count
         FROM physical_stock_counts psc
         INNER JOIN store_locations sl ON sl.id = psc.store_location_id
         LEFT JOIN users u ON u.id = psc.counted_by
         LEFT JOIN users a ON a.id = psc.approved_by
         LEFT JOIN physical_stock_count_items psci ON psci.physical_stock_count_id = psc.id
         GROUP BY psc.id, sl.name, u.full_name, a.full_name
         ORDER BY psc.created_at DESC`
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.get("/low-stock", async (req, res, next) => {
    try {
      const rows = await db.all(
        `SELECT p.id AS product_id, p.name AS product_name, p.minimum_stock_level, p.reorder_level,
                COALESCE(SUM(ib.quantity_on_hand), 0) AS current_stock
         FROM products p
         LEFT JOIN inventory_balances ib ON ib.product_id = p.id
         GROUP BY p.id
         HAVING COALESCE(SUM(ib.quantity_on_hand), 0) <= p.reorder_level
         ORDER BY current_stock ASC, p.name`
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.get("/expiring", async (req, res, next) => {
    try {
      const days = Number(req.query.days || 30);
      const rows = await db.all(
        `SELECT sb.*, p.name AS product_name, sl.name AS store_name
         FROM stock_batches sb
         INNER JOIN products p ON p.id = sb.product_id
         INNER JOIN store_locations sl ON sl.id = sb.store_location_id
         WHERE sb.expiry_date IS NOT NULL
           AND sb.quantity_remaining > 0
           AND sb.expiry_date <= CURRENT_DATE + (? || ' days')::interval
         ORDER BY sb.expiry_date ASC`,
        [days]
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createInventoryRoutes;
