const express = require("express");

const { requireAuth, requirePermission } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { ensureApprovalAllowed } = require("../services/approval-workflow-service");
const { resolvePaymentTerm } = require("../services/config-lookup-service");
const { receiveGoodsIntoInventory } = require("../services/inventory-service");
const { getNextSequence } = require("../services/system-service");
const { getStatus } = require("../services/status-service");
const { assertPurchaseType, assertPurchaseTypeQuery } = require("../services/purchase-type-service");
const { resolveInvoicePaymentDetails } = require("../services/invoice-payment-service");

function createProcurementRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  async function getCentralStoreId(tx) {
    const store = await tx.get("SELECT id FROM store_locations WHERE name = ?", ["Central Store"]);
    if (!store) {
      const error = new Error("Central Store is not configured.");
      error.status = 500;
      throw error;
    }
    return store.id;
  }

  router.get("/purchase-requisitions", async (req, res, next) => {
    try {
      const purchaseType = assertPurchaseTypeQuery(req.query.purchaseType);
      const where = purchaseType ? "WHERE pr.purchase_type = ?" : "";
      const params = purchaseType ? [purchaseType] : [];
      const rows = await db.all(
        `SELECT pr.*, u.full_name AS requested_by_name, a.full_name AS approved_by_name,
                COALESCE(COUNT(pri.id), 0)::int AS item_count,
                COALESCE(SUM(COALESCE(pri.quantity_approved, pri.quantity_requested) * pri.estimated_unit_cost), 0) AS total_amount
         FROM purchase_requisitions pr
         LEFT JOIN users u ON u.id = pr.requested_by
         LEFT JOIN users a ON a.id = pr.approved_by
         LEFT JOIN purchase_requisition_items pri ON pri.purchase_requisition_id = pr.id
         ${where}
         GROUP BY pr.id, u.full_name, a.full_name
         ORDER BY pr.created_at DESC`,
        params
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.get("/purchase-requisitions/:id", async (req, res, next) => {
    try {
      const header = await db.get("SELECT * FROM purchase_requisitions WHERE id = ?", [req.params.id]);
      if (!header) {
        res.status(404).json({ success: false, message: "Purchase requisition not found" });
        return;
      }
      const [items, auditTrail] = await Promise.all([
        db.all(
          `SELECT pri.*, p.name AS product_name, s.name AS preferred_supplier_name,
                  uom.code AS unit_code, uom.name AS unit_name
           FROM purchase_requisition_items pri
           INNER JOIN products p ON p.id = pri.product_id
           LEFT JOIN suppliers s ON s.id = pri.preferred_supplier_id
           LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
           WHERE pri.purchase_requisition_id = ?
           ORDER BY p.name`,
          [req.params.id]
        ),
        db.all(
          `SELECT *
           FROM audit_logs
           WHERE entity_type = 'purchase_requisition' AND entity_id = ?
           ORDER BY created_at DESC`,
          [req.params.id]
        ),
      ]);
      res.json({ success: true, data: { header, items, auditTrail } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/purchase-requisitions", async (req, res, next) => {
    try {
      const purchaseType = assertPurchaseType(req.body.purchaseType);
      const statusRow = await getStatus(db, "purchase_requisition", req.body.status || "Draft", { fallbackName: "Draft" });
      const requisition = await db.transaction(async (tx) => {
        const requisitionNumber = await getNextSequence(
          { ...db, get: tx.get.bind(tx) },
          "purchaseRequisitionPrefix",
          "purchase_requisitions"
        );
        const headerResult = await tx.exec(
          `INSERT INTO purchase_requisitions
             (requisition_number, request_date, purchase_type, status_id, status, requested_by, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           RETURNING *`,
          [
            requisitionNumber,
            req.body.requestDate,
            purchaseType,
            statusRow?.id || null,
            statusRow?.status_name || "Draft",
            req.session.user.id,
            req.body.notes || null,
          ]
        );

        for (const item of req.body.items || []) {
          await tx.exec(
            `INSERT INTO purchase_requisition_items
               (purchase_requisition_id, product_id, quantity_requested, quantity_approved, estimated_unit_cost, preferred_supplier_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              headerResult.rows[0].id,
              item.productId,
              item.quantityRequested || 0,
              item.quantityApproved || 0,
              item.estimatedUnitCost || 0,
              item.preferredSupplierId || null,
            ]
          );
        }

        return headerResult.rows[0];
      });

      await logAudit(db, req.session.user.id, "create", "purchase_requisition", requisition.id, req.body);
      res.status(201).json({ success: true, data: requisition });
    } catch (error) {
      next(error);
    }
  });

  router.post("/purchase-requisitions/:id/submit", async (req, res, next) => {
    try {
      const requisition = await db.get("SELECT * FROM purchase_requisitions WHERE id = ?", [req.params.id]);
      if (!requisition) {
        res.status(404).json({ success: false, message: "Purchase requisition not found" });
        return;
      }
      if (String(requisition.status || "").toLowerCase() !== "draft") {
        res.status(400).json({ success: false, message: "Only draft purchase requisitions can be submitted." });
        return;
      }
      const submittedStatus = await getStatus(db, "purchase_requisition", "submitted", { fallbackName: "Submitted" });
      const result = await db.exec(
        `UPDATE purchase_requisitions
         SET status_id = ?, status = ?, updated_at = NOW()
         WHERE id = ?
         RETURNING *`,
        [submittedStatus?.id || null, submittedStatus?.status_name || "Submitted", req.params.id]
      );
      await logAudit(db, req.session.user.id, "submit", "purchase_requisition", Number(req.params.id), {});
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/purchase-requisitions/:id/approve",
    requirePermission("procurement_requisitions.approve"),
    async (req, res, next) => {
      try {
        const requisition = await db.get("SELECT * FROM purchase_requisitions WHERE id = ?", [req.params.id]);
        if (!requisition) {
          res.status(404).json({ success: false, message: "Purchase requisition not found" });
          return;
        }
        if (String(requisition.status || "").toLowerCase() !== "submitted") {
          res.status(400).json({ success: false, message: "Submit the purchase requisition before approving it." });
          return;
        }
        const totalAmount = (req.body.items || []).reduce(
          (sum, item) => sum + Number(item.quantityApproved || 0) * Number(item.estimatedUnitCost || 0),
          0
        );
        await ensureApprovalAllowed(req, db, {
          documentType: "purchase_requisition",
          record: requisition,
          creatorFields: ["requested_by"],
          amount: totalAmount,
        });
        const approvedStatus = await getStatus(db, "purchase_requisition", "approved", { fallbackName: "Approved" });

        await db.transaction(async (tx) => {
          for (const item of req.body.items || []) {
            await tx.exec(
              `UPDATE purchase_requisition_items
               SET quantity_approved = ?, estimated_unit_cost = ?, preferred_supplier_id = ?
               WHERE id = ? AND purchase_requisition_id = ?`,
              [
                item.quantityApproved,
                item.estimatedUnitCost || 0,
                item.preferredSupplierId || null,
                item.id,
                req.params.id,
              ]
            );
          }

          await tx.exec(
            `UPDATE purchase_requisitions
             SET status_id = ?, status = ?, approved_by = ?, updated_at = NOW()
             WHERE id = ?`,
            [approvedStatus?.id || null, approvedStatus?.status_name || "Approved", req.session.user.id, req.params.id]
          );
        });

        await logAudit(db, req.session.user.id, "approve", "purchase_requisition", Number(req.params.id), req.body);
        const refreshed = await db.get("SELECT * FROM purchase_requisitions WHERE id = ?", [req.params.id]);
        res.json({ success: true, data: refreshed });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/purchase-requisitions/:id/reject",
    requirePermission("procurement_requisitions.approve"),
    async (req, res, next) => {
      try {
        const requisition = await db.get("SELECT * FROM purchase_requisitions WHERE id = ?", [req.params.id]);
        if (!requisition) {
          res.status(404).json({ success: false, message: "Purchase requisition not found" });
          return;
        }
        if (String(requisition.status || "").toLowerCase() !== "submitted") {
          res.status(400).json({ success: false, message: "Only submitted purchase requisitions can be rejected." });
          return;
        }
        await ensureApprovalAllowed(req, db, {
          documentType: "purchase_requisition",
          record: requisition,
          creatorFields: ["requested_by"],
        });
        const rejectedStatus = await getStatus(db, "purchase_requisition", "rejected", { fallbackName: "Rejected" });
        const result = await db.exec(
          `UPDATE purchase_requisitions
           SET status_id = ?, status = ?, rejected_by = ?, notes = COALESCE(notes, '') || ? , updated_at = NOW()
           WHERE id = ?
           RETURNING *`,
          [
            rejectedStatus?.id || null,
            rejectedStatus?.status_name || "Rejected",
            req.session.user.id,
            `\nRejected reason: ${req.body.reason || "Not specified"}`,
            req.params.id,
          ]
        );
        await logAudit(db, req.session.user.id, "reject", "purchase_requisition", Number(req.params.id), req.body);
        res.json({ success: true, data: result.rows[0] });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get("/purchase-orders", async (req, res, next) => {
    try {
      const purchaseType = assertPurchaseTypeQuery(req.query.purchaseType);
      const where = purchaseType ? "WHERE po.purchase_type = ?" : "";
      const params = purchaseType ? [purchaseType] : [];
      const rows = await db.all(
        `SELECT po.*, s.name AS supplier_name,
                COALESCE(COUNT(poi.id), 0)::int AS item_count,
                COALESCE(SUM(poi.line_total), 0) AS total_amount
         FROM purchase_orders po
         INNER JOIN suppliers s ON s.id = po.supplier_id
         LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
         ${where}
         GROUP BY po.id, s.name
         ORDER BY po.created_at DESC`,
        params
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.post("/purchase-orders", async (req, res, next) => {
    try {
      const statusRow = await getStatus(db, "purchase_order", req.body.status || "Draft", { fallbackName: "Draft" });
      const order = await db.transaction(async (tx) => {
        const purchaseRequisitionId = req.body.purchaseRequisitionId || null;
        const linkedRequisition = purchaseRequisitionId
          ? await tx.get("SELECT id, purchase_type, status FROM purchase_requisitions WHERE id = ?", [purchaseRequisitionId])
          : null;
        if (purchaseRequisitionId && !linkedRequisition) {
          const error = new Error("Purchase requisition not found.");
          error.status = 404;
          throw error;
        }
        const purchaseType = assertPurchaseType(req.body.purchaseType, {
          required: !linkedRequisition,
          defaultValue: linkedRequisition?.purchase_type,
        });
        if (linkedRequisition && purchaseType !== linkedRequisition.purchase_type) {
          const error = new Error("Purchase order type must match the linked purchase requisition.");
          error.status = 400;
          throw error;
        }
        const orderNumber = await getNextSequence({ ...db, get: tx.get.bind(tx) }, "purchaseOrderPrefix", "purchase_orders");
        const paymentTerm = await resolvePaymentTerm(tx, req.body.paymentTermId, req.body.paymentTerms);
        const headerResult = await tx.exec(
          `INSERT INTO purchase_orders
             (order_number, purchase_requisition_id, supplier_id, order_date, purchase_type, expected_delivery_date, payment_term_id, status_id, status, created_by, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING *`,
          [
            orderNumber,
            purchaseRequisitionId,
            req.body.supplierId,
            req.body.orderDate,
            purchaseType,
            req.body.expectedDeliveryDate || null,
            paymentTerm?.id || null,
            statusRow?.id || null,
            statusRow?.status_name || "Draft",
            req.session.user.id,
            req.body.notes || null,
          ]
        );

        let totalReceivedQuantity = 0;
        for (const item of req.body.items || []) {
          totalReceivedQuantity += Number(item.quantityOrdered || 0);
          await tx.exec(
            `INSERT INTO purchase_order_items
               (purchase_order_id, product_id, quantity_ordered, unit_cost, line_total)
             VALUES (?, ?, ?, ?, ?)`,
            [
              headerResult.rows[0].id,
              item.productId,
              item.quantityOrdered || 0,
              item.unitCost || 0,
              Number(item.quantityOrdered || 0) * Number(item.unitCost || 0),
            ]
          );
        }

        if (purchaseRequisitionId) {
          const convertedStatus = await getStatus(tx, "purchase_requisition", "converted_to_po", { fallbackName: "Converted to PO" });
          await tx.exec(
            `UPDATE purchase_requisitions
             SET status_id = ?, status = ?, updated_at = NOW()
             WHERE id = ?`,
            [convertedStatus?.id || null, convertedStatus?.status_name || "Converted to PO", purchaseRequisitionId]
          );
        }

        return headerResult.rows[0];
      });

      await logAudit(db, req.session.user.id, "create", "purchase_order", order.id, req.body);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  });

  router.get("/purchase-orders/:id", async (req, res, next) => {
    try {
      const header = await db.get(
        `SELECT po.*, s.name AS supplier_name
         FROM purchase_orders po
         INNER JOIN suppliers s ON s.id = po.supplier_id
         WHERE po.id = ?`,
        [req.params.id]
      );
      if (!header) {
        res.status(404).json({ success: false, message: "Purchase order not found" });
        return;
      }

      const [items, auditTrail] = await Promise.all([
        db.all(
          `SELECT poi.*, p.name AS product_name, uom.code AS unit_code, uom.name AS unit_name
           FROM purchase_order_items poi
           INNER JOIN products p ON p.id = poi.product_id
           LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
           WHERE poi.purchase_order_id = ?
           ORDER BY p.name`,
          [req.params.id]
        ),
        db.all(
          `SELECT *
           FROM audit_logs
           WHERE entity_type = 'purchase_order' AND entity_id = ?
           ORDER BY created_at DESC`,
          [req.params.id]
        ),
      ]);

      res.json({ success: true, data: { header, items, auditTrail } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/purchase-orders/:id/send", async (req, res, next) => {
    try {
      const sentStatus = await getStatus(db, "purchase_order", "sent", { fallbackName: "Sent" });
      const result = await db.exec(
        `UPDATE purchase_orders
         SET status_id = ?, status = ?, updated_at = NOW()
         WHERE id = ?
         RETURNING *`,
        [sentStatus?.id || null, sentStatus?.status_name || "Sent", req.params.id]
      );
      if (!result.rows[0]) {
        res.status(404).json({ success: false, message: "Purchase order not found" });
        return;
      }
      await logAudit(db, req.session.user.id, "send", "purchase_order", Number(req.params.id), {});
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.get("/goods-received", async (req, res, next) => {
    try {
      const purchaseType = assertPurchaseTypeQuery(req.query.purchaseType);
      const where = purchaseType ? "WHERE po.purchase_type = ?" : "";
      const params = purchaseType ? [purchaseType] : [];
      const rows = await db.all(
        `SELECT grn.id, grn.grn_number, grn.purchase_order_id, grn.supplier_id,
                grn.receipt_date, grn.received_by, grn.notes, grn.created_at, grn.updated_at,
                po.order_number, po.purchase_type, s.name AS supplier_name,
                COALESCE(COUNT(grni.id), 0)::int AS item_count,
                COALESCE(SUM(grni.quantity_received), 0) AS total_quantity_received
         FROM goods_received_notes grn
         INNER JOIN purchase_orders po ON po.id = grn.purchase_order_id
         INNER JOIN suppliers s ON s.id = grn.supplier_id
         LEFT JOIN goods_received_note_items grni ON grni.goods_received_note_id = grn.id
         ${where}
          GROUP BY grn.id, po.order_number, po.purchase_type, s.name
         ORDER BY grn.created_at DESC`,
        params
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.post("/goods-received", async (req, res, next) => {
    try {
      const grn = await db.transaction(async (tx) => {
        const grnNumber = await getNextSequence({ ...db, get: tx.get.bind(tx) }, "goodsReceivedPrefix", "goods_received_notes");
        const purchaseOrder = await tx.get("SELECT * FROM purchase_orders WHERE id = ?", [req.body.purchaseOrderId]);
        const centralStoreId = await getCentralStoreId(tx);
        const confirmedStatus = await getStatus(tx, "goods_received_note", "confirmed", { fallbackName: "Confirmed" });
        const fullyReceivedStatus = await getStatus(tx, "purchase_order", "fully_received", { fallbackName: "Fully Received" });
        if (!purchaseOrder) {
          const error = new Error("Purchase order not found.");
          error.status = 404;
          throw error;
        }

        const headerResult = await tx.exec(
          `INSERT INTO goods_received_notes
             (grn_number, purchase_order_id, supplier_id, store_location_id, receipt_date, status_id, status, received_by, confirmed_by, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING *`,
          [
            grnNumber,
            req.body.purchaseOrderId,
            purchaseOrder.supplier_id,
            centralStoreId,
            req.body.receiptDate,
            confirmedStatus?.id || null,
            confirmedStatus?.status_name || "Confirmed",
            req.session.user.id,
            req.session.user.id,
            req.body.notes || null,
          ]
        );

        for (const item of req.body.items || []) {
          const lineResult = await tx.exec(
            `INSERT INTO goods_received_note_items
               (goods_received_note_id, product_id, quantity_received, unit_cost, line_total, batch_number, expiry_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             RETURNING *`,
            [
              headerResult.rows[0].id,
              item.productId,
              item.quantityReceived || 0,
              item.unitCost || 0,
              Number(item.quantityReceived || 0) * Number(item.unitCost || 0),
              item.batchNumber,
              item.expiryDate || null,
            ]
          );

          await receiveGoodsIntoInventory(tx, {
            productId: lineResult.rows[0].product_id,
            storeLocationId: centralStoreId,
            supplierId: purchaseOrder.supplier_id,
            goodsReceivedNoteId: headerResult.rows[0].id,
            batchNumber: lineResult.rows[0].batch_number || `GRN-${headerResult.rows[0].id}-${lineResult.rows[0].id}`,
            expiryDate: lineResult.rows[0].expiry_date,
            quantityReceived: lineResult.rows[0].quantity_received,
            unitCost: lineResult.rows[0].unit_cost,
            receivedAt: req.body.receiptDate,
            notes: req.body.notes || null,
            createdBy: req.session.user.id,
          });
        }

        await tx.exec(
          `UPDATE purchase_orders
           SET status_id = ?, status = ?, updated_at = NOW()
           WHERE id = ?`,
          [fullyReceivedStatus?.id || null, fullyReceivedStatus?.status_name || "Fully Received", req.body.purchaseOrderId]
        );

        return headerResult.rows[0];
      });

      const purchaseOrder = await db.get("SELECT purchase_type FROM purchase_orders WHERE id = ?", [req.body.purchaseOrderId]);
      await logAudit(db, req.session.user.id, "receive", "goods_received_note", grn.id, { ...req.body, purchaseType: purchaseOrder?.purchase_type || null });
      const visibleGrn = Object.fromEntries(
        Object.entries(grn).filter(([key]) => !["status_id", "status", "store_location_id"].includes(key)),
      );
      res.status(201).json({ success: true, data: visibleGrn });
    } catch (error) {
      next(error);
    }
  });

  router.get("/goods-received/:id", async (req, res, next) => {
    try {
      const header = await db.get(
        `SELECT grn.id, grn.grn_number, grn.purchase_order_id, grn.supplier_id,
                grn.receipt_date, grn.received_by, grn.notes, grn.created_at, grn.updated_at,
                po.order_number, po.purchase_type, s.name AS supplier_name
         FROM goods_received_notes grn
         INNER JOIN purchase_orders po ON po.id = grn.purchase_order_id
         INNER JOIN suppliers s ON s.id = grn.supplier_id
         WHERE grn.id = ?`,
        [req.params.id]
      );
      if (!header) {
        res.status(404).json({ success: false, message: "Goods received note not found" });
        return;
      }
      const items = await db.all(
        `SELECT grni.*, p.name AS product_name, uom.code AS unit_code, uom.name AS unit_name
         FROM goods_received_note_items grni
         INNER JOIN products p ON p.id = grni.product_id
         LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
         WHERE grni.goods_received_note_id = ?
         ORDER BY p.name`,
        [req.params.id]
      );
      res.json({ success: true, data: { header, items } });
    } catch (error) {
      next(error);
    }
  });

  router.get("/supplier-invoices", async (req, res, next) => {
    try {
      const rows = await db.all(
        `SELECT si.*, s.name AS supplier_name
         FROM supplier_invoices si
         INNER JOIN suppliers s ON s.id = si.supplier_id
         ORDER BY si.created_at DESC`
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.post("/supplier-invoices", async (req, res, next) => {
    try {
      const openStatus = await getStatus(db, "supplier_invoice", "open", { fallbackName: "Open" });
      const paymentTerm = await resolvePaymentTerm(db, req.body.paymentTermId, req.body.paymentTerms);
      const invoicePayment = resolveInvoicePaymentDetails(req.body.paymentMethod, req.body.dueDate);
      const invoiceNumber = req.body.invoiceNumber || (await getNextSequence(db, "supplierInvoicePrefix", "supplier_invoices"));
      const result = await db.exec(
        `INSERT INTO supplier_invoices
           (invoice_number, supplier_id, purchase_order_id, goods_received_note_id, invoice_date, due_date, payment_method, payment_term_id, total_amount, amount_paid, payment_status_id, payment_status, status_id, status, created_by, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
         RETURNING *`,
        [
          invoiceNumber,
          req.body.supplierId,
          req.body.purchaseOrderId || null,
          req.body.goodsReceivedNoteId || null,
          req.body.invoiceDate,
          invoicePayment.dueDate,
          invoicePayment.paymentMethod,
          paymentTerm?.id || null,
          req.body.totalAmount || 0,
          null,
          "Pending",
          openStatus?.id || null,
          openStatus?.status_name || "Open",
          req.session.user.id,
          req.body.notes || null,
        ]
      );
      await logAudit(db, req.session.user.id, "create", "supplier_invoice", result.rows[0].id, req.body);
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.get("/supplier-invoices/:id", async (req, res, next) => {
    try {
      const invoice = await db.get(
        `SELECT si.*, s.name AS supplier_name, po.order_number, grn.grn_number
         FROM supplier_invoices si
         INNER JOIN suppliers s ON s.id = si.supplier_id
         LEFT JOIN purchase_orders po ON po.id = si.purchase_order_id
         LEFT JOIN goods_received_notes grn ON grn.id = si.goods_received_note_id
         WHERE si.id = ?`,
        [req.params.id]
      );
      if (!invoice) {
        res.status(404).json({ success: false, message: "Supplier invoice not found" });
        return;
      }
      const payments = await db.all(
        `SELECT *
         FROM payment_vouchers
         WHERE supplier_invoice_id = ? AND LOWER(status) = 'paid'
         ORDER BY payment_date DESC, id DESC`,
        [req.params.id]
      );
      res.json({ success: true, data: { invoice, payments } });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createProcurementRoutes;
