"use strict";

const {
  buildBrandedDocumentHtml,
  escapeHtml,
  formatCurrency,
  formatDate,
  getBusinessBranding,
} = require("./branded-document");
const { renderToPDF } = require("./pdf-generator");
const { renderWorkbook } = require("./excel-export");

const DOCUMENT_TYPES = {
  "purchase-orders": {
    titleWord: "Local Purchase Order",
    documentLabel: "Supplier Local Purchase Order",
    entityType: "purchase_order",
    filePrefix: "PurchaseOrder",
  },
  "purchase-requisitions": {
    titleWord: "Purchase Requisition",
    documentLabel: "Internal Purchase Requisition",
    entityType: "purchase_requisition",
    filePrefix: "PurchaseRequisition",
  },
  "goods-received": {
    titleWord: "Goods Received",
    documentLabel: "Goods Received Note",
    entityType: "goods_received_note",
    filePrefix: "GoodsReceived",
  },
  "supplier-invoices": {
    titleWord: "Supplier Invoice",
    documentLabel: "Accounts Payable Invoice",
    entityType: "supplier_invoice",
    filePrefix: "SupplierInvoice",
  },
  "payment-vouchers": {
    titleWord: "Payment Voucher",
    documentLabel: "Payment Voucher",
    entityType: "payment_voucher",
    filePrefix: "PaymentVoucher",
  },
  "kitchen-requisitions": {
    titleWord: "Kitchen Requisition",
    documentLabel: "Kitchen Stock Request",
    entityType: "kitchen_requisition",
    filePrefix: "KitchenRequisition",
  },
  "production-batches": {
    titleWord: "Production Batch",
    documentLabel: "Production Batch Record",
    entityType: "production_batch",
    filePrefix: "ProductionBatch",
  },
};

function getDocumentDefinition(type) {
  return DOCUMENT_TYPES[type] || null;
}

function formatUnit(item) {
  return item.unit_code || item.unit_name || "-";
}

function unitColumn() {
  return { key: "unit", header: "Unit", className: "col-unit", excelHeader: "Unit", excelKey: "unit", width: 12 };
}

function buildItemTable(columns, rows, totals = []) {
  const header = columns
    .map((column) => `<th class="${column.className || ""}">${escapeHtml(column.header)}</th>`)
    .join("");
  const body =
    rows.length === 0
      ? `<tr><td colspan="${columns.length}">No line items.</td></tr>`
      : rows
          .map((row) => {
            const cells = columns
              .map((column) => `<td class="${column.className || ""}">${row[column.key] ?? ""}</td>`)
              .join("");
            return `<tr>${cells}</tr>`;
          })
          .join("");
  const footer = totals
    .map((total) => {
      return `<tr class="tf-total"><td colspan="${Math.max(columns.length, 1)}" class="tf-total-cell"><div class="tf-total-line"><span class="tf-label">${escapeHtml(
        total.label
      )}</span><span class="tf-value">${escapeHtml(total.value)}</span></div></td></tr>`;
    })
    .join("");
  return `
    <table>
      <thead><tr>${header}</tr></thead>
      <tbody>${body}</tbody>
      ${footer ? `<tfoot>${footer}</tfoot>` : ""}
    </table>`;
}

