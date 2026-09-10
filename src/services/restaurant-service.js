"use strict";

let schemaReadyPromise = null;

async function ensureRestaurantSchema(db) {
  if (schemaReadyPromise) {
    return schemaReadyPromise;
  }

  schemaReadyPromise = (async () => {
    await db.exec(`
      ALTER TABLE business_profile
      ADD COLUMN IF NOT EXISTS business_type VARCHAR(40) NOT NULL DEFAULT 'catering'
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        item_id INTEGER REFERENCES items(id) ON DELETE RESTRICT,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE RESTRICT,
        source_type VARCHAR(30) NOT NULL DEFAULT 'direct_item',
        menu_category VARCHAR(120),
        description TEXT,
        price NUMERIC(14,2) NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS restaurant_sales (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
        sale_date DATE NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'posted',
        payment_method VARCHAR(50),
        notes TEXT,
        total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS restaurant_sale_items (
        id SERIAL PRIMARY KEY,
        restaurant_sale_id INTEGER NOT NULL REFERENCES restaurant_sales(id) ON DELETE CASCADE,
        menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
        item_id INTEGER REFERENCES items(id) ON DELETE RESTRICT,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
        source_type VARCHAR(30) NOT NULL DEFAULT 'direct_item',
        description TEXT NOT NULL,
        quantity NUMERIC(14,2) NOT NULL,
        unit_price NUMERIC(14,2) NOT NULL,
        line_total NUMERIC(14,2) NOT NULL
      )
    `);

    await db.exec(`
      ALTER TABLE menu_items
      ADD COLUMN IF NOT EXISTS recipe_id INTEGER REFERENCES recipes(id) ON DELETE RESTRICT
    `);
    await db.exec(`
      ALTER TABLE menu_items
      ADD COLUMN IF NOT EXISTS source_type VARCHAR(30) NOT NULL DEFAULT 'direct_item'
    `);
    await db.exec(`
      ALTER TABLE menu_items
      ALTER COLUMN item_id DROP NOT NULL
    `);
    await db.exec(`
      UPDATE menu_items
      SET source_type = 'direct_item'
      WHERE source_type IS NULL OR TRIM(source_type) = ''
    `);

    await db.exec(`
      ALTER TABLE restaurant_sale_items
      ADD COLUMN IF NOT EXISTS recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL
    `);
    await db.exec(`
      ALTER TABLE restaurant_sale_items
      ADD COLUMN IF NOT EXISTS source_type VARCHAR(30) NOT NULL DEFAULT 'direct_item'
    `);
    await db.exec(`
      ALTER TABLE restaurant_sale_items
      ALTER COLUMN item_id DROP NOT NULL
    `);
    await db.exec(`
      UPDATE restaurant_sale_items
      SET source_type = 'direct_item'
      WHERE source_type IS NULL OR TRIM(source_type) = ''
    `);
  })().catch((error) => {
    schemaReadyPromise = null;
    throw error;
  });

  return schemaReadyPromise;
}

module.exports = {
  ensureRestaurantSchema,
};
