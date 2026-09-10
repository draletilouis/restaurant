const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { getSettingsBundle } = require("../services/settings-service");
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

function generateInvoiceNumber(id, prefix = "INV") {
  return `${prefix}-${String(id).padStart(6, "0")}`;
}

async function getInvoiceDocument(db, id) {
  const invoice = await db.get(
    `SELECT i.*, c.name AS customer_name, c.contact_person, c.phone, u.full_name AS created_by_name
     FROM invoices i
     INNER JOIN customers c ON c.id = i.customer_id
     LEFT JOIN users u ON u.id = i.created_by
     WHERE i.id = ?`,
    [id]
  );
  if (!invoice) {
    return null;
  }

  const items = await db.all(
    `SELECT ii.*, it.name AS item_name
     FROM invoice_items ii
     LEFT JOIN items it ON it.id = ii.item_id
     WHERE ii.invoice_id = ?
     ORDER BY ii.id`,
    [id]
  );

  return {
    ...invoice,
    items,
  };
}

function createInvoicesRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const invoices = await db.all(
        `SELECT i.*, c.name AS customer_name
         FROM invoices i
         INNER JOIN customers c ON c.id = i.customer_id
         ORDER BY i.id DESC`
      );
      res.json({ success: true, data: invoices });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const invoice = await getInvoiceDocument(db, req.params.id);
      if (!invoice) {
        res.status(404).json({ success: false, message: "Invoice not found" });
        return;
      }
      res.json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const { customerId, cateringOrderId, invoiceDate, dueDate, notes, items } = req.body;
      const configuration = await getSettingsBundle(db);
      const totalAmount = (items || []).reduce(
        (total, item) => total + Number(item.quantity || 0) * Number(item.unitPrice || 0),
        0
      );
      const invoice = await db.transaction(async (tx) => {
        const inserted = await tx.exec(
          `INSERT INTO invoices (
             customer_id, catering_order_id, invoice_number, invoice_date,
             due_date, status, total_amount, balance_due, notes, created_by
           ) VALUES (?, ?, 'PENDING', ?, ?, 'open', ?, ?, ?, ?)
           RETURNING *`,
          [
            customerId,
            cateringOrderId || null,
            invoiceDate,
            dueDate || null,
            totalAmount,
            totalAmount,
            notes || null,
            req.session.user.id,
          ]
        );
        const createdInvoice = inserted.rows[0];
        await tx.exec("UPDATE invoices SET invoice_number = ? WHERE id = ?", [
          generateInvoiceNumber(createdInvoice.id, configuration.settings.invoicePrefix),
          createdInvoice.id,
        ]);
        for (const item of items || []) {
          await tx.exec(
            `INSERT INTO invoice_items (invoice_id, item_id, description, quantity, unit_price, line_total)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              createdInvoice.id,
              item.itemId || null,
              item.description,
              item.quantity,
              item.unitPrice,
              Number(item.quantity) * Number(item.unitPrice),
            ]
          );
        }
        return tx.get("SELECT * FROM invoices WHERE id = ?", [createdInvoice.id]);
      });
      await logAudit(db, req.session.user.id, "create", "invoice", invoice.id, req.body);
      res.status(201).json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/pdf", async (req, res, next) => {
    try {
      const invoice = await getInvoiceDocument(db, req.params.id);
      if (!invoice) {
        res.status(404).json({ success: false, message: "Invoice not found" });
        return;
      }

      const { business, logoDataUri, settings } = await getBusinessBranding(db);
      const rows = invoice.items
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
        titleWord: "Invoice",
        documentLabel: "Customer Invoice",
        documentNumber: invoice.invoice_number,
        documentDate: invoice.invoice_date,
        leftMetaRows: [
          { label: "Customer", value: invoice.customer_name, bold: true },
          { label: "Phone", value: invoice.phone || "-" },
          { label: "Issue Date", value: formatDate(invoice.invoice_date) },
          { label: "Due Date", value: formatDate(invoice.due_date) },
        ],
        rightMetaRows: [
          { label: "Status", value: invoice.status, bold: true },
          { label: "Outstanding", value: formatCurrency(invoice.balance_due, settings.currencyCode), bold: true },
          { label: "Prepared By", value: invoice.created_by_name || "-" },
          {
            label: "Order Ref",
            value: invoice.catering_order_id
              ? formatDocumentCode(settings.cateringOrderPrefix, invoice.catering_order_id)
              : "-",
          },
        ],
        notes: invoice.notes || "",
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
                <td colspan="4" class="tf-total-cell"><div class="tf-total-line"><span class="tf-label">TOTAL</span><span class="tf-value">${formatCurrency(invoice.total_amount, settings.currencyCode)}</span></div></td>
              </tr>
            </tfoot>
          </table>`,
      });

      const pdfBuffer = await renderToPDF(html);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/xlsx", async (req, res, next) => {
    try {
      const invoice = await getInvoiceDocument(db, req.params.id);
      if (!invoice) {
        res.status(404).json({ success: false, message: "Invoice not found" });
        return;
      }

      const { business, settings } = await getBusinessBranding(db);
      const buffer = await renderWorkbook({
        business,
        title: "Customer Invoice",
        documentLabel: "Invoice",
        documentNumber: invoice.invoice_number,
        documentDate: invoice.invoice_date,
        leftMetaRows: [
          { label: "Customer", value: invoice.customer_name },
          { label: "Phone", value: invoice.phone || "-" },
          { label: "Due Date", value: formatDate(invoice.due_date) },
        ],
        rightMetaRows: [
          { label: "Status", value: invoice.status },
          { label: "Outstanding", value: formatCurrency(invoice.balance_due) },
          { label: "Prepared By", value: invoice.created_by_name || "-" },
        ],
        notes: invoice.notes || "",
        sheetName: "Invoice",
        columns: [
          { header: "Description", key: "description", width: 32 },
          { header: "Quantity", key: "quantity", width: 14 },
          { header: "Unit Price", key: "unit_price", width: 16 },
          { header: "Line Total", key: "line_total", width: 16 },
        ],
        rows: invoice.items.map((item) => ({
          description: item.description || item.item_name || "Item",
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          line_total: Number(item.line_total || 0),
        })),
        totals: [{ label: "TOTAL", value: Number(invoice.total_amount || 0), currencyCode: settings.currencyCode }],
      });

      res.set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Invoice-${invoice.invoice_number}.xlsx"`,
        "Content-Length": buffer.length,
      });
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createInvoicesRoutes;
