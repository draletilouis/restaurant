const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { ensureRestaurantSchema } = require("../services/restaurant-service");

async function getBusinessType(db) {
  await ensureRestaurantSchema(db);
  const row = await db.get(`SELECT business_type FROM business_profile ORDER BY id ASC LIMIT 1`);
  return String(row?.business_type || "catering").toLowerCase();
}

function createMenuRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      if ((await getBusinessType(db)) !== "restaurant") {
        res.json({ success: true, data: [] });
        return;
      }

      const menuItems = await db.all(
        `SELECT mi.*
         FROM menu_items mi
         ORDER BY mi.menu_category NULLS LAST, mi.name`
      );
      res.json({ success: true, data: menuItems });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      if ((await getBusinessType(db)) !== "restaurant") {
        res.status(400).json({ success: false, message: "Menu management is only available for restaurant businesses." });
        return;
      }

      const active = req.body.active !== false;
      const result = await db.exec(
        `INSERT INTO menu_items (name, item_id, recipe_id, source_type, menu_category, description, price, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`,
        [
          String(req.body.name || "").trim(),
          null,
          null,
          "menu",
          String(req.body.menuCategory || "").trim() || null,
          String(req.body.description || "").trim() || null,
          Number(req.body.price || 0),
          active !== false,
        ]
      );

      await logAudit(db, req.session.user.id, "create", "menu_item", result.rows[0].id, req.body);
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createMenuRoutes;