async function loadPurchaseOrder(db, id) {
  const header = await db.get(
    `SELECT po.*, s.name AS supplier_name, s.address AS supplier_address,
            s.phone AS supplier_phone, u.full_name AS created_by_name
     FROM purchase_orders po
     INNER JOIN suppliers s ON s.id = po.supplier_id
     LEFT JOIN users u ON u.id = po.created_by
     WHERE po.id = ?`,
    [id]
  );
  if (!header) return null;
  const items = await db.all(
    `SELECT poi.*, p.name AS product_name, uom.code AS unit_code
     FROM purchase_order_items poi
     INNER JOIN products p ON p.id = poi.product_id
     LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
     WHERE poi.purchase_order_id = ?
     ORDER BY p.name`,
    [id]
  );
  const total = items.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
  return {
    number: header.order_number,
    date: header.order_date,
    notes: header.notes,
    leftMetaRows: [
      { label: "LPO No.", value: header.order_number, bold: true },
      { label: "Order Date", value: formatDate(header.order_date) },
      { label: "Supplier", value: header.supplier_name || "-" },
      { label: "Expected", value: formatDate(header.expected_delivery_date) },
    ],
    rightMetaRows: [
      { label: "Status", value: header.status, bold: true },
      { label: "Prepared By", value: header.created_by_name || "-" },
      { label: "Purchase Type", value: header.purchase_type || "Weekly" },
      { label: "Value", value: formatCurrency(total), bold: true },
    ],
    columns: [
      { key: "name", header: "Item Description", className: "col-name", excelHeader: "Item", excelKey: "name", width: 32 },
      { key: "qty", header: "Qty", className: "col-qty", excelHeader: "Qty", excelKey: "qtyValue", width: 12 },
      unitColumn(),
      { key: "price", header: "Unit Cost", className: "col-price", excelHeader: "Unit Cost", excelKey: "priceValue", width: 16 },
      { key: "total", header: "Line Total", className: "col-total", excelHeader: "Line Total", excelKey: "totalValue", width: 16 },
    ],
    htmlRows: items.map((item) => ({
      name: escapeHtml(item.product_name),
      qty: Number(item.quantity_ordered || 0).toLocaleString(),
      unit: escapeHtml(formatUnit(item)),
      price: formatCurrency(item.unit_cost),
      total: formatCurrency(item.line_total),
    })),
    excelRows: items.map((item) => ({
      name: item.product_name,
      qtyValue: Number(item.quantity_ordered || 0),
      unit: formatUnit(item),
      priceValue: Number(item.unit_cost || 0),
      totalValue: Number(item.line_total || 0),
    })),
    totals: [{ label: "TOTAL", value: formatCurrency(total) }],
    excelTotals: [{ label: "TOTAL", value: formatCurrency(total) }],
  };
}

async function loadPurchaseRequisition(db, id) {
  const header = await db.get(
    `SELECT pr.*, req.full_name AS requested_by_name, appr.full_name AS approved_by_name
     FROM purchase_requisitions pr
     LEFT JOIN users req ON req.id = pr.requested_by
     LEFT JOIN users appr ON appr.id = pr.approved_by
     WHERE pr.id = ?`,
    [id]
  );
  if (!header) return null;
  const items = await db.all(
    `SELECT pri.*, p.name AS product_name, s.name AS preferred_supplier_name,
            uom.code AS unit_code, uom.name AS unit_name
     FROM purchase_requisition_items pri
     INNER JOIN products p ON p.id = pri.product_id
     LEFT JOIN suppliers s ON s.id = pri.preferred_supplier_id
     LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
     WHERE pri.purchase_requisition_id = ?
     ORDER BY p.name`,
    [id]
  );
  const total = items.reduce(
    (sum, item) =>
      sum + Number(item.estimated_unit_cost || 0) * Number(item.quantity_approved || item.quantity_requested || 0),
    0
  );
  return {
    number: header.requisition_number,
    date: header.request_date,
    notes: header.notes,
    leftMetaRows: [
      { label: "PR No.", value: header.requisition_number, bold: true },
      { label: "Request Date", value: formatDate(header.request_date) },
      { label: "Requested By", value: header.requested_by_name || "-" },
      { label: "Purchase Type", value: header.purchase_type || "Weekly" },
    ],
    rightMetaRows: [
      { label: "Status", value: header.status, bold: true },
      { label: "Approved By", value: header.approved_by_name || "-" },
      { label: "Items", value: String(items.length) },
      { label: "Est. Value", value: formatCurrency(total), bold: true },
    ],
    columns: [
      { key: "name", header: "Product", className: "col-name", excelHeader: "Product", excelKey: "name", width: 28 },
      { key: "requested", header: "Requested", className: "col-qty", excelHeader: "Requested", excelKey: "requestedValue", width: 12 },
      { key: "approved", header: "Approved", className: "col-qty", excelHeader: "Approved", excelKey: "approvedValue", width: 12 },
      unitColumn(),
      { key: "cost", header: "Est. Cost", className: "col-price", excelHeader: "Est. Cost", excelKey: "costValue", width: 16 },
      { key: "total", header: "Line Total", className: "col-total", excelHeader: "Line Total", excelKey: "totalValue", width: 16 },
    ],
    htmlRows: items.map((item) => {
      const qty = Number(item.quantity_approved || item.quantity_requested || 0);
      const lineTotal = qty * Number(item.estimated_unit_cost || 0);
      return {
        name: escapeHtml(item.product_name),
        requested: Number(item.quantity_requested || 0).toLocaleString(),
        approved: Number(item.quantity_approved || 0).toLocaleString(),
        unit: escapeHtml(formatUnit(item)),
        cost: formatCurrency(item.estimated_unit_cost),
        total: formatCurrency(lineTotal),
      };
    }),
    excelRows: items.map((item) => {
      const qty = Number(item.quantity_approved || item.quantity_requested || 0);
      return {
        name: item.product_name,
        requestedValue: Number(item.quantity_requested || 0),
        approvedValue: Number(item.quantity_approved || 0),
        unit: formatUnit(item),
        costValue: Number(item.estimated_unit_cost || 0),
        totalValue: qty * Number(item.estimated_unit_cost || 0),
      };
    }),
    totals: [{ label: "ESTIMATED TOTAL", value: formatCurrency(total) }],
    excelTotals: [{ label: "ESTIMATED TOTAL", value: formatCurrency(total) }],
  };
}

