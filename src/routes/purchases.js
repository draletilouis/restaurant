const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { recordStockMovement } = require("../services/stock-service");
const {
  buildBrandedDocumentHtml,
  escapeHtml,
  formatCurrency,
  formatDocumentCode,
  formatDate,
  getBusinessBranding,
} = require("../services/branded-document");
const { renderToPDF } = require("../services/pdf-generator");
const { renderWorkbook } = require("../services/excel-export");

function sumLineTotal(items = []) {
  return items.reduce((total, item) => total + Number(item.quantity || 0) * Number(item.unitCost || 0), 0);
}

async function getPurchaseOrderDocument(db, id) {
  const order = await db.get(
    `SELECT po.*, s.name AS supplier_name, st.name AS store_name, u.full_name AS created_by_name
     FROM purchase_orders po
     INNER JOIN suppliers s ON s.id = po.supplier_id
     LEFT JOIN stores st ON st.id = po.destination_store_id
     LEFT JOIN users u ON u.id = po.created_by
     WHERE po.id = ?`,
    [id]
  );
  if (!order) {
    return null;
  }

  const items = await db.all(
    `SELECT poi.*, i.name AS item_name, un.code AS unit_code
     FROM purchase_order_items poi
     INNER JOIN items i ON i.id = poi.item_id
     LEFT JOIN units un ON un.id = i.unit_id
     WHERE poi.purchase_order_id = ?
     ORDER BY poi.id`,
    [id]
  );

  return {
    ...order,
    items,
  };
}

async function getGoodsReceiptDocument(db, id) {
  const receipt = await db.get(
    `SELECT gr.*, po.id AS purchase_order_number, po.order_date, po.expected_date,
            s.name AS supplier_name, st.name AS store_name, u.full_name AS created_by_name
     FROM goods_receipts gr
     INNER JOIN purchase_orders po ON po.id = gr.purchase_order_id
     INNER JOIN suppliers s ON s.id = po.supplier_id
     INNER JOIN stores st ON st.id = gr.store_id
     LEFT JOIN users u ON u.id = gr.created_by
     WHERE gr.id = ?`,
    [id]
  );
  if (!receipt) {
    return null;
  }

  const items = await db.all(
    `SELECT gri.*, i.name AS item_name, un.code AS unit_code
     FROM goods_receipt_items gri
     INNER JOIN items i ON i.id = gri.item_id
     LEFT JOIN units un ON un.id = i.unit_id
     WHERE gri.goods_receipt_id = ?
     ORDER BY gri.id`,
    [id]
  );

  return {
    ...receipt,
    items,
    total_amount: items.reduce((sum, item) => sum + Number(item.line_total || 0), 0),
  };
}

async function sendPdfResponse(res, filename, html) {
  const pdfBuffer = await renderToPDF(html);
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Length": pdfBuffer.length,
  });
  res.send(pdfBuffer);
}

async function sendWorkbookResponse(res, filename, workbookOptions) {
  const buffer = await renderWorkbook(workbookOptions);
  res.set({
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Length": buffer.length,
  });
  res.send(buffer);
}

function createPurchasesRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/orders", async (req, res, next) => {
    try {
      const orders = await db.all(
        `SELECT po.*, s.name AS supplier_name, st.name AS store_name
         FROM purchase_orders po
         INNER JOIN suppliers s ON s.id = po.supplier_id
         LEFT JOIN stores st ON st.id = po.destination_store_id
         ORDER BY po.id DESC`
      );
      res.json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  });

  router.get("/orders/:id", async (req, res, next) => {
    try {
      const order = await getPurchaseOrderDocument(db, req.params.id);
      if (!order) {
        res.status(404).json({ success: false, message: "Purchase order not found" });
        return;
      }
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  });

  router.get("/orders/:id/pdf", async (req, res, next) => {
    try {
      const order = await getPurchaseOrderDocument(db, req.params.id);
      if (!order) {
        res.status(404).json({ success: false, message: "Purchase order not found" });
        return;
      }

      const { business, logoDataUri, settings } = await getBusinessBranding(db);
      const documentNumber = formatDocumentCode(settings.purchaseOrderPrefix, order.id);
      const rows = order.items
        .map(
          (item) => `
            <tr>
              <td class="col-name">${escapeHtml(item.item_name)}</td>
              <td class="col-qty">${Number(item.quantity || 0).toLocaleString()}</td>
              <td class="col-price">${formatCurrency(item.unit_cost, settings.currencyCode)}</td>
              <td class="col-total">${formatCurrency(item.line_total, settings.currencyCode)}</td>
            </tr>`
        )
        .join("");

      const html = buildBrandedDocumentHtml({
        business,
        logoDataUri,
        titleWord: "Purchase Order",
        documentLabel: "Supplier Purchase Order",
        documentNumber,
        documentDate: order.order_date,
        leftMetaRows: [
          { label: "Supplier", value: order.supplier_name, bold: true },
          { label: "Store", value: order.store_name || "-" },
          { label: "Order Date", value: formatDate(order.order_date) },
          { label: "Expected", value: formatDate(order.expected_date) },
        ],
        rightMetaRows: [
          { label: "Status", value: order.status, bold: true },
          { label: "Type", value: order.purchase_type },
          { label: "Prepared By", value: order.created_by_name || "-" },
          { label: "Total", value: formatCurrency(order.total_amount, settings.currencyCode), bold: true },
        ],
        notes: order.notes || "",
        bodyHtml: `
          <table>
            <thead>
              <tr>
                <th class="col-name">Item Description</th>
                <th class="col-qty">Qty</th>
                <th class="col-price">Unit Cost</th>
                <th class="col-total">Line Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr class="tf-total">
                <td colspan="4" class="tf-total-cell"><div class="tf-total-line"><span class="tf-label">TOTAL</span><span class="tf-value">${formatCurrency(order.total_amount, settings.currencyCode)}</span></div></td>
              </tr>
            </tfoot>
          </table>`,
      });

      await sendPdfResponse(res, `PurchaseOrder-${documentNumber}.pdf`, html);
    } catch (error) {
      next(error);
    }
  });

  router.get("/orders/:id/xlsx", async (req, res, next) => {
    try {
      const order = await getPurchaseOrderDocument(db, req.params.id);
      if (!order) {
        res.status(404).json({ success: false, message: "Purchase order not found" });
        return;
      }

      const { business, settings } = await getBusinessBranding(db);
      const documentNumber = formatDocumentCode(settings.purchaseOrderPrefix, order.id);
      await sendWorkbookResponse(res, `PurchaseOrder-${documentNumber}.xlsx`, {
        business,
        title: "Purchase Order",
        documentLabel: "Supplier Purchase Order",
        documentNumber,
        documentDate: order.order_date,
        leftMetaRows: [
          { label: "Supplier", value: order.supplier_name },
          { label: "Store", value: order.store_name || "-" },
          { label: "Expected", value: formatDate(order.expected_date) },
        ],
        rightMetaRows: [
          { label: "Status", value: order.status },
          { label: "Type", value: order.purchase_type },
          { label: "Prepared By", value: order.created_by_name || "-" },
        ],
        notes: order.notes || "",
        sheetName: "Purchase Order",
        columns: [
          { header: "Item", key: "item_name", width: 32 },
          { header: "Unit", key: "unit_code", width: 12 },
          { header: "Quantity", key: "quantity", width: 14 },
          { header: "Unit Cost", key: "unit_cost", width: 16 },
          { header: "Line Total", key: "line_total", width: 16 },
        ],
        rows: order.items.map((item) => ({
          item_name: item.item_name,
          unit_code: item.unit_code || "-",
          quantity: Number(item.quantity || 0),
          unit_cost: Number(item.unit_cost || 0),
          line_total: Number(item.line_total || 0),
        })),
        totals: [{ label: "TOTAL", value: Number(order.total_amount || 0) }],
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/receipts", async (req, res, next) => {
    try {
      const receipts = await db.all(
        `SELECT gr.*, po.id AS purchase_order_number, st.name AS store_name
         FROM goods_receipts gr
         INNER JOIN purchase_orders po ON po.id = gr.purchase_order_id
         INNER JOIN stores st ON st.id = gr.store_id
         ORDER BY gr.id DESC`
      );
      res.json({ success: true, data: receipts });
    } catch (error) {
      next(error);
    }
  });

  router.get("/receipts/:id", async (req, res, next) => {
    try {
      const receipt = await getGoodsReceiptDocument(db, req.params.id);
      if (!receipt) {
        res.status(404).json({ success: false, message: "Goods receipt not found" });
        return;
      }
      res.json({ success: true, data: receipt });
    } catch (error) {
      next(error);
    }
  });

  router.get("/receipts/:id/pdf", async (req, res, next) => {
    try {
      const receipt = await getGoodsReceiptDocument(db, req.params.id);
      if (!receipt) {
        res.status(404).json({ success: false, message: "Goods receipt not found" });
        return;
      }

      const { business, logoDataUri, settings } = await getBusinessBranding(db);
      const documentNumber = formatDocumentCode(settings.goodsReceiptPrefix, receipt.id);
      const rows = receipt.items
        .map(
          (item) => `
            <tr>
              <td class="col-name">${escapeHtml(item.item_name)}</td>
              <td class="col-qty">${Number(item.quantity_received || 0).toLocaleString()}</td>
              <td class="col-price">${formatCurrency(item.unit_cost, settings.currencyCode)}</td>
              <td class="col-total">${formatCurrency(item.line_total, settings.currencyCode)}</td>
            </tr>`
        )
        .join("");

      const html = buildBrandedDocumentHtml({
        business,
        logoDataUri,
        titleWord: "Goods Receipt",
        documentLabel: "Purchase Receipt Note",
        documentNumber,
        documentDate: receipt.receipt_date,
        leftMetaRows: [
          { label: "Supplier", value: receipt.supplier_name, bold: true },
          { label: "PO Ref", value: formatDocumentCode(settings.purchaseOrderPrefix, receipt.purchase_order_number) },
          { label: "Store", value: receipt.store_name || "-" },
        ],
        rightMetaRows: [
          { label: "Status", value: receipt.status, bold: true },
          { label: "Received By", value: receipt.created_by_name || "-" },
          { label: "Value", value: formatCurrency(receipt.total_amount, settings.currencyCode), bold: true },
        ],
        notes: receipt.notes || "",
        bodyHtml: `
          <table>
            <thead>
              <tr>
                <th class="col-name">Item Description</th>
                <th class="col-qty">Received Qty</th>
                <th class="col-price">Unit Cost</th>
                <th class="col-total">Line Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr class="tf-total">
                <td colspan="4" class="tf-total-cell"><div class="tf-total-line"><span class="tf-label">TOTAL</span><span class="tf-value">${formatCurrency(receipt.total_amount, settings.currencyCode)}</span></div></td>
              </tr>
            </tfoot>
          </table>`,
      });

      await sendPdfResponse(res, `GoodsReceipt-${documentNumber}.pdf`, html);
    } catch (error) {
      next(error);
    }
  });

  router.get("/receipts/:id/xlsx", async (req, res, next) => {
    try {
      const receipt = await getGoodsReceiptDocument(db, req.params.id);
      if (!receipt) {
        res.status(404).json({ success: false, message: "Goods receipt not found" });
        return;
      }

      const { business, settings } = await getBusinessBranding(db);
      const documentNumber = formatDocumentCode(settings.goodsReceiptPrefix, receipt.id);
      await sendWorkbookResponse(res, `GoodsReceipt-${documentNumber}.xlsx`, {
        business,
        title: "Goods Receipt Note",
        documentLabel: "Purchase Receipt",
        documentNumber,
        documentDate: receipt.receipt_date,
        leftMetaRows: [
          { label: "Supplier", value: receipt.supplier_name },
          { label: "PO Ref", value: formatDocumentCode(settings.purchaseOrderPrefix, receipt.purchase_order_number) },
          { label: "Store", value: receipt.store_name || "-" },
        ],
        rightMetaRows: [
          { label: "Status", value: receipt.status },
          { label: "Received By", value: receipt.created_by_name || "-" },
        ],
        notes: receipt.notes || "",
        sheetName: "Goods Receipt",
        columns: [
          { header: "Item", key: "item_name", width: 32 },
          { header: "Unit", key: "unit_code", width: 12 },
          { header: "Received Qty", key: "quantity_received", width: 16 },
          { header: "Unit Cost", key: "unit_cost", width: 16 },
          { header: "Line Total", key: "line_total", width: 16 },
        ],
        rows: receipt.items.map((item) => ({
          item_name: item.item_name,
          unit_code: item.unit_code || "-",
          quantity_received: Number(item.quantity_received || 0),
          unit_cost: Number(item.unit_cost || 0),
          line_total: Number(item.line_total || 0),
        })),
        totals: [{ label: "TOTAL", value: Number(receipt.total_amount || 0) }],
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/orders", async (req, res, next) => {
    try {
      const { supplierId, destinationStoreId, orderDate, expectedDate, purchaseType, notes, items } = req.body;
      const totalAmount = sumLineTotal(items);
      const createdOrder = await db.transaction(async (tx) => {
        const orderResult = await tx.exec(
          `INSERT INTO purchase_orders (
             supplier_id, destination_store_id, order_date, expected_date,
             purchase_type, status, notes, total_amount, created_by
           ) VALUES (?, ?, ?, ?, ?, 'approved', ?, ?, ?)
           RETURNING *`,
          [
            supplierId,
            destinationStoreId || null,
            orderDate,
            expectedDate || null,
            purchaseType || "daily",
            notes || null,
            totalAmount,
            req.session.user.id,
          ]
        );
        const order = orderResult.rows[0];
        for (const item of items || []) {
          await tx.exec(
            `INSERT INTO purchase_order_items (
               purchase_order_id, item_id, quantity, unit_cost, line_total
             ) VALUES (?, ?, ?, ?, ?)`,
            [
              order.id,
              item.itemId,
              item.quantity,
              item.unitCost,
              Number(item.quantity) * Number(item.unitCost),
            ]
          );
        }
        return order;
      });
      await logAudit(db, req.session.user.id, "create", "purchase_order", createdOrder.id, req.body);
      res.status(201).json({ success: true, data: createdOrder });
    } catch (error) {
      next(error);
    }
  });

  router.post("/receipts", async (req, res, next) => {
    try {
      const { purchaseOrderId, storeId, receiptDate, notes, items } = req.body;
      const receipt = await db.transaction(async (tx) => {
        const receiptResult = await tx.exec(
          `INSERT INTO goods_receipts (
             purchase_order_id, store_id, receipt_date, notes, created_by
           ) VALUES (?, ?, ?, ?, ?)
           RETURNING *`,
          [purchaseOrderId, storeId, receiptDate, notes || null, req.session.user.id]
        );
        const createdReceipt = receiptResult.rows[0];

        for (const item of items || []) {
          await tx.exec(
            `INSERT INTO goods_receipt_items (
               goods_receipt_id, item_id, quantity_received, unit_cost, line_total
             ) VALUES (?, ?, ?, ?, ?)`,
            [
              createdReceipt.id,
              item.itemId,
              item.quantityReceived,
              item.unitCost,
              Number(item.quantityReceived) * Number(item.unitCost),
            ]
          );

          await recordStockMovement(tx, {
            itemId: item.itemId,
            storeId,
            movementType: "purchase_receipt",
            referenceType: "goods_receipt",
            referenceId: createdReceipt.id,
            quantityIn: Number(item.quantityReceived),
            quantityOut: 0,
            unitCost: Number(item.unitCost),
            movementDate: receiptDate,
            notes: notes || null,
          });
        }

        await tx.exec("UPDATE purchase_orders SET status = 'received' WHERE id = ?", [purchaseOrderId]);
        return createdReceipt;
      });

      await logAudit(db, req.session.user.id, "receive", "goods_receipt", receipt.id, req.body);
      res.status(201).json({ success: true, data: receipt });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createPurchasesRoutes;
