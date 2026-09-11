"use strict";

const { formatCurrency } = require("./branded-document");

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function summaryItem(label, value, format = "number") {
  const display =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
        ? `${number(value).toFixed(2)}%`
        : String(number(value).toLocaleString("en-UG"));
  return { label, value: number(value), format, display };
}

function normalizeRange(query = {}, fallbackDays = 30) {
  const endDate = query.endDate || new Date().toISOString().slice(0, 10);
  const end = new Date(`${endDate}T00:00:00`);
  const start = query.startDate
    ? new Date(`${query.startDate}T00:00:00`)
    : new Date(end.getTime() - fallbackDays * 24 * 60 * 60 * 1000);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate,
  };
}

function getAgingBucket(dueDate, balance) {
  if (number(balance) <= 0) {
    return { aging_bucket: "Settled", days_overdue: 0, is_overdue: false };
  }
  if (!dueDate) {
    return { aging_bucket: "No Due Date", days_overdue: null, is_overdue: false };
  }
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    return { aging_bucket: "No Due Date", days_overdue: null, is_overdue: false };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const daysOverdue = Math.floor((today - due) / 86400000);
  if (daysOverdue <= 0) return { aging_bucket: "Current", days_overdue: 0, is_overdue: false };
  if (daysOverdue <= 30) return { aging_bucket: "1-30 Days", days_overdue: daysOverdue, is_overdue: true };
  if (daysOverdue <= 60) return { aging_bucket: "31-60 Days", days_overdue: daysOverdue, is_overdue: true };
  if (daysOverdue <= 90) return { aging_bucket: "61-90 Days", days_overdue: daysOverdue, is_overdue: true };
  return { aging_bucket: "90+ Days", days_overdue: daysOverdue, is_overdue: true };
}

const REPORT_CATALOG = [
  {
    type: "operational",
    title: "Operational Snapshot",
    category: "operational",
    description: "Active contracts, pending procurement, kitchen requests, and today's production.",
    tabs: ["operational", "management"],
    periodRequired: true,
  },
  {
    type: "inventory",
    title: "Inventory Health",
    category: "inventory",
    description: "Current store balances, stock value, low stock, and expiring batches.",
    tabs: ["inventory", "management"],
    periodRequired: false,
  },
  {
    type: "movements",
    title: "Stock Movement History",
    category: "inventory",
    description: "Every stock movement in the selected period.",
    tabs: ["inventory", "management"],
    periodRequired: true,
  },
  {
    type: "adjustments",
    title: "Stock Adjustments",
    category: "inventory",
    description: "Approved and pending stock adjustments.",
    tabs: ["inventory", "management"],
    periodRequired: true,
  },
  {
    type: "procurement",
    title: "Procurement Pipeline",
    category: "procurement",
    description: "Purchase requisitions and purchase orders in the selected period.",
    tabs: ["procurement", "management"],
    periodRequired: true,
  },
  {
    type: "purchases",
    title: "Purchase Report (LPO / PO)",
    category: "procurement",
    description: "Purchase orders and LPOs with suppliers, values, and status.",
    tabs: ["procurement", "finance", "management"],
    periodRequired: true,
  },
  {
    type: "cash-requisitions",
    title: "Cash Requisition Report",
    category: "finance",
    description: "Cash requests, payees, amounts, release, and settlement in the period.",
    tabs: ["finance", "procurement", "management"],
    periodRequired: true,
  },
  {
    type: "all-purchases",
    title: "All Purchases",
    category: "finance",
    description: "Combined purchases from LPOs/POs and cash requisitions in one register.",
    tabs: ["finance", "procurement", "management"],
    periodRequired: true,
  },
  {
    type: "receipts",
    title: "Goods Received",
    category: "procurement",
    description: "Confirmed receipts into central store.",
    tabs: ["procurement", "management"],
    periodRequired: true,
  },
  {
    type: "finance",
    title: "Supplier Payables",
    category: "finance",
    description: "Supplier invoices, payments, outstanding balances, and aging.",
    tabs: ["finance", "management"],
    periodRequired: true,
  },
  {
    type: "contracts",
    title: "Contract Demand Outlook",
    category: "contracts",
    description: "Active and upcoming contracts with expected daily demand.",
    tabs: ["contracts", "management"],
    periodRequired: false,
  },
  {
    type: "kitchen",
    title: "Kitchen Requisitions",
    category: "production",
    description: "Kitchen requests, approvals, and issues.",
    tabs: ["production", "management"],
    periodRequired: true,
  },
  {
    type: "production",
    title: "Production Batches",
    category: "production",
    description: "Planned versus actual output and recorded wastage.",
    tabs: ["production", "management"],
    periodRequired: true,
  },
  {
    type: "consumption",
    title: "Product Consumption",
    category: "production",
    description: "Purchased, issued, consumed, wasted, returned, and remaining quantities.",
    tabs: ["production", "management"],
    periodRequired: true,
  },
  {
    type: "wastage",
    title: "Wastage Report",
    category: "production",
    description: "Recorded wastage by product and production batch.",
    tabs: ["production", "management"],
    periodRequired: true,
  },
];

