const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { ensureRestaurantSchema } = require("../services/restaurant-service");
const { recordStockMovement } = require("../services/stock-service");

async function getBusinessType(db) {
  await ensureRestaurantSchema(db);
  const row = await db.get(`SELECT business_type FROM business_profile ORDER BY id ASC LIMIT 1`);
  return String(row?.business_type || "catering").toLowerCase();
}

function createRestaurantSalesRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      if ((await getBusinessType(db)) !== "restaurant") {
        res.json({ success: true, data: [] });
        return;
      }

      const sales = await db.all(
        `SELECT rs.*, s.name AS store_name, u.full_name AS created_by_name,
                COUNT(rsi.id) AS item_count
         FROM restaurant_sales rs
         INNER JOIN stores s ON s.id = rs.store_id
         LEFT JOIN users u ON u.id = rs.created_by
         LEFT JOIN restaurant_sale_items rsi ON rsi.restaurant_sale_id = rs.id
         GROUP BY rs.id, s.name, u.full_name
         ORDER BY rs.id DESC`
      );
      res.json({ success: true, data: sales });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      if ((await getBusinessType(db)) !== "restaurant") {
        res.status(400).json({ success: false, message: "Restaurant sales are only available for restaurant businesses." });
        return;
      }

      const items = Array.isArray(req.body.items) ? req.body.items : [];
      if (!items.length) {
        res.status(400).json({ success: false, message: "Add at least one line to the sale." });
        return;
      }

      const menuIds = items
        .filter((item) => String(item.lineType || "menu") === "menu")
        .map((item) => Number(item.menuItemId))
        .filter((value) => Number.isFinite(value) && value > 0);
      const stockItemIds = items
        .filter((item) => String(item.lineType || "") === "stock_item")
        .map((item) => Number(item.itemId))
        .filter((value) => Number.isFinite(value) && value > 0);
      const storeId = Number(req.body.storeId);
      const saleDate = req.body.saleDate;
      const paymentMethod = String(req.body.paymentMethod || "").trim() || null;
      const notes = String(req.body.notes || "").trim() || null;

      const sale = await db.transaction(async (tx) => {
        const menuRows = menuIds.length
          ? await tx.all(
            `SELECT mi.*
             FROM menu_items mi
             WHERE mi.id = ANY(?::int[])`,
            [menuIds]
          )
          : [];
        const stockRows = stockItemIds.length
          ? await tx.all(
            `SELECT i.*, c.name AS category_name
             FROM items i
             LEFT JOIN item_categories c ON c.id = i.category_id
             WHERE i.id = ANY(?::int[])`,
            [stockItemIds]
          )
          : [];

        const menuMap = new Map(menuRows.map((row) => [Number(row.id), row]));
        const stockMap = new Map(stockRows.map((row) => [Number(row.id), row]));
        const preparedLines = [];
        const requestedByItem = new Map();

        for (const inputItem of items) {
          const lineType = String(inputItem.lineType || "menu").toLowerCase();
          const quantity = Number(inputItem.quantity || 0);
          if (!(quantity > 0)) {
            throw new Error("All sale quantities must be greater than zero.");
          }

          if (lineType === "stock_item") {
            const stockRow = stockMap.get(Number(inputItem.itemId));
            if (!stockRow || stockRow.active === false) {
              throw new Error("One or more selected stock sale items are unavailable.");
            }

            preparedLines.push({
              lineType: "stock_item",
              menuItemId: null,
              itemId: Number(stockRow.id),
              description: stockRow.name,
              quantity,
              unitPrice: Number(stockRow.sales_price || 0),
              lineTotal: Number(stockRow.sales_price || 0) * quantity,
            });

            const existing = requestedByItem.get(Number(stockRow.id)) || {
              quantity: 0,
              itemName: stockRow.name,
              unitCost: Number(stockRow.standard_cost || 0),
            };
            requestedByItem.set(Number(stockRow.id), {
              quantity: Number(existing.quantity || 0) + quantity,
              itemName: existing.itemName,
              unitCost: existing.unitCost,
            });
            continue;
          }

          const menuRow = menuMap.get(Number(inputItem.menuItemId));
          if (!menuRow || menuRow.active === false) {
            throw new Error("One or more selected menu items are unavailable.");
          }

          preparedLines.push({
            lineType: "menu",
            menuItemId: Number(menuRow.id),
            itemId: null,
            description: menuRow.name,
            quantity,
            unitPrice: Number(menuRow.price || 0),
            lineTotal: Number(menuRow.price || 0) * quantity,
          });
        }

        for (const [itemId, requestSummary] of requestedByItem.entries()) {
          const balanceRow = await tx.get(
            `SELECT quantity
             FROM stock_balances
             WHERE item_id = ? AND store_id = ?`,
            [itemId, storeId]
          );
          const availableQuantity = Number(balanceRow?.quantity || 0);
          if (availableQuantity < Number(requestSummary.quantity || 0)) {
            throw new Error(
              `Insufficient stock for ${requestSummary.itemName || "a stock item"}. Available: ${availableQuantity}.`
            );
          }
        }

        const totalAmount = preparedLines.reduce((sum, line) => sum + line.lineTotal, 0);
        const insertedSale = await tx.exec(
          `INSERT INTO restaurant_sales (
             store_id, sale_date, status, payment_method, notes, total_amount, created_by
           ) VALUES (?, ?, 'posted', ?, ?, ?, ?)
           RETURNING *`,
          [storeId, saleDate, paymentMethod, notes, totalAmount, req.session.user.id]
        );
        const createdSale = insertedSale.rows[0];

        for (const line of preparedLines) {
          await tx.exec(
            `INSERT INTO restaurant_sale_items (
               restaurant_sale_id, menu_item_id, item_id, recipe_id, source_type, description, quantity, unit_price, line_total
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              createdSale.id,
              line.menuItemId,
              line.itemId,
              null,
              line.lineType,
              line.description,
              line.quantity,
              line.unitPrice,
              line.lineTotal,
            ]
          );
        }

        for (const [itemId, requestSummary] of requestedByItem.entries()) {
          await recordStockMovement(tx, {
            itemId,
            storeId,
            movementType: "restaurant_sale",
            referenceType: "restaurant_sale",
            referenceId: createdSale.id,
            quantityIn: 0,
            quantityOut: Number(requestSummary.quantity || 0),
            unitCost: Number(requestSummary.unitCost || 0),
            movementDate: saleDate,
            notes,
          });
        }

        return createdSale;
      });

      await logAudit(db, req.session.user.id, "create", "restaurant_sale", sale.id, req.body);
      res.status(201).json({ success: true, data: sale });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createRestaurantSalesRoutes;
