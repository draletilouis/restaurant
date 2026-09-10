const bcrypt = require("bcrypt");
const { generateNextNumber } = require("../services/numbering-series-service");

const DEMO_PASSWORD = "admin123";
const SEED_MARKER_CLIENT = "MTN Uganda";

function isoDate(daysFromToday = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

async function insert(db, sql, params = []) {
  const result = await db.exec(sql, params);
  return result.rows[0];
}

async function status(db, moduleKey, code, fallbackName) {
  return db.get(
    `SELECT id, status_name
     FROM statuses
     WHERE module_key = ?
       AND (status_code = ? OR LOWER(status_name) = LOWER(?))
     LIMIT 1`,
    [moduleKey, code, fallbackName || code]
  );
}

async function ensureUser(db, { fullName, username, email, roleCode }, passwordHash) {
  let user = await db.get("SELECT id FROM users WHERE username = ?", [username]);
  if (!user) {
    user = await insert(
      db,
      `INSERT INTO users (full_name, username, email, password_hash)
       VALUES (?, ?, ?, ?)
       RETURNING id`,
      [fullName, username, email, passwordHash]
    );
  }
  const role = await db.get("SELECT id FROM roles WHERE code = ?", [roleCode]);
  if (role) {
    await db.exec(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES (?, ?)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [user.id, role.id]
    );
  }
  return user;
}

async function applyReceipt(db, {
  productId,
  storeId,
  supplierId,
  grnId,
  batchNumber,
  expiryDate,
  quantity,
  unitCost,
  receivedAt,
  userId,
}) {
  const batch = await insert(
    db,
    `INSERT INTO stock_batches
       (product_id, store_location_id, supplier_id, goods_received_note_id, batch_number,
        expiry_date, quantity_received, quantity_remaining, unit_cost, received_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`,
    [
      productId,
      storeId,
      supplierId,
      grnId,
      batchNumber,
      expiryDate || null,
      quantity,
      quantity,
      unitCost,
      receivedAt,
    ]
  );

  const existing = await db.get(
    `SELECT * FROM inventory_balances WHERE product_id = ? AND store_location_id = ?`,
    [productId, storeId]
  );
  const nextQty = Number(existing?.quantity_on_hand || 0) + Number(quantity);
  const nextValue = Number(existing?.stock_value || 0) + Number(quantity) * Number(unitCost);

  if (existing) {
    await db.exec(
      `UPDATE inventory_balances
       SET quantity_on_hand = ?, stock_value = ?, updated_at = NOW()
       WHERE id = ?`,
      [nextQty, nextValue, existing.id]
    );
  } else {
    await db.exec(
      `INSERT INTO inventory_balances (product_id, store_location_id, quantity_on_hand, stock_value)
       VALUES (?, ?, ?, ?)`,
      [productId, storeId, nextQty, nextValue]
    );
  }

  await db.exec(
    `INSERT INTO stock_movements
       (product_id, store_location_id, stock_batch_id, movement_type, reference_type, reference_id,
        quantity_in, quantity_out, unit_cost, balance_after, movement_date, notes, created_by)
     VALUES (?, ?, ?, 'Goods Received', 'goods_received_note', ?, ?, 0, ?, ?, ?, ?, ?)`,
    [
      productId,
      storeId,
      batch.id,
      grnId,
      quantity,
      unitCost,
      nextQty,
      receivedAt,
      `Received batch ${batchNumber}`,
      userId,
    ]
  );

  return batch;
}

async function applyIssue(db, { productId, storeId, quantity, issueDate, issueId, userId, note }) {
  let remaining = Number(quantity);
  let lastCost = 0;
  const batches = await db.all(
    `SELECT * FROM stock_batches
     WHERE product_id = ?
       AND store_location_id = ?
       AND quantity_remaining > 0
     ORDER BY COALESCE(expiry_date, received_at), received_at, id`,
    [productId, storeId]
  );

  for (const batch of batches) {
    if (remaining <= 0) {
      break;
    }
    const take = Math.min(Number(batch.quantity_remaining), remaining);
    lastCost = Number(batch.unit_cost);
    await db.exec(
      `UPDATE stock_batches SET quantity_remaining = quantity_remaining - ? WHERE id = ?`,
      [take, batch.id]
    );

    const balance = await db.get(
      `SELECT * FROM inventory_balances WHERE product_id = ? AND store_location_id = ?`,
      [productId, storeId]
    );
    const nextQty = Math.max(Number(balance?.quantity_on_hand || 0) - take, 0);
    const nextValue = Math.max(Number(balance?.stock_value || 0) - take * lastCost, 0);
    if (balance) {
      await db.exec(
        `UPDATE inventory_balances
         SET quantity_on_hand = ?, stock_value = ?, updated_at = NOW()
         WHERE id = ?`,
        [nextQty, nextValue, balance.id]
      );
    }

    await db.exec(
      `INSERT INTO stock_movements
         (product_id, store_location_id, stock_batch_id, movement_type, reference_type, reference_id,
          quantity_in, quantity_out, unit_cost, balance_after, movement_date, notes, created_by)
       VALUES (?, ?, ?, 'Store Issue', 'store_issue', ?, 0, ?, ?, ?, ?, ?, ?)`,
      [productId, storeId, batch.id, issueId, take, lastCost, nextQty, issueDate, note || "Issued to kitchen", userId]
    );

    remaining -= take;
  }

  return lastCost;
}

async function applyReturn(db, { productId, storeId, quantity, unitCost, returnDate, returnId, userId }) {
  const newest = await db.get(
    `SELECT * FROM stock_batches
     WHERE product_id = ? AND store_location_id = ?
     ORDER BY received_at DESC, id DESC
     LIMIT 1`,
    [productId, storeId]
  );
  if (newest) {
    await db.exec(`UPDATE stock_batches SET quantity_remaining = quantity_remaining + ? WHERE id = ?`, [
      quantity,
      newest.id,
    ]);
  }

  const balance = await db.get(
    `SELECT * FROM inventory_balances WHERE product_id = ? AND store_location_id = ?`,
    [productId, storeId]
  );
  const nextQty = Number(balance?.quantity_on_hand || 0) + Number(quantity);
  const nextValue = Number(balance?.stock_value || 0) + Number(quantity) * Number(unitCost);
  if (balance) {
    await db.exec(
      `UPDATE inventory_balances
       SET quantity_on_hand = ?, stock_value = ?, updated_at = NOW()
       WHERE id = ?`,
      [nextQty, nextValue, balance.id]
    );
  }

  await db.exec(
    `INSERT INTO stock_movements
       (product_id, store_location_id, stock_batch_id, movement_type, reference_type, reference_id,
        quantity_in, quantity_out, unit_cost, balance_after, movement_date, notes, created_by)
     VALUES (?, ?, ?, 'Return to Store', 'stock_return', ?, ?, 0, ?, ?, ?, 'Unused stock returned from kitchen', ?)`,
    [productId, storeId, newest?.id || null, returnId, quantity, unitCost, nextQty, returnDate, userId]
  );
}

async function log(db, userId, action, entityType, entityId, details) {
  await db.exec(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, status, details)
     VALUES (?, ?, ?, ?, 'Success', ?::jsonb)`,
    [userId, action, entityType, entityId, JSON.stringify(details || {})]
  );
}

async function seedDemoData(db) {
  await db.exec(
    `UPDATE business_profile
     SET business_name = 'Kampala Kitchen Catering',
         business_phone = '+256 414 250180',
         business_location = 'Plot 18, 5th Street, Industrial Area, Kampala',
         owner_email = 'ops@kampalakitchen.ug',
         business_type = 'catering',
         updated_at = NOW()
     WHERE id = (SELECT id FROM business_profile ORDER BY id LIMIT 1)`
  );

  if (await db.get("SELECT id FROM clients WHERE name = ?", [SEED_MARKER_CLIENT])) {
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const admin = await db.get("SELECT id FROM users WHERE username = ?", ["admin"]);
  const [procurement, store, kitchen, finance, manager] = await Promise.all([
    ensureUser(
      db,
      {
        fullName: "Grace Namutebi",
        username: "grace.namutebi",
        email: "grace.namutebi@kampalakitchen.ug",
        roleCode: "procurement_officer",
      },
      passwordHash
    ),
    ensureUser(
      db,
      {
        fullName: "Moses Okello",
        username: "moses.okello",
        email: "moses.okello@kampalakitchen.ug",
        roleCode: "store_manager",
      },
      passwordHash
    ),
    ensureUser(
      db,
      {
        fullName: "Aisha Nakanjako",
        username: "aisha.nakanjako",
        email: "aisha.nakanjako@kampalakitchen.ug",
        roleCode: "kitchen_supervisor",
      },
      passwordHash
    ),
    ensureUser(
      db,
      {
        fullName: "Peter Ssemakula",
        username: "peter.ssemakula",
        email: "peter.ssemakula@kampalakitchen.ug",
        roleCode: "finance_officer",
      },
      passwordHash
    ),
    ensureUser(
      db,
      {
        fullName: "Diana Mukasa",
        username: "diana.mukasa",
        email: "diana.mukasa@kampalakitchen.ug",
        roleCode: "manager",
      },
      passwordHash
    ),
  ]);

  const [
    cashTerm,
    days14,
    days30,
    lunchType,
    breakfastType,
    kitchenDept,
    centralStore,
    coldStore,
    dryStore,
  ] = await Promise.all([
    db.get("SELECT id, name FROM payment_terms WHERE name = ?", ["Cash"]),
    db.get("SELECT id, name FROM payment_terms WHERE name = ?", ["14 days"]),
    db.get("SELECT id, name FROM payment_terms WHERE name = ?", ["30 days"]),
    db.get("SELECT id FROM delivery_types WHERE code = ?", ["lunch"]),
    db.get("SELECT id FROM delivery_types WHERE code = ?", ["breakfast"]),
    db.get("SELECT id, name FROM departments WHERE code = ?", ["kitchen"]),
    db.get("SELECT id FROM store_locations WHERE name = ?", ["Central Store"]),
    db.get("SELECT id FROM store_locations WHERE name = ?", ["Cold Store"]),
    db.get("SELECT id FROM store_locations WHERE name = ?", ["Dry Store"]),
  ]);

  const units = Object.fromEntries(
    (await db.all("SELECT id, code FROM units_of_measure")).map((row) => [row.code, row.id])
  );
  const categories = Object.fromEntries(
    (await db.all("SELECT id, name FROM product_categories")).map((row) => [row.name, row.id])
  );
  const statuses = {
    contractActive: await status(db, "contracts", "active", "Active"),
    contractDraft: await status(db, "contracts", "draft", "Draft"),
    contractSuspended: await status(db, "contracts", "suspended", "Suspended"),
    contractExpired: await status(db, "contracts", "expired", "Expired"),
    prDraft: await status(db, "purchase_requisition", "draft", "Draft"),
    prSubmitted: await status(db, "purchase_requisition", "submitted", "Submitted"),
    prApproved: await status(db, "purchase_requisition", "approved", "Approved"),
    prRejected: await status(db, "purchase_requisition", "rejected", "Rejected"),
    prConverted: await status(db, "purchase_requisition", "converted_to_po", "Converted to PO"),
    poDraft: await status(db, "purchase_order", "draft", "Draft"),
    poSent: await status(db, "purchase_order", "sent", "Sent"),
    poPartial: await status(db, "purchase_order", "partially_received", "Partially Received"),
    poFull: await status(db, "purchase_order", "fully_received", "Fully Received"),
    grnConfirmed: await status(db, "goods_received_note", "confirmed", "Confirmed"),
    invoiceOpen: await status(db, "supplier_invoice", "open", "Open"),
    invoiceClosed: await status(db, "supplier_invoice", "closed", "Closed"),
    pvPaid: await status(db, "payment_voucher", "paid", "Paid"),
    adjDraft: await status(db, "stock_adjustment", "draft", "Draft"),
    adjApproved: await status(db, "stock_adjustment", "approved", "Approved"),
    countDraft: await status(db, "physical_stock_count", "draft", "Draft"),
    countApproved: await status(db, "physical_stock_count", "approved", "Approved"),
    krDraft: await status(db, "kitchen_requisition", "draft", "Draft"),
    krSubmitted: await status(db, "kitchen_requisition", "submitted", "Submitted"),
    krApproved: await status(db, "kitchen_requisition", "approved", "Approved"),
    krRejected: await status(db, "kitchen_requisition", "rejected", "Rejected"),
    krIssued: await status(db, "kitchen_requisition", "issued", "Issued"),
    issueIssued: await status(db, "store_issue", "issued", "Issued"),
    batchCompleted: await status(db, "production_batch", "completed", "Completed"),
    batchDraft: await status(db, "production_batch", "draft", "Draft"),
    returnConfirmed: await status(db, "stock_return", "confirmed", "Confirmed"),
  };

  const supplierRows = [
    ["Nakasero Fresh Produce", "Hajji Musa Kasozi", "0772123456", "orders@nakaserofresh.ug", "Nakasero Market, Kampala", days14],
    ["Kalerwe Market Cooperative", "Sarah Nalwanga", "0754987123", "kalerwe.co@gmail.com", "Kalerwe Market, Kawempe", cashTerm],
    ["Uganda Meat Packers Ltd", "Joseph Otim", "0414345678", "sales@ump.co.ug", "Old Port Bell Road, Kampala", days30],
    ["Bidco Uganda Limited", "Rita Atim", "0312264000", "orders.ug@bidcoafrica.com", "Jinja Industrial Area", days30],
    ["Maganjo Grain Millers", "David Ssebunya", "0702558899", "sales@maganjo.co.ug", "Maganjo, Wakiso", days14],
    ["Fresh Dairy Corporation", "Lydia Achieng", "0392176400", "trade@freshdairy.ug", "Kampala Industrial Area", days14],
    ["Nice House of Plastics", "Brian Kato", "0414258339", "packs@nicehouse.ug", "Ntinda Industrial Area", days30],
    ["Mukwano Industries", "Evelyn Namutebi", "0414340000", "b2b@mukwano.com", "Mukwano Road, Kampala", days30],
    ["Owino Wholesale Traders", "Ali Semakula", "0782441100", "owino.wholesale@gmail.com", "St. Balikuddembe Market, Kampala", cashTerm],
  ];

  const suppliers = {};
  for (const [name, contact, phone, email, address, term] of supplierRows) {
    const row = await insert(
      db,
      `INSERT INTO suppliers (name, contact_person, phone, email, address, payment_terms, payment_term_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
       RETURNING *`,
      [name, contact, phone, email, address, term?.name || "14 days", term?.id || null]
    );
    suppliers[name] = row;
  }

  const productDefs = [
    ["Long Grain Rice", "KK-RICE-KG", "Raw Material", "Grains", "kg", 80, 120, 4200, false, "Maganjo Grain Millers"],
    ["White Posho (Maize Flour)", "KK-POSHO-KG", "Raw Material", "Grains", "kg", 60, 90, 2600, false, "Maganjo Grain Millers"],
    ["Dry Beans (Nambale)", "KK-BEANS-KG", "Raw Material", "Grains", "kg", 40, 70, 5000, false, "Owino Wholesale Traders"],
    ["Groundnuts", "KK-Gnuts-KG", "Raw Material", "Grains", "kg", 15, 25, 7800, false, "Owino Wholesale Traders"],
    ["Beef Stewing Cuts", "KK-BEEF-KG", "Raw Material", "Meat", "kg", 20, 35, 16000, true, "Uganda Meat Packers Ltd"],
    ["Chicken (Dressed)", "KK-CHICKEN-KG", "Raw Material", "Meat", "kg", 20, 35, 14000, true, "Uganda Meat Packers Ltd"],
    ["Fresh Nile Perch", "KK-FISH-KG", "Raw Material", "Meat", "kg", 8, 15, 18000, true, "Kalerwe Market Cooperative"],
    ["Tomatoes", "KK-TOMATO-KG", "Raw Material", "Vegetables", "kg", 15, 25, 3500, true, "Nakasero Fresh Produce"],
    ["Onions", "KK-ONION-KG", "Raw Material", "Vegetables", "kg", 15, 25, 2800, true, "Nakasero Fresh Produce"],
    ["Cabbage", "KK-CABBAGE-KG", "Raw Material", "Vegetables", "kg", 10, 18, 1500, true, "Kalerwe Market Cooperative"],
    ["Nakati", "KK-NAKATI-KG", "Raw Material", "Vegetables", "kg", 8, 12, 2200, true, "Nakasero Fresh Produce"],
    ["Carrots", "KK-CARROT-KG", "Raw Material", "Vegetables", "kg", 8, 12, 3000, true, "Nakasero Fresh Produce"],
    ["Cooking Oil", "KK-OIL-LTR", "Raw Material", "Cooking Oil", "ltr", 20, 40, 8500, false, "Bidco Uganda Limited"],
    ["Iodised Salt", "KK-SALT-KG", "Raw Material", "Raw Materials", "kg", 8, 12, 1800, false, "Mukwano Industries"],
    ["White Sugar", "KK-SUGAR-KG", "Raw Material", "Raw Materials", "kg", 15, 25, 5200, false, "Owino Wholesale Traders"],
    ["Fresh Milk", "KK-MILK-LTR", "Raw Material", "Beverages", "ltr", 20, 30, 2800, true, "Fresh Dairy Corporation"],
    ["Tea Leaves", "KK-TEA-KG", "Raw Material", "Beverages", "kg", 4, 8, 16000, false, "Owino Wholesale Traders"],
    ["Drinking Water", "KK-WATER-LTR", "Raw Material", "Beverages", "ltr", 80, 120, 800, false, "Mukwano Industries"],
    ["Lunch Pack Boxes", "KK-BOX-PCS", "Packaging", "Packaging", "pcs", 400, 800, 450, false, "Nice House of Plastics"],
    ["Disposable Plates", "KK-PLATE-PACK", "Packaging", "Packaging", "pack", 20, 40, 12000, false, "Nice House of Plastics"],
    ["Serviettes", "KK-SERVIETTE-PACK", "Packaging", "Packaging", "pack", 10, 20, 8500, false, "Nice House of Plastics"],
    ["Liquid Soap", "KK-SOAP-LTR", "Consumable", "Cleaning Supplies", "ltr", 8, 15, 4200, false, "Mukwano Industries"],
    ["Executive Lunch Pack", "KK-MEAL-EXEC", "Prepared Meal", "Prepared Meals", "meal", 0, 0, 12000, false, null],
    ["Staff Lunch Pack", "KK-MEAL-STAFF", "Prepared Meal", "Prepared Meals", "meal", 0, 0, 8000, false, null],
    ["Breakfast Pack", "KK-MEAL-BFST", "Prepared Meal", "Prepared Meals", "meal", 0, 0, 5500, false, null],
    ["Tea Break Snack Pack", "KK-MEAL-TEA", "Prepared Meal", "Prepared Meals", "meal", 0, 0, 3500, false, null],
  ];

  const products = {};
  for (const [name, sku, type, categoryName, unitCode, minStock, reorder, cost, perishable, supplierName] of productDefs) {
    const row = await insert(
      db,
      `INSERT INTO products
         (name, sku, product_type, product_category_id, unit_of_measure_id, minimum_stock_level,
          reorder_level, standard_cost, is_perishable, default_supplier_id, status, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
       RETURNING *`,
      [
        name,
        sku,
        type,
        categories[categoryName],
        units[unitCode],
        minStock,
        reorder,
        cost,
        perishable,
        supplierName ? suppliers[supplierName].id : null,
        `${name} for Kampala Kitchen Catering production.`,
      ]
    );
    products[sku] = row;
  }

  const weekday = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const clientDefs = [
    {
      name: SEED_MARKER_CLIENT,
      contact: "Rebecca Nambi",
      phone: "0312210100",
      email: "facilities@mtn.co.ug",
      address: "Plot 69-71 Jinja Road, Kampala",
      locations: [
        {
          name: "MTN Head Office",
          address: "Plot 69-71 Jinja Road",
          contact: "Rebecca Nambi",
          phone: "0772001100",
          notes: "Deliver lunch to staff restaurant by 12:00.",
          mealSku: "KK-MEAL-STAFF",
          qty: 180,
          price: 12000,
          cycle: "Monthly",
          term: days30,
          delivery: lunchType,
          status: statuses.contractActive,
          statusName: "Active",
          start: isoDate(-90),
          end: isoDate(275),
        },
        {
          name: "MTN Nakawa Switch",
          address: "Nakawa Business Park",
          contact: "Ivan Wamala",
          phone: "0772001188",
          notes: "Use the service yard entrance.",
          mealSku: "KK-MEAL-STAFF",
          qty: 60,
          price: 12000,
          cycle: "Monthly",
          term: days30,
          delivery: lunchType,
          status: statuses.contractActive,
          statusName: "Active",
          start: isoDate(-60),
          end: isoDate(300),
        },
      ],
    },
    {
      name: "Stanbic Bank Uganda",
      contact: "Patricia Aanyu",
      phone: "0414231818",
      email: "admin.support@stanbic.co.ug",
      address: "Crested Towers, Short Street, Kampala",
      locations: [
        {
          name: "Crested Towers Cafeteria",
          address: "Crested Towers, Short Street",
          contact: "Patricia Aanyu",
          phone: "0701552211",
          notes: "Breakfast 07:30, lunch 12:15. Use basement loading bay.",
          mealSku: "KK-MEAL-EXEC",
          qty: 150,
          price: 18500,
          cycle: "Monthly",
          term: days30,
          delivery: lunchType,
          status: statuses.contractActive,
          statusName: "Active",
          start: isoDate(-120),
          end: isoDate(240),
          extraItem: { sku: "KK-MEAL-BFST", qty: 80, price: 7500, unit: "Breakfast" },
        },
      ],
    },
    {
      name: "dfcu Bank",
      contact: "Samuel Kizito",
      phone: "0414351000",
      email: "workplace@dfcugroup.com",
      address: "Plot 26 Kyadondo Road, Nakasero",
      locations: [
        {
          name: "dfcu Impala House",
          address: "Impala House, Kimathi Avenue",
          contact: "Samuel Kizito",
          phone: "0782440099",
          notes: "Security clearance required for delivery crew.",
          mealSku: "KK-MEAL-EXEC",
          qty: 90,
          price: 17000,
          cycle: "Monthly",
          term: days30,
          delivery: lunchType,
          status: statuses.contractActive,
          statusName: "Active",
          start: isoDate(-45),
          end: isoDate(320),
        },
      ],
    },
    {
      name: "Uganda Revenue Authority",
      contact: "Joan Among",
      phone: "0417442000",
      email: "staff.welfare@ura.go.ug",
      address: "URA Tower, Nakawa",
      locations: [
        {
          name: "URA Tower Canteen",
          address: "Plot 21-29 Nakawa Industrial Area",
          contact: "Joan Among",
          phone: "0752664410",
          notes: "Largest daily drop. Two serving lines.",
          mealSku: "KK-MEAL-STAFF",
          qty: 220,
          price: 11000,
          cycle: "Monthly",
          term: days30,
          delivery: lunchType,
          status: statuses.contractActive,
          statusName: "Active",
          start: isoDate(-200),
          end: isoDate(165),
        },
      ],
    },
    {
      name: "National Social Security Fund",
      contact: "Henry Lubega",
      phone: "0414258449",
      email: "facilities@nssfug.org",
      address: "Workers House, Pilkington Road",
      locations: [
        {
          name: "Workers House",
          address: "Plot 1 Pilkington Road",
          contact: "Henry Lubega",
          phone: "0703882211",
          notes: "Deliver to 3rd floor pantry.",
          mealSku: "KK-MEAL-STAFF",
          qty: 100,
          price: 12500,
          cycle: "Monthly",
          term: days30,
          delivery: lunchType,
          status: statuses.contractActive,
          statusName: "Active",
          start: isoDate(-30),
          end: isoDate(335),
        },
      ],
    },
    {
      name: "Ministry of Health",
      contact: "Dr. Alice Nabwire",
      phone: "0414340500",
      email: "admin@health.go.ug",
      address: "Plot 6 Lourdel Road, Wandegeya",
      locations: [
        {
          name: "MOH Headquarters",
          address: "Plot 6 Lourdel Road",
          contact: "Dr. Alice Nabwire",
          phone: "0772550091",
          notes: "Suspended pending budget confirmation.",
          mealSku: "KK-MEAL-STAFF",
          qty: 70,
          price: 10000,
          cycle: "Monthly",
          term: days30,
          delivery: lunchType,
          status: statuses.contractSuspended,
          statusName: "Suspended",
          start: isoDate(-80),
          end: isoDate(100),
        },
      ],
    },
    {
      name: "Centenary Bank",
      contact: "Mark Ssonko",
      phone: "0414339600",
      email: "admin@centenarybank.co.ug",
      address: "Mapeera House, Kampala Road",
      locations: [
        {
          name: "Mapeera House",
          address: "Plot 44-46 Kampala Road",
          contact: "Mark Ssonko",
          phone: "0701993344",
          notes: "Draft awaiting signed service level agreement.",
          mealSku: "KK-MEAL-EXEC",
          qty: 85,
          price: 16000,
          cycle: "Monthly",
          term: days30,
          delivery: lunchType,
          status: statuses.contractDraft,
          statusName: "Draft",
          start: isoDate(10),
          end: isoDate(375),
        },
      ],
    },
    {
      name: "Pride Microfinance",
      contact: "Cissy Namatovu",
      phone: "0414341700",
      email: "ops@pridemicrofinance.co.ug",
      address: "Pride House, Lumumba Avenue",
      locations: [
        {
          name: "Pride House",
          address: "Plot 30 Lumumba Avenue",
          contact: "Cissy Namatovu",
          phone: "0782114455",
          notes: "Contract ended last month.",
          mealSku: "KK-MEAL-STAFF",
          qty: 55,
          price: 10500,
          cycle: "Monthly",
          term: days14,
          delivery: lunchType,
          status: statuses.contractExpired,
          statusName: "Expired",
          start: isoDate(-400),
          end: isoDate(-20),
        },
      ],
    },
  ];

  const contracts = [];
  for (const clientDef of clientDefs) {
    const client = await insert(
      db,
      `INSERT INTO clients (name, contact_person, phone, email, address, status_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Active')
       RETURNING *`,
      [
        clientDef.name,
        clientDef.contact,
        clientDef.phone,
        clientDef.email,
        clientDef.address,
        statuses.contractActive?.id || null,
      ]
    );

    for (const locationDef of clientDef.locations) {
      const location = await insert(
        db,
        `INSERT INTO client_locations (client_id, name, address, contact_person, phone, delivery_notes)
         VALUES (?, ?, ?, ?, ?, ?)
         RETURNING *`,
        [client.id, locationDef.name, locationDef.address, locationDef.contact, locationDef.phone, locationDef.notes]
      );
      const contractNumber = await generateNextNumber(db, "contract");
      const contract = await insert(
        db,
        `INSERT INTO contracts
           (client_id, client_location_id, contract_number, start_date, end_date, billing_cycle,
            payment_terms, payment_term_id, delivery_type_id, price_per_unit, expected_daily_quantity,
            delivery_days, status_id, status, notes, created_by, approved_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`,
        [
          client.id,
          location.id,
          contractNumber,
          locationDef.start,
          locationDef.end,
          locationDef.cycle,
          locationDef.term?.name || "30 days",
          locationDef.term?.id || null,
          locationDef.delivery?.id || lunchType?.id || null,
          locationDef.price,
          locationDef.qty,
          weekday,
          locationDef.status?.id || null,
          locationDef.statusName,
          locationDef.notes,
          manager.id,
          locationDef.statusName === "Active" ? manager.id : null,
        ]
      );
      await db.exec(`INSERT INTO contract_schedules (contract_id, schedule_type, quantity, delivery_time) VALUES (?, 'Daily', ?, '12:15')`, [
        contract.id,
        locationDef.qty,
      ]);
      await db.exec(
        `INSERT INTO contract_items (contract_id, product_id, service_unit, quantity_per_delivery, unit_price, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [contract.id, products[locationDef.mealSku].id, "Meal", locationDef.qty, locationDef.price, "Weekday office meal"]
      );
      if (locationDef.extraItem) {
        await db.exec(
          `INSERT INTO contract_items (contract_id, product_id, service_unit, quantity_per_delivery, unit_price, notes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            contract.id,
            products[locationDef.extraItem.sku].id,
            locationDef.extraItem.unit,
            locationDef.extraItem.qty,
            locationDef.extraItem.price,
            "Weekday breakfast service",
          ]
        );
      }
      contracts.push(contract);
      await log(db, manager.id, locationDef.statusName === "Active" ? "activate" : "create", "contract", contract.id, {
        contractNumber,
        client: clientDef.name,
      });
    }
  }

  const rawProducts = [
    "KK-RICE-KG",
    "KK-POSHO-KG",
    "KK-BEANS-KG",
    "KK-BEEF-KG",
    "KK-CHICKEN-KG",
    "KK-TOMATO-KG",
    "KK-ONION-KG",
    "KK-OIL-LTR",
    "KK-BOX-PCS",
    "KK-MILK-LTR",
  ].map((sku) => products[sku]);

  async function createRequisition({ date, type, statusRow, requestedBy, approvedBy, rejectedBy, notes, items }) {
    const requisition = await insert(
      db,
      `INSERT INTO purchase_requisitions
         (requisition_number, request_date, purchase_type, status_id, status,
          requested_by, approved_by, rejected_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        await generateNextNumber(db, "purchase_requisition"),
        date,
        type,
        statusRow?.id || null,
        statusRow?.status_name || "Draft",
        requestedBy,
        approvedBy || null,
        rejectedBy || null,
        notes,
      ]
    );
    const lineIds = [];
    for (const item of items) {
      const line = await insert(
        db,
        `INSERT INTO purchase_requisition_items
           (purchase_requisition_id, product_id, quantity_requested, quantity_approved, estimated_unit_cost, preferred_supplier_id)
         VALUES (?, ?, ?, ?, ?, ?)
         RETURNING *`,
        [
          requisition.id,
          item.product.id,
          item.requested,
          item.approved ?? item.requested,
          item.cost,
          item.supplier.id,
        ]
      );
      lineIds.push(line);
    }
    return { requisition, items: lineIds };
  }

  const lastWeekReq = await createRequisition({
    date: isoDate(-11),
    type: "Weekly",
    statusRow: statuses.prConverted,
    requestedBy: procurement.id,
    approvedBy: manager.id,
    notes: "Weekly dry goods and proteins for Industrial Area kitchen.",
    items: [
      { product: products["KK-RICE-KG"], requested: 420, cost: 4200, supplier: suppliers["Maganjo Grain Millers"] },
      { product: products["KK-POSHO-KG"], requested: 320, cost: 2600, supplier: suppliers["Maganjo Grain Millers"] },
      { product: products["KK-BEANS-KG"], requested: 220, cost: 5000, supplier: suppliers["Owino Wholesale Traders"] },
      { product: products["KK-OIL-LTR"], requested: 80, cost: 8500, supplier: suppliers["Bidco Uganda Limited"] },
      { product: products["KK-BOX-PCS"], requested: 3500, cost: 450, supplier: suppliers["Nice House of Plastics"] },
      { product: products["KK-SALT-KG"], requested: 40, cost: 1800, supplier: suppliers["Mukwano Industries"] },
      { product: products["KK-SUGAR-KG"], requested: 80, cost: 5200, supplier: suppliers["Owino Wholesale Traders"] },
    ],
  });

  const meatReq = await createRequisition({
    date: isoDate(-6),
    type: "Weekly",
    statusRow: statuses.prConverted,
    requestedBy: procurement.id,
    approvedBy: manager.id,
    notes: "Cold-store proteins for the week.",
    items: [
      { product: products["KK-BEEF-KG"], requested: 160, cost: 16000, supplier: suppliers["Uganda Meat Packers Ltd"] },
      { product: products["KK-CHICKEN-KG"], requested: 150, cost: 14000, supplier: suppliers["Uganda Meat Packers Ltd"] },
      { product: products["KK-FISH-KG"], requested: 40, cost: 18000, supplier: suppliers["Kalerwe Market Cooperative"] },
    ],
  });

  const produceReq = await createRequisition({
    date: isoDate(-4),
    type: "Daily",
    statusRow: statuses.prConverted,
    requestedBy: procurement.id,
    approvedBy: manager.id,
    notes: "Nakasero market run for perishable vegetables and milk.",
    items: [
      { product: products["KK-TOMATO-KG"], requested: 80, cost: 3500, supplier: suppliers["Nakasero Fresh Produce"] },
      { product: products["KK-ONION-KG"], requested: 60, cost: 2800, supplier: suppliers["Nakasero Fresh Produce"] },
      { product: products["KK-CABBAGE-KG"], requested: 40, cost: 1500, supplier: suppliers["Kalerwe Market Cooperative"] },
      { product: products["KK-NAKATI-KG"], requested: 25, cost: 2200, supplier: suppliers["Nakasero Fresh Produce"] },
      { product: products["KK-CARROT-KG"], requested: 20, cost: 3000, supplier: suppliers["Nakasero Fresh Produce"] },
      { product: products["KK-MILK-LTR"], requested: 80, cost: 2800, supplier: suppliers["Fresh Dairy Corporation"] },
    ],
  });

  const pendingReq = await createRequisition({
    date: isoDate(0),
    type: "Weekly",
    statusRow: statuses.prSubmitted,
    requestedBy: procurement.id,
    notes: "Next weekly top-up waiting for Diana's approval.",
    items: [
      { product: products["KK-RICE-KG"], requested: 200, approved: 0, cost: 4200, supplier: suppliers["Maganjo Grain Millers"] },
      { product: products["KK-OIL-LTR"], requested: 60, approved: 0, cost: 8500, supplier: suppliers["Bidco Uganda Limited"] },
      { product: products["KK-TOMATO-KG"], requested: 50, approved: 0, cost: 3800, supplier: suppliers["Nakasero Fresh Produce"] },
    ],
  });

  await createRequisition({
    date: isoDate(-1),
    type: "Daily",
    statusRow: statuses.prDraft,
    requestedBy: procurement.id,
    notes: "Monday morning market list still being priced.",
    items: [
      { product: products["KK-TOMATO-KG"], requested: 30, approved: 0, cost: 3600, supplier: suppliers["Nakasero Fresh Produce"] },
      { product: products["KK-CHICKEN-KG"], requested: 40, approved: 0, cost: 14000, supplier: suppliers["Uganda Meat Packers Ltd"] },
    ],
  });

  await createRequisition({
    date: isoDate(-8),
    type: "Weekly",
    statusRow: statuses.prRejected,
    requestedBy: procurement.id,
    rejectedBy: manager.id,
    notes: "Rejected reason: Quantities look like a double order against last week's GRN.",
    items: [
      { product: products["KK-RICE-KG"], requested: 800, approved: 0, cost: 4200, supplier: suppliers["Maganjo Grain Millers"] },
    ],
  });

  async function createOrder({ requisition, supplier, date, expected, type, statusRow, items, notes }) {
    const order = await insert(
      db,
      `INSERT INTO purchase_orders
         (order_number, purchase_requisition_id, supplier_id, order_date, purchase_type,
          expected_delivery_date, payment_term_id, status_id, status, created_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        await generateNextNumber(db, "purchase_order"),
        requisition?.id || null,
        supplier.id,
        date,
        type,
        expected,
        supplier.payment_term_id,
        statusRow?.id || null,
        statusRow?.status_name || "Draft",
        procurement.id,
        notes,
      ]
    );
    for (const item of items) {
      await db.exec(
        `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity_ordered, unit_cost, line_total)
         VALUES (?, ?, ?, ?, ?)`,
        [order.id, item.product.id, item.qty, item.cost, item.qty * item.cost]
      );
    }
    return order;
  }

  const grainOrder = await createOrder({
    requisition: lastWeekReq.requisition,
    supplier: suppliers["Maganjo Grain Millers"],
    date: isoDate(-10),
    expected: isoDate(-8),
    type: "Weekly",
    statusRow: statuses.poFull,
    notes: "Rice and posho for two production weeks.",
    items: [
      { product: products["KK-RICE-KG"], qty: 420, cost: 4200 },
      { product: products["KK-POSHO-KG"], qty: 320, cost: 2600 },
    ],
  });
  const dryOrder = await createOrder({
    requisition: lastWeekReq.requisition,
    supplier: suppliers["Owino Wholesale Traders"],
    date: isoDate(-10),
    expected: isoDate(-8),
    type: "Weekly",
    statusRow: statuses.poFull,
    notes: "Beans, sugar and groundnuts from Owino.",
    items: [
      { product: products["KK-BEANS-KG"], qty: 220, cost: 5000 },
      { product: products["KK-SUGAR-KG"], qty: 80, cost: 5200 },
      { product: products["KK-Gnuts-KG"], qty: 40, cost: 7800 },
    ],
  });
  const oilOrder = await createOrder({
    requisition: lastWeekReq.requisition,
    supplier: suppliers["Bidco Uganda Limited"],
    date: isoDate(-10),
    expected: isoDate(-8),
    type: "Weekly",
    statusRow: statuses.poFull,
    notes: "Elianto cooking oil drums. Keep this lean so the store shows a low-stock alert.",
    items: [{ product: products["KK-OIL-LTR"], qty: 40, cost: 8500 }],
  });
  const packOrder = await createOrder({
    requisition: lastWeekReq.requisition,
    supplier: suppliers["Nice House of Plastics"],
    date: isoDate(-9),
    expected: isoDate(1),
    type: "Weekly",
    statusRow: statuses.poSent,
    notes: "Lunch boxes still on the Ntinda production queue.",
    items: [
      { product: products["KK-BOX-PCS"], qty: 3500, cost: 450 },
      { product: products["KK-PLATE-PACK"], qty: 40, cost: 12000 },
      { product: products["KK-SERVIETTE-PACK"], qty: 20, cost: 8500 },
    ],
  });
  const meatOrder = await createOrder({
    requisition: meatReq.requisition,
    supplier: suppliers["Uganda Meat Packers Ltd"],
    date: isoDate(-6),
    expected: isoDate(-5),
    type: "Weekly",
    statusRow: statuses.poFull,
    notes: "Cold-chain delivery into the industrial area cold store.",
    items: [
      { product: products["KK-BEEF-KG"], qty: 160, cost: 16000 },
      { product: products["KK-CHICKEN-KG"], qty: 150, cost: 14000 },
    ],
  });
  const produceOrder = await createOrder({
    requisition: produceReq.requisition,
    supplier: suppliers["Nakasero Fresh Produce"],
    date: isoDate(-4),
    expected: isoDate(-3),
    type: "Daily",
    statusRow: statuses.poFull,
    notes: "Early market collection with Fresh Dairy milk on the same run.",
    items: [
      { product: products["KK-TOMATO-KG"], qty: 80, cost: 3500 },
      { product: products["KK-ONION-KG"], qty: 60, cost: 2800 },
      { product: products["KK-NAKATI-KG"], qty: 25, cost: 2200 },
      { product: products["KK-CARROT-KG"], qty: 20, cost: 3000 },
      { product: products["KK-MILK-LTR"], qty: 80, cost: 2800 },
    ],
  });
  const kalerweOrder = await createOrder({
    requisition: produceReq.requisition,
    supplier: suppliers["Kalerwe Market Cooperative"],
    date: isoDate(-4),
    expected: isoDate(-3),
    type: "Daily",
    statusRow: statuses.poPartial,
    notes: "Cabbage received. Fish delayed by the lake landing.",
    items: [
      { product: products["KK-CABBAGE-KG"], qty: 40, cost: 1500 },
      { product: products["KK-FISH-KG"], qty: 40, cost: 18000 },
    ],
  });
  await createOrder({
    supplier: suppliers["Mukwano Industries"],
    date: isoDate(0),
    expected: isoDate(3),
    type: "Weekly",
    statusRow: statuses.poDraft,
    notes: "Soap and water top-up not yet sent to the supplier.",
    items: [
      { product: products["KK-SOAP-LTR"], qty: 30, cost: 4200 },
      { product: products["KK-WATER-LTR"], qty: 200, cost: 800 },
      { product: products["KK-SALT-KG"], qty: 20, cost: 1800 },
    ],
  });

  async function receiveOrder({ order, supplier, storeLocation, date, items }) {
    const grn = await insert(
      db,
      `INSERT INTO goods_received_notes
         (grn_number, purchase_order_id, supplier_id, store_location_id, receipt_date,
          status_id, status, received_by, confirmed_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        await generateNextNumber(db, "goods_received_note"),
        order.id,
        supplier.id,
        storeLocation.id,
        date,
        statuses.grnConfirmed?.id || null,
        statuses.grnConfirmed?.status_name || "Confirmed",
        store.id,
        store.id,
        `Confirmed receipt for ${order.order_number}`,
      ]
    );

    for (const item of items) {
      await db.exec(
        `INSERT INTO goods_received_note_items
           (goods_received_note_id, product_id, quantity_received, unit_cost, line_total, batch_number, expiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          grn.id,
          item.product.id,
          item.qty,
          item.cost,
          item.qty * item.cost,
          item.batch,
          item.expiry || null,
        ]
      );
      await applyReceipt(db, {
        productId: item.product.id,
        storeId: storeLocation.id,
        supplierId: supplier.id,
        grnId: grn.id,
        batchNumber: item.batch,
        expiryDate: item.expiry,
        quantity: item.qty,
        unitCost: item.cost,
        receivedAt: date,
        userId: store.id,
      });
    }
    await log(db, store.id, "receive", "goods_received_note", grn.id, { order: order.order_number });
    return grn;
  }

  const grainGrn = await receiveOrder({
    order: grainOrder,
    supplier: suppliers["Maganjo Grain Millers"],
    storeLocation: dryStore,
    date: isoDate(-8),
    items: [
      { product: products["KK-RICE-KG"], qty: 420, cost: 4200, batch: "MAG-RICE-0828", expiry: isoDate(180) },
      { product: products["KK-POSHO-KG"], qty: 320, cost: 2600, batch: "MAG-POSHO-0828", expiry: isoDate(150) },
    ],
  });
  const dryGrn = await receiveOrder({
    order: dryOrder,
    supplier: suppliers["Owino Wholesale Traders"],
    storeLocation: dryStore,
    date: isoDate(-8),
    items: [
      { product: products["KK-BEANS-KG"], qty: 220, cost: 5000, batch: "OWINO-BEANS-0828", expiry: isoDate(210) },
      { product: products["KK-SUGAR-KG"], qty: 80, cost: 5200, batch: "OWINO-SUGAR-0828", expiry: isoDate(240) },
      { product: products["KK-Gnuts-KG"], qty: 40, cost: 7800, batch: "OWINO-GNUT-0828", expiry: isoDate(120) },
    ],
  });
  const oilGrn = await receiveOrder({
    order: oilOrder,
    supplier: suppliers["Bidco Uganda Limited"],
    storeLocation: centralStore,
    date: isoDate(-8),
    items: [{ product: products["KK-OIL-LTR"], qty: 40, cost: 8500, batch: "BIDCO-OIL-0828", expiry: isoDate(300) }],
  });
  const meatGrn = await receiveOrder({
    order: meatOrder,
    supplier: suppliers["Uganda Meat Packers Ltd"],
    storeLocation: coldStore,
    date: isoDate(-5),
    items: [
      { product: products["KK-BEEF-KG"], qty: 160, cost: 16000, batch: "UMP-BEEF-0831", expiry: isoDate(6) },
      { product: products["KK-CHICKEN-KG"], qty: 150, cost: 14000, batch: "UMP-CHK-0831", expiry: isoDate(5) },
    ],
  });
  const produceGrn = await receiveOrder({
    order: produceOrder,
    supplier: suppliers["Nakasero Fresh Produce"],
    storeLocation: centralStore,
    date: isoDate(-3),
    items: [
      { product: products["KK-TOMATO-KG"], qty: 80, cost: 3500, batch: "NAK-TOM-0902", expiry: isoDate(2) },
      { product: products["KK-ONION-KG"], qty: 60, cost: 2800, batch: "NAK-ONI-0902", expiry: isoDate(12) },
      { product: products["KK-NAKATI-KG"], qty: 25, cost: 2200, batch: "NAK-NKT-0902", expiry: isoDate(3) },
      { product: products["KK-CARROT-KG"], qty: 20, cost: 3000, batch: "NAK-CAR-0902", expiry: isoDate(8) },
      { product: products["KK-MILK-LTR"], qty: 80, cost: 2800, batch: "FDC-MILK-0902", expiry: isoDate(2) },
    ],
  });
  const kalerweGrn = await receiveOrder({
    order: kalerweOrder,
    supplier: suppliers["Kalerwe Market Cooperative"],
    storeLocation: centralStore,
    date: isoDate(-3),
    items: [{ product: products["KK-CABBAGE-KG"], qty: 40, cost: 1500, batch: "KAL-CAB-0902", expiry: isoDate(7) }],
  });

  async function createInvoice({ supplier, order, grn, date, due, total, paid, invStatus, number }) {
    return insert(
      db,
      `INSERT INTO supplier_invoices
         (invoice_number, supplier_id, purchase_order_id, goods_received_note_id, invoice_date, due_date,
          payment_term_id, total_amount, amount_paid, payment_status_id, payment_status, status_id, status, created_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        number,
        supplier.id,
        order.id,
        grn.id,
        date,
        due,
        supplier.payment_term_id,
        total,
        paid,
        null,
        paid >= total ? "Paid" : paid > 0 ? "Partially Paid" : "Pending",
        invStatus?.id || null,
        invStatus?.status_name || "Open",
        finance.id,
        `Supplier bill for ${order.order_number}`,
      ]
    );
  }

  const grainInvoiceTotal = 420 * 4200 + 320 * 2600;
  const grainInvoice = await createInvoice({
    supplier: suppliers["Maganjo Grain Millers"],
    order: grainOrder,
    grn: grainGrn,
    date: isoDate(-7),
    due: isoDate(7),
    total: grainInvoiceTotal,
    paid: grainInvoiceTotal,
    invStatus: statuses.invoiceClosed,
    number: "MAG-INV-8821",
  });
  async function createPaidPaymentVoucher({ supplier, invoice, order, date, amount, method, reference, notes }) {
    const voucherNumber = await generateNextNumber(db, "payment_voucher", date);
    return insert(
      db,
      `INSERT INTO payment_vouchers
         (voucher_number, supplier_id, supplier_invoice_id, purchase_order_id, amount, payment_date,
          payment_method, reference_number, status_id, status, prepared_by, approved_by, paid_by,
          approved_at, paid_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        voucherNumber,
        supplier.id,
        invoice.id,
        order.id,
        amount,
        date,
        method,
        reference,
        statuses.pvPaid?.id || null,
        statuses.pvPaid?.status_name || "Paid",
        finance.id,
        finance.id,
        finance.id,
        date,
        date,
        notes,
      ]
    );
  }

  await createPaidPaymentVoucher({
    supplier: suppliers["Maganjo Grain Millers"],
    invoice: grainInvoice,
    order: grainOrder,
    date: isoDate(-2),
    amount: grainInvoiceTotal,
    method: "Bank Transfer",
    reference: "STANBIC-EFT-44120",
    notes: "Settled in full from the operations account.",
  });

  const meatInvoiceTotal = 160 * 16000 + 150 * 14000;
  const meatInvoice = await createInvoice({
    supplier: suppliers["Uganda Meat Packers Ltd"],
    order: meatOrder,
    grn: meatGrn,
    date: isoDate(-4),
    due: isoDate(26),
    total: meatInvoiceTotal,
    paid: 2000000,
    invStatus: statuses.invoiceOpen,
    number: "UMP-INV-3104",
  });
  await createPaidPaymentVoucher({
    supplier: suppliers["Uganda Meat Packers Ltd"],
    invoice: meatInvoice,
    order: meatOrder,
    date: isoDate(-1),
    amount: 2000000,
    method: "Cheque",
    reference: "CHQ-NSSF-1044",
    notes: "Part payment against August meat deliveries.",
  });

  const produceInvoiceTotal = 80 * 3500 + 60 * 2800 + 25 * 2200 + 20 * 3000 + 80 * 2800;
  await createInvoice({
    supplier: suppliers["Nakasero Fresh Produce"],
    order: produceOrder,
    grn: produceGrn,
    date: isoDate(-2),
    due: isoDate(12),
    total: produceInvoiceTotal,
    paid: 0,
    invStatus: statuses.invoiceOpen,
    number: "NAK-INV-0902",
  });

  const oilInvoiceTotal = 40 * 8500;
  await createInvoice({
    supplier: suppliers["Bidco Uganda Limited"],
    order: oilOrder,
    grn: oilGrn,
    date: isoDate(-6),
    due: isoDate(24),
    total: oilInvoiceTotal,
    paid: 0,
    invStatus: statuses.invoiceOpen,
    number: "BIDCO-INV-7781",
  });

  const dryInvoice = await createInvoice({
    supplier: suppliers["Owino Wholesale Traders"],
    order: dryOrder,
    grn: dryGrn,
    date: isoDate(-7),
    due: isoDate(-7),
    total: 220 * 5000 + 80 * 5200 + 40 * 7800,
    paid: 220 * 5000 + 80 * 5200 + 40 * 7800,
    invStatus: statuses.invoiceClosed,
    number: "OWINO-CASH-0828",
  });
  await createPaidPaymentVoucher({
    supplier: suppliers["Owino Wholesale Traders"],
    invoice: dryInvoice,
    order: dryOrder,
    date: isoDate(-7),
    amount: Number(dryInvoice.total_amount),
    method: "Cash",
    reference: "CASH-OWINO-0828",
    notes: "Paid on delivery from the petty cash float.",
  });

  const issueSets = [
    {
      date: isoDate(-2),
      status: statuses.krIssued,
      planned: 800,
      actual: 786,
      wasteMeals: 9,
      notes: "Friday full office run.",
      items: [
        ["KK-RICE-KG", 82],
        ["KK-POSHO-KG", 60],
        ["KK-BEANS-KG", 48],
        ["KK-BEEF-KG", 38],
        ["KK-CHICKEN-KG", 34],
        ["KK-TOMATO-KG", 24],
        ["KK-ONION-KG", 14],
        ["KK-OIL-LTR", 12],
        ["KK-MILK-LTR", 18],
        ["KK-BOX-PCS", 0],
      ],
      returns: [
        ["KK-TOMATO-KG", 3],
        ["KK-ONION-KG", 2],
      ],
      waste: [
        ["KK-TOMATO-KG", 2, 3500],
        ["KK-BEEF-KG", 1.5, 16000],
      ],
    },
    {
      date: isoDate(-1),
      status: statuses.krIssued,
      planned: 800,
      actual: 792,
      wasteMeals: 6,
      notes: "Thursday office lunch plus Stanbic breakfast tea.",
      items: [
        ["KK-RICE-KG", 80],
        ["KK-POSHO-KG", 58],
        ["KK-BEANS-KG", 46],
        ["KK-BEEF-KG", 36],
        ["KK-CHICKEN-KG", 32],
        ["KK-TOMATO-KG", 22],
        ["KK-ONION-KG", 13],
        ["KK-OIL-LTR", 11],
        ["KK-MILK-LTR", 20],
        ["KK-CABBAGE-KG", 10],
      ],
      returns: [["KK-MILK-LTR", 4]],
      waste: [["KK-CHICKEN-KG", 1, 14000]],
    },
    {
      date: isoDate(0),
      status: statuses.krIssued,
      planned: 120,
      actual: 118,
      wasteMeals: 2,
      notes: "Saturday URA training conference lunch.",
      items: [
        ["KK-RICE-KG", 16],
        ["KK-BEANS-KG", 10],
        ["KK-CHICKEN-KG", 12],
        ["KK-TOMATO-KG", 6],
        ["KK-ONION-KG", 4],
        ["KK-OIL-LTR", 3],
        ["KK-CABBAGE-KG", 4],
      ],
      returns: [],
      waste: [["KK-OIL-LTR", 0.5, 8500]],
    },
  ];

  for (const set of issueSets) {
    const kr = await insert(
      db,
      `INSERT INTO kitchen_requisitions
         (requisition_number, request_date, production_date, department_id, department_name,
          source_store_location_id, requested_by, approved_by, status_id, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        await generateNextNumber(db, "kitchen_requisition"),
        set.date,
        set.date,
        kitchenDept.id,
        kitchenDept.name,
        centralStore.id,
        kitchen.id,
        store.id,
        set.status?.id || null,
        set.status?.status_name || "Issued",
        set.notes,
      ]
    );

    const krItems = [];
    for (const [sku, qty] of set.items.filter(([, qty]) => qty > 0)) {
      const line = await insert(
        db,
        `INSERT INTO kitchen_requisition_items
           (kitchen_requisition_id, product_id, requested_quantity, approved_quantity, issued_quantity)
         VALUES (?, ?, ?, ?, ?)
         RETURNING *`,
        [kr.id, products[sku].id, qty, qty, qty]
      );
      krItems.push({ sku, qty, line });
    }

    const issue = await insert(
      db,
      `INSERT INTO store_issues
         (issue_number, kitchen_requisition_id, source_store_location_id, department_id, department_name,
          issue_date, status_id, status, issued_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        await generateNextNumber(db, "store_issue"),
        kr.id,
        set.date === isoDate(0) ? centralStore.id : set.items.some(([sku]) => sku.includes("BEEF") || sku.includes("CHICKEN"))
          ? coldStore.id
          : centralStore.id,
        kitchenDept.id,
        kitchenDept.name,
        set.date,
        statuses.issueIssued?.id || null,
        statuses.issueIssued?.status_name || "Issued",
        store.id,
        set.notes,
      ]
    );

    const consumed = [];
    for (const row of krItems) {
      const storeId = ["KK-BEEF-KG", "KK-CHICKEN-KG", "KK-FISH-KG", "KK-MILK-LTR"].includes(row.sku)
        ? (row.sku === "KK-MILK-LTR" ? centralStore.id : coldStore.id)
        : ["KK-RICE-KG", "KK-POSHO-KG", "KK-BEANS-KG", "KK-SUGAR-KG", "KK-Gnuts-KG"].includes(row.sku)
          ? dryStore.id
          : centralStore.id;
      const unitCost = await applyIssue(db, {
        productId: products[row.sku].id,
        storeId,
        quantity: row.qty,
        issueDate: set.date,
        issueId: issue.id,
        userId: store.id,
        note: `Issued for ${kr.requisition_number}`,
      });
      await db.exec(
        `INSERT INTO store_issue_items
           (store_issue_id, kitchen_requisition_item_id, product_id, approved_quantity, issued_quantity, unit_cost)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [issue.id, row.line.id, products[row.sku].id, row.qty, row.qty, unitCost || products[row.sku].standard_cost]
      );
      consumed.push({ sku: row.sku, qty: row.qty });
    }

    const batch = await insert(
      db,
      `INSERT INTO production_batches
         (batch_number, production_date, shift, department_id, delivery_type_id, supervisor_id,
          kitchen_requisition_id, store_issue_id, planned_output, actual_output, wastage_quantity,
          notes, status_id, status, created_by, completed_by)
       VALUES (?, ?, 'Lunch Service', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        await generateNextNumber(db, "production_batch"),
        set.date,
        kitchenDept.id,
        lunchType?.id || null,
        kitchen.id,
        kr.id,
        issue.id,
        set.planned,
        set.actual,
        set.wasteMeals,
        set.notes,
        statuses.batchCompleted?.id || null,
        statuses.batchCompleted?.status_name || "Completed",
        kitchen.id,
        kitchen.id,
      ]
    );
    for (const row of consumed) {
      await db.exec(
        `INSERT INTO production_batch_items (production_batch_id, product_id, quantity_consumed)
         VALUES (?, ?, ?)`,
        [batch.id, products[row.sku].id, row.qty]
      );
    }

    for (const [sku, qty, cost] of set.waste) {
      await db.exec(
        `INSERT INTO wastage_records
           (production_batch_id, store_issue_id, product_id, quantity, wastage_type, wastage_value, notes, recorded_by, record_date)
         VALUES (?, ?, ?, ?, 'Production', ?, ?, ?, ?)`,
        [
          batch.id,
          issue.id,
          products[sku].id,
          qty,
          qty * cost,
          "Trim, spoilage or overcook during lunch service.",
          kitchen.id,
          set.date,
        ]
      );
    }

    if (set.returns.length) {
      const stockReturn = await insert(
        db,
        `INSERT INTO stock_returns
           (return_number, kitchen_requisition_id, store_issue_id, store_location_id, return_date,
            status_id, status, received_by, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`,
        [
          await generateNextNumber(db, "stock_return"),
          kr.id,
          issue.id,
          centralStore.id,
          set.date,
          statuses.returnConfirmed?.id || null,
          statuses.returnConfirmed?.status_name || "Confirmed",
          store.id,
          "Unused issued stock returned after service.",
        ]
      );
      for (const [sku, qty] of set.returns) {
        const unitCost = Number(products[sku].standard_cost);
        const returnStore = ["KK-BEEF-KG", "KK-CHICKEN-KG"].includes(sku) ? coldStore.id : sku.startsWith("KK-RICE") || sku.startsWith("KK-BEANS") || sku.startsWith("KK-POSHO") ? dryStore.id : centralStore.id;
        await db.exec(
          `INSERT INTO stock_return_items (stock_return_id, product_id, quantity_returned, unit_cost)
           VALUES (?, ?, ?, ?)`,
          [stockReturn.id, products[sku].id, qty, unitCost]
        );
        await applyReturn(db, {
          productId: products[sku].id,
          storeId: returnStore,
          quantity: qty,
          unitCost,
          returnDate: set.date,
          returnId: stockReturn.id,
          userId: store.id,
        });
      }
    }

    await log(db, kitchen.id, "complete", "production_batch", batch.id, {
      planned: set.planned,
      actual: set.actual,
    });
  }

  const mondayKr = await insert(
    db,
    `INSERT INTO kitchen_requisitions
       (requisition_number, request_date, production_date, department_id, department_name,
        source_store_location_id, requested_by, status_id, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`,
    [
      await generateNextNumber(db, "kitchen_requisition"),
      isoDate(0),
      isoDate(2),
      kitchenDept.id,
      kitchenDept.name,
      centralStore.id,
      kitchen.id,
      statuses.krSubmitted?.id || null,
      statuses.krSubmitted?.status_name || "Submitted",
      "Monday office lunch request waiting for store approval.",
    ]
  );
  for (const [sku, qty] of [
    ["KK-RICE-KG", 80],
    ["KK-POSHO-KG", 55],
    ["KK-BEANS-KG", 45],
    ["KK-CHICKEN-KG", 30],
    ["KK-TOMATO-KG", 20],
    ["KK-OIL-LTR", 10],
  ]) {
    await db.exec(
      `INSERT INTO kitchen_requisition_items
         (kitchen_requisition_id, product_id, requested_quantity, approved_quantity, issued_quantity)
       VALUES (?, ?, ?, 0, 0)`,
      [mondayKr.id, products[sku].id, qty]
    );
  }
  await insert(
    db,
    `INSERT INTO kitchen_requisitions
       (requisition_number, request_date, production_date, department_id, department_name,
        source_store_location_id, requested_by, status_id, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`,
    [
      await generateNextNumber(db, "kitchen_requisition"),
      isoDate(0),
      isoDate(3),
      kitchenDept.id,
      kitchenDept.name,
      centralStore.id,
      kitchen.id,
      statuses.krDraft?.id || null,
      statuses.krDraft?.status_name || "Draft",
      "Tuesday draft list. Aisha is still confirming Stanbic breakfast numbers.",
    ]
  );
  const sundayKr = await insert(
    db,
    `INSERT INTO kitchen_requisitions
       (requisition_number, request_date, production_date, department_id, department_name,
        source_store_location_id, requested_by, approved_by, status_id, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`,
    [
      await generateNextNumber(db, "kitchen_requisition"),
      isoDate(-1),
      isoDate(1),
      kitchenDept.id,
      kitchenDept.name,
      coldStore.id,
      kitchen.id,
      store.id,
      statuses.krApproved?.id || null,
      statuses.krApproved?.status_name || "Approved",
      "Sunday prep proteins approved. Issue first thing Monday.",
    ]
  );
  for (const [sku, qty] of [
    ["KK-BEEF-KG", 20],
    ["KK-CHICKEN-KG", 18],
  ]) {
    await db.exec(
      `INSERT INTO kitchen_requisition_items
         (kitchen_requisition_id, product_id, requested_quantity, approved_quantity, issued_quantity)
       VALUES (?, ?, ?, ?, 0)`,
      [sundayKr.id, products[sku].id, qty, qty]
    );
  }
  await insert(
    db,
    `INSERT INTO kitchen_requisitions
       (requisition_number, request_date, production_date, department_id, department_name,
        source_store_location_id, requested_by, rejected_by, status_id, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`,
    [
      await generateNextNumber(db, "kitchen_requisition"),
      isoDate(-3),
      isoDate(-2),
      kitchenDept.id,
      kitchenDept.name,
      centralStore.id,
      kitchen.id,
      store.id,
      statuses.krRejected?.id || null,
      statuses.krRejected?.status_name || "Rejected",
      "Rejected reason: Requested 200kg rice while Friday batch already had dry stock issued.",
    ]
  );

  const tomatoDamage = await insert(
    db,
    `INSERT INTO stock_adjustments
       (adjustment_number, store_location_id, adjustment_date, reason, status_id, status, requested_by, approved_by, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`,
    [
      await generateNextNumber(db, "stock_adjustment"),
      centralStore.id,
      isoDate(-1),
      "Damage/Spoilage",
      statuses.adjApproved?.id || null,
      statuses.adjApproved?.status_name || "Approved",
      store.id,
      manager.id,
      "Soft tomatoes from the Nakasero crate written off.",
    ]
  );
  await db.exec(
    `INSERT INTO stock_adjustment_items (stock_adjustment_id, product_id, quantity_delta) VALUES (?, ?, ?)`,
    [tomatoDamage.id, products["KK-TOMATO-KG"].id, -5]
  );
  await applyIssue(db, {
    productId: products["KK-TOMATO-KG"].id,
    storeId: centralStore.id,
    quantity: 5,
    issueDate: isoDate(-1),
    issueId: tomatoDamage.id,
    userId: store.id,
    note: "Spoilage write-off",
  });
  await db.exec(
    `UPDATE stock_movements
     SET movement_type = 'Damage/Spoilage', reference_type = 'stock_adjustment'
     WHERE reference_type = 'store_issue' AND reference_id = ?`,
    [tomatoDamage.id]
  );

  await insert(
    db,
    `INSERT INTO stock_adjustments
       (adjustment_number, store_location_id, adjustment_date, reason, status_id, status, requested_by, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`,
    [
      await generateNextNumber(db, "stock_adjustment"),
      dryStore.id,
      isoDate(0),
      "Count variance review",
      statuses.adjDraft?.id || null,
      statuses.adjDraft?.status_name || "Draft",
      store.id,
      "Draft rice variance pending Diana's approval.",
    ]
  );

  const riceBalance = await db.get(
    `SELECT COALESCE(SUM(quantity_on_hand), 0) AS qty
     FROM inventory_balances
     WHERE product_id = ?`,
    [products["KK-RICE-KG"].id]
  );
  const count = await insert(
    db,
    `INSERT INTO physical_stock_counts
       (count_number, store_location_id, count_date, status_id, status, counted_by, approved_by, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`,
    [
      await generateNextNumber(db, "physical_stock_count"),
      dryStore.id,
      isoDate(-1),
      statuses.countApproved?.id || null,
      statuses.countApproved?.status_name || "Approved",
      store.id,
      manager.id,
      "Friday dry-store count after lunch issues.",
    ]
  );
  const systemRice = Number(riceBalance?.qty || 0);
  await db.exec(
    `INSERT INTO physical_stock_count_items
       (physical_stock_count_id, product_id, system_quantity, counted_quantity, variance_quantity)
     VALUES (?, ?, ?, ?, ?)`,
    [count.id, products["KK-RICE-KG"].id, systemRice, Math.max(systemRice - 2, 0), -2]
  );
  await insert(
    db,
    `INSERT INTO physical_stock_counts
       (count_number, store_location_id, count_date, status_id, status, counted_by, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     RETURNING *`,
    [
      await generateNextNumber(db, "physical_stock_count"),
      coldStore.id,
      isoDate(0),
      statuses.countDraft?.id || null,
      statuses.countDraft?.status_name || "Draft",
      store.id,
      "Weekend cold-store count still in progress.",
    ]
  );

  await insert(
    db,
    `INSERT INTO production_batches
       (batch_number, production_date, shift, department_id, delivery_type_id, supervisor_id,
        kitchen_requisition_id, planned_output, actual_output, wastage_quantity, notes, status_id, status, created_by)
     VALUES (?, ?, 'Breakfast', ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)
     RETURNING *`,
    [
      await generateNextNumber(db, "production_batch"),
      isoDate(2),
      kitchenDept.id,
      breakfastType?.id || null,
      kitchen.id,
      mondayKr.id,
      80,
      "Monday Stanbic breakfast draft batch.",
      statuses.batchDraft?.id || null,
      statuses.batchDraft?.status_name || "Draft",
      kitchen.id,
    ]
  );

  await log(db, procurement.id, "create", "purchase_requisition", pendingReq.requisition.id, {
    note: "Submitted weekly top-up",
  });
  await log(db, finance.id, "create", "supplier_invoice", grainInvoice.id, { invoice: "MAG-INV-8821" });
  await log(db, store.id, "approve", "stock_adjustment", tomatoDamage.id, { reason: "Damage/Spoilage" });
}

module.exports = {
  seedDemoData,
};