async function loadGoodsReceived(db, id) {
  const header = await db.get(
    `SELECT grn.id, grn.grn_number, grn.purchase_order_id, grn.supplier_id,
            grn.receipt_date, grn.received_by, grn.notes,
            po.order_number, s.name AS supplier_name,
            recv.full_name AS received_by_name
     FROM goods_received_notes grn
     INNER JOIN purchase_orders po ON po.id = grn.purchase_order_id
     INNER JOIN suppliers s ON s.id = grn.supplier_id
     LEFT JOIN users recv ON recv.id = grn.received_by
     WHERE grn.id = ?`,
    [id]
  );
  if (!header) return null;
  const items = await db.all(
    `SELECT grni.*, p.name AS product_name, uom.code AS unit_code, uom.name AS unit_name
     FROM goods_received_note_items grni
     INNER JOIN products p ON p.id = grni.product_id
     LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
     WHERE grni.goods_received_note_id = ?
     ORDER BY p.name`,
    [id]
  );
  const total = items.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
  return {
    number: header.grn_number,
    date: header.receipt_date,
    notes: header.notes,
    leftMetaRows: [
      { label: "GRN No.", value: header.grn_number, bold: true },
      { label: "Receipt Date", value: formatDate(header.receipt_date) },
      { label: "Supplier", value: header.supplier_name || "-" },
      { label: "Local Purchase Order", value: header.order_number || "-" },
    ],
    rightMetaRows: [
      { label: "Received By", value: header.received_by_name || "-" },
      { label: "Value", value: formatCurrency(total), bold: true },
    ],
    columns: [
      { key: "name", header: "Product", className: "col-name", excelHeader: "Product", excelKey: "name", width: 28 },
      { key: "qty", header: "Received", className: "col-qty", excelHeader: "Received", excelKey: "qtyValue", width: 12 },
      unitColumn(),
      { key: "batch", header: "Batch", className: "col-batch", excelHeader: "Batch", excelKey: "batch", width: 16 },
      { key: "expiry", header: "Expiry", className: "col-qty", excelHeader: "Expiry", excelKey: "expiry", width: 14 },
      { key: "total", header: "Line Total", className: "col-total", excelHeader: "Line Total", excelKey: "totalValue", width: 16 },
    ],
    htmlRows: items.map((item) => ({
      name: escapeHtml(item.product_name),
      qty: Number(item.quantity_received || 0).toLocaleString(),
      unit: escapeHtml(formatUnit(item)),
      batch: escapeHtml(item.batch_number || "-"),
      expiry: formatDate(item.expiry_date),
      total: formatCurrency(item.line_total),
    })),
    excelRows: items.map((item) => ({
      name: item.product_name,
      qtyValue: Number(item.quantity_received || 0),
      unit: formatUnit(item),
      batch: item.batch_number || "-",
      expiry: formatDate(item.expiry_date),
      totalValue: Number(item.line_total || 0),
    })),
    totals: [{ label: "TOTAL", value: formatCurrency(total) }],
    excelTotals: [{ label: "TOTAL", value: formatCurrency(total) }],
  };
}

