const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { recordStockMovement } = require("../services/stock-service");

function createRequisitionsRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const requisitions = await db.all("SELECT * FROM requisitions ORDER BY id DESC");
      res.json({ success: true, data: requisitions });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const { sourceStoreId, destinationStoreId, kitchenId, requestDate, notes, items } = req.body;
      const requisition = await db.transaction(async (tx) => {
        const result = await tx.exec(
          `INSERT INTO requisitions (
             source_store_id, destination_store_id, kitchen_id, request_date,
             notes, requested_by
           ) VALUES (?, ?, ?, ?, ?, ?)
           RETURNING *`,
          [
            sourceStoreId,
            destinationStoreId || null,
            kitchenId || null,
            requestDate,
            notes || null,
            req.session.user.id,
          ]
        );
        const created = result.rows[0];
        for (const item of items || []) {
          await tx.exec(
            `INSERT INTO requisition_items (
               requisition_id, item_id, quantity_requested, quantity_issued
             ) VALUES (?, ?, ?, 0)`,
            [created.id, item.itemId, item.quantityRequested]
          );
        }
        return created;
      });
      await logAudit(db, req.session.user.id, "create", "requisition", requisition.id, req.body);
      res.status(201).json({ success: true, data: requisition });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/issue", async (req, res, next) => {
    try {
      const requisitionId = Number.parseInt(req.params.id, 10);
      const { issueDate, items } = req.body;

      await db.transaction(async (tx) => {
        const requisition = await tx.get("SELECT * FROM requisitions WHERE id = ?", [requisitionId]);
        if (!requisition) {
          const error = new Error("Requisition not found");
          error.status = 404;
          throw error;
        }

        for (const item of items || []) {
          await tx.exec(
            `UPDATE requisition_items
             SET quantity_issued = ?
             WHERE requisition_id = ? AND item_id = ?`,
            [item.quantityIssued, requisitionId, item.itemId]
          );

          await recordStockMovement(tx, {
            itemId: item.itemId,
            storeId: requisition.source_store_id,
            movementType: "requisition_issue",
            referenceType: "requisition",
            referenceId: requisitionId,
            quantityIn: 0,
            quantityOut: Number(item.quantityIssued),
            movementDate: issueDate,
            notes: requisition.notes,
          });

          if (requisition.destination_store_id) {
            await recordStockMovement(tx, {
              itemId: item.itemId,
              storeId: requisition.destination_store_id,
              movementType: "transfer_receipt",
              referenceType: "requisition",
              referenceId: requisitionId,
              quantityIn: Number(item.quantityIssued),
              quantityOut: 0,
              movementDate: issueDate,
              notes: requisition.notes,
            });
          }
        }

        await tx.exec(
          `UPDATE requisitions
           SET status = 'issued', approved_by = ?
           WHERE id = ?`,
          [req.session.user.id, requisitionId]
        );
      });

      await logAudit(db, req.session.user.id, "issue", "requisition", requisitionId, req.body);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createRequisitionsRoutes;
