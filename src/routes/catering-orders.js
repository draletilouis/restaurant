const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
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

async function getCateringOrderDocument(db, id) {
  const order = await db.get(
    `SELECT co.*, c.name AS customer_name, c.contact_person, c.phone, u.full_name AS created_by_name
     FROM catering_orders co
     INNER JOIN customers c ON c.id = co.customer_id
     LEFT JOIN users u ON u.id = co.created_by
     WHERE co.id = ?`,
    [id]
  );
  if (!order) {
    return null;
  }

  const items = await db.all(
    `SELECT coi.*, it.name AS item_name
     FROM catering_order_items coi
     LEFT JOIN items it ON it.id = coi.item_id
     WHERE coi.catering_order_id = ?
     ORDER BY coi.id`,
    [id]
  );

  return {
    ...order,
    items,
  };
}

function createCateringOrderRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const orders = await db.all(
        `SELECT co.*, c.name AS customer_name
         FROM catering_orders co
         INNER JOIN customers c ON c.id = co.customer_id
         ORDER BY co.id DESC`
      );
      res.json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const order = await getCateringOrderDocument(db, req.params.id);
      if (!order) {
        res.status(404).json({ success: false, message: "Catering order not found" });
        return;
      }
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const { customerId, orderDate, eventDate, locationName, notes, items } = req.body;
      const totalAmount = (items || []).reduce(
        (total, item) => total + Number(item.quantity || 0) * Number(item.unitPrice || 0),
        0
      );
      const order = await db.transaction(async (tx) => {
        const result = await tx.exec(
          `INSERT INTO catering_orders (
             customer_id, order_date, event_date, location_name, notes, status, total_amount, created_by
           ) VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?)
           RETURNING *`,
          [customerId, orderDate, eventDate || null, locationName || null, notes || null, totalAmount, req.session.user.id]
        );
        const createdOrder = result.rows[0];
        for (const item of items || []) {
          await tx.exec(
            `INSERT INTO catering_order_items (
               catering_order_id, item_id, description, quantity, unit_price, line_total
             ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              createdOrder.id,
              item.itemId || null,
              item.description,
              item.quantity,
              item.unitPrice,
              Number(item.quantity) * Number(item.unitPrice),
            ]
          );
        }
        return createdOrder;
      });
      await logAudit(db, req.session.user.id, "create", "catering_order", order.id, req.body);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/pdf", async (req, res, next) => {
    try {
      const order = await getCateringOrderDocument(db, req.params.id);
      if (!order) {
        res.status(404).json({ success: false, message: "Catering order not found" });
        return;
      }

      const { business, logoDataUri, settings } = await getBusinessBranding(db);
      const documentNumber = formatDocumentCode(settings.cateringOrderPrefix, order.id);
      const rows = order.items
        .map(
          (item) => `
            <tr>
              <td class="col-name">${escapeHtml(item.description || item.item_name || "Item")}</td>
              <td class="col-qty">${Number(item.quantity || 0).toLocaleString()}</td>
              <td class="col-price">${formatCurrency(item.unit_price, settings.currencyCode)}</td>
              <td class="col-total">${formatCurrency(item.line_total, settings.currencyCode)}</td>
            </tr>`
        )
        .join("");

      const html = buildBrandedDocumentHtml({
        business,
        logoDataUri,
        titleWord: "Catering Order",
        documentLabel: "Customer Catering Order",
        documentNumber,
        documentDate: order.order_date,
        leftMetaRows: [
          { label: "Customer", value: order.customer_name, bold: true },
          { label: "Contact", value: order.contact_person || "-" },
          { label: "Phone", value: order.phone || "-" },
          { label: "Event Date", value: formatDate(order.event_date) },
        ],
        rightMetaRows: [
          { label: "Status", value: order.status, bold: true },
          { label: "Location", value: order.location_name || "-" },
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
                <th class="col-price">Unit Price</th>
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

      const pdfBuffer = await renderToPDF(html);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="CateringOrder-${documentNumber}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/xlsx", async (req, res, next) => {
    try {
      const order = await getCateringOrderDocument(db, req.params.id);
      if (!order) {
        res.status(404).json({ success: false, message: "Catering order not found" });
        return;
      }

      const { business, settings } = await getBusinessBranding(db);
      const documentNumber = formatDocumentCode(settings.cateringOrderPrefix, order.id);
      const buffer = await renderWorkbook({
        business,
        title: "Catering Order",
        documentLabel: "Customer Catering Order",
        documentNumber,
        documentDate: order.order_date,
        leftMetaRows: [
          { label: "Customer", value: order.customer_name },
          { label: "Contact", value: order.contact_person || "-" },
          { label: "Phone", value: order.phone || "-" },
        ],
        rightMetaRows: [
          { label: "Status", value: order.status },
          { label: "Location", value: order.location_name || "-" },
          { label: "Event Date", value: formatDate(order.event_date) },
        ],
        notes: order.notes || "",
        sheetName: "Catering Order",
        columns: [
          { header: "Description", key: "description", width: 34 },
          { header: "Quantity", key: "quantity", width: 14 },
          { header: "Unit Price", key: "unit_price", width: 16 },
          { header: "Line Total", key: "line_total", width: 16 },
        ],
        rows: order.items.map((item) => ({
          description: item.description || item.item_name || "Item",
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          line_total: Number(item.line_total || 0),
        })),
        totals: [{ label: "TOTAL", value: Number(order.total_amount || 0) }],
      });

      res.set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="CateringOrder-${documentNumber}.xlsx"`,
        "Content-Length": buffer.length,
      });
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createCateringOrderRoutes;
