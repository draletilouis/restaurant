const express = require("express");

const { requireAuth, requirePermission } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { ensureApprovalAllowed } = require("../services/approval-workflow-service");
const { generateNextNumber } = require("../services/numbering-series-service");
const { getStatus } = require("../services/status-service");
const {
  receiveGoodsIntoInventory,
  transferStockBetweenStores,
} = require("../services/inventory-service");
const { resolveInvoicePaymentDetails } = require("../services/invoice-payment-service");

const PAYMENT_METHODS = new Set(["Cash", "Mobile Money", "Bank Transfer", "Card", "Cheque"]);

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function positive(value, label) {
  const number = Number(value);
  if (!(number > 0)) {
    throw httpError(400, `${label} must be greater than zero.`);
  }
  return number;
}

function nonNegative(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw httpError(400, `${label} must be zero or greater.`);
  }
  return number;
}

function idempotencyKey(req) {
  const value = req.get("Idempotency-Key") || req.body?.idempotencyKey;
  return value ? String(value).trim().slice(0, 120) : null;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function txAdapter(tx) {
  return {
    exec: tx.exec.bind(tx),
    run: tx.run.bind(tx),
    get: tx.get.bind(tx),
    all: tx.all.bind(tx),
  };
}

async function nextNumber(tx, seriesKey, referenceDate) {
  return generateNextNumber(txAdapter(tx), seriesKey, { referenceDate, forUpdate: true });
}

async function status(tx, moduleKey, key, fallbackName) {
  return getStatus(tx, moduleKey, key, { fallbackName });
}

async function getCentralStoreId(tx) {
  const store = await tx.get("SELECT id FROM store_locations WHERE name = ?", ["Central Store"]);
  if (!store) {
    throw httpError(500, "Central Store is not configured.");
  }
  return store.id;
}

function statusName(row, fallback) {
  return row?.status_name || fallback;
}

function requireItems(items, label = "Items") {
  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(400, `${label} are required.`);
  }
  return items;
}

function ensureUniqueProducts(items) {
  const ids = items.map((item) => Number(item.productId));
  if (ids.some((id) => !id)) {
    throw httpError(400, "Every line must have a valid product.");
  }
  if (new Set(ids).size !== ids.length) {
    throw httpError(400, "A product may only appear once per document.");
  }
}