async function loadSupplierInvoice(db, id) {
  const header = await db.get(
    `SELECT si.*, s.name AS supplier_name, s.address AS supplier_address,
            po.order_number, grn.grn_number, u.full_name AS created_by_name
     FROM supplier_invoices si
     INNER JOIN suppliers s ON s.id = si.supplier_id
     LEFT JOIN purchase_orders po ON po.id = si.purchase_order_id
     LEFT JOIN goods_received_notes grn ON grn.id = si.goods_received_note_id
     LEFT JOIN users u ON u.id = si.created_by
     WHERE si.id = ?`,
    [id]
  );
  if (!header) return null;
  const payments = await db.all(
    `SELECT payment_date, amount, payment_method, reference_number, notes
     FROM payment_vouchers
     WHERE supplier_invoice_id = ? AND LOWER(status) = 'paid'
     ORDER BY payment_date, id`,
    [id]
  );
  const balance = Number(header.total_amount || 0) - Number(header.amount_paid || 0);
  const items = [
    {
      name: `Supplier invoice for ${header.supplier_name}`,
      qty: "1",
      price: formatCurrency(header.total_amount),
      total: formatCurrency(header.total_amount),
    },
    ...payments.map((payment) => ({
      name: `Payment ${formatDate(payment.payment_date)} via ${payment.payment_method || "N/A"}`,
      qty: "1",
      price: formatCurrency(payment.amount),
      total: formatCurrency(payment.amount),
    })),
  ];
  return {
    number: header.invoice_number,
    date: header.invoice_date,
    notes: header.notes,
    leftMetaRows: [
      { label: "Invoice No.", value: header.invoice_number, bold: true },
      { label: "Invoice Date", value: formatDate(header.invoice_date) },
      { label: "Supplier", value: header.supplier_name || "-" },
      { label: "Due Date", value: formatDate(header.due_date) },
    ],
    rightMetaRows: [
      { label: "Payment", value: header.payment_status, bold: true },
      { label: "Local Purchase Order", value: header.order_number || "-" },
      { label: "GRN", value: header.grn_number || "-" },
      { label: "Balance", value: formatCurrency(balance), bold: true },
    ],
    columns: [
      { key: "name", header: "Description", className: "col-name", excelHeader: "Description", excelKey: "name", width: 40 },
      { key: "qty", header: "Qty", className: "col-qty", excelHeader: "Qty", excelKey: "qtyValue", width: 10 },
      { key: "price", header: "Amount", className: "col-price", excelHeader: "Amount", excelKey: "priceValue", width: 16 },
      { key: "total", header: "Total", className: "col-total", excelHeader: "Total", excelKey: "totalValue", width: 16 },
    ],
    htmlRows: items,
    excelRows: [
      {
        name: `Supplier invoice for ${header.supplier_name}`,
        qtyValue: 1,
        priceValue: Number(header.total_amount || 0),
        totalValue: Number(header.total_amount || 0),
      },
      ...payments.map((payment) => ({
        name: `Payment ${formatDate(payment.payment_date)} via ${payment.payment_method || "N/A"}`,
        qtyValue: 1,
        priceValue: Number(payment.amount || 0),
        totalValue: Number(payment.amount || 0),
      })),
    ],
    totals: [
      { label: "INVOICE TOTAL", value: formatCurrency(header.total_amount) },
      { label: "AMOUNT PAID", value: formatCurrency(header.amount_paid) },
      { label: "BALANCE DUE", value: formatCurrency(balance) },
    ],
    excelTotals: [
      { label: "INVOICE TOTAL", value: formatCurrency(header.total_amount) },
      { label: "AMOUNT PAID", value: formatCurrency(header.amount_paid) },
      { label: "BALANCE DUE", value: formatCurrency(balance) },
    ],
  };
}

