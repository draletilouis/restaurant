const express = require("express");

const { requireAuth, requirePermission } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { ensureApprovalAllowed } = require("../services/approval-workflow-service");
const { resolveDeliveryType, resolveDepartment } = require("../services/config-lookup-service");
const { issueStockFromInventory, returnStockToInventory } = require("../services/inventory-service");
const { getNextSequence } = require("../services/system-service");
const { getStatus } = require("../services/status-service");

function createKitchenRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/requisitions", async (req, res, next) => {
    try {
      const rows = await db.all(
        `SELECT kr.*, u.full_name AS requested_by_name, a.full_name AS approved_by_name, sl.name AS source_store_name,
                COALESCE(COUNT(kri.id), 0)::int AS item_count
         FROM kitchen_requisitions kr
         LEFT JOIN users u ON u.id = kr.requested_by
         LEFT JOIN users a ON a.id = kr.approved_by
         INNER JOIN store_locations sl ON sl.id = kr.source_store_location_id
         LEFT JOIN kitchen_requisition_items kri ON kri.kitchen_requisition_id = kr.id
         GROUP BY kr.id, u.full_name, a.full_name, sl.name
         ORDER BY kr.created_at DESC`
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.get("/requisitions/:id", async (req, res, next) => {
    try {
      const header = await db.get("SELECT * FROM kitchen_requisitions WHERE id = ?", [req.params.id]);
      if (!header) {
        res.status(404).json({ success: false, message: "Kitchen requisition not found" });
        return;
      }
      const [items, issues, auditTrail] = await Promise.all([
        db.all(
          `SELECT kri.*, p.name AS product_name, uom.code AS unit_code, uom.name AS unit_name
           FROM kitchen_requisition_items kri
           INNER JOIN products p ON p.id = kri.product_id
           LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
           WHERE kri.kitchen_requisition_id = ?
           ORDER BY p.name`,
          [req.params.id]
        ),
        db.all("SELECT * FROM store_issues WHERE kitchen_requisition_id = ? ORDER BY created_at DESC", [req.params.id]),
        db.all(
          `SELECT *
           FROM audit_logs
           WHERE entity_type = 'kitchen_requisition' AND entity_id = ?
           ORDER BY created_at DESC`,
          [req.params.id]
        ),
      ]);
      res.json({ success: true, data: { header, items, issues, auditTrail } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/requisitions", async (req, res, next) => {
    try {
      const draftStatus = await getStatus(db, "kitchen_requisition", "draft", { fallbackName: "Draft" });
      const department = await resolveDepartment(db, req.body.departmentId, req.body.departmentName || "Kitchen");
      const requisition = await db.transaction(async (tx) => {
        const requisitionNumber = await getNextSequence(
          { ...db, get: tx.get.bind(tx) },
          "kitchenRequisitionPrefix",
          "kitchen_requisitions"
        );
        const headerResult = await tx.exec(
          `INSERT INTO kitchen_requisitions
             (requisition_number, request_date, production_date, department_id, department_name, source_store_location_id, requested_by, status_id, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING *`,
          [
            requisitionNumber,
            req.body.requestDate,
            req.body.productionDate,
            department?.id || null,
            department?.name || req.body.departmentName || "Kitchen",
            req.body.sourceStoreLocationId,
            req.session.user.id,
            draftStatus?.id || null,
            draftStatus?.status_name || "Draft",
            req.body.notes || null,
          ]
        );

        for (const item of req.body.items || []) {
          await tx.exec(
            `INSERT INTO kitchen_requisition_items
               (kitchen_requisition_id, product_id, requested_quantity, approved_quantity, issued_quantity)
             VALUES (?, ?, ?, 0, 0)`,
            [headerResult.rows[0].id, item.productId, item.requestedQuantity || 0]
          );
        }

        return headerResult.rows[0];
      });

      await logAudit(db, req.session.user.id, "create", "kitchen_requisition", requisition.id, req.body);
      res.status(201).json({ success: true, data: requisition });
    } catch (error) {
      next(error);
    }
  });

  router.post("/requisitions/:id/submit", async (req, res, next) => {
    try {
      const submittedStatus = await getStatus(db, "kitchen_requisition", "submitted", { fallbackName: "Submitted" });
      const result = await db.exec(
        `UPDATE kitchen_requisitions
         SET status_id = ?, status = ?, updated_at = NOW()
         WHERE id = ?
         RETURNING *`,
        [submittedStatus?.id || null, submittedStatus?.status_name || "Submitted", req.params.id]
      );
      await logAudit(db, req.session.user.id, "submit", "kitchen_requisition", Number(req.params.id), {});
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.post("/requisitions/:id/approve", requirePermission("kitchen_requisitions.approve"), async (req, res, next) => {
    try {
      const requisition = await db.get("SELECT * FROM kitchen_requisitions WHERE id = ?", [req.params.id]);
      if (!requisition) {
        res.status(404).json({ success: false, message: "Kitchen requisition not found" });
        return;
      }
      const totalAmount = (req.body.items || []).reduce((sum, item) => sum + Number(item.approvedQuantity || 0), 0);
      await ensureApprovalAllowed(req, db, {
        documentType: "kitchen_requisition",
        record: requisition,
        creatorFields: ["requested_by"],
        amount: totalAmount,
      });
      const approvedStatus = await getStatus(db, "kitchen_requisition", "approved", { fallbackName: "Approved" });

      await db.transaction(async (tx) => {
        for (const item of req.body.items || []) {
          await tx.exec(
            `UPDATE kitchen_requisition_items
             SET approved_quantity = ?
             WHERE id = ? AND kitchen_requisition_id = ?`,
            [item.approvedQuantity || 0, item.id, req.params.id]
          );
        }

        await tx.exec(
          `UPDATE kitchen_requisitions
           SET status_id = ?, status = ?, approved_by = ?, updated_at = NOW()
           WHERE id = ?`,
          [approvedStatus?.id || null, approvedStatus?.status_name || "Approved", req.session.user.id, req.params.id]
        );
      });

      await logAudit(db, req.session.user.id, "approve", "kitchen_requisition", Number(req.params.id), req.body);
      const refreshed = await db.get("SELECT * FROM kitchen_requisitions WHERE id = ?", [req.params.id]);
      res.json({ success: true, data: refreshed });
    } catch (error) {
      next(error);
    }
  });

  router.post("/requisitions/:id/reject", requirePermission("kitchen_requisitions.approve"), async (req, res, next) => {
    try {
      const requisition = await db.get("SELECT * FROM kitchen_requisitions WHERE id = ?", [req.params.id]);
      if (!requisition) {
        res.status(404).json({ success: false, message: "Kitchen requisition not found" });
        return;
      }
      await ensureApprovalAllowed(req, db, {
        documentType: "kitchen_requisition",
        record: requisition,
        creatorFields: ["requested_by"],
      });
      const rejectedStatus = await getStatus(db, "kitchen_requisition", "rejected", { fallbackName: "Rejected" });
      const result = await db.exec(
        `UPDATE kitchen_requisitions
         SET status_id = ?, status = ?, rejected_by = ?, notes = COALESCE(notes, '') || ?, updated_at = NOW()
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
      await logAudit(db, req.session.user.id, "reject", "kitchen_requisition", Number(req.params.id), req.body);
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.get("/store-issues", async (req, res, next) => {
    try {
      const rows = await db.all(
        `SELECT si.*, kr.requisition_number,
                COALESCE(COUNT(sii.id), 0)::int AS item_count,
                COALESCE(SUM(sii.issued_quantity), 0) AS total_issued_quantity
         FROM store_issues si
         INNER JOIN kitchen_requisitions kr ON kr.id = si.kitchen_requisition_id
         LEFT JOIN store_issue_items sii ON sii.store_issue_id = si.id
         GROUP BY si.id, kr.requisition_number
         ORDER BY si.created_at DESC`
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.post("/store-issues", async (req, res, next) => {
    try {
      const storeIssue = await db.transaction(async (tx) => {
        const requisition = await tx.get("SELECT * FROM kitchen_requisitions WHERE id = ?", [req.body.kitchenRequisitionId]);
        if (!requisition) {
          const error = new Error("Kitchen requisition not found.");
          error.status = 404;
          throw error;
        }

        if (requisition.status !== "Approved") {
          const error = new Error("Only approved kitchen requisitions can be issued.");
          error.status = 400;
          throw error;
        }

        const issueNumber = await getNextSequence({ ...db, get: tx.get.bind(tx) }, "storeIssuePrefix", "store_issues");
        const issuedStatus = await getStatus(tx, "store_issue", "issued", { fallbackName: "Issued" });
        const requisitionIssuedStatus = await getStatus(tx, "kitchen_requisition", "issued", { fallbackName: "Issued" });
        const headerResult = await tx.exec(
          `INSERT INTO store_issues
             (issue_number, kitchen_requisition_id, source_store_location_id, department_id, department_name, issue_date, status_id, status, issued_by, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING *`,
          [
            issueNumber,
            req.body.kitchenRequisitionId,
            requisition.source_store_location_id,
            requisition.department_id || null,
            requisition.department_name,
            req.body.issueDate,
            issuedStatus?.id || null,
            issuedStatus?.status_name || "Issued",
            req.session.user.id,
            req.body.notes || null,
          ]
        );

        for (const item of req.body.items || []) {
          const requisitionItem = await tx.get("SELECT * FROM kitchen_requisition_items WHERE id = ?", [item.kitchenRequisitionItemId]);
          await tx.exec(
            `INSERT INTO store_issue_items
               (store_issue_id, kitchen_requisition_item_id, product_id, approved_quantity, issued_quantity, unit_cost)
             VALUES (?, ?, ?, ?, ?, ?)
             RETURNING *`,
            [
              headerResult.rows[0].id,
              item.kitchenRequisitionItemId || null,
              item.productId,
              requisitionItem?.approved_quantity || 0,
              item.issuedQuantity || 0,
              item.unitCost || 0,
            ]
          );

          await issueStockFromInventory(tx, {
            productId: item.productId,
            storeLocationId: requisition.source_store_location_id,
            quantity: item.issuedQuantity || 0,
            referenceType: "StoreIssue",
            referenceId: headerResult.rows[0].id,
            movementDate: req.body.issueDate,
            notes: req.body.notes || null,
            createdBy: req.session.user.id,
          });

          if (item.kitchenRequisitionItemId) {
            await tx.exec(
              `UPDATE kitchen_requisition_items
               SET issued_quantity = ?, approved_quantity = COALESCE(approved_quantity, 0)
               WHERE id = ?`,
              [item.issuedQuantity || 0, item.kitchenRequisitionItemId]
            );
          }
        }

        await tx.exec(
          `UPDATE kitchen_requisitions
           SET status_id = ?, status = ?, updated_at = NOW()
           WHERE id = ?`,
          [requisitionIssuedStatus?.id || null, requisitionIssuedStatus?.status_name || "Issued", req.body.kitchenRequisitionId]
        );

        return headerResult.rows[0];
      });

      await logAudit(db, req.session.user.id, "issue", "store_issue", storeIssue.id, req.body);
      res.status(201).json({ success: true, data: storeIssue });
    } catch (error) {
      next(error);
    }
  });

  router.get("/store-issues/:id", async (req, res, next) => {
    try {
      const header = await db.get(
        `SELECT si.*, kr.requisition_number
         FROM store_issues si
         INNER JOIN kitchen_requisitions kr ON kr.id = si.kitchen_requisition_id
         WHERE si.id = ?`,
        [req.params.id]
      );
      if (!header) {
        res.status(404).json({ success: false, message: "Store issue not found" });
        return;
      }
      const items = await db.all(
        `SELECT sii.*, p.name AS product_name
         FROM store_issue_items sii
         INNER JOIN products p ON p.id = sii.product_id
         WHERE sii.store_issue_id = ?
         ORDER BY p.name`,
        [req.params.id]
      );
      res.json({ success: true, data: { header, items } });
    } catch (error) {
      next(error);
    }
  });

  router.get("/production-batches", async (req, res, next) => {
    try {
      const rows = await db.all(
        `SELECT pb.*, kr.requisition_number, u.full_name AS supervisor_name,
                COALESCE(COUNT(pbi.id), 0)::int AS item_count
         FROM production_batches pb
         INNER JOIN kitchen_requisitions kr ON kr.id = pb.kitchen_requisition_id
         LEFT JOIN users u ON u.id = pb.supervisor_id
         LEFT JOIN production_batch_items pbi ON pbi.production_batch_id = pb.id
         GROUP BY pb.id, kr.requisition_number, u.full_name
         ORDER BY pb.created_at DESC`
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.post("/production-batches", async (req, res, next) => {
    try {
      const batch = await db.transaction(async (tx) => {
        const batchNumber = await getNextSequence({ ...db, get: tx.get.bind(tx) }, "productionBatchPrefix", "production_batches");
        const requisition = await tx.get("SELECT department_id FROM kitchen_requisitions WHERE id = ?", [req.body.kitchenRequisitionId]);
        const deliveryType = await resolveDeliveryType(tx, req.body.deliveryTypeId, req.body.deliveryType || "Lunch");
        const draftStatus = await getStatus(tx, "production_batch", "draft", { fallbackName: "Draft" });
        const headerResult = await tx.exec(
          `INSERT INTO production_batches
             (batch_number, production_date, shift, department_id, delivery_type_id, supervisor_id, kitchen_requisition_id, store_issue_id, planned_output, actual_output, wastage_quantity, notes, status_id, status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)
           RETURNING *`,
          [
            batchNumber,
            req.body.productionDate,
            req.body.shift,
            req.body.departmentId || requisition?.department_id || null,
            deliveryType?.id || null,
            req.body.supervisorId || req.session.user.id,
            req.body.kitchenRequisitionId,
            req.body.storeIssueId || null,
            req.body.plannedOutput || 0,
            req.body.notes || null,
            draftStatus?.id || null,
            draftStatus?.status_name || "Draft",
            req.session.user.id,
          ]
        );

        for (const item of req.body.items || []) {
          await tx.exec(
            `INSERT INTO production_batch_items
               (production_batch_id, product_id, quantity_consumed)
             VALUES (?, ?, ?)`,
            [headerResult.rows[0].id, item.productId, item.quantityConsumed || 0]
          );
        }

        return headerResult.rows[0];
      });

      await logAudit(db, req.session.user.id, "create", "production_batch", batch.id, req.body);
      res.status(201).json({ success: true, data: batch });
    } catch (error) {
      next(error);
    }
  });

  router.post("/production-batches/:id/complete", async (req, res, next) => {
    try {
      const completedStatus = await getStatus(db, "production_batch", "completed", { fallbackName: "Completed" });
      const result = await db.exec(
        `UPDATE production_batches
         SET actual_output = ?, wastage_quantity = ?, status_id = ?, status = ?, completed_by = ?, updated_at = NOW()
         WHERE id = ?
         RETURNING *`,
        [
          req.body.actualOutput || 0,
          req.body.wastageQuantity || 0,
          completedStatus?.id || null,
          completedStatus?.status_name || "Completed",
          req.session.user.id,
          req.params.id,
        ]
      );
      await logAudit(db, req.session.user.id, "complete", "production_batch", Number(req.params.id), req.body);
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.get("/wastage", async (req, res, next) => {
    try {
      const rows = await db.all(
        `SELECT wr.*, p.name AS product_name
         FROM wastage_records wr
         INNER JOIN products p ON p.id = wr.product_id
         ORDER BY wr.record_date DESC, wr.id DESC`
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.post("/wastage", async (req, res, next) => {
    try {
      const product = await db.get("SELECT standard_cost FROM products WHERE id = ?", [req.body.productId]);
      const result = await db.exec(
        `INSERT INTO wastage_records
           (production_batch_id, store_issue_id, product_id, quantity, wastage_type, wastage_value, notes, recorded_by, record_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`,
        [
          req.body.productionBatchId || null,
          req.body.storeIssueId || null,
          req.body.productId,
          req.body.quantity || 0,
          req.body.wastageType || "Production",
          Number(req.body.quantity || 0) * Number(product?.standard_cost || 0),
          req.body.notes || null,
          req.session.user.id,
          req.body.recordDate,
        ]
      );
      await logAudit(db, req.session.user.id, "create", "wastage_record", result.rows[0].id, req.body);
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.post("/returns", async (req, res, next) => {
    try {
      const stockReturn = await db.transaction(async (tx) => {
        const returnNumber = await getNextSequence({ ...db, get: tx.get.bind(tx) }, "stockReturnPrefix", "stock_returns");
        const confirmedStatus = await getStatus(tx, "stock_return", "confirmed", { fallbackName: "Confirmed" });
        const closedStatus = await getStatus(tx, "kitchen_requisition", "closed", { fallbackName: "Closed" });
        const headerResult = await tx.exec(
          `INSERT INTO stock_returns
             (return_number, kitchen_requisition_id, store_issue_id, store_location_id, return_date, status_id, status, received_by, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING *`,
          [
            returnNumber,
            req.body.kitchenRequisitionId,
            req.body.storeIssueId,
            req.body.storeLocationId,
            req.body.returnDate,
            confirmedStatus?.id || null,
            confirmedStatus?.status_name || "Confirmed",
            req.session.user.id,
            req.body.notes || null,
          ]
        );

        for (const item of req.body.items || []) {
          await tx.exec(
            `INSERT INTO stock_return_items
               (stock_return_id, product_id, quantity_returned, unit_cost)
             VALUES (?, ?, ?, ?)`,
            [headerResult.rows[0].id, item.productId, item.quantityReturned || 0, item.unitCost || 0]
          );

          await returnStockToInventory(tx, {
            productId: item.productId,
            storeLocationId: req.body.storeLocationId,
            quantity: item.quantityReturned || 0,
            unitCost: item.unitCost || 0,
            batchNumber: `${headerResult.rows[0].return_number}-${item.productId}`,
            returnDate: req.body.returnDate,
            referenceType: "StockReturn",
            referenceId: headerResult.rows[0].id,
            notes: req.body.notes || null,
            createdBy: req.session.user.id,
          });
        }

        await tx.exec(
          `UPDATE kitchen_requisitions
           SET status_id = ?, status = ?, updated_at = NOW()
           WHERE id = ?`,
          [closedStatus?.id || null, closedStatus?.status_name || "Closed", req.body.kitchenRequisitionId]
        );

        return headerResult.rows[0];
      });

      await logAudit(db, req.session.user.id, "create", "stock_return", stockReturn.id, req.body);
      res.status(201).json({ success: true, data: stockReturn });
    } catch (error) {
      next(error);
    }
  });

  router.get("/returns", async (req, res, next) => {
    try {
      const rows = await db.all(
        `SELECT sr.*, kr.requisition_number, si.issue_number, sl.name AS store_name
         FROM stock_returns sr
         INNER JOIN kitchen_requisitions kr ON kr.id = sr.kitchen_requisition_id
         INNER JOIN store_issues si ON si.id = sr.store_issue_id
         INNER JOIN store_locations sl ON sl.id = sr.store_location_id
         ORDER BY sr.return_date DESC, sr.id DESC`
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.get("/production-batches/:id", async (req, res, next) => {
    try {
      const header = await db.get(
        `SELECT pb.*, kr.requisition_number, u.full_name AS supervisor_name
         FROM production_batches pb
         INNER JOIN kitchen_requisitions kr ON kr.id = pb.kitchen_requisition_id
         LEFT JOIN users u ON u.id = pb.supervisor_id
         WHERE pb.id = ?`,
        [req.params.id]
      );
      if (!header) {
        res.status(404).json({ success: false, message: "Production batch not found" });
        return;
      }
      const [items, wastage] = await Promise.all([
        db.all(
          `SELECT pbi.*, p.name AS product_name
           FROM production_batch_items pbi
           INNER JOIN products p ON p.id = pbi.product_id
           WHERE pbi.production_batch_id = ?
           ORDER BY p.name`,
          [req.params.id]
        ),
        db.all(
          `SELECT wr.*, p.name AS product_name
           FROM wastage_records wr
           INNER JOIN products p ON p.id = wr.product_id
           WHERE wr.production_batch_id = ?
           ORDER BY wr.record_date DESC, wr.id DESC`,
          [req.params.id]
        ),
      ]);
      res.json({ success: true, data: { header, items, wastage } });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createKitchenRoutes;
