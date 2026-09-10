const express = require("express");

const { requireAuth } = require("../middleware/auth");

function createDashboardRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const [
        activeContracts,
        weeklyExpectedDemand,
        currentStockValue,
        lowStockItems,
        expiringStockItems,
        pendingPurchaseRequisitions,
        pendingPurchaseOrders,
        pendingKitchenRequisitions,
        todaysProductionBatches,
        topConsumedProducts,
        wastageValue,
        supplierBalances,
        purchaseActivity,
      ] = await Promise.all([
        db.get(`SELECT COUNT(*)::int AS value FROM contracts WHERE status = 'Active'`),
        db.get(
          `SELECT COALESCE(SUM(quantity_per_delivery), 0) AS value
           FROM contract_items ci
           INNER JOIN contracts c ON c.id = ci.contract_id
           WHERE c.status = 'Active'`
        ),
        db.get(`SELECT COALESCE(SUM(stock_value), 0) AS value FROM inventory_balances`),
        db.get(
          `SELECT COUNT(*)::int AS value
           FROM (
             SELECT p.id
             FROM products p
             LEFT JOIN inventory_balances ib ON ib.product_id = p.id
             GROUP BY p.id
             HAVING COALESCE(SUM(ib.quantity_on_hand), 0) <= p.reorder_level
           ) low_stock`
        ),
        db.get(
          `SELECT COUNT(*)::int AS value
           FROM stock_batches
           WHERE expiry_date IS NOT NULL
             AND quantity_remaining > 0
             AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'`
        ),
        db.get(`SELECT COUNT(*)::int AS value FROM purchase_requisitions WHERE status IN ('Draft', 'Submitted')`),
        db.get(`SELECT COUNT(*)::int AS value FROM purchase_orders WHERE status IN ('Draft', 'Sent', 'Partially Received')`),
        db.get(`SELECT COUNT(*)::int AS value FROM kitchen_requisitions WHERE status IN ('Draft', 'Submitted', 'Approved')`),
        db.get(`SELECT COUNT(*)::int AS value FROM production_batches WHERE production_date = CURRENT_DATE`),
        db.all(
          `SELECT p.name, COALESCE(SUM(sii.issued_quantity), 0) AS total_issued
           FROM store_issue_items sii
           INNER JOIN products p ON p.id = sii.product_id
           GROUP BY p.id
           ORDER BY total_issued DESC
           LIMIT 5`
        ),
        db.get(`SELECT COALESCE(SUM(wastage_value), 0) AS value FROM wastage_records`),
        db.all(
          `SELECT s.name, COALESCE(SUM(si.total_amount - si.amount_paid), 0) AS balance_due
           FROM suppliers s
           LEFT JOIN supplier_invoices si ON si.supplier_id = s.id
           GROUP BY s.id
           ORDER BY balance_due DESC
           LIMIT 5`
        ),
        db.all(
          `SELECT po.purchase_type, COUNT(DISTINCT po.id)::int AS order_count,
                  COALESCE(SUM(poi.line_total), 0) AS order_value
           FROM purchase_orders po
           LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
           GROUP BY po.purchase_type
           ORDER BY po.purchase_type`
        ),
      ]);

      res.json({
        success: true,
        data: {
          activeContracts: Number(activeContracts?.value || 0),
          weeklyExpectedDemand: Number(weeklyExpectedDemand?.value || 0),
          currentStockValue: Number(currentStockValue?.value || 0),
          lowStockItems: Number(lowStockItems?.value || 0),
          expiringStockItems: Number(expiringStockItems?.value || 0),
          pendingPurchaseRequisitions: Number(pendingPurchaseRequisitions?.value || 0),
          pendingPurchaseOrders: Number(pendingPurchaseOrders?.value || 0),
          pendingKitchenRequisitions: Number(pendingKitchenRequisitions?.value || 0),
          todaysProductionBatches: Number(todaysProductionBatches?.value || 0),
          topConsumedProducts,
          wastageValue: Number(wastageValue?.value || 0),
          supplierBalances,
          purchaseActivity,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createDashboardRoutes;