async function loadPaymentVoucher(db, id) {
  const header = await db.get(
    `SELECT pv.*, s.name AS supplier_name, si.invoice_number,
            cr.requisition_number AS cash_requisition_number,
            cr.payee_name AS cash_payee_name, cr.purpose AS cash_requisition_purpose,
            cr.currency_code, prepared.full_name AS prepared_by_name,
            approved.full_name AS approved_by_name, paid.full_name AS paid_by_name
     FROM payment_vouchers pv
     LEFT JOIN suppliers s ON s.id = pv.supplier_id
     LEFT JOIN supplier_invoices si ON si.id = pv.supplier_invoice_id
     LEFT JOIN cash_requisitions cr ON cr.id = pv.cash_requisition_id
     LEFT JOIN users prepared ON prepared.id = pv.prepared_by
     LEFT JOIN users approved ON approved.id = pv.approved_by
     LEFT JOIN users paid ON paid.id = pv.paid_by
     WHERE pv.id = ?`,
    [id],
  );
  if (!header) return null;

  const isCashRequisition = Boolean(header.cash_requisition_id);
  const sourceNumber = isCashRequisition
    ? header.cash_requisition_number
    : header.invoice_number;
  const payee =
    String(header.payee_name || "").trim() ||
    header.supplier_name ||
    header.cash_payee_name ||
    "-";
  const currency = header.currency_code || "UGX";
  const amount = Number(header.amount || 0);
  const purpose = String(
    header.purpose || header.cash_requisition_purpose || "",
  ).trim();
  const lineDescription = isCashRequisition
    ? purpose || "Cash requisition payment"
    : purpose || `Payment against supplier invoice ${sourceNumber || "-"}`;

  return {
    number: header.voucher_number,
    date: header.payment_date,
    notes: header.notes,
    leftMetaRows: [
      { label: "Voucher No.", value: header.voucher_number, bold: true },
      { label: "Payment Date", value: formatDate(header.payment_date) },
      { label: "Payment To", value: payee },
      { label: "Payment Method", value: header.payment_method || "-" },
      { label: "Reference", value: header.reference_number || "-" },
    ],
    rightMetaRows: [
      { label: "Status", value: header.status, bold: true },
      { label: isCashRequisition ? "Cash Requisition" : "Supplier Invoice", value: sourceNumber || "-" },
      { label: "Prepared By", value: header.prepared_by_name || "-" },
      { label: "Approved By", value: header.approved_by_name || "-" },
      { label: "Paid By", value: header.paid_by_name || "-" },
    ],
    columns: [
      {
        key: "description",
        header: isCashRequisition ? "Purpose" : "Payment Description",
        className: "col-name",
        excelHeader: isCashRequisition ? "Purpose" : "Description",
        excelKey: "description",
        width: 52,
      },
      { key: "amount", header: "Amount", className: "col-total", excelHeader: "Amount", excelKey: "amountValue", width: 18 },
    ],
    htmlRows: [
      {
        description: escapeHtml(lineDescription),
        amount: escapeHtml(formatCurrency(amount, currency)),
      },
    ],
    excelRows: [
      {
        description: lineDescription,
        amountValue: amount,
      },
    ],
    totals: [{ label: "TOTAL PAID", value: formatCurrency(amount, currency) }],
    excelTotals: [{ label: "TOTAL PAID", value: formatCurrency(amount, currency) }],
  };
}