async function recordApproval(tx, entityType, entityId, action, fromStatus, toStatus, actorId, comment) {
  await tx.exec(
    `INSERT INTO approval_history
       (entity_type, entity_id, action, from_status, to_status, comment, actor_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [entityType, entityId, action, fromStatus || null, toStatus || null, comment || null, actorId || null]
  );
}

async function getLpoLines(db, lpoId) {
  return db.all(
    `SELECT poi.*, p.name AS product_name, uom.code AS unit_code,
            COALESCE(SUM(CASE WHEN grn.status = 'Confirmed' THEN grni.quantity_received ELSE 0 END), 0) AS received_quantity,
            poi.quantity_ordered - COALESCE(SUM(CASE WHEN grn.status = 'Confirmed' THEN grni.quantity_received ELSE 0 END), 0) AS outstanding_quantity
     FROM purchase_order_items poi
     INNER JOIN products p ON p.id = poi.product_id
     LEFT JOIN goods_received_note_items grni ON grni.product_id = poi.product_id
     LEFT JOIN goods_received_notes grn
       ON grn.id = grni.goods_received_note_id
      AND grn.purchase_order_id = poi.purchase_order_id
     LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
     WHERE poi.purchase_order_id = ?
     GROUP BY poi.id, p.name, uom.code
     ORDER BY p.name`,
    [lpoId]
  );
}

async function getLpoDetail(db, lpoId) {
  const header = await db.get(
    `SELECT po.*, po.lpo_number AS document_number, s.name AS supplier_name,
            r.requisition_number AS goods_requisition_number
     FROM purchase_orders po
     INNER JOIN suppliers s ON s.id = po.supplier_id
     LEFT JOIN purchase_requisitions r ON r.id = po.purchase_requisition_id
     WHERE po.id = ? AND po.lpo_number IS NOT NULL`,
    [lpoId]
  );
  if (!header) return null;

  const [items, deliveries, invoices, paymentVouchers] = await Promise.all([
    getLpoLines(db, lpoId),
    db.all(
      `SELECT grn.*, sl.name AS store_name,
              COALESCE(SUM(grni.quantity_received), 0) AS total_quantity_received
       FROM goods_received_notes grn
       INNER JOIN store_locations sl ON sl.id = grn.store_location_id
       LEFT JOIN goods_received_note_items grni ON grni.goods_received_note_id = grn.id
       WHERE grn.purchase_order_id = ?
       GROUP BY grn.id, sl.name
       ORDER BY grn.receipt_date, grn.id`,
      [lpoId]
    ),
    db.all(
      `SELECT * FROM supplier_invoices WHERE purchase_order_id = ? ORDER BY invoice_date DESC, id DESC`,
      [lpoId]
    ),
    db.all(
      `SELECT * FROM payment_vouchers WHERE purchase_order_id = ? ORDER BY payment_date DESC, id DESC`,
      [lpoId]
    ),
  ]);
  return { header, items, deliveries, invoices, paymentVouchers };
}

function ensureState(record, allowed, label) {
  if (!allowed.includes(String(record.status || "").toLowerCase())) {
    throw httpError(400, `${label} cannot be moved from ${record.status || "its current state"}.`);
  }
}

function parseApprovalItems(bodyItems, existingItems) {
  const input = Array.isArray(bodyItems) && bodyItems.length ? bodyItems : existingItems;
  return input.map((item) => ({
    id: item.id,
    quantityApproved: item.quantityApproved ?? item.quantity_approved ?? item.quantityRequested ?? item.quantity_requested,
    estimatedUnitCost: item.estimatedUnitCost ?? item.estimated_unit_cost ?? 0,
    preferredSupplierId: item.preferredSupplierId ?? item.preferred_supplier_id ?? null,
  }));
}

function createProcurementSystemRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/goods-requisitions", async (req, res, next) => {
    try {
      const statusFilter = req.query.status ? "AND LOWER(pr.status) = LOWER(?)" : "";
      const params = req.query.status ? [req.query.status] : [];
      const rows = await db.all(
        `SELECT pr.*, u.full_name AS requested_by_name, a.full_name AS approved_by_name,
                d.name AS department_name, COALESCE(COUNT(pri.id), 0)::int AS item_count,
                COALESCE(SUM(COALESCE(pri.quantity_approved, pri.quantity_requested) * pri.estimated_unit_cost), 0) AS total_amount
         FROM purchase_requisitions pr
         LEFT JOIN users u ON u.id = pr.requested_by
         LEFT JOIN users a ON a.id = pr.approved_by
         LEFT JOIN departments d ON d.id = pr.department_id
         LEFT JOIN purchase_requisition_items pri ON pri.purchase_requisition_id = pr.id
         WHERE pr.requisition_type = 'GOODS' ${statusFilter}
         GROUP BY pr.id, u.full_name, a.full_name, d.name
         ORDER BY pr.created_at DESC`,
        params
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.get("/goods-requisitions/:id", async (req, res, next) => {
    try {
      const header = await db.get(
        `SELECT pr.*, u.full_name AS requested_by_name, a.full_name AS approved_by_name, d.name AS department_name
         FROM purchase_requisitions pr
         LEFT JOIN users u ON u.id = pr.requested_by
         LEFT JOIN users a ON a.id = pr.approved_by
         LEFT JOIN departments d ON d.id = pr.department_id
         WHERE pr.id = ? AND pr.requisition_type = 'GOODS'`,
        [req.params.id]
      );
      if (!header) return res.status(404).json({ success: false, message: "Goods requisition not found" });
      const [items, approvals] = await Promise.all([
        db.all(
          `SELECT pri.*, p.name AS product_name, s.name AS preferred_supplier_name, uom.code AS unit_code
           FROM purchase_requisition_items pri
           INNER JOIN products p ON p.id = pri.product_id
           LEFT JOIN suppliers s ON s.id = pri.preferred_supplier_id
           LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
           WHERE pri.purchase_requisition_id = ? ORDER BY p.name`,
          [req.params.id]
        ),
        db.all(`SELECT * FROM approval_history WHERE entity_type = 'goods_requisition' AND entity_id = ? ORDER BY created_at DESC`, [req.params.id]),
      ]);
      res.json({ success: true, data: { header, items, approvals } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/goods-requisitions", async (req, res, next) => {
    try {
      const items = requireItems(req.body.items);
      ensureUniqueProducts(items);
      const key = idempotencyKey(req);
      const result = await db.transaction(async (tx) => {
        if (key) {
          const existing = await tx.get(
            `SELECT * FROM purchase_requisitions WHERE requisition_type = 'GOODS' AND idempotency_key = ?`,
            [key]
          );
          if (existing) return { record: existing, existing: true };
        }
        const draft = await status(tx, "goods_requisition", "draft", "Draft");
        const number = await nextNumber(tx, "goods_requisition", req.body.requestDate || today());
        const header = await tx.exec(
          `INSERT INTO purchase_requisitions
             (requisition_number, request_date, required_date, purchase_type, requisition_type, purpose, department_id, status_id, status, requested_by, idempotency_key, notes)
           VALUES (?, ?, ?, 'Weekly', 'GOODS', ?, ?, ?, ?, ?, ?, ?)
           RETURNING *`,
          [
            number,
            req.body.requestDate || today(),
            req.body.requiredDate || null,
            String(req.body.purpose || "Goods procurement").trim(),
            req.body.departmentId || null,
            draft?.id || null,
            statusName(draft, "Draft"),
            req.session.user.id,
            key,
            req.body.notes || null,
          ]
        );
        for (const item of items) {
          await tx.exec(
            `INSERT INTO purchase_requisition_items
               (purchase_requisition_id, product_id, quantity_requested, estimated_unit_cost, preferred_supplier_id)
             VALUES (?, ?, ?, ?, ?)`,
            [header.rows[0].id, item.productId, positive(item.quantityRequested, "Requested quantity"), Number(item.estimatedUnitCost || 0), item.preferredSupplierId || null]
          );
        }
        await logAudit(tx, req.session.user.id, "create", "goods_requisition", header.rows[0].id, req.body);
        return { record: header.rows[0], existing: false };
      });
      res.status(result.existing ? 200 : 201).json({ success: true, data: result.record, idempotent: result.existing });
    } catch (error) {
      next(error);
    }
  });

  router.post("/goods-requisitions/:id/submit", async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const record = await tx.get(`SELECT * FROM purchase_requisitions WHERE id = ? AND requisition_type = 'GOODS' FOR UPDATE`, [req.params.id]);
        if (!record) throw httpError(404, "Goods requisition not found.");
        ensureState(record, ["draft", "returned for revision"], "Goods requisition");
        const submitted = await status(tx, "goods_requisition", "submitted", "Submitted");
        const updated = await tx.exec(
          `UPDATE purchase_requisitions SET status_id = ?, status = ?, submitted_at = NOW(), updated_at = NOW() WHERE id = ? RETURNING *`,
          [submitted?.id || null, statusName(submitted, "Submitted"), req.params.id]
        );
        await recordApproval(tx, "goods_requisition", req.params.id, "submit", record.status, updated.rows[0].status, req.session.user.id, req.body.comment);
        await logAudit(tx, req.session.user.id, "submit", "goods_requisition", Number(req.params.id), req.body);
        return updated.rows[0];
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/goods-requisitions/:id/approve", requirePermission("procurement_requisitions.approve"), async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const record = await tx.get(`SELECT * FROM purchase_requisitions WHERE id = ? AND requisition_type = 'GOODS' FOR UPDATE`, [req.params.id]);
        if (!record) throw httpError(404, "Goods requisition not found.");
        ensureState(record, ["submitted"], "Goods requisition");
        const existingItems = await tx.all(`SELECT * FROM purchase_requisition_items WHERE purchase_requisition_id = ? ORDER BY id FOR UPDATE`, [req.params.id]);
        const approvalItems = parseApprovalItems(req.body.items, existingItems);
        if (approvalItems.length !== existingItems.length) throw httpError(400, "Approval must include every requisition line.");
        const existingById = new Map(existingItems.map((item) => [Number(item.id), item]));
        let totalAmount = 0;
        for (const item of approvalItems) {
          const existing = existingById.get(Number(item.id));
          if (!existing) throw httpError(400, "Approval contains an invalid requisition line.");
          const approved = positive(item.quantityApproved, "Approved quantity");
          if (approved > Number(existing.quantity_requested) + 0.0001) throw httpError(400, "Approved quantity cannot exceed requested quantity.");
          const unitCost = Number(item.estimatedUnitCost || existing.estimated_unit_cost || 0);
          totalAmount += approved * unitCost;
          await tx.exec(
            `UPDATE purchase_requisition_items SET quantity_approved = ?, estimated_unit_cost = ?, preferred_supplier_id = ? WHERE id = ?`,
            [approved, unitCost, item.preferredSupplierId || existing.preferred_supplier_id || null, item.id]
          );
        }
        await ensureApprovalAllowed(req, tx, { documentType: "goods_requisition", record, creatorFields: ["requested_by"], amount: totalAmount });
        const approved = await status(tx, "goods_requisition", "approved", "Approved");
        const updated = await tx.exec(
          `UPDATE purchase_requisitions SET status_id = ?, status = ?, approved_by = ?, updated_at = NOW() WHERE id = ? RETURNING *`,
          [approved?.id || null, statusName(approved, "Approved"), req.session.user.id, req.params.id]
        );
        await recordApproval(tx, "goods_requisition", req.params.id, "approve", record.status, updated.rows[0].status, req.session.user.id, req.body.comment);
        await logAudit(tx, req.session.user.id, "approve", "goods_requisition", Number(req.params.id), req.body);
        return updated.rows[0];
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  async function transitionGoods(req, res, next, action) {
    try {
      const result = await db.transaction(async (tx) => {
        const record = await tx.get(`SELECT * FROM purchase_requisitions WHERE id = ? AND requisition_type = 'GOODS' FOR UPDATE`, [req.params.id]);
        if (!record) throw httpError(404, "Goods requisition not found.");
        ensureState(record, ["submitted"], "Goods requisition");
        await ensureApprovalAllowed(req, tx, { documentType: "goods_requisition", record, creatorFields: ["requested_by"] });
        const target = await status(tx, "goods_requisition", action === "reject" ? "rejected" : "returned_for_revision", action === "reject" ? "Rejected" : "Returned for Revision");
        const updated = await tx.exec(
          `UPDATE purchase_requisitions
           SET status_id = ?, status = ?, ${action === "reject" ? "rejected_by" : "returned_by"} = ?, ${action === "reject" ? "notes" : "return_reason"} = ?, updated_at = NOW()
           WHERE id = ? RETURNING *`,
          [target?.id || null, statusName(target, action === "reject" ? "Rejected" : "Returned for Revision"), req.session.user.id, req.body.reason || null, req.params.id]
        );
        await recordApproval(tx, "goods_requisition", req.params.id, action, record.status, updated.rows[0].status, req.session.user.id, req.body.reason);
        await logAudit(tx, req.session.user.id, action, "goods_requisition", Number(req.params.id), req.body);
        return updated.rows[0];
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  router.post("/goods-requisitions/:id/reject", requirePermission("procurement_requisitions.approve"), (req, res, next) => transitionGoods(req, res, next, "reject"));
  router.post("/goods-requisitions/:id/return", requirePermission("procurement_requisitions.approve"), (req, res, next) => transitionGoods(req, res, next, "return"));

  router.get("/cash-requisitions", async (req, res, next) => {
    try {
      const rows = await db.all(
        `SELECT cr.*, u.full_name AS requested_by_name, a.full_name AS approved_by_name,
                rel.full_name AS released_by_name, stl.full_name AS settled_by_name,
                d.name AS department_name,
                pv.voucher_number AS payment_voucher_number, pv.status AS payment_voucher_status,
                crs.settlement_date, crs.actual_spent_amount, crs.cash_returned_amount,
                crs.variance_amount, crs.variance_reason, crs.receipt_reference
         FROM cash_requisitions cr
         LEFT JOIN users u ON u.id = cr.requested_by
         LEFT JOIN users a ON a.id = cr.approved_by
         LEFT JOIN users rel ON rel.id = cr.released_by
         LEFT JOIN cash_requisition_settlements crs ON crs.cash_requisition_id = cr.id
         LEFT JOIN users stl ON stl.id = crs.settled_by
         LEFT JOIN payment_vouchers pv ON pv.cash_requisition_id = cr.id AND LOWER(pv.status) <> 'rejected'
         LEFT JOIN departments d ON d.id = cr.department_id
         ORDER BY cr.created_at DESC`
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.get("/cash-requisitions/:id", async (req, res, next) => {
    try {
      const record = await db.get(
        `SELECT cr.*, u.full_name AS requested_by_name, a.full_name AS approved_by_name,
                rel.full_name AS released_by_name, d.name AS department_name
         FROM cash_requisitions cr
         LEFT JOIN users u ON u.id = cr.requested_by
         LEFT JOIN users a ON a.id = cr.approved_by
         LEFT JOIN users rel ON rel.id = cr.released_by
         LEFT JOIN departments d ON d.id = cr.department_id
         WHERE cr.id = ?`,
        [req.params.id]
      );
      if (!record) return res.status(404).json({ success: false, message: "Cash requisition not found" });
      const settlement = await db.get(
        `SELECT crs.*, u.full_name AS settled_by_name
         FROM cash_requisition_settlements crs
         LEFT JOIN users u ON u.id = crs.settled_by
         WHERE crs.cash_requisition_id = ?`,
        [req.params.id]
      );
      const approvals = await db.all(`SELECT * FROM approval_history WHERE entity_type = 'cash_requisition' AND entity_id = ? ORDER BY created_at DESC`, [req.params.id]);
      res.json({ success: true, data: { record, settlement, approvals } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/cash-requisitions", async (req, res, next) => {
    try {
      const amount = positive(req.body.amount, "Cash requisition amount");
      const purpose = String(req.body.purpose || "").trim();
      if (!purpose) throw httpError(400, "Cash requisition purpose is required.");
      const key = idempotencyKey(req);
      const result = await db.transaction(async (tx) => {
        if (key) {
          const existing = await tx.get(`SELECT * FROM cash_requisitions WHERE idempotency_key = ?`, [key]);
          if (existing) return { record: existing, existing: true };
        }
        const draft = await status(tx, "cash_requisition", "draft", "Draft");
        const number = await nextNumber(tx, "cash_requisition", req.body.requestDate || today());
        const inserted = await tx.exec(
          `INSERT INTO cash_requisitions
             (requisition_number, request_date, required_date, department_id, purpose, payee_name, amount, currency_code, status_id, status, requested_by, idempotency_key, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
          [number, req.body.requestDate || today(), req.body.requiredDate || null, req.body.departmentId || null, purpose, req.body.payeeName || null, amount, req.body.currencyCode || "UGX", draft?.id || null, statusName(draft, "Draft"), req.session.user.id, key, req.body.notes || null]
        );
        await logAudit(tx, req.session.user.id, "create", "cash_requisition", inserted.rows[0].id, req.body);
        return { record: inserted.rows[0], existing: false };
      });
      res.status(result.existing ? 200 : 201).json({ success: true, data: result.record, idempotent: result.existing });
    } catch (error) {
      next(error);
    }
  });

  router.put("/cash-requisitions/:id", async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const record = await tx.get(`SELECT * FROM cash_requisitions WHERE id = ? FOR UPDATE`, [req.params.id]);
        if (!record) throw httpError(404, "Cash requisition not found.");
        const isAdmin = (req.session.user.roles || []).includes("admin");
        if (!isAdmin && Number(record.requested_by) !== Number(req.session.user.id)) {
          throw httpError(403, "Only the requester or an Admin can edit this cash requisition.");
        }
        ensureState(record, ["draft", "returned for revision"], "Cash requisition");
        const purpose = String(req.body.purpose || "").trim();
        if (!purpose) throw httpError(400, "Cash requisition purpose is required.");
        const amount = positive(req.body.amount, "Cash requisition amount");
        const updated = await tx.exec(
          `UPDATE cash_requisitions
           SET request_date = ?, required_date = ?, department_id = ?, purpose = ?, payee_name = ?,
               amount = ?, currency_code = ?, notes = ?, rejection_reason = NULL, return_reason = NULL,
               updated_at = NOW()
           WHERE id = ? RETURNING *`,
          [req.body.requestDate || record.request_date, req.body.requiredDate || null, req.body.departmentId || null, purpose, req.body.payeeName || null, amount, req.body.currencyCode || record.currency_code || "UGX", req.body.notes || null, req.params.id]
        );
        await logAudit(tx, req.session.user.id, "update", "cash_requisition", Number(req.params.id), req.body);
        return updated.rows[0];
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  async function transitionCash(req, res, next, action) {
    try {
      const result = await db.transaction(async (tx) => {
        const record = await tx.get(`SELECT * FROM cash_requisitions WHERE id = ? FOR UPDATE`, [req.params.id]);
        if (!record) throw httpError(404, "Cash requisition not found.");
        const allowed = action === "submit" ? ["draft", "returned for revision"] : ["submitted"];
        if (action === "approve" || action === "reject" || action === "return") await ensureApprovalAllowed(req, tx, { documentType: "cash_requisition", record, creatorFields: ["requested_by"], amount: record.amount });
        ensureState(record, allowed, "Cash requisition");
        const key = action === "submit" ? "submitted" : action === "approve" ? "approved" : action === "reject" ? "rejected" : "returned_for_revision";
        const target = await status(tx, "cash_requisition", key, action === "submit" ? "Submitted" : action === "approve" ? "Approved" : action === "reject" ? "Rejected" : "Returned for Revision");
        let updateSql = "UPDATE cash_requisitions SET status_id = ?, status = ?, updated_at = NOW()";
        let updateParams = [target?.id || null, statusName(target, key)];
        if (action === "submit") {
          updateSql += ", submitted_at = NOW()";
        } else if (action === "approve") {
          updateSql += ", approved_by = ?, approved_at = NOW()";
          updateParams.push(req.session.user.id);
        } else if (action === "reject") {
          updateSql += ", rejected_by = ?, rejection_reason = ?";
          updateParams.push(req.session.user.id, req.body.reason || null);
        } else {
          updateSql += ", returned_by = ?, return_reason = ?";
          updateParams.push(req.session.user.id, req.body.reason || null);
        }
        updateSql += " WHERE id = ? RETURNING *";
        updateParams.push(req.params.id);
        const updated = await tx.exec(updateSql, updateParams);
        await recordApproval(tx, "cash_requisition", req.params.id, action, record.status, updated.rows[0].status, req.session.user.id, req.body.reason);
        await logAudit(tx, req.session.user.id, action, "cash_requisition", Number(req.params.id), req.body);
        return updated.rows[0];
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  router.post("/cash-requisitions/:id/submit", async (req, res, next) => transitionCash(req, res, next, "submit"));
  router.post("/cash-requisitions/:id/approve", requirePermission("procurement_requisitions.approve"), (req, res, next) => transitionCash(req, res, next, "approve"));
  router.post("/cash-requisitions/:id/reject", requirePermission("procurement_requisitions.approve"), (req, res, next) => transitionCash(req, res, next, "reject"));
  router.post("/cash-requisitions/:id/return", requirePermission("procurement_requisitions.approve"), (req, res, next) => transitionCash(req, res, next, "return"));

  router.post("/cash-requisitions/:id/release", requirePermission("cash_requisitions.release"), async (req, res, next) => {
    try {
      const paymentMethod = String(req.body.paymentMethod || "Cash").trim();
      if (!PAYMENT_METHODS.has(paymentMethod)) throw httpError(400, "A valid cash release payment method is required.");
      const referenceNumber = String(req.body.referenceNumber || "").trim();
      if (!referenceNumber) throw httpError(400, "A cash release reference is required.");
      const result = await db.transaction(async (tx) => {
        const record = await tx.get(`SELECT * FROM cash_requisitions WHERE id = ? FOR UPDATE`, [req.params.id]);
        if (!record) throw httpError(404, "Cash requisition not found.");
        ensureState(record, ["approved"], "Cash requisition");
        const linkedVoucher = await tx.get(
          `SELECT voucher_number FROM payment_vouchers
           WHERE cash_requisition_id = ? AND LOWER(status) <> 'rejected'
           ORDER BY id DESC LIMIT 1`,
          [record.id],
        );
        if (linkedVoucher) throw httpError(400, `Use payment voucher ${linkedVoucher.voucher_number} to release this cash requisition.`);
        const released = await status(tx, "cash_requisition", "cash_released", "Cash Released");
        const updated = await tx.exec(`UPDATE cash_requisitions SET status_id = ?, status = ?, released_by = ?, release_payment_method = ?, release_reference_number = ?, release_notes = ?, cash_released_at = NOW(), updated_at = NOW() WHERE id = ? RETURNING *`, [released?.id || null, statusName(released, "Cash Released"), req.session.user.id, paymentMethod, referenceNumber, req.body.notes || null, req.params.id]);
        await recordApproval(tx, "cash_requisition", req.params.id, "release", record.status, updated.rows[0].status, req.session.user.id, req.body.comment || req.body.notes);
        await logAudit(tx, req.session.user.id, "release", "cash_requisition", Number(req.params.id), req.body);
        return updated.rows[0];
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/cash-requisitions/:id/settle", requirePermission("cash_requisitions.settle"), async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const record = await tx.get(`SELECT * FROM cash_requisitions WHERE id = ? FOR UPDATE`, [req.params.id]);
        if (!record) throw httpError(404, "Cash requisition not found.");
        ensureState(record, ["cash released"], "Cash requisition");
        const actualSpentAmount = nonNegative(req.body.actualSpentAmount, "Actual spent amount");
        const cashReturnedAmount = nonNegative(req.body.cashReturnedAmount ?? 0, "Cash returned amount");
        const requestedAmount = Number(record.amount);
        if (actualSpentAmount + cashReturnedAmount > requestedAmount + 0.01) {
          throw httpError(400, "Actual spending and cash returned cannot exceed the released amount.");
        }
        const varianceAmount = Number((requestedAmount - actualSpentAmount - cashReturnedAmount).toFixed(2));
        const receiptReference = String(req.body.receiptReference || "").trim() || null;
        const varianceReason = String(req.body.varianceReason || "").trim() || null;
        const notes = String(req.body.notes || "").trim() || null;
        const attachmentId = req.body.attachmentId ? Number(req.body.attachmentId) : null;
        if (!receiptReference && !attachmentId && !notes && !varianceReason) {
          throw httpError(400, "Add a receipt reference, attach a receipt, or explain the settlement.");
        }
        if (Math.abs(varianceAmount) > 0.01 && !varianceReason) {
          throw httpError(400, "Explain any difference between the released amount and the settlement.");
        }
        const inserted = await tx.exec(
          `INSERT INTO cash_requisition_settlements
             (cash_requisition_id, settlement_date, actual_spent_amount, cash_returned_amount, variance_amount, variance_reason, receipt_reference, receipt_attachment_id, settled_by, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
          [req.params.id, req.body.settlementDate || today(), actualSpentAmount, cashReturnedAmount, varianceAmount, varianceReason, receiptReference, attachmentId, req.session.user.id, notes]
        );
        const closed = await status(tx, "cash_requisition", "closed", "Closed");
        const updated = await tx.exec(
          `UPDATE cash_requisitions
           SET status_id = ?, status = ?, completed_at = NOW(), updated_at = NOW()
           WHERE id = ? RETURNING *`,
          [closed?.id || null, statusName(closed, "Closed"), req.params.id]
        );
        await recordApproval(tx, "cash_requisition", req.params.id, "settle", record.status, updated.rows[0].status, req.session.user.id, notes || varianceReason);
        await logAudit(tx, req.session.user.id, "settle", "cash_requisition", Number(req.params.id), req.body);
        return { record: updated.rows[0], settlement: inserted.rows[0] };
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.get("/lpos", async (req, res, next) => {
    try {
      const rows = await db.all(
        `SELECT po.*, s.name AS supplier_name, r.requisition_number AS goods_requisition_number,
                COALESCE(SUM(poi.line_total), 0) AS total_amount,
                COALESCE((SELECT SUM(grni.quantity_received) FROM goods_received_notes grn INNER JOIN goods_received_note_items grni ON grni.goods_received_note_id = grn.id WHERE grn.purchase_order_id = po.id AND grn.status = 'Confirmed'), 0) AS received_quantity
         FROM purchase_orders po INNER JOIN suppliers s ON s.id = po.supplier_id
         LEFT JOIN purchase_requisitions r ON r.id = po.purchase_requisition_id
         LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
         WHERE po.lpo_number IS NOT NULL
         GROUP BY po.id, s.name, r.requisition_number ORDER BY po.created_at DESC`
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.get("/lpos/:id", async (req, res, next) => {
    try {
      const detail = await getLpoDetail(db, req.params.id);
      if (!detail) return res.status(404).json({ success: false, message: "LPO not found" });
      res.json({ success: true, data: detail });
    } catch (error) {
      next(error);
    }
  });

  router.post("/lpos", async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const key = idempotencyKey(req);
        if (key) {
          const existing = await tx.get(`SELECT * FROM purchase_orders WHERE lpo_number IS NOT NULL AND idempotency_key = ?`, [key]);
          if (existing) return { record: existing, existing: true };
        }
        const requisition = await tx.get(`SELECT * FROM purchase_requisitions WHERE id = ? AND requisition_type = 'GOODS' FOR UPDATE`, [req.body.goodsRequisitionId]);
        if (!requisition) throw httpError(404, "Approved goods requisition not found.");
        ensureState(requisition, ["approved"], "Goods requisition");
        const existingLpo = await tx.get(`SELECT id FROM purchase_orders WHERE purchase_requisition_id = ? AND lpo_number IS NOT NULL AND status <> 'Cancelled'`, [requisition.id]);
        if (existingLpo) throw httpError(409, "This goods requisition already has an active LPO.");
        const supplier = await tx.get(`SELECT id FROM suppliers WHERE id = ? AND LOWER(status) = 'active'`, [req.body.supplierId]);
        if (!supplier) throw httpError(400, "Active supplier is required.");
        const requisitionItems = await tx.all(`SELECT * FROM purchase_requisition_items WHERE purchase_requisition_id = ? ORDER BY id`, [requisition.id]);
        const bodyItems = Array.isArray(req.body.items) && req.body.items.length ? req.body.items : requisitionItems.map((item) => ({ productId: item.product_id, quantityOrdered: item.quantity_approved, unitCost: item.estimated_unit_cost }));
        requireItems(bodyItems, "LPO lines");
        ensureUniqueProducts(bodyItems);
        if (bodyItems.length !== requisitionItems.length) throw httpError(400, "The LPO must include every approved requisition line.");
        const approvedByProduct = new Map(requisitionItems.map((item) => [Number(item.product_id), Number(item.quantity_approved)]));
        const lpoNumber = await nextNumber(tx, "lpo", req.body.orderDate || today());
        const draft = await status(tx, "lpo", "draft", "Draft");
        const header = await tx.exec(
          `INSERT INTO purchase_orders
             (order_number, lpo_number, purchase_requisition_id, supplier_id, order_date, purchase_type, expected_delivery_date, payment_term_id, status_id, status, created_by, idempotency_key, notes)
           VALUES (?, ?, ?, ?, ?, 'Weekly', ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
          [lpoNumber, lpoNumber, requisition.id, req.body.supplierId, req.body.orderDate || today(), req.body.expectedDeliveryDate || null, req.body.paymentTermId || null, draft?.id || null, statusName(draft, "Draft"), req.session.user.id, key, req.body.notes || null]
        );
        for (const item of bodyItems) {
          const quantity = positive(item.quantityOrdered, "Ordered quantity");
          const approved = approvedByProduct.get(Number(item.productId));
          if (approved === undefined || quantity > approved + 0.0001) throw httpError(400, "LPO quantity cannot exceed approved requisition quantity.");
          const unitCost = Number(item.unitCost || 0);
          await tx.exec(`INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity_ordered, unit_cost, line_total) VALUES (?, ?, ?, ?, ?)`, [header.rows[0].id, item.productId, quantity, unitCost, quantity * unitCost]);
        }
        await logAudit(tx, req.session.user.id, "create", "lpo", header.rows[0].id, req.body);
        return { record: header.rows[0], existing: false };
      });
      res.status(result.existing ? 200 : 201).json({ success: true, data: result.record, idempotent: result.existing });
    } catch (error) {
      next(error);
    }
  });

  router.post("/lpos/:id/issue", async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const record = await tx.get(`SELECT * FROM purchase_orders WHERE id = ? AND lpo_number IS NOT NULL FOR UPDATE`, [req.params.id]);
        if (!record) throw httpError(404, "LPO not found.");
        ensureState(record, ["draft"], "LPO");
        const issued = await status(tx, "lpo", "issued", "Issued");
        const updated = await tx.exec(`UPDATE purchase_orders SET status_id = ?, status = ?, issued_by = ?, issued_at = NOW(), updated_at = NOW() WHERE id = ? RETURNING *`, [issued?.id || null, statusName(issued, "Issued"), req.session.user.id, req.params.id]);
        if (record.purchase_requisition_id) {
          const raised = await status(tx, "goods_requisition", "lpo_raised", "LPO Raised");
          await tx.exec(`UPDATE purchase_requisitions SET status_id = ?, status = ?, updated_at = NOW() WHERE id = ?`, [raised?.id || null, statusName(raised, "LPO Raised"), record.purchase_requisition_id]);
        }
        await recordApproval(tx, "lpo", req.params.id, "issue", record.status, updated.rows[0].status, req.session.user.id, req.body.comment);
        await logAudit(tx, req.session.user.id, "issue", "lpo", Number(req.params.id), req.body);
        return updated.rows[0];
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.get("/deliveries", async (req, res, next) => {
    try {
      const rows = await db.all(
        `SELECT grn.id, grn.grn_number, grn.delivery_note_number, grn.purchase_order_id,
                grn.supplier_id, grn.receipt_date, grn.received_by, grn.notes,
                grn.created_at, grn.updated_at,
                po.lpo_number, po.order_number, s.name AS supplier_name,
                COALESCE(SUM(grni.quantity_received), 0) AS total_quantity_received
         FROM goods_received_notes grn INNER JOIN purchase_orders po ON po.id = grn.purchase_order_id
         INNER JOIN suppliers s ON s.id = grn.supplier_id
         LEFT JOIN goods_received_note_items grni ON grni.goods_received_note_id = grn.id
         WHERE po.lpo_number IS NOT NULL
         GROUP BY grn.id, po.lpo_number, po.order_number, s.name ORDER BY grn.receipt_date DESC, grn.id DESC`
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.get("/deliveries/:id", async (req, res, next) => {
    try {
       const header = await db.get(`SELECT grn.id, grn.grn_number, grn.delivery_note_number, grn.purchase_order_id, grn.supplier_id, grn.receipt_date, grn.received_by, grn.notes, grn.created_at, grn.updated_at, po.lpo_number, po.order_number, s.name AS supplier_name FROM goods_received_notes grn INNER JOIN purchase_orders po ON po.id = grn.purchase_order_id INNER JOIN suppliers s ON s.id = grn.supplier_id WHERE grn.id = ? AND po.lpo_number IS NOT NULL`, [req.params.id]);
      if (!header) return res.status(404).json({ success: false, message: "Delivery not found" });
      const items = await db.all(`SELECT grni.*, p.name AS product_name, uom.code AS unit_code FROM goods_received_note_items grni INNER JOIN products p ON p.id = grni.product_id LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id WHERE grni.goods_received_note_id = ? ORDER BY p.name`, [req.params.id]);
      res.json({ success: true, data: { header, items } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/deliveries", async (req, res, next) => {
    try {
      const items = requireItems(req.body.items, "Delivery lines");
      ensureUniqueProducts(items);
      const key = idempotencyKey(req);
      if (!req.body.deliveryNoteNumber && !key) throw httpError(400, "Delivery note number or Idempotency-Key is required.");
      const result = await db.transaction(async (tx) => {
        if (key) {
          const existing = await tx.get(`SELECT * FROM goods_received_notes WHERE idempotency_key = ?`, [key]);
          if (existing) return { record: existing, existing: true, summary: await getLpoLines(tx, existing.purchase_order_id) };
        }
        const lpo = await tx.get(`SELECT * FROM purchase_orders WHERE id = ? AND lpo_number IS NOT NULL FOR UPDATE`, [req.body.lpoId || req.body.purchaseOrderId]);
        if (!lpo) throw httpError(404, "LPO not found.");
        const centralStoreId = await getCentralStoreId(tx);
        ensureState(lpo, ["issued", "partially received"], "LPO");
        if (req.body.deliveryNoteNumber) {
          const duplicate = await tx.get(`SELECT id FROM goods_received_notes WHERE purchase_order_id = ? AND delivery_note_number = ?`, [lpo.id, req.body.deliveryNoteNumber]);
          if (duplicate) throw httpError(409, "This delivery note is already registered against the LPO.");
        }
        const lpoItems = await getLpoLines(tx, lpo.id);
        const byProduct = new Map(lpoItems.map((item) => [Number(item.product_id), item]));
        for (const item of items) {
          const line = byProduct.get(Number(item.productId));
          if (!line) throw httpError(400, "Delivery contains a product not ordered on the LPO.");
          const quantity = positive(item.quantityReceived, "Received quantity");
          if (quantity > Number(line.outstanding_quantity) + 0.0001) throw httpError(400, `Cannot receive more than the outstanding quantity for ${line.product_name}.`);
        }
        const confirmed = await status(tx, "goods_received_note", "confirmed", "Confirmed");
        const number = await nextNumber(tx, "goods_received_note", req.body.deliveryDate || today());
        const header = await tx.exec(
          `INSERT INTO goods_received_notes
             (grn_number, delivery_note_number, purchase_order_id, supplier_id, store_location_id, receipt_date, status_id, status, received_by, confirmed_by, idempotency_key, posted_at, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?) RETURNING *`,
          [number, req.body.deliveryNoteNumber || null, lpo.id, lpo.supplier_id, centralStoreId, req.body.deliveryDate || today(), confirmed?.id || null, statusName(confirmed, "Confirmed"), req.session.user.id, req.session.user.id, key, req.body.notes || null]
        );
        for (const item of items) {
          const ordered = byProduct.get(Number(item.productId));
          const quantity = Number(item.quantityReceived);
          const unitCost = Number(item.unitCost ?? ordered.unit_cost ?? 0);
          const line = await tx.exec(
            `INSERT INTO goods_received_note_items (goods_received_note_id, product_id, quantity_received, unit_cost, line_total, batch_number, expiry_date)
             VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
            [header.rows[0].id, item.productId, quantity, unitCost, quantity * unitCost, item.batchNumber || `${number}-${item.productId}`, item.expiryDate || null]
          );
           await receiveGoodsIntoInventory(tx, { productId: item.productId, storeLocationId: centralStoreId, supplierId: lpo.supplier_id, goodsReceivedNoteId: header.rows[0].id, batchNumber: line.rows[0].batch_number, expiryDate: line.rows[0].expiry_date, quantityReceived: quantity, unitCost, receivedAt: req.body.deliveryDate || today(), notes: req.body.notes || null, createdBy: req.session.user.id });
        }
        const summary = await getLpoLines(tx, lpo.id);
        const fullyReceived = summary.length > 0 && summary.every((line) => Number(line.outstanding_quantity) <= 0.0001);
        const target = await status(tx, "lpo", fullyReceived ? "fully_received" : "partially_received", fullyReceived ? "Fully Received" : "Partially Received");
        await tx.exec(`UPDATE purchase_orders SET status_id = ?, status = ?, updated_at = NOW() WHERE id = ?`, [target?.id || null, statusName(target, fullyReceived ? "Fully Received" : "Partially Received"), lpo.id]);
        await recordApproval(tx, "lpo", lpo.id, "receive", lpo.status, statusName(target, fullyReceived ? "Fully Received" : "Partially Received"), req.session.user.id, req.body.deliveryNoteNumber);
        await logAudit(tx, req.session.user.id, "receive", "goods_received_note", header.rows[0].id, req.body);
        return { record: header.rows[0], existing: false, summary };
      });
      const visibleRecord = Object.fromEntries(
        Object.entries(result.record).filter(([key]) => !["status_id", "status", "store_location_id"].includes(key)),
      );
      res.status(result.existing ? 200 : 201).json({ success: true, data: visibleRecord, summary: result.summary, idempotent: result.existing });
    } catch (error) {
      next(error);
    }
  });

  router.get("/supplier-invoices", async (req, res, next) => {
    try {
      const rows = await db.all(`SELECT si.*, s.name AS supplier_name, po.lpo_number FROM supplier_invoices si INNER JOIN suppliers s ON s.id = si.supplier_id LEFT JOIN purchase_orders po ON po.id = si.purchase_order_id ORDER BY si.invoice_date DESC, si.id DESC`);
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.get("/supplier-invoices/:id", async (req, res, next) => {
    try {
      const invoice = await db.get(`SELECT si.*, s.name AS supplier_name, po.lpo_number FROM supplier_invoices si INNER JOIN suppliers s ON s.id = si.supplier_id LEFT JOIN purchase_orders po ON po.id = si.purchase_order_id WHERE si.id = ?`, [req.params.id]);
      if (!invoice) return res.status(404).json({ success: false, message: "Supplier invoice not found" });
      const [payments, attachments] = await Promise.all([db.all(`SELECT * FROM payment_vouchers WHERE supplier_invoice_id = ? AND LOWER(status) = 'paid' ORDER BY payment_date DESC, id DESC`, [req.params.id]), db.all(`SELECT * FROM attachments WHERE entity_type = 'supplier_invoice' AND entity_id = ? ORDER BY created_at DESC`, [req.params.id])]);
      res.json({ success: true, data: { invoice, payments, attachments } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/supplier-invoices", async (req, res, next) => {
    try {
      const amount = positive(req.body.totalAmount, "Invoice amount");
      const invoicePayment = resolveInvoicePaymentDetails(req.body.paymentMethod, req.body.dueDate);
      const key = idempotencyKey(req);
      const result = await db.transaction(async (tx) => {
        if (key) {
          const existing = await tx.get(`SELECT * FROM supplier_invoices WHERE idempotency_key = ?`, [key]);
          if (existing) return { record: existing, existing: true };
        }
        const supplier = await tx.get(`SELECT id FROM suppliers WHERE id = ?`, [req.body.supplierId]);
        if (!supplier) throw httpError(400, "Supplier is required.");
        if (req.body.lpoId || req.body.purchaseOrderId) {
          const lpo = await tx.get(`SELECT id, supplier_id FROM purchase_orders WHERE id = ? AND lpo_number IS NOT NULL`, [req.body.lpoId || req.body.purchaseOrderId]);
          if (!lpo) throw httpError(400, "LPO not found.");
          if (Number(lpo.supplier_id) !== Number(req.body.supplierId)) throw httpError(400, "Invoice supplier must match the LPO supplier.");
        }
        const duplicate = await tx.get(`SELECT id FROM supplier_invoices WHERE supplier_id = ? AND LOWER(invoice_number) = LOWER(?)`, [req.body.supplierId, req.body.invoiceNumber]);
        if (duplicate) throw httpError(409, "This supplier invoice number is already registered for the supplier.");
        const open = await status(tx, "supplier_invoice", "open", "Open");
        const number = String(req.body.invoiceNumber || (await nextNumber(tx, "supplier_invoice", req.body.invoiceDate || today()))).trim();
        const inserted = await tx.exec(
          `INSERT INTO supplier_invoices
             (invoice_number, supplier_id, purchase_order_id, goods_received_note_id, invoice_date, due_date, payment_method, payment_term_id, total_amount, amount_paid, payment_status_id, payment_status, status_id, status, attachment_id, idempotency_key, created_by, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
          [number, req.body.supplierId, req.body.lpoId || req.body.purchaseOrderId || null, req.body.deliveryId || req.body.goodsReceivedNoteId || null, req.body.invoiceDate || today(), invoicePayment.dueDate, invoicePayment.paymentMethod, req.body.paymentTermId || null, amount, null, "Pending", open?.id || null, statusName(open, "Open"), req.body.attachmentId || null, key, req.session.user.id, req.body.notes || null]
        );
        await logAudit(tx, req.session.user.id, "create", "supplier_invoice", inserted.rows[0].id, req.body);
        return { record: inserted.rows[0], existing: false };
      });
      res.status(result.existing ? 200 : 201).json({ success: true, data: result.record, idempotent: result.existing });
    } catch (error) {
      next(error);
    }
  });

  router.get("/payment-vouchers", async (req, res, next) => {
    try {
      const rows = await db.all(`SELECT pv.*, s.name AS supplier_name, si.invoice_number,
                cr.requisition_number AS cash_requisition_number, cr.payee_name AS cash_payee_name,
                cr.purpose AS cash_requisition_purpose, cr.currency_code,
                COALESCE(s.name, cr.payee_name) AS payee_name,
                po.lpo_number
         FROM payment_vouchers pv
         LEFT JOIN suppliers s ON s.id = pv.supplier_id
         LEFT JOIN supplier_invoices si ON si.id = pv.supplier_invoice_id
         LEFT JOIN cash_requisitions cr ON cr.id = pv.cash_requisition_id
         LEFT JOIN purchase_orders po ON po.id = pv.purchase_order_id
         ORDER BY pv.payment_date DESC, pv.id DESC`);
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.get("/payment-vouchers/:id", async (req, res, next) => {
    try {
      const voucher = await db.get(`SELECT pv.*, s.name AS supplier_name, si.invoice_number,
                cr.requisition_number AS cash_requisition_number, cr.payee_name AS cash_payee_name,
                cr.purpose AS cash_requisition_purpose, cr.currency_code,
                COALESCE(s.name, cr.payee_name) AS payee_name,
                po.lpo_number
         FROM payment_vouchers pv
         LEFT JOIN suppliers s ON s.id = pv.supplier_id
         LEFT JOIN supplier_invoices si ON si.id = pv.supplier_invoice_id
         LEFT JOIN cash_requisitions cr ON cr.id = pv.cash_requisition_id
         LEFT JOIN purchase_orders po ON po.id = pv.purchase_order_id
         WHERE pv.id = ?`, [req.params.id]);
      if (!voucher) return res.status(404).json({ success: false, message: "Payment voucher not found" });
      const approvals = await db.all(`SELECT * FROM approval_history WHERE entity_type = 'payment_voucher' AND entity_id = ? ORDER BY created_at DESC`, [req.params.id]);
      res.json({ success: true, data: { voucher, approvals } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/payment-vouchers", async (req, res, next) => {
    try {
      const amount = positive(req.body.amount, "Payment voucher amount");
      const method = String(req.body.paymentMethod || "").trim();
      if (!PAYMENT_METHODS.has(method)) throw httpError(400, "Choose a valid payment method.");
      const supplierInvoiceId = req.body.supplierInvoiceId ? Number(req.body.supplierInvoiceId) : null;
      const cashRequisitionId = req.body.cashRequisitionId ? Number(req.body.cashRequisitionId) : null;
      if ((supplierInvoiceId && cashRequisitionId) || (!supplierInvoiceId && !cashRequisitionId)) {
        throw httpError(400, "Link the payment voucher to either a supplier invoice or a cash requisition.");
      }
      let supplierId = req.body.supplierId ? Number(req.body.supplierId) : null;
      const key = idempotencyKey(req);
      const result = await db.transaction(async (tx) => {
        if (key) {
          const existing = await tx.get(`SELECT * FROM payment_vouchers WHERE idempotency_key = ?`, [key]);
          if (existing) return { record: existing, existing: true };
        }
        let invoice = null;
        if (supplierInvoiceId) {
          invoice = await tx.get(`SELECT * FROM supplier_invoices WHERE id = ? FOR UPDATE`, [supplierInvoiceId]);
          if (!invoice) throw httpError(400, "Supplier invoice not found.");
          if (supplierId && Number(invoice.supplier_id) !== supplierId) throw httpError(400, "Payment supplier must match invoice supplier.");
          supplierId = Number(invoice.supplier_id);
          if (amount > Number(invoice.total_amount) - Number(invoice.amount_paid) + 0.0001) throw httpError(400, "Payment cannot exceed the invoice balance.");
        } else {
          const cashRequisition = await tx.get(`SELECT * FROM cash_requisitions WHERE id = ? FOR UPDATE`, [cashRequisitionId]);
          if (!cashRequisition) throw httpError(400, "Cash requisition not found.");
          ensureState(cashRequisition, ["approved", "cash released"], "Cash requisition");
          if (amount > Number(cashRequisition.amount) + 0.0001) throw httpError(400, "Payment cannot exceed the cash requisition amount.");
          const linkedVoucher = await tx.get(
            `SELECT id, voucher_number FROM payment_vouchers
             WHERE cash_requisition_id = ? AND LOWER(status) <> 'rejected'
             ORDER BY id DESC LIMIT 1`,
            [cashRequisitionId],
          );
          if (linkedVoucher) throw httpError(409, `Cash requisition is already linked to payment voucher ${linkedVoucher.voucher_number}.`);
          supplierId = null;
        }
        if (req.body.lpoId || req.body.purchaseOrderId) {
          const lpo = await tx.get(`SELECT id, supplier_id FROM purchase_orders WHERE id = ? AND lpo_number IS NOT NULL`, [req.body.lpoId || req.body.purchaseOrderId]);
          if (!lpo) throw httpError(400, "LPO not found.");
          if (!supplierId || Number(lpo.supplier_id) !== supplierId) throw httpError(400, "Payment supplier must match the LPO supplier.");
          if (invoice && Number(invoice.purchase_order_id || lpo.id) !== Number(lpo.id)) throw httpError(400, "Payment LPO must match the invoice LPO.");
        }
        const draft = await status(tx, "payment_voucher", "draft", "Draft");
        const number = await nextNumber(tx, "payment_voucher", req.body.paymentDate || today());
        const inserted = await tx.exec(`INSERT INTO payment_vouchers (voucher_number, supplier_id, supplier_invoice_id, cash_requisition_id, purchase_order_id, amount, payment_date, payment_method, reference_number, status_id, status, prepared_by, supporting_attachment_id, idempotency_key, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`, [number, supplierId, supplierInvoiceId, cashRequisitionId, req.body.lpoId || req.body.purchaseOrderId || null, amount, req.body.paymentDate || today(), method, req.body.referenceNumber || null, draft?.id || null, statusName(draft, "Draft"), req.session.user.id, req.body.attachmentId || null, key, req.body.notes || null]);
        await logAudit(tx, req.session.user.id, "create", "payment_voucher", inserted.rows[0].id, req.body);
        return { record: inserted.rows[0], existing: false };
      });
      res.status(result.existing ? 200 : 201).json({ success: true, data: result.record, idempotent: result.existing });
    } catch (error) {
      next(error);
    }
  });

  async function transitionVoucher(req, res, next, action) {
    try {
      const result = await db.transaction(async (tx) => {
        const voucher = await tx.get(`SELECT * FROM payment_vouchers WHERE id = ? FOR UPDATE`, [req.params.id]);
        if (!voucher) throw httpError(404, "Payment voucher not found.");
        if (action === "submit") ensureState(voucher, ["draft"], "Payment voucher");
        if (action === "approve") {
          ensureState(voucher, ["submitted"], "Payment voucher");
        }
        if (action === "reject") {
          ensureState(voucher, ["submitted"], "Payment voucher");
        }
        const targetKey = action === "submit" ? "submitted" : action === "reject" ? "rejected" : "approved";
        const target = await status(tx, "payment_voucher", targetKey, targetKey === "submitted" ? "Submitted" : targetKey === "rejected" ? "Rejected" : "Approved");
        let updateSql = `UPDATE payment_vouchers SET status_id = ?, status = ?`;
        let updateParams = [target?.id || null, statusName(target, targetKey)];
        if (action === "approve") {
          updateSql += ", approved_by = ?, approved_at = NOW()";
          updateParams.push(req.session.user.id);
        } else if (action === "reject") {
          updateSql += ", notes = COALESCE(notes, '') || ?";
          updateParams.push(`\nRejected reason: ${req.body.reason || "Not specified"}`);
        }
        updateSql += ", updated_at = NOW() WHERE id = ? RETURNING *";
        updateParams.push(req.params.id);
        const updated = await tx.exec(updateSql, updateParams);
        await recordApproval(tx, "payment_voucher", req.params.id, action, voucher.status, updated.rows[0].status, req.session.user.id, req.body.comment);
        await logAudit(tx, req.session.user.id, action, "payment_voucher", Number(req.params.id), req.body);
        return updated.rows[0];
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  router.post("/payment-vouchers/:id/submit", (req, res, next) => transitionVoucher(req, res, next, "submit"));
  router.post("/payment-vouchers/:id/approve", (req, res, next) => transitionVoucher(req, res, next, "approve"));
  router.post("/payment-vouchers/:id/reject", (req, res, next) => transitionVoucher(req, res, next, "reject"));

  router.post("/payment-vouchers/:id/pay", async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const voucher = await tx.get(`SELECT * FROM payment_vouchers WHERE id = ? FOR UPDATE`, [req.params.id]);
        if (!voucher) throw httpError(404, "Payment voucher not found.");
        ensureState(voucher, ["approved"], "Payment voucher");
        if (voucher.supplier_invoice_id) {
          const invoice = await tx.get(`SELECT * FROM supplier_invoices WHERE id = ? FOR UPDATE`, [voucher.supplier_invoice_id]);
          if (!invoice) throw httpError(400, "Linked supplier invoice not found.");
          if (Number(voucher.amount) > Number(invoice.total_amount) - Number(invoice.amount_paid) + 0.0001) throw httpError(400, "Payment exceeds the current invoice balance.");
          const open = await status(tx, "supplier_invoice", "open", "Open");
          const closed = await status(tx, "supplier_invoice", "closed", "Closed");
          const newPaid = Number(invoice.amount_paid) + Number(voucher.amount);
          const invoiceIsPaid = newPaid >= Number(invoice.total_amount) - 0.0001;
          await tx.exec(`UPDATE supplier_invoices SET amount_paid = ?, payment_status_id = NULL, payment_status = ?, status_id = ?, status = ?, updated_at = NOW() WHERE id = ?`, [newPaid, invoiceIsPaid ? "Paid" : "Partially Paid", invoiceIsPaid ? closed?.id || null : open?.id || null, invoiceIsPaid ? statusName(closed, "Closed") : statusName(open, "Open"), invoice.id]);
        }
        if (voucher.cash_requisition_id) {
          const cashRequisition = await tx.get(`SELECT * FROM cash_requisitions WHERE id = ? FOR UPDATE`, [voucher.cash_requisition_id]);
          if (!cashRequisition) throw httpError(400, "Linked cash requisition not found.");
          ensureState(cashRequisition, ["approved", "cash released"], "Cash requisition");
          if (String(cashRequisition.status || "").toLowerCase() === "approved") {
            const released = await status(tx, "cash_requisition", "cash_released", "Cash Released");
            await tx.exec(
              `UPDATE cash_requisitions
               SET status_id = ?, status = ?, released_by = ?, release_payment_method = ?,
                   release_reference_number = ?, release_notes = ?, cash_released_at = NOW(), updated_at = NOW()
               WHERE id = ?`,
              [released?.id || null, statusName(released, "Cash Released"), req.session.user.id, voucher.payment_method, req.body.referenceNumber || voucher.reference_number || null, req.body.notes || null, cashRequisition.id],
            );
            await recordApproval(tx, "cash_requisition", cashRequisition.id, "release", cashRequisition.status, statusName(released, "Cash Released"), req.session.user.id, req.body.referenceNumber || voucher.reference_number);
            await logAudit(tx, req.session.user.id, "release", "cash_requisition", cashRequisition.id, { paymentVoucherId: voucher.id });
          }
        }
        const paidStatus = await status(tx, "payment_voucher", "paid", "Paid");
        let updateSql = `UPDATE payment_vouchers SET status_id = ?, status = ?, paid_by = ?, paid_at = NOW()`;
        const updateParams = [paidStatus?.id || null, statusName(paidStatus, "Paid"), req.session.user.id];
        if (req.body.referenceNumber) {
          updateSql += ", reference_number = ?";
          updateParams.push(req.body.referenceNumber);
        }
        if (req.body.notes) {
          updateSql += ", notes = COALESCE(notes, '') || ?";
          updateParams.push(`\nPayment note: ${req.body.notes}`);
        }
        updateSql += ", updated_at = NOW() WHERE id = ? RETURNING *";
        updateParams.push(voucher.id);
        const updated = await tx.exec(updateSql, updateParams);
        await recordApproval(tx, "payment_voucher", voucher.id, "pay", voucher.status, updated.rows[0].status, req.session.user.id, req.body.referenceNumber);
        await logAudit(tx, req.session.user.id, "pay", "payment_voucher", voucher.id, req.body);
        return updated.rows[0];
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.get("/supplier-receipts", async (req, res, next) => {
    try {
      const rows = await db.all(`SELECT sr.*, s.name AS supplier_name, si.invoice_number, pv.voucher_number FROM supplier_receipts sr INNER JOIN suppliers s ON s.id = sr.supplier_id LEFT JOIN supplier_invoices si ON si.id = sr.supplier_invoice_id LEFT JOIN payment_vouchers pv ON pv.id = sr.payment_voucher_id ORDER BY sr.receipt_date DESC, sr.id DESC`);
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.get("/supplier-receipts/:id", async (req, res, next) => {
    try {
      const record = await db.get(`SELECT sr.*, s.name AS supplier_name, si.invoice_number, pv.voucher_number FROM supplier_receipts sr INNER JOIN suppliers s ON s.id = sr.supplier_id LEFT JOIN supplier_invoices si ON si.id = sr.supplier_invoice_id LEFT JOIN payment_vouchers pv ON pv.id = sr.payment_voucher_id WHERE sr.id = ?`, [req.params.id]);
      if (!record) return res.status(404).json({ success: false, message: "Supplier receipt not found" });
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  });

  router.post("/supplier-receipts", async (req, res, next) => {
    try {
      const amount = positive(req.body.amount, "Supplier receipt amount");
      const key = idempotencyKey(req);
      const result = await db.transaction(async (tx) => {
        if (key) {
          const existing = await tx.get(`SELECT * FROM supplier_receipts WHERE idempotency_key = ?`, [key]);
          if (existing) return { record: existing, existing: true };
        }
        const voucher = await tx.get(`SELECT * FROM payment_vouchers WHERE id = ? FOR UPDATE`, [req.body.paymentVoucherId]);
        if (!voucher || String(voucher.status).toLowerCase() !== "paid") throw httpError(400, "A paid payment voucher is required.");
        if (Number(voucher.supplier_id) !== Number(req.body.supplierId)) throw httpError(400, "Receipt supplier must match payment voucher supplier.");
        if (req.body.supplierInvoiceId && Number(req.body.supplierInvoiceId) !== Number(voucher.supplier_invoice_id)) throw httpError(400, "Receipt invoice must match payment voucher invoice.");
        if (amount > Number(voucher.amount) + 0.0001) throw httpError(400, "Receipt amount cannot exceed the payment voucher amount.");
        const duplicate = await tx.get(`SELECT id FROM supplier_receipts WHERE payment_voucher_id = ?`, [voucher.id]);
        if (duplicate) throw httpError(409, "A supplier receipt is already registered for this payment voucher.");
        const number = await nextNumber(tx, "supplier_receipt", req.body.receiptDate || today());
        const inserted = await tx.exec(`INSERT INTO supplier_receipts (receipt_number, supplier_id, supplier_invoice_id, payment_voucher_id, receipt_date, amount, attachment_id, registered_by, status, idempotency_key, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Registered', ?, ?) RETURNING *`, [number, req.body.supplierId, req.body.supplierInvoiceId || voucher.supplier_invoice_id || null, voucher.id, req.body.receiptDate || today(), amount, req.body.attachmentId || null, req.session.user.id, key, req.body.notes || null]);
        await logAudit(tx, req.session.user.id, "register", "supplier_receipt", inserted.rows[0].id, req.body);
        return { record: inserted.rows[0], existing: false };
      });
      res.status(result.existing ? 200 : 201).json({ success: true, data: result.record, idempotent: result.existing });
    } catch (error) {
      next(error);
    }
  });

  router.post("/attachments", async (req, res, next) => {
    try {
      if (!req.body.entityType || !req.body.entityId || !req.body.fileName) throw httpError(400, "Entity and file metadata are required.");
      const result = await db.exec(`INSERT INTO attachments (entity_type, entity_id, file_name, mime_type, file_size, storage_key, file_url, metadata, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?) RETURNING *`, [req.body.entityType, req.body.entityId, req.body.fileName, req.body.mimeType || null, req.body.fileSize || null, req.body.storageKey || null, req.body.fileUrl || null, JSON.stringify(req.body.metadata || {}), req.session.user.id]);
      await logAudit(db, req.session.user.id, "attach", "attachment", result.rows[0].id, req.body);
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.get("/store-issues", async (req, res, next) => {
    try {
      const rows = await db.all(`SELECT si.*, src.name AS source_store_name, dst.name AS destination_store_name, u.full_name AS issued_by_name, COALESCE(SUM(sii.issued_quantity), 0) AS total_quantity FROM store_issues si INNER JOIN store_locations src ON src.id = si.source_store_location_id LEFT JOIN store_locations dst ON dst.id = si.destination_store_location_id LEFT JOIN users u ON u.id = si.issued_by LEFT JOIN store_issue_items sii ON sii.store_issue_id = si.id WHERE si.issue_type = 'STORE_TRANSFER' GROUP BY si.id, src.name, dst.name, u.full_name ORDER BY si.issue_date DESC, si.id DESC`);
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.post("/store-issues", async (req, res, next) => {
    try {
      const items = requireItems(req.body.items, "Store issue lines");
      ensureUniqueProducts(items);
      const key = idempotencyKey(req);
      const result = await db.transaction(async (tx) => {
        if (key) {
          const existing = await tx.get(`SELECT * FROM store_issues WHERE issue_type = 'STORE_TRANSFER' AND idempotency_key = ?`, [key]);
          if (existing) return { record: existing, existing: true };
        }
        const issueNumber = await nextNumber(tx, "store_issue", req.body.issueDate || today());
        const issued = await status(tx, "store_issue", "issued", "Issued");
        const inserted = await tx.exec(`INSERT INTO store_issues (issue_number, kitchen_requisition_id, source_store_location_id, destination_store_location_id, department_id, department_name, issue_type, issue_date, status_id, status, issued_by, idempotency_key, notes) VALUES (?, NULL, ?, ?, ?, ?, 'STORE_TRANSFER', ?, ?, ?, ?, ?, ?) RETURNING *`, [issueNumber, req.body.sourceStoreLocationId, req.body.destinationStoreLocationId, req.body.departmentId || null, req.body.departmentName || "Stores", req.body.issueDate || today(), issued?.id || null, statusName(issued, "Issued"), req.session.user.id, key, req.body.notes || null]);
        for (const item of items) {
          const quantity = positive(item.quantity, "Transfer quantity");
          const line = await tx.exec(`INSERT INTO store_issue_items (store_issue_id, kitchen_requisition_item_id, product_id, approved_quantity, issued_quantity, unit_cost) VALUES (?, NULL, ?, ?, ?, 0) RETURNING *`, [inserted.rows[0].id, item.productId, quantity, quantity]);
          const allocations = await transferStockBetweenStores(tx, { productId: item.productId, sourceStoreLocationId: req.body.sourceStoreLocationId, destinationStoreLocationId: req.body.destinationStoreLocationId, quantity, movementDate: req.body.issueDate || today(), referenceType: "StoreIssue", referenceId: inserted.rows[0].id, movementType: "Transfer", notes: req.body.notes || null, createdBy: req.session.user.id });
          const averageCost = allocations.reduce((sum, allocation) => sum + allocation.quantity * allocation.unitCost, 0) / quantity;
          await tx.exec(`UPDATE store_issue_items SET unit_cost = ? WHERE id = ?`, [averageCost, line.rows[0].id]);
        }
        await logAudit(tx, req.session.user.id, "issue", "store_issue", inserted.rows[0].id, req.body);
        return { record: inserted.rows[0], existing: false };
      });
      res.status(result.existing ? 200 : 201).json({ success: true, data: result.record, idempotent: result.existing });
    } catch (error) {
      next(error);
    }
  });

  router.get("/traceability/goods-requisitions/:id", async (req, res, next) => {
    try {
      const requisition = await db.get(`SELECT * FROM purchase_requisitions WHERE id = ? AND requisition_type = 'GOODS'`, [req.params.id]);
      if (!requisition) return res.status(404).json({ success: false, message: "Goods requisition not found" });
      const lpos = await db.all(`SELECT * FROM purchase_orders WHERE purchase_requisition_id = ? AND lpo_number IS NOT NULL ORDER BY id`, [req.params.id]);
      const lpoIds = lpos.map((row) => row.id);
      const inList = (values) => values.length ? values.map((_, index) => `?`).join(", ") : "NULL";
      const deliveries = await db.all(`SELECT * FROM goods_received_notes WHERE purchase_order_id IN (${inList(lpoIds)}) ORDER BY receipt_date, id`, lpoIds);
      const deliveryIds = deliveries.map((row) => row.id);
      const invoices = await db.all(`SELECT * FROM supplier_invoices WHERE purchase_order_id IN (${inList(lpoIds)}) ORDER BY invoice_date, id`, lpoIds);
      const invoiceIds = invoices.map((row) => row.id);
      const vouchers = await db.all(`SELECT * FROM payment_vouchers WHERE purchase_order_id IN (${inList(lpoIds)}) OR supplier_invoice_id IN (${inList(invoiceIds)}) ORDER BY payment_date, id`, [...lpoIds, ...invoiceIds]);
      const voucherIds = vouchers.map((row) => row.id);
      const receipts = await db.all(`SELECT * FROM supplier_receipts WHERE payment_voucher_id IN (${inList(voucherIds)}) ORDER BY receipt_date, id`, voucherIds);
      const movements = deliveryIds.length ? await db.all(`SELECT sm.* FROM stock_movements sm WHERE sm.reference_type = 'GoodsReceivedNote' AND sm.reference_id IN (${inList(deliveryIds)}) ORDER BY sm.movement_date, sm.id`, deliveryIds) : [];
      const approvals = await db.all(`SELECT * FROM approval_history WHERE (entity_type = 'goods_requisition' AND entity_id = ?) OR (entity_type = 'lpo' AND entity_id IN (${inList(lpoIds)})) ORDER BY created_at`, [req.params.id, ...lpoIds]);
      res.json({ success: true, data: { requisition, lpos, deliveries, invoices, paymentVouchers: vouchers, supplierReceipts: receipts, stockMovements: movements, approvals } });
    } catch (error) {
      next(error);
    }
  });

  router.get("/traceability/lpos/:id", async (req, res, next) => {
    try {
      const detail = await getLpoDetail(db, req.params.id);
      if (!detail) return res.status(404).json({ success: false, message: "LPO not found" });
      const trace = await db.all(`SELECT sm.* FROM stock_movements sm INNER JOIN goods_received_note_items grni ON grni.product_id = sm.product_id INNER JOIN goods_received_notes grn ON grn.id = grni.goods_received_note_id WHERE grn.purchase_order_id = ? AND sm.reference_type = 'GoodsReceivedNote' ORDER BY sm.movement_date, sm.id`, [req.params.id]);
      const approvals = await db.all(`SELECT * FROM approval_history WHERE entity_type = 'lpo' AND entity_id = ? ORDER BY created_at`, [req.params.id]);
      res.json({ success: true, data: { ...detail, stockMovements: trace, approvals } });
    } catch (error) {
      next(error);
    }
  });

  router.get("/registers/:register", async (req, res, next) => {
    try {
      const queries = {
        "goods-requisitions": `SELECT requisition_number, request_date, required_date, purpose, status, requested_by FROM purchase_requisitions WHERE requisition_type = 'GOODS' ORDER BY request_date DESC, id DESC`,
        "cash-requisitions": `SELECT cr.requisition_number, cr.request_date, cr.purpose, cr.payee_name, cr.amount, cr.status, cr.requested_by, cr.release_payment_method, cr.release_reference_number, crs.settlement_date, crs.actual_spent_amount, crs.cash_returned_amount, crs.variance_amount, crs.receipt_reference FROM cash_requisitions cr LEFT JOIN cash_requisition_settlements crs ON crs.cash_requisition_id = cr.id ORDER BY cr.request_date DESC, cr.id DESC`,
        lpos: `SELECT lpo_number, order_date, supplier_id, status, expected_delivery_date FROM purchase_orders WHERE lpo_number IS NOT NULL ORDER BY order_date DESC, id DESC`,
        invoices: `SELECT invoice_number, supplier_id, invoice_date, total_amount, amount_paid, payment_status FROM supplier_invoices ORDER BY invoice_date DESC, id DESC`,
        deliveries: `SELECT grn_number, delivery_note_number, purchase_order_id, receipt_date, store_location_id, status FROM goods_received_notes ORDER BY receipt_date DESC, id DESC`,
        "outstanding-lpo-deliveries": `SELECT po.lpo_number, s.name AS supplier_name, poi.product_id, p.name AS product_name, poi.quantity_ordered, COALESCE(SUM(CASE WHEN grn.status = 'Confirmed' THEN grni.quantity_received ELSE 0 END), 0) AS received_quantity, poi.quantity_ordered - COALESCE(SUM(CASE WHEN grn.status = 'Confirmed' THEN grni.quantity_received ELSE 0 END), 0) AS outstanding_quantity FROM purchase_orders po INNER JOIN suppliers s ON s.id = po.supplier_id INNER JOIN purchase_order_items poi ON poi.purchase_order_id = po.id INNER JOIN products p ON p.id = poi.product_id LEFT JOIN goods_received_note_items grni ON grni.product_id = poi.product_id LEFT JOIN goods_received_notes grn ON grn.id = grni.goods_received_note_id AND grn.purchase_order_id = po.id WHERE po.lpo_number IS NOT NULL GROUP BY po.id, s.name, poi.id, p.name HAVING poi.quantity_ordered - COALESCE(SUM(CASE WHEN grn.status = 'Confirmed' THEN grni.quantity_received ELSE 0 END), 0) > 0 ORDER BY po.lpo_number, p.name`,
        "payment-vouchers": `SELECT voucher_number, supplier_id, payment_date, amount, payment_method, status FROM payment_vouchers ORDER BY payment_date DESC, id DESC`,
        "supplier-receipts": `SELECT receipt_number, supplier_id, receipt_date, amount, status FROM supplier_receipts ORDER BY receipt_date DESC, id DESC`,
        "current-stock": `SELECT ib.*, p.name AS product_name, sl.name AS store_name FROM inventory_balances ib INNER JOIN products p ON p.id = ib.product_id INNER JOIN store_locations sl ON sl.id = ib.store_location_id ORDER BY p.name, sl.name`,
        "stock-by-store": `SELECT sl.name AS store_name, COUNT(ib.id)::int AS product_count, COALESCE(SUM(ib.quantity_on_hand), 0) AS total_quantity, COALESCE(SUM(ib.stock_value), 0) AS stock_value FROM store_locations sl LEFT JOIN inventory_balances ib ON ib.store_location_id = sl.id GROUP BY sl.id, sl.name ORDER BY sl.name`,
        "store-issues": `SELECT issue_number, issue_date, source_store_location_id, destination_store_location_id, status, issued_by FROM store_issues WHERE issue_type = 'STORE_TRANSFER' ORDER BY issue_date DESC, id DESC`,
        "item-movements": `SELECT sm.*, p.name AS product_name, sl.name AS store_name FROM stock_movements sm INNER JOIN products p ON p.id = sm.product_id INNER JOIN store_locations sl ON sl.id = sm.store_location_id WHERE (? IS NULL OR sm.product_id = ?) ORDER BY sm.movement_date DESC, sm.id DESC`,
      };
      const query = queries[req.params.register];
      if (!query) return res.status(404).json({ success: false, message: "Unknown register" });
      const productId = req.params.register === "item-movements" && req.query.productId ? Number(req.query.productId) : null;
      const rows = req.params.register === "item-movements" ? await db.all(query, [productId, productId]) : await db.all(query);
      res.json({ success: true, data: { register: req.params.register, rows } });
    } catch (error) {
      next(error);
    }
  });

  router.use((error, req, res, next) => {
    if (error?.code === "23505") {
      error.status = 409;
      error.message = "This operation conflicts with an existing document or idempotency key.";
    }
    next(error);
  });

  return router;
}

module.exports = createProcurementSystemRoutes;