function getReportCatalog() {
  return REPORT_CATALOG.map((entry) => ({ ...entry }));
}

function getReportDefinition(type) {
  return REPORT_CATALOG.find((entry) => entry.type === type) || null;
}

async function fetchProductConsumptionRows(db, range) {
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
     SELECT p.name AS product_name,
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
             END AS wastage_rate
     FROM products p
     LEFT JOIN purchased ON purchased.product_id = p.id
     LEFT JOIN issued ON issued.product_id = p.id
     LEFT JOIN returned ON returned.product_id = p.id
     LEFT JOIN wasted ON wasted.product_id = p.id
     LEFT JOIN balances ON balances.product_id = p.id
     LEFT JOIN production ON production.product_id = p.id
     WHERE COALESCE(purchased.purchased_quantity, 0) > 0
        OR COALESCE(issued.issued_quantity, 0) > 0
        OR COALESCE(returned.returned_quantity, 0) > 0
        OR COALESCE(wasted.wastage_quantity, 0) > 0
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

async function fetchOperationalReport(db, range) {
  const [contracts, requisitions, orders, kitchen, production] = await Promise.all([
    db.all(
      `SELECT c.contract_number, cl.name AS client_name, loc.name AS location_name,
              c.status, c.expected_daily_quantity, c.price_per_unit, c.start_date, c.end_date
       FROM contracts c
       INNER JOIN clients cl ON cl.id = c.client_id
       INNER JOIN client_locations loc ON loc.id = c.client_location_id
       WHERE c.status = 'Active'
       ORDER BY cl.name, c.contract_number`
    ),
    db.get(
      `SELECT COUNT(*) FILTER (WHERE status IN ('Draft', 'Submitted')) AS pending_requisitions
       FROM purchase_requisitions
       WHERE request_date BETWEEN ? AND ?`,
      [range.startDate, range.endDate]
    ),
    db.get(
      `SELECT COUNT(*) FILTER (WHERE status IN ('Draft', 'Sent', 'Partially Received')) AS pending_orders
       FROM purchase_orders
       WHERE order_date BETWEEN ? AND ?`,
      [range.startDate, range.endDate]
    ),
    db.get(
      `SELECT COUNT(*) FILTER (WHERE status IN ('Draft', 'Submitted', 'Approved')) AS pending_kitchen
       FROM kitchen_requisitions
       WHERE request_date BETWEEN ? AND ?`,
      [range.startDate, range.endDate]
    ),
    db.get(
      `SELECT COUNT(*) AS batch_count, COALESCE(SUM(actual_output), 0) AS actual_output
       FROM production_batches
       WHERE production_date BETWEEN ? AND ?`,
      [range.startDate, range.endDate]
    ),
  ]);

  return {
    type: "operational",
    title: "Operational Snapshot",
    period: range,
    landscape: true,
    summary: [
      summaryItem("Active contracts", contracts.length),
      summaryItem("Pending purchase requisitions", requisitions?.pending_requisitions),
      summaryItem("Open purchase orders", orders?.pending_orders),
      summaryItem("Open kitchen requisitions", kitchen?.pending_kitchen),
      summaryItem("Production batches", production?.batch_count),
      summaryItem("Actual output", production?.actual_output),
    ],
    columns: [
      { key: "contract_number", header: "Contract" },
      { key: "client_name", header: "Client" },
      { key: "location_name", header: "Location" },
      { key: "status", header: "Status" },
      { key: "expected_daily_quantity", header: "Daily Qty", format: "number" },
      { key: "price_per_unit", header: "Price / Unit", format: "currency" },
      { key: "start_date", header: "Start", format: "date" },
      { key: "end_date", header: "End", format: "date" },
    ],
    rows: contracts,
  };
}

async function fetchInventoryReport(db) {
  const [rows, expiring] = await Promise.all([
    db.all(
      `SELECT p.name AS product_name, pc.name AS category, sl.name AS store_name,
              ib.quantity_on_hand, ib.stock_value, p.reorder_level, p.minimum_stock_level,
              CASE
                WHEN ib.quantity_on_hand <= 0 THEN 'Out of stock'
                WHEN p.reorder_level > 0 AND ib.quantity_on_hand <= p.reorder_level THEN 'Low stock'
                ELSE 'Healthy'
              END AS stock_status
       FROM inventory_balances ib
       INNER JOIN products p ON p.id = ib.product_id
       INNER JOIN store_locations sl ON sl.id = ib.store_location_id
       LEFT JOIN product_categories pc ON pc.id = p.product_category_id
       ORDER BY ib.quantity_on_hand ASC, p.name`
    ),
    db.get(
      `SELECT COUNT(*) AS expiring_count
       FROM stock_batches
       WHERE quantity_remaining > 0
         AND expiry_date IS NOT NULL
         AND expiry_date <= (CURRENT_DATE + INTERVAL '14 days')`
    ),
  ]);

  const lowStock = rows.filter((row) => row.stock_status === "Low stock").length;
  const outOfStock = rows.filter((row) => row.stock_status === "Out of stock").length;
  const stockValue = rows.reduce((sum, row) => sum + number(row.stock_value), 0);

  return {
    type: "inventory",
    title: "Inventory Health",
    period: { startDate: null, endDate: null },
    landscape: true,
    summary: [
      summaryItem("Tracked balances", rows.length),
      summaryItem("Stock value", stockValue, "currency"),
      summaryItem("Low stock", lowStock),
      summaryItem("Out of stock", outOfStock),
      summaryItem("Expiring in 14 days", expiring?.expiring_count),
    ],
    columns: [
      { key: "product_name", header: "Product" },
      { key: "category", header: "Category" },
      { key: "store_name", header: "Store" },
      { key: "quantity_on_hand", header: "On Hand", format: "number" },
      { key: "reorder_level", header: "Reorder", format: "number" },
      { key: "stock_value", header: "Value", format: "currency" },
      { key: "stock_status", header: "Status" },
    ],
    rows,
  };
}

async function fetchMovementsReport(db, range) {
  const rows = await db.all(
    `SELECT sm.movement_date, p.name AS product_name, sl.name AS store_name,
            sm.movement_type, sm.reference_type, sm.quantity_in, sm.quantity_out,
            sm.unit_cost, sm.balance_after, sm.notes
     FROM stock_movements sm
     INNER JOIN products p ON p.id = sm.product_id
     INNER JOIN store_locations sl ON sl.id = sm.store_location_id
     WHERE sm.movement_date BETWEEN ? AND ?
     ORDER BY sm.movement_date DESC, sm.id DESC`,
    [range.startDate, range.endDate]
  );
  return {
    type: "movements",
    title: "Stock Movement History",
    period: range,
    landscape: true,
    summary: [
      summaryItem("Movements", rows.length),
      summaryItem("Quantity in", rows.reduce((sum, row) => sum + number(row.quantity_in), 0)),
      summaryItem("Quantity out", rows.reduce((sum, row) => sum + number(row.quantity_out), 0)),
    ],
    columns: [
      { key: "movement_date", header: "Date", format: "date" },
      { key: "product_name", header: "Product" },
      { key: "store_name", header: "Store" },
      { key: "movement_type", header: "Type" },
      { key: "reference_type", header: "Reference" },
      { key: "quantity_in", header: "In", format: "number" },
      { key: "quantity_out", header: "Out", format: "number" },
      { key: "balance_after", header: "Balance", format: "number" },
    ],
    rows,
  };
}

async function fetchAdjustmentsReport(db, range) {
  const rows = await db.all(
    `SELECT sa.adjustment_number, sl.name AS store_name, sa.adjustment_date, sa.reason,
            sa.status, COALESCE(SUM(sai.quantity_delta), 0) AS quantity_delta,
            req.full_name AS requested_by_name
     FROM stock_adjustments sa
     INNER JOIN store_locations sl ON sl.id = sa.store_location_id
     LEFT JOIN stock_adjustment_items sai ON sai.stock_adjustment_id = sa.id
     LEFT JOIN users req ON req.id = sa.requested_by
     WHERE sa.adjustment_date BETWEEN ? AND ?
     GROUP BY sa.id, sl.name, req.full_name
     ORDER BY sa.adjustment_date DESC`,
    [range.startDate, range.endDate]
  );
  return {
    type: "adjustments",
    title: "Stock Adjustments",
    period: range,
    summary: [summaryItem("Adjustments", rows.length)],
    columns: [
      { key: "adjustment_number", header: "Adjustment" },
      { key: "store_name", header: "Store" },
      { key: "adjustment_date", header: "Date", format: "date" },
      { key: "reason", header: "Reason" },
      { key: "quantity_delta", header: "Qty Delta", format: "number" },
      { key: "status", header: "Status" },
      { key: "requested_by_name", header: "Requested By" },
    ],
    rows,
  };
}

async function fetchProcurementReport(db, range) {
  const rows = await db.all(
    `SELECT pr.requisition_number AS reference, 'Purchase Requisition' AS document_type,
            pr.request_date AS document_date, pr.status, pr.purchase_type,
            u.full_name AS party_name,
            COALESCE(SUM(COALESCE(pri.quantity_approved, pri.quantity_requested) * pri.estimated_unit_cost), 0) AS total_amount
     FROM purchase_requisitions pr
     LEFT JOIN users u ON u.id = pr.requested_by
     LEFT JOIN purchase_requisition_items pri ON pri.purchase_requisition_id = pr.id
     WHERE pr.request_date BETWEEN ? AND ?
     GROUP BY pr.id, u.full_name
     UNION ALL
     SELECT po.order_number, 'Purchase Order', po.order_date, po.status, po.purchase_type,
            s.name,
            COALESCE(SUM(poi.line_total), 0)
     FROM purchase_orders po
     INNER JOIN suppliers s ON s.id = po.supplier_id
     LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
     WHERE po.order_date BETWEEN ? AND ?
     GROUP BY po.id, s.name
     ORDER BY document_date DESC`,
    [range.startDate, range.endDate, range.startDate, range.endDate]
  );
  return {
    type: "procurement",
    title: "Procurement Pipeline",
    period: range,
    landscape: true,
    summary: [
      summaryItem("Documents", rows.length),
      summaryItem("Pipeline value", rows.reduce((sum, row) => sum + number(row.total_amount), 0), "currency"),
    ],
    columns: [
      { key: "document_type", header: "Type" },
      { key: "reference", header: "Reference" },
      { key: "party_name", header: "Requested / Supplier" },
      { key: "purchase_type", header: "Purchase Type" },
      { key: "document_date", header: "Date", format: "date" },
      { key: "status", header: "Status" },
      { key: "total_amount", header: "Value", format: "currency" },
    ],
    rows,
  };
}

async function fetchPurchasesReport(db, range) {
  const rows = await db.all(
    `SELECT po.order_number,
            po.lpo_number,
            s.name AS supplier_name,
            po.order_date,
            po.expected_delivery_date,
            po.purchase_type,
            po.status,
            COALESCE(SUM(poi.line_total), 0) AS total_amount,
            COALESCE(COUNT(poi.id), 0)::int AS item_count
     FROM purchase_orders po
     INNER JOIN suppliers s ON s.id = po.supplier_id
     LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
     WHERE po.order_date BETWEEN ? AND ?
     GROUP BY po.id, s.name
     ORDER BY po.order_date DESC, po.id DESC`,
    [range.startDate, range.endDate]
  );
  return {
    type: "purchases",
    title: "Purchase Report (LPO / PO)",
    period: range,
    summary: [
      summaryItem("Purchase documents", rows.length),
      summaryItem("Order value", rows.reduce((sum, row) => sum + number(row.total_amount), 0), "currency"),
      summaryItem("With LPO", rows.filter((row) => row.lpo_number).length),
    ],
    columns: [
      { key: "order_number", header: "PO" },
      { key: "lpo_number", header: "LPO" },
      { key: "supplier_name", header: "Supplier" },
      { key: "order_date", header: "Order Date", format: "date" },
      { key: "expected_delivery_date", header: "Expected", format: "date" },
      { key: "purchase_type", header: "Type" },
      { key: "item_count", header: "Items", format: "number" },
      { key: "status", header: "Status" },
      { key: "total_amount", header: "Total", format: "currency" },
    ],
    rows,
  };
}

async function fetchCashRequisitionsReport(db, range) {
  const rows = await db.all(
    `SELECT cr.requisition_number,
            cr.request_date,
            cr.required_date,
            d.name AS department_name,
            cr.payee_name,
            cr.purpose,
            cr.amount,
            cr.currency_code,
            cr.status,
            cr.release_payment_method,
            cr.cash_released_at,
            crs.settlement_date,
            crs.actual_spent_amount,
            crs.cash_returned_amount,
            crs.variance_amount
     FROM cash_requisitions cr
     LEFT JOIN departments d ON d.id = cr.department_id
     LEFT JOIN cash_requisition_settlements crs ON crs.cash_requisition_id = cr.id
     WHERE cr.request_date BETWEEN ? AND ?
     ORDER BY cr.request_date DESC, cr.id DESC`,
    [range.startDate, range.endDate]
  );
  return {
    type: "cash-requisitions",
    title: "Cash Requisition Report",
    period: range,
    summary: [
      summaryItem("Cash requisitions", rows.length),
      summaryItem("Requested", rows.reduce((sum, row) => sum + number(row.amount), 0), "currency"),
      summaryItem(
        "Settled spend",
        rows.reduce((sum, row) => sum + number(row.actual_spent_amount), 0),
        "currency"
      ),
    ],
    columns: [
      { key: "requisition_number", header: "CRQ" },
      { key: "request_date", header: "Request Date", format: "date" },
      { key: "department_name", header: "Department" },
      { key: "payee_name", header: "Payee" },
      { key: "purpose", header: "Purpose" },
      { key: "amount", header: "Requested", format: "currency" },
      { key: "status", header: "Status" },
      { key: "release_payment_method", header: "Release Method" },
      { key: "settlement_date", header: "Settled", format: "date" },
      { key: "actual_spent_amount", header: "Spent", format: "currency" },
      { key: "cash_returned_amount", header: "Returned", format: "currency" },
      { key: "variance_amount", header: "Variance", format: "currency" },
    ],
    rows,
  };
}

async function fetchAllPurchasesReport(db, range) {
  const rows = await db.all(
    `SELECT *
     FROM (
       SELECT
         'LPO / PO'::text AS source,
         COALESCE(po.lpo_number, po.order_number) AS reference,
         po.order_number AS secondary_reference,
         po.order_date AS purchase_date,
         s.name AS party_name,
         COALESCE(po.purchase_type, 'Purchase order') AS purpose,
         COALESCE(SUM(poi.line_total), 0) AS amount,
         po.status,
         'UGX'::text AS currency_code
       FROM purchase_orders po
       INNER JOIN suppliers s ON s.id = po.supplier_id
       LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
       WHERE po.order_date BETWEEN ? AND ?
       GROUP BY po.id, s.name

       UNION ALL

       SELECT
         'Cash Requisition'::text AS source,
         cr.requisition_number AS reference,
         NULL::text AS secondary_reference,
         cr.request_date AS purchase_date,
         COALESCE(cr.payee_name, 'Cash payee') AS party_name,
         cr.purpose,
         COALESCE(crs.actual_spent_amount, cr.amount) AS amount,
         cr.status,
         cr.currency_code
       FROM cash_requisitions cr
       LEFT JOIN cash_requisition_settlements crs ON crs.cash_requisition_id = cr.id
       WHERE cr.request_date BETWEEN ? AND ?
         AND LOWER(cr.status) NOT IN ('draft', 'rejected', 'cancelled')
     ) purchases
     ORDER BY purchase_date DESC, source, reference`,
    [range.startDate, range.endDate, range.startDate, range.endDate]
  );

  const lpoRows = rows.filter((row) => row.source === "LPO / PO");
  const cashRows = rows.filter((row) => row.source === "Cash Requisition");
  return {
    type: "all-purchases",
    title: "All Purchases",
    period: range,
    summary: [
      summaryItem("All purchases", rows.length),
      summaryItem("From LPO / PO", lpoRows.length),
      summaryItem("From cash requisitions", cashRows.length),
      summaryItem("Total value", rows.reduce((sum, row) => sum + number(row.amount), 0), "currency"),
    ],
    columns: [
      { key: "source", header: "Source" },
      { key: "reference", header: "Reference" },
      { key: "secondary_reference", header: "PO" },
      { key: "purchase_date", header: "Date", format: "date" },
      { key: "party_name", header: "Supplier / Payee" },
      { key: "purpose", header: "Purpose / Type" },
      { key: "status", header: "Status" },
      { key: "amount", header: "Amount", format: "currency" },
    ],
    rows,
  };
}

async function fetchReceiptsReport(db, range) {
  const rows = await db.all(
    `SELECT grn.grn_number, po.order_number, s.name AS supplier_name,
            grn.receipt_date,
            COALESCE(SUM(grni.quantity_received), 0) AS quantity_received,
            COALESCE(SUM(grni.line_total), 0) AS total_amount
     FROM goods_received_notes grn
     INNER JOIN purchase_orders po ON po.id = grn.purchase_order_id
     INNER JOIN suppliers s ON s.id = grn.supplier_id
     LEFT JOIN goods_received_note_items grni ON grni.goods_received_note_id = grn.id
     WHERE grn.receipt_date BETWEEN ? AND ?
     GROUP BY grn.id, po.order_number, s.name
     ORDER BY grn.receipt_date DESC`,
    [range.startDate, range.endDate]
  );
  return {
    type: "receipts",
    title: "Goods Received",
    period: range,
    summary: [
      summaryItem("Receipts", rows.length),
      summaryItem("Received value", rows.reduce((sum, row) => sum + number(row.total_amount), 0), "currency"),
    ],
    columns: [
      { key: "grn_number", header: "GRN" },
      { key: "order_number", header: "PO" },
      { key: "supplier_name", header: "Supplier" },
      { key: "receipt_date", header: "Date", format: "date" },
      { key: "quantity_received", header: "Qty Received", format: "number" },
      { key: "total_amount", header: "Value", format: "currency" },
    ],
    rows,
  };
}

async function fetchFinanceReport(db, range) {
  const invoices = await db.all(
    `SELECT si.invoice_number, s.name AS supplier_name, si.invoice_date, si.due_date,
            si.total_amount, si.amount_paid, (si.total_amount - si.amount_paid) AS balance,
            si.payment_status, si.status, po.order_number, grn.grn_number
     FROM supplier_invoices si
     INNER JOIN suppliers s ON s.id = si.supplier_id
     LEFT JOIN purchase_orders po ON po.id = si.purchase_order_id
     LEFT JOIN goods_received_notes grn ON grn.id = si.goods_received_note_id
     WHERE si.invoice_date BETWEEN ? AND ?
     ORDER BY si.invoice_date DESC`,
    [range.startDate, range.endDate]
  );
  const rows = invoices.map((invoice) => ({
    ...invoice,
    ...getAgingBucket(invoice.due_date, invoice.balance),
  }));
  const outstanding = rows.reduce((sum, row) => sum + number(row.balance), 0);
  const overdue = rows.filter((row) => row.is_overdue).length;
  return {
    type: "finance",
    title: "Supplier Payables",
    period: range,
    landscape: true,
    summary: [
      summaryItem("Invoices", rows.length),
      summaryItem("Invoiced", rows.reduce((sum, row) => sum + number(row.total_amount), 0), "currency"),
      summaryItem("Paid", rows.reduce((sum, row) => sum + number(row.amount_paid), 0), "currency"),
      summaryItem("Outstanding", outstanding, "currency"),
      summaryItem("Overdue invoices", overdue),
    ],
    columns: [
      { key: "invoice_number", header: "Invoice" },
      { key: "supplier_name", header: "Supplier" },
      { key: "invoice_date", header: "Invoice Date", format: "date" },
      { key: "due_date", header: "Due", format: "date" },
      { key: "total_amount", header: "Total", format: "currency" },
      { key: "amount_paid", header: "Paid", format: "currency" },
      { key: "balance", header: "Balance", format: "currency" },
      { key: "aging_bucket", header: "Aging" },
      { key: "payment_status", header: "Payment" },
    ],
    rows,
  };
}

async function fetchContractsReport(db) {
  const rows = await db.all(
    `SELECT c.contract_number, cl.name AS client_name, loc.name AS location_name,
            c.status, c.billing_cycle, c.expected_daily_quantity, c.price_per_unit,
            (c.expected_daily_quantity * c.price_per_unit) AS daily_value,
            c.start_date, c.end_date
     FROM contracts c
     INNER JOIN clients cl ON cl.id = c.client_id
     INNER JOIN client_locations loc ON loc.id = c.client_location_id
     ORDER BY c.status, cl.name`
  );
  const active = rows.filter((row) => row.status === "Active");
  return {
    type: "contracts",
    title: "Contract Demand Outlook",
    period: { startDate: null, endDate: null },
    landscape: true,
    summary: [
      summaryItem("Contracts", rows.length),
      summaryItem("Active", active.length),
      summaryItem("Daily meals", active.reduce((sum, row) => sum + number(row.expected_daily_quantity), 0)),
      summaryItem("Daily contract value", active.reduce((sum, row) => sum + number(row.daily_value), 0), "currency"),
    ],
    columns: [
      { key: "contract_number", header: "Contract" },
      { key: "client_name", header: "Client" },
      { key: "location_name", header: "Location" },
      { key: "status", header: "Status" },
      { key: "billing_cycle", header: "Billing" },
      { key: "expected_daily_quantity", header: "Daily Qty", format: "number" },
      { key: "price_per_unit", header: "Price / Unit", format: "currency" },
      { key: "daily_value", header: "Daily Value", format: "currency" },
      { key: "end_date", header: "End", format: "date" },
    ],
    rows,
  };
}

async function fetchKitchenReport(db, range) {
  const rows = await db.all(
    `SELECT kr.requisition_number, kr.department_name, u.full_name AS requested_by_name,
            kr.request_date, kr.production_date, kr.status,
            COALESCE(COUNT(kri.id), 0)::int AS item_count,
            COALESCE(SUM(kri.requested_quantity), 0) AS requested_quantity,
            COALESCE(SUM(kri.approved_quantity), 0) AS approved_quantity,
            COALESCE(SUM(kri.issued_quantity), 0) AS issued_quantity
     FROM kitchen_requisitions kr
     LEFT JOIN users u ON u.id = kr.requested_by
     LEFT JOIN kitchen_requisition_items kri ON kri.kitchen_requisition_id = kr.id
     WHERE kr.request_date BETWEEN ? AND ?
     GROUP BY kr.id, u.full_name
     ORDER BY kr.request_date DESC`,
    [range.startDate, range.endDate]
  );
  return {
    type: "kitchen",
    title: "Kitchen Requisitions",
    period: range,
    summary: [
      summaryItem("Requisitions", rows.length),
      summaryItem("Requested qty", rows.reduce((sum, row) => sum + number(row.requested_quantity), 0)),
      summaryItem("Issued qty", rows.reduce((sum, row) => sum + number(row.issued_quantity), 0)),
    ],
    columns: [
      { key: "requisition_number", header: "KR" },
      { key: "department_name", header: "Kitchen" },
      { key: "requested_by_name", header: "Requested By" },
      { key: "request_date", header: "Requested", format: "date" },
      { key: "production_date", header: "Production", format: "date" },
      { key: "item_count", header: "Items", format: "number" },
      { key: "requested_quantity", header: "Requested", format: "number" },
      { key: "issued_quantity", header: "Issued", format: "number" },
      { key: "status", header: "Status" },
    ],
    rows,
  };
}

async function fetchProductionReport(db, range) {
  const rows = await db.all(
    `SELECT pb.batch_number, pb.production_date, pb.shift, kr.requisition_number,
            u.full_name AS supervisor_name, pb.planned_output, pb.actual_output,
            pb.wastage_quantity, pb.status
     FROM production_batches pb
     INNER JOIN kitchen_requisitions kr ON kr.id = pb.kitchen_requisition_id
     LEFT JOIN users u ON u.id = pb.supervisor_id
     WHERE pb.production_date BETWEEN ? AND ?
     ORDER BY pb.production_date DESC`,
    [range.startDate, range.endDate]
  );
  return {
    type: "production",
    title: "Production Batches",
    period: range,
    summary: [
      summaryItem("Batches", rows.length),
      summaryItem("Planned output", rows.reduce((sum, row) => sum + number(row.planned_output), 0)),
      summaryItem("Actual output", rows.reduce((sum, row) => sum + number(row.actual_output), 0)),
      summaryItem("Wastage", rows.reduce((sum, row) => sum + number(row.wastage_quantity), 0)),
    ],
    columns: [
      { key: "batch_number", header: "Batch" },
      { key: "production_date", header: "Date", format: "date" },
      { key: "shift", header: "Shift" },
      { key: "requisition_number", header: "Requisition" },
      { key: "supervisor_name", header: "Supervisor" },
      { key: "planned_output", header: "Planned", format: "number" },
      { key: "actual_output", header: "Actual", format: "number" },
      { key: "wastage_quantity", header: "Wastage", format: "number" },
      { key: "status", header: "Status" },
    ],
    rows,
  };
}

async function fetchConsumptionReport(db, range) {
  const rows = await fetchProductConsumptionRows(db, range);
  return {
    type: "consumption",
    title: "Product Consumption",
    period: range,
    landscape: true,
    summary: [
      summaryItem("Products", rows.length),
      summaryItem("Issued", rows.reduce((sum, row) => sum + number(row.issued_quantity), 0)),
      summaryItem("Consumed", rows.reduce((sum, row) => sum + number(row.consumed_quantity), 0)),
      summaryItem("Wasted", rows.reduce((sum, row) => sum + number(row.wastage_quantity), 0)),
    ],
    columns: [
      { key: "product_name", header: "Product" },
      { key: "purchased_quantity", header: "Purchased", format: "number" },
      { key: "issued_quantity", header: "Issued", format: "number" },
      { key: "returned_quantity", header: "Returned", format: "number" },
      { key: "wastage_quantity", header: "Wasted", format: "number" },
      { key: "consumed_quantity", header: "Consumed", format: "number" },
      { key: "remaining_quantity", header: "Remaining", format: "number" },
      { key: "wastage_rate", header: "Waste %", format: "percent" },
    ],
    rows,
  };
}

async function fetchWastageReport(db, range) {
  const rows = await db.all(
    `SELECT wr.record_date, p.name AS product_name, wr.wastage_type, wr.quantity,
            wr.wastage_value, pb.batch_number, wr.notes
     FROM wastage_records wr
     INNER JOIN products p ON p.id = wr.product_id
     LEFT JOIN production_batches pb ON pb.id = wr.production_batch_id
     WHERE wr.record_date BETWEEN ? AND ?
     ORDER BY wr.record_date DESC`,
    [range.startDate, range.endDate]
  );
  return {
    type: "wastage",
    title: "Wastage Report",
    period: range,
    summary: [
      summaryItem("Records", rows.length),
      summaryItem("Wasted qty", rows.reduce((sum, row) => sum + number(row.quantity), 0)),
      summaryItem("Wastage value", rows.reduce((sum, row) => sum + number(row.wastage_value), 0), "currency"),
    ],
    columns: [
      { key: "record_date", header: "Date", format: "date" },
      { key: "product_name", header: "Product" },
      { key: "wastage_type", header: "Type" },
      { key: "batch_number", header: "Batch" },
      { key: "quantity", header: "Quantity", format: "number" },
      { key: "wastage_value", header: "Value", format: "currency" },
      { key: "notes", header: "Notes" },
    ],
    rows,
  };
}

async function fetchReport(db, type, query = {}) {
  const definition = getReportDefinition(type);
  if (!definition) {
    const error = new Error("Unknown report type");
    error.statusCode = 400;
    throw error;
  }
  const range = normalizeRange(query, 30);
  const fetchers = {
    operational: fetchOperationalReport,
    inventory: fetchInventoryReport,
    movements: fetchMovementsReport,
    adjustments: fetchAdjustmentsReport,
    procurement: fetchProcurementReport,
    purchases: fetchPurchasesReport,
    "cash-requisitions": fetchCashRequisitionsReport,
    "all-purchases": fetchAllPurchasesReport,
    receipts: fetchReceiptsReport,
    finance: fetchFinanceReport,
    contracts: fetchContractsReport,
    kitchen: fetchKitchenReport,
    production: fetchProductionReport,
    consumption: fetchConsumptionReport,
    wastage: fetchWastageReport,
  };
  const report = await fetchers[type](db, range);
  return {
    ...report,
    description: definition.description,
    category: definition.category,
  };
}

module.exports = {
  fetchReport,
  getAgingBucket,
  getReportCatalog,
  getReportDefinition,
  normalizeRange,
};
