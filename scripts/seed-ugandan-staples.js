"use strict";
require("dotenv").config();
const Database = require("../src/database/database");

const STAPLES = [
  ["Rice", "LF-RICE-KG", "Raw Material", "Grains", "kg", 80, 120, 4200, false, "Bulk rice for office and event meals."],
  ["Posho", "LF-POSHO-KG", "Raw Material", "Grains", "kg", 60, 90, 2600, false, "Maize flour for posho / ugali."],
  ["Nambale beans", "LF-BEANS-KG", "Raw Material", "Grains", "kg", 40, 70, 5000, false, "Dry nambale beans for sauces and sides."],
  ["Cooking oil", "LF-OIL-LTR", "Raw Material", "Cooking Oil", "ltr", 20, 40, 8500, false, "Kitchen frying and cooking oil."],
  ["Matooke", "LF-MATOOKE-KG", "Raw Material", "Vegetables", "kg", 40, 60, 1800, true, "Green banana for steaming — core staple."],
  ["Beef", "LF-BEEF-KG", "Raw Material", "Meat", "kg", 20, 35, 16000, true, "Stewing beef for sauces and mains."],
  ["Chicken", "LF-CHICKEN-KG", "Raw Material", "Meat", "kg", 20, 35, 14000, true, "Dressed chicken for stews and grills."],
  ["Tomatoes", "LF-TOMATO-KG", "Raw Material", "Vegetables", "kg", 15, 25, 3500, true, "Sauce base and garnish."],
  ["Onions", "LF-ONION-KG", "Raw Material", "Vegetables", "kg", 15, 25, 2800, true, "Aromatic base for almost every dish."],
  ["Sugar", "LF-SUGAR-KG", "Raw Material", "Raw Materials", "kg", 15, 25, 5200, false, "Tea service and sweetening."],
];

(async () => {
  const db = new Database();
  try {
    const unitRows = await db.all("SELECT id, code FROM units_of_measure");
    const unitIdByCode = Object.fromEntries(unitRows.map((row) => [row.code, row.id]));
    const categoryRows = await db.all("SELECT id, name FROM product_categories");
    const categoryIdByName = Object.fromEntries(categoryRows.map((row) => [row.name, row.id]));

    for (const row of STAPLES) {
      const [name, sku, productType, categoryName, unitCode, minStock, reorder, cost, perishable, description] = row;
      if (!categoryIdByName[categoryName]) throw new Error("Missing category " + categoryName);
      if (!unitIdByCode[unitCode]) throw new Error("Missing unit " + unitCode);
      await db.exec(
        `INSERT INTO products
           (name, sku, product_type, product_category_id, unit_of_measure_id, minimum_stock_level,
            reorder_level, standard_cost, is_perishable, status, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
         ON CONFLICT (sku) DO NOTHING`,
        [name, sku, productType, categoryIdByName[categoryName], unitIdByCode[unitCode], minStock, reorder, cost, perishable, description]
      );
      console.log("upserted", sku);
    }

    const listed = await db.all(
      `SELECT p.sku, p.name, pc.name AS category, uom.code AS unit, p.standard_cost::float AS cost_ugx
       FROM products p
       LEFT JOIN product_categories pc ON pc.id = p.product_category_id
       LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
       WHERE p.sku LIKE 'LF-%'
       ORDER BY p.name`
    );
    await db.exec(
      `INSERT INTO maintenance_runs (operation_key, completed_at, metadata)
       VALUES (?, NOW(), ?::jsonb)
       ON CONFLICT (operation_key) DO NOTHING`,
      ["ugandan-catering-staples-v1", JSON.stringify({ source: "scripts/seed-ugandan-staples.js" })]
    );
    console.table(listed);
  } finally {
    await db.pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