async function loadKitchenRequisition(db, id) {
  const header = await db.get(
    `SELECT kr.*, sl.name AS store_name, req.full_name AS requested_by_name,
            appr.full_name AS approved_by_name
     FROM kitchen_requisitions kr
     INNER JOIN store_locations sl ON sl.id = kr.source_store_location_id
     LEFT JOIN users req ON req.id = kr.requested_by
     LEFT JOIN users appr ON appr.id = kr.approved_by
     WHERE kr.id = ?`,
    [id]
  );
  if (!header) return null;
  const items = await db.all(
    `SELECT kri.*, p.name AS product_name, uom.code AS unit_code, uom.name AS unit_name
     FROM kitchen_requisition_items kri
     INNER JOIN products p ON p.id = kri.product_id
     LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
     WHERE kri.kitchen_requisition_id = ?
     ORDER BY p.name`,
    [id]
  );
  return {
    number: header.requisition_number,
    date: header.request_date,
    notes: header.notes,
    leftMetaRows: [
      { label: "KR No.", value: header.requisition_number, bold: true },
      { label: "Request Date", value: formatDate(header.request_date) },
      { label: "Kitchen", value: header.department_name || "-" },
      { label: "Production Date", value: formatDate(header.production_date) },
    ],
    rightMetaRows: [
      { label: "Status", value: header.status, bold: true },
      { label: "Requested By", value: header.requested_by_name || "-" },
      { label: "Approved By", value: header.approved_by_name || "-" },
      { label: "Source Store", value: header.store_name || "-" },
    ],
    columns: [
      { key: "name", header: "Product", className: "col-name", excelHeader: "Product", excelKey: "name", width: 28 },
      { key: "requested", header: "Requested", className: "col-qty", excelHeader: "Requested", excelKey: "requestedValue", width: 12 },
      { key: "approved", header: "Approved", className: "col-qty", excelHeader: "Approved", excelKey: "approvedValue", width: 12 },
      { key: "issued", header: "Issued", className: "col-qty", excelHeader: "Issued", excelKey: "issuedValue", width: 12 },
      unitColumn(),
    ],
    htmlRows: items.map((item) => ({
      name: escapeHtml(item.product_name),
      requested: Number(item.requested_quantity || 0).toLocaleString(),
      approved: Number(item.approved_quantity || 0).toLocaleString(),
      issued: Number(item.issued_quantity || 0).toLocaleString(),
      unit: escapeHtml(formatUnit(item)),
    })),
    excelRows: items.map((item) => ({
      name: item.product_name,
      requestedValue: Number(item.requested_quantity || 0),
      approvedValue: Number(item.approved_quantity || 0),
      issuedValue: Number(item.issued_quantity || 0),
      unit: formatUnit(item),
    })),
    totals: [],
    excelTotals: [],
  };
}

async function loadProductionBatch(db, id) {
  const header = await db.get(
    `SELECT pb.*, kr.requisition_number, u.full_name AS supervisor_name
     FROM production_batches pb
     INNER JOIN kitchen_requisitions kr ON kr.id = pb.kitchen_requisition_id
     LEFT JOIN users u ON u.id = pb.supervisor_id
     WHERE pb.id = ?`,
    [id]
  );
  if (!header) return null;
  const items = await db.all(
    `SELECT pbi.*, p.name AS product_name
     FROM production_batch_items pbi
     INNER JOIN products p ON p.id = pbi.product_id
     WHERE pbi.production_batch_id = ?
     ORDER BY p.name`,
    [id]
  );
  return {
    number: header.batch_number,
    date: header.production_date,
    notes: header.notes,
    leftMetaRows: [
      { label: "Batch No.", value: header.batch_number, bold: true },
      { label: "Production Date", value: formatDate(header.production_date) },
      { label: "Shift", value: header.shift || "-" },
      { label: "Requisition", value: header.requisition_number || "-" },
    ],
    rightMetaRows: [
      { label: "Status", value: header.status, bold: true },
      { label: "Supervisor", value: header.supervisor_name || "-" },
      { label: "Planned", value: Number(header.planned_output || 0).toLocaleString() },
      { label: "Actual", value: Number(header.actual_output || 0).toLocaleString(), bold: true },
    ],
    columns: [
      { key: "name", header: "Consumed Product", className: "col-name", excelHeader: "Product", excelKey: "name", width: 32 },
      { key: "qty", header: "Consumed", className: "col-qty", excelHeader: "Consumed", excelKey: "qtyValue", width: 14 },
    ],
    htmlRows: items.map((item) => ({
      name: escapeHtml(item.product_name),
      qty: Number(item.quantity_consumed || 0).toLocaleString(),
    })),
    excelRows: items.map((item) => ({
      name: item.product_name,
      qtyValue: Number(item.quantity_consumed || 0),
    })),
    totals: [{ label: "WASTAGE", value: Number(header.wastage_quantity || 0).toLocaleString() }],
    excelTotals: [{ label: "WASTAGE", value: Number(header.wastage_quantity || 0) }],
  };
}

