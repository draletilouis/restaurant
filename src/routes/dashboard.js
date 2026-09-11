const express = require("express");

const { requireAuth } = require("../middleware/auth");

function daysUntil(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
}

function ageLabel(value) {
  if (!value) return "";
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return "";
  const hours = Math.max(0, Math.floor((Date.now() - then.getTime()) / 3600000));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

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
        openRequisitions,
        openOrders,
        openKitchen,
        lowStockRows,
        expiringRows,
        todayBatches,
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
             HAVING p.reorder_level > 0
                AND COALESCE(SUM(ib.quantity_on_hand), 0) <= p.reorder_level
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
        db.all(
          `SELECT pr.id, pr.requisition_number, pr.status, pr.purchase_type, pr.created_at,
                  u.full_name AS requester_name
           FROM purchase_requisitions pr
           LEFT JOIN users u ON u.id = pr.requested_by
           WHERE pr.status IN ('Draft', 'Submitted')
           ORDER BY pr.created_at ASC
           LIMIT 8`
        ),
        db.all(
          `SELECT po.id, po.order_number, po.status, po.expected_delivery_date, po.created_at,
                  s.name AS supplier_name
           FROM purchase_orders po
           LEFT JOIN suppliers s ON s.id = po.supplier_id
           WHERE po.status IN ('Draft', 'Sent', 'Partially Received')
           ORDER BY po.expected_delivery_date NULLS LAST, po.created_at ASC
           LIMIT 8`
        ),
        db.all(
          `SELECT kr.id, kr.requisition_number, kr.status, kr.department_name, kr.created_at,
                  u.full_name AS requester_name
           FROM kitchen_requisitions kr
           LEFT JOIN users u ON u.id = kr.requested_by
           WHERE kr.status IN ('Draft', 'Submitted', 'Approved')
           ORDER BY
             CASE kr.status WHEN 'Approved' THEN 0 WHEN 'Submitted' THEN 1 ELSE 2 END,
             kr.created_at ASC
           LIMIT 8`
        ),
        db.all(
          `SELECT p.id AS product_id, p.name AS product_name, p.reorder_level,
                  COALESCE(SUM(ib.quantity_on_hand), 0) AS current_stock
           FROM products p
           LEFT JOIN inventory_balances ib ON ib.product_id = p.id
           GROUP BY p.id
           HAVING p.reorder_level > 0
              AND COALESCE(SUM(ib.quantity_on_hand), 0) <= p.reorder_level
           ORDER BY COALESCE(SUM(ib.quantity_on_hand), 0) ASC, p.name ASC
           LIMIT 8`
        ),
        db.all(
          `SELECT sb.id, sb.batch_number, sb.expiry_date, sb.quantity_remaining,
                  p.name AS product_name
           FROM stock_batches sb
           INNER JOIN products p ON p.id = sb.product_id
           WHERE sb.expiry_date IS NOT NULL
             AND sb.quantity_remaining > 0
             AND sb.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
           ORDER BY sb.expiry_date ASC
           LIMIT 8`
        ),
        db.all(
          `SELECT pb.id, pb.batch_number, pb.status, pb.shift, pb.production_date, pb.created_at,
                  kr.department_name
           FROM production_batches pb
           LEFT JOIN kitchen_requisitions kr ON kr.id = pb.kitchen_requisition_id
           WHERE pb.production_date = CURRENT_DATE
             AND pb.status NOT IN ('Completed', 'Cancelled')
           ORDER BY pb.created_at ASC
           LIMIT 8`
        ),
      ]);

      const topActions = [];

      for (const row of openOrders || []) {
        const due = daysUntil(row.expected_delivery_date);
        const overdue = due !== null && due < 0;
        const dueToday = due === 0;
        let severity = 4;
        let tone = "warning";
        let detail = `${row.supplier_name || "Supplier"} - ${row.status}`;
        if (overdue) {
          severity = 1;
          tone = "danger";
          detail = `${row.supplier_name || "Supplier"} - overdue ${Math.abs(due)}d`;
        } else if (dueToday) {
          severity = 4;
          tone = "warning";
          detail = `${row.supplier_name || "Supplier"} - due today`;
        } else if (due !== null) {
          detail = `${row.supplier_name || "Supplier"} - due in ${due}d`;
        }
        topActions.push({
          id: row.order_number,
          title: `Receive ${row.order_number}`,
          detail: `${detail} - ${ageLabel(row.created_at)}`.replace(/\s-\s$/, ""),
          tone,
          verb: "Receive",
          target: "procurement",
          tab: "purchase orders",
          severity,
          count: 1,
          source: "orders",
          sortKey: row.created_at,
        });
      }

      for (const row of openKitchen || []) {
        const approved = String(row.status) === "Approved";
        topActions.push({
          id: row.requisition_number,
          title: approved
            ? `Issue stock for ${row.requisition_number}`
            : `Review ${row.requisition_number}`,
          detail: `${row.department_name || "Kitchen"} - ${String(row.status).toLowerCase()} - ${ageLabel(row.created_at)}`,
          tone: approved ? "warning" : "info",
          verb: approved ? "Issue" : "Review",
          target: "kitchen",
          tab: "pending",
          severity: approved ? 3 : 3.5,
          count: 1,
          source: "kitchen",
          sortKey: row.created_at,
        });
      }

      for (const row of lowStockRows || []) {
        const current = Number(row.current_stock || 0);
        const out = current <= 0;
        topActions.push({
          id: `stock-${row.product_id}`,
          title: out ? `Restock ${row.product_name}` : `Review low stock - ${row.product_name}`,
          detail: out
            ? `Out of stock - reorder ${Number(row.reorder_level || 0)}`
            : `On hand ${current} - reorder ${Number(row.reorder_level || 0)}`,
          tone: out ? "danger" : "warning",
          verb: "Review",
          target: "inventory",
          tab: "alerts",
          severity: out ? 5 : 5.5,
          count: 1,
          source: "stock",
          sortKey: current,
        });
      }

      for (const row of expiringRows || []) {
        const due = daysUntil(row.expiry_date);
        const expired = due !== null && due < 0;
        const soon = due !== null && due <= 7;
        let detail;
        if (expired) detail = `Expired ${Math.abs(due)}d ago - ${Number(row.quantity_remaining)} left`;
        else if (due === 0) detail = `Expires today - ${Number(row.quantity_remaining)} left`;
        else detail = `Expires in ${due}d - ${Number(row.quantity_remaining)} left`;
        topActions.push({
          id: row.batch_number || `batch-${row.id}`,
          title: `Review expiry - ${row.product_name}`,
          detail,
          tone: expired || due === 0 ? "danger" : "warning",
          verb: "Review",
          target: "inventory",
          tab: "alerts",
          severity: expired ? 1 : soon ? 6 : 6.5,
          count: 1,
          source: "stock",
          sortKey: row.expiry_date,
        });
      }

      for (const row of todayBatches || []) {
        topActions.push({
          id: row.batch_number,
          title: `Record batch ${row.batch_number}`,
          detail: `${row.department_name || row.shift || "Production"} - ${String(row.status).toLowerCase()}`,
          tone: "info",
          verb: "Open",
          target: "production",
          tab: "batches",
          severity: 7,
          count: 1,
          source: "production",
          sortKey: row.created_at,
        });
      }

      for (const row of openRequisitions || []) {
        const ageHours = row.created_at
          ? Math.floor((Date.now() - new Date(row.created_at).getTime()) / 3600000)
          : 0;
        const oldDraft = String(row.status) === "Draft" && ageHours >= 24;
        topActions.push({
          id: row.requisition_number,
          title: `Review ${row.requisition_number}`,
          detail: `${row.purchase_type || "Purchase"} - ${String(row.status).toLowerCase()} - ${row.requester_name || "requester"} - ${ageLabel(row.created_at)}`,
          tone: oldDraft ? "warning" : "info",
          verb: "Review",
          target: "procurement",
          tab: "purchase requisitions",
          severity: oldDraft ? 8 : 8.5,
          count: 1,
          source: "requisitions",
          sortKey: row.created_at,
        });
      }

      topActions.sort((a, b) => {
        if (a.severity !== b.severity) return a.severity - b.severity;
        const aKey = a.sortKey == null ? "" : String(a.sortKey);
        const bKey = b.sortKey == null ? "" : String(b.sortKey);
        return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
      });

      const ranked = topActions.slice(0, 24).map(({ sortKey, ...rest }) => rest);

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
          stockRiskItems:
            Number(lowStockItems?.value || 0) + Number(expiringStockItems?.value || 0),
          topConsumedProducts,
          wastageValue: Number(wastageValue?.value || 0),
          supplierBalances,
          purchaseActivity,
          topActions: ranked,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createDashboardRoutes;