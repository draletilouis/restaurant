const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { recordStockMovement } = require("../services/stock-service");

function createProductionRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/recipes", async (req, res, next) => {
    try {
      const recipes = await db.all(
        `SELECT r.*, i.name AS output_item_name
         FROM recipes r
         LEFT JOIN items i ON i.id = r.output_item_id
         ORDER BY r.name`
      );
      res.json({ success: true, data: recipes });
    } catch (error) {
      next(error);
    }
  });

  router.get("/batches", async (req, res, next) => {
    try {
      const batches = await db.all(
        `SELECT pb.*, r.name AS recipe_name, k.name AS kitchen_name, s.name AS store_name
         FROM production_batches pb
         INNER JOIN recipes r ON r.id = pb.recipe_id
         LEFT JOIN kitchens k ON k.id = pb.kitchen_id
         INNER JOIN stores s ON s.id = pb.store_id
         ORDER BY pb.id DESC`
      );
      res.json({ success: true, data: batches });
    } catch (error) {
      next(error);
    }
  });

  router.post("/recipes", async (req, res, next) => {
    try {
      const { name, outputItemId, outputQuantity, instructions, items } = req.body;
      const recipe = await db.transaction(async (tx) => {
        const result = await tx.exec(
          `INSERT INTO recipes (name, output_item_id, output_quantity, instructions)
           VALUES (?, ?, ?, ?)
           RETURNING *`,
          [name, outputItemId || null, outputQuantity || 1, instructions || null]
        );
        const createdRecipe = result.rows[0];
        for (const item of items || []) {
          await tx.exec(
            `INSERT INTO recipe_items (recipe_id, item_id, quantity)
             VALUES (?, ?, ?)`,
            [createdRecipe.id, item.itemId, item.quantity]
          );
        }
        return createdRecipe;
      });
      await logAudit(db, req.session.user.id, "create", "recipe", recipe.id, req.body);
      res.status(201).json({ success: true, data: recipe });
    } catch (error) {
      next(error);
    }
  });

  router.post("/batches", async (req, res, next) => {
    try {
      const { recipeId, kitchenId, storeId, batchDate, outputQuantity, notes } = req.body;
      const batch = await db.transaction(async (tx) => {
        const result = await tx.exec(
          `INSERT INTO production_batches (
             recipe_id, kitchen_id, store_id, batch_date, output_quantity, notes, created_by
           ) VALUES (?, ?, ?, ?, ?, ?, ?)
           RETURNING *`,
          [recipeId, kitchenId || null, storeId, batchDate, outputQuantity, notes || null, req.session.user.id]
        );
        const createdBatch = result.rows[0];
        const recipeItems = await tx.all("SELECT * FROM recipe_items WHERE recipe_id = ?", [recipeId]);
        const recipe = await tx.get("SELECT * FROM recipes WHERE id = ?", [recipeId]);
        const scalingFactor = Number(outputQuantity) / Number(recipe.output_quantity || 1);

        for (const recipeItem of recipeItems) {
          const quantityConsumed = Number(recipeItem.quantity) * scalingFactor;
          await tx.exec(
            `INSERT INTO production_batch_items (production_batch_id, item_id, quantity_consumed)
             VALUES (?, ?, ?)`,
            [createdBatch.id, recipeItem.item_id, quantityConsumed]
          );
          await recordStockMovement(tx, {
            itemId: recipeItem.item_id,
            storeId,
            movementType: "production_consumption",
            referenceType: "production_batch",
            referenceId: createdBatch.id,
            quantityIn: 0,
            quantityOut: quantityConsumed,
            movementDate: batchDate,
            notes,
          });
        }

        if (recipe.output_item_id) {
          await recordStockMovement(tx, {
            itemId: recipe.output_item_id,
            storeId,
            movementType: "production_output",
            referenceType: "production_batch",
            referenceId: createdBatch.id,
            quantityIn: Number(outputQuantity),
            quantityOut: 0,
            movementDate: batchDate,
            notes,
          });
        }

        return createdBatch;
      });

      await logAudit(db, req.session.user.id, "create", "production_batch", batch.id, req.body);
      res.status(201).json({ success: true, data: batch });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createProductionRoutes;