const LOADERS = {
  "purchase-orders": loadPurchaseOrder,
  "purchase-requisitions": loadPurchaseRequisition,
  "goods-received": loadGoodsReceived,
  "supplier-invoices": loadSupplierInvoice,
  "payment-vouchers": loadPaymentVoucher,
  "kitchen-requisitions": loadKitchenRequisition,
  "production-batches": loadProductionBatch,
};

async function loadDocument(db, type, id) {
  const definition = getDocumentDefinition(type);
  if (!definition) {
    const error = new Error("Unknown document type");
    error.statusCode = 400;
    throw error;
  }
  const payload = await LOADERS[type](db, id);
  if (!payload) {
    return null;
  }
  return { definition, payload };
}

function buildDocumentHtml(branding, definition, payload) {
  return buildBrandedDocumentHtml({
    business: branding.business,
    logoDataUri: branding.logoDataUri,
    titleWord: definition.titleWord,
    documentLabel: definition.documentLabel,
    documentNumber: payload.number,
    documentDate: payload.date,
    leftMetaRows: payload.leftMetaRows,
    rightMetaRows: payload.rightMetaRows,
    notes: payload.notes || "",
    showSignature: true,
    documentSettings: branding.settings,
    bodyHtml: buildItemTable(payload.columns, payload.htmlRows, payload.totals),
  });
}

function safeFilename(prefix, number, extension) {
  return `${prefix}-${String(number || "document").replace(/[^a-zA-Z0-9-]/g, "_")}.${extension}`;
}

async function renderDocument(db, type, id, format) {
  const loaded = await loadDocument(db, type, id);
  if (!loaded) {
    return null;
  }
  const branding = await getBusinessBranding(db);
  const { definition, payload } = loaded;
  const html = buildDocumentHtml(branding, definition, payload);

  if (format === "html") {
    return {
      contentType: "text/html; charset=utf-8",
      filename: safeFilename(definition.filePrefix, payload.number, "html"),
      body: html,
      definition,
      payload,
    };
  }

  if (format === "xlsx") {
    const buffer = await renderWorkbook({
      business: branding.business,
      title: definition.titleWord,
      documentLabel: definition.documentLabel,
      documentNumber: payload.number,
      documentDate: payload.date,
      leftMetaRows: payload.leftMetaRows,
      rightMetaRows: payload.rightMetaRows,
      notes: payload.notes || "",
      columns: payload.columns.map((column) => ({
        header: column.excelHeader,
        key: column.excelKey,
        width: column.width,
      })),
      rows: payload.excelRows,
      totals: payload.excelTotals,
      sheetName: definition.titleWord,
    });
    return {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: safeFilename(definition.filePrefix, payload.number, "xlsx"),
      body: Buffer.from(buffer),
      definition,
      payload,
    };
  }

  const pdfBuffer = await renderToPDF(html);
  return {
    contentType: "application/pdf",
    filename: safeFilename(definition.filePrefix, payload.number, "pdf"),
    body: pdfBuffer,
    definition,
    payload,
  };
}

module.exports = {
  DOCUMENT_TYPES,
  getDocumentDefinition,
  loadDocument,
  renderDocument,
};
