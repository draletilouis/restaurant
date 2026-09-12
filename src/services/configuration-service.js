const { logAudit } = require("./audit-service");
const { normalizeStatusKey, toTitleCase } = require("./status-service");

const CONFIG_DEFINITIONS = {
  units: {
    key: "units",
    label: "Units of Measure",
    description: "Define quantity units used across products, purchases, stock, requisitions, and production.",
    table: "units_of_measure",
    groupCode: "units_of_measure",
    orderBy: "sort_order ASC, name ASC",
    select: "id, code, name, description, sort_order, is_active, created_at",
    fields: ["code", "name", "description", "sort_order", "is_active"],
    defaults: { sort_order: 10, is_active: true },
  },
  "product-categories": {
    key: "product-categories",
    label: "Product Categories",
    description: "Group products into reusable inventory, procurement, and reporting categories.",
    table: "product_categories",
    groupCode: "product_categories",
    orderBy: "sort_order ASC, name ASC",
    select: "id, name, description, sort_order, is_active, created_at",
    fields: ["name", "description", "sort_order", "is_active"],
    defaults: { sort_order: 20, is_active: true },
  },
  stores: {
    key: "stores",
    label: "Stores / Locations",
    description: "Configure central, kitchen, cold, and dry stores used by inventory and stock movement workflows.",
    table: "store_locations",
    groupCode: "store_locations",
    orderBy: "sort_order ASC, name ASC",
    select: "id, name, location_type, description, sort_order, is_active, created_at, updated_at",
    fields: ["name", "location_type", "description", "sort_order", "is_active"],
    defaults: { location_type: "Store", sort_order: 30, is_active: true },
  },
  departments: {
    key: "departments",
    label: "Departments",
    description: "Maintain reusable operating departments for requests, approvals, production, and reporting.",
    table: "departments",
    groupCode: "departments",
    orderBy: "sort_order ASC, name ASC",
    select: "id, code, name, description, sort_order, is_active, created_at, updated_at",
    fields: ["code", "name", "description", "sort_order", "is_active"],
    defaults: { sort_order: 40, is_active: true },
  },
  statuses: {
    key: "statuses",
    label: "Statuses",
    description: "Control status labels, codes, colors, and terminal behavior for each workflow module.",
    table: "statuses",
    groupCode: "statuses",
    orderBy: "module_key ASC, sort_order ASC, status_name ASC",
    select: "id, status_name, status_code, module_key, color, sort_order, is_terminal, is_active, created_at, updated_at",
    fields: ["status_name", "status_code", "module_key", "color", "sort_order", "is_terminal", "is_active"],
    defaults: { color: "#98A2B3", sort_order: 50, is_terminal: false, is_active: true },
  },
  "numbering-series": {
    key: "numbering-series",
    label: "Numbering Series",
    description: "Manage central document numbering rules used across transactional workflows.",
    table: "numbering_series",
    groupCode: "numbering_series",
    orderBy: "document_type ASC",
    select:
      "id, document_type, document_key, prefix, current_year, current_month, current_number, padding_length, reset_frequency, is_active, created_at, updated_at",
    fields: [
      "document_type",
      "document_key",
      "prefix",
      "current_year",
      "current_month",
      "current_number",
      "padding_length",
      "reset_frequency",
      "is_active",
    ],
    defaults: { current_number: 0, padding_length: 4, reset_frequency: "Yearly", is_active: true },
  },
  "approval-workflows": {
    key: "approval-workflows",
    label: "Approval Workflows",
    description: "Reuse approval thresholds and roles across plans, requisitions, orders, and stock controls.",
    table: "approval_workflows",
    groupCode: "approval_workflows",
    orderBy: "document_type ASC, approval_level ASC",
    select:
      "id, workflow_name, document_type, required_role, approval_level, min_amount, max_amount, can_creator_approve, is_active, created_at, updated_at",
    fields: [
      "workflow_name",
      "document_type",
      "required_role",
      "approval_level",
      "min_amount",
      "max_amount",
      "can_creator_approve",
      "is_active",
    ],
    defaults: { approval_level: 1, min_amount: 0, max_amount: 999999999999, can_creator_approve: false, is_active: true },
  },
  "payment-terms": {
    key: "payment-terms",
    label: "Payment Terms",
    description: "Standardize payment terms reused by suppliers, purchase orders, invoices, and contracts.",
    table: "payment_terms",
    groupCode: "payment_terms",
    orderBy: "sort_order ASC, days_due ASC, name ASC",
    select: "id, name, days_due, description, sort_order, is_active, created_at, updated_at",
    fields: ["name", "days_due", "description", "sort_order", "is_active"],
    defaults: { days_due: 0, sort_order: 80, is_active: true },
  },
  "delivery-types": {
    key: "delivery-types",
    label: "Delivery Types",
    description: "Define catering delivery patterns used by contracts, schedules, production, and reports.",
    table: "delivery_types",
    groupCode: "delivery_types",
    orderBy: "sort_order ASC, name ASC",
    select: "id, code, name, description, sort_order, is_active, created_at, updated_at",
    fields: ["code", "name", "description", "sort_order", "is_active"],
    defaults: { sort_order: 90, is_active: true },
  },
  "expense-categories": {
    key: "expense-categories",
    label: "Expense Categories",
    description: "Prepare reusable cost buckets for later finance and reporting modules.",
    table: "expense_categories",
    groupCode: "expense_categories",
    orderBy: "sort_order ASC, name ASC",
    select: "id, code, name, description, sort_order, is_active, created_at, updated_at",
    fields: ["code", "name", "description", "sort_order", "is_active"],
    defaults: { sort_order: 100, is_active: true },
  },
  "tax-settings": {
    key: "tax-settings",
    label: "Tax Settings",
    description: "Store reusable tax rules for purchase and sales documents.",
    table: "tax_settings",
    groupCode: "tax_settings",
    orderBy: "tax_name ASC",
    select: "id, tax_name, tax_rate, applies_to_purchases, applies_to_sales, is_active, created_at, updated_at",
    fields: ["tax_name", "tax_rate", "applies_to_purchases", "applies_to_sales", "is_active"],
    defaults: { tax_rate: 0, applies_to_purchases: true, applies_to_sales: false, is_active: true },
  },
  "notification-rules": {
    key: "notification-rules",
    label: "Notification Rules",
    description: "Configure low stock, expiry, contract, and approval notifications centrally.",
    table: "notification_rules",
    groupCode: "notification_rules",
    orderBy: "rule_name ASC",
    select: "id, rule_name, trigger_type, threshold_value, recipient_role, description, is_active, created_at, updated_at",
    fields: ["rule_name", "trigger_type", "threshold_value", "recipient_role", "description", "is_active"],
    defaults: { threshold_value: 0, is_active: true },
  },
};

const CONFIG_GROUP_SEEDS = Object.values(CONFIG_DEFINITIONS).map((definition, index) => ({
  code: definition.groupCode,
  name: definition.label,
  description: definition.description,
  sortOrder: (index + 1) * 10,
}));

const CONFIG_MIRROR_MAP = {
  units: {
    name: (row) => row.name,
    code: (row) => row.code,
    color: null,
    isActive: (row) => row.is_active,
    sortOrder: (row) => row.sort_order,
  },
  "product-categories": {
    name: (row) => row.name,
    code: (row) => normalizeStatusKey(row.name),
    color: null,
    isActive: (row) => row.is_active,
    sortOrder: (row) => row.sort_order,
  },
  stores: {
    name: (row) => row.name,
    code: (row) => normalizeStatusKey(row.name),
    color: null,
    isActive: (row) => row.is_active,
    sortOrder: (row) => row.sort_order,
  },
  departments: {
    name: (row) => row.name,
    code: (row) => row.code,
    color: null,
    isActive: (row) => row.is_active,
    sortOrder: (row) => row.sort_order,
  },
  statuses: {
    name: (row) => row.status_name,
    code: (row) => row.status_code,
    color: (row) => row.color,
    isActive: (row) => row.is_active,
    sortOrder: (row) => row.sort_order,
  },
  "numbering-series": {
    name: (row) => row.document_type,
    code: (row) => row.document_key,
    color: null,
    isActive: (row) => row.is_active,
    sortOrder: () => 0,
  },
  "approval-workflows": {
    name: (row) => row.workflow_name,
    code: (row) => normalizeStatusKey(`${row.document_type}_${row.approval_level}`),
    color: null,
    isActive: (row) => row.is_active,
    sortOrder: (row) => row.approval_level,
  },
  "payment-terms": {
    name: (row) => row.name,
    code: (row) => normalizeStatusKey(row.name),
    color: null,
    isActive: (row) => row.is_active,
    sortOrder: (row) => row.sort_order,
  },
  "delivery-types": {
    name: (row) => row.name,
    code: (row) => row.code,
    color: null,
    isActive: (row) => row.is_active,
    sortOrder: (row) => row.sort_order,
  },
  "expense-categories": {
    name: (row) => row.name,
    code: (row) => row.code,
    color: null,
    isActive: (row) => row.is_active,
    sortOrder: (row) => row.sort_order,
  },
  "tax-settings": {
    name: (row) => row.tax_name,
    code: (row) => normalizeStatusKey(row.tax_name),
    color: null,
    isActive: (row) => row.is_active,
    sortOrder: () => 0,
  },
  "notification-rules": {
    name: (row) => row.rule_name,
    code: (row) => normalizeStatusKey(row.rule_name),
    color: null,
    isActive: (row) => row.is_active,
    sortOrder: () => 0,
  },
};

function getDefinition(type) {
  const definition = CONFIG_DEFINITIONS[type];
  if (!definition) {
    const error = new Error(`Unknown configuration type: ${type}`);
    error.status = 404;
    throw error;
  }
  return definition;
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value === "true";
  }
  return fallback;
}

function normalizePayload(type, payload = {}) {
  const definition = getDefinition(type);
  const normalized = { ...definition.defaults };

  for (const field of definition.fields) {
    if (payload[field] !== undefined) {
      normalized[field] = payload[field];
    }
  }

  if ("status_name" in normalized) {
    normalized.status_name = toTitleCase(normalized.status_name);
  }
  if ("status_code" in normalized) {
    normalized.status_code = normalizeStatusKey(normalized.status_code || normalized.status_name);
  }
  if ("module_key" in normalized) {
    normalized.module_key = normalizeStatusKey(normalized.module_key || "global") || "global";
  }
  if ("code" in normalized && normalized.code) {
    normalized.code = normalizeStatusKey(normalized.code);
  }
  if ("document_key" in normalized && normalized.document_key) {
    normalized.document_key = normalizeStatusKey(normalized.document_key);
  }
  if ("document_type" in normalized && normalized.document_type) {
    normalized.document_type = String(normalized.document_type).trim();
  }
  if ("workflow_name" in normalized && normalized.workflow_name) {
    normalized.workflow_name = String(normalized.workflow_name).trim();
  }
  if ("name" in normalized && normalized.name) {
    normalized.name = String(normalized.name).trim();
  }
  if ("location_type" in normalized && normalized.location_type) {
    normalized.location_type = String(normalized.location_type).trim();
  }
  if ("rule_name" in normalized && normalized.rule_name) {
    normalized.rule_name = String(normalized.rule_name).trim();
  }
  if ("trigger_type" in normalized && normalized.trigger_type) {
    normalized.trigger_type = String(normalized.trigger_type).trim();
  }
  if ("tax_name" in normalized && normalized.tax_name) {
    normalized.tax_name = String(normalized.tax_name).trim();
  }
  if ("is_active" in normalized) {
    normalized.is_active = normalizeBoolean(normalized.is_active, true);
  }
  if ("is_terminal" in normalized) {
    normalized.is_terminal = normalizeBoolean(normalized.is_terminal, false);
  }
  if ("can_creator_approve" in normalized) {
    normalized.can_creator_approve = normalizeBoolean(normalized.can_creator_approve, false);
  }
  if ("applies_to_purchases" in normalized) {
    normalized.applies_to_purchases = normalizeBoolean(normalized.applies_to_purchases, true);
  }
  if ("applies_to_sales" in normalized) {
    normalized.applies_to_sales = normalizeBoolean(normalized.applies_to_sales, false);
  }

  return normalized;
}

async function ensureConfigurationGroups(db) {
  for (const group of CONFIG_GROUP_SEEDS) {
    await db.exec(
      `INSERT INTO configuration_groups (code, name, description, sort_order, is_active)
       VALUES (?, ?, ?, ?, TRUE)
       ON CONFLICT (code)
       DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order`,
      [group.code, group.name, group.description, group.sortOrder]
    );
  }
}

async function syncMirrorItem(db, type, row) {
  const definition = getDefinition(type);
  const mirrorMap = CONFIG_MIRROR_MAP[type];
  const group = await db.get("SELECT id FROM configuration_groups WHERE code = ?", [definition.groupCode]);
  if (!group || !mirrorMap || !row?.id) {
    return;
  }

  const itemCode = mirrorMap.code?.(row) || normalizeStatusKey(mirrorMap.name?.(row) || `${type}_${row.id}`);
  await db.exec(
    `INSERT INTO configuration_items
       (group_id, source_table, source_id, item_code, item_name, color, sort_order, is_active, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb)
     ON CONFLICT (source_table, source_id)
     DO UPDATE SET
       group_id = EXCLUDED.group_id,
       item_code = EXCLUDED.item_code,
       item_name = EXCLUDED.item_name,
       color = EXCLUDED.color,
       sort_order = EXCLUDED.sort_order,
       is_active = EXCLUDED.is_active,
       metadata = EXCLUDED.metadata,
       updated_at = NOW()`,
    [
      group.id,
      definition.table,
      row.id,
      itemCode,
      mirrorMap.name?.(row) || row.name || row.status_name || row.document_type || row.workflow_name,
      mirrorMap.color?.(row) || null,
      Number(mirrorMap.sortOrder?.(row) || 0),
      normalizeBoolean(mirrorMap.isActive?.(row), true),
      JSON.stringify({ configurationType: type }),
    ]
  );
}

async function syncConfigurationMirrors(db) {
  await ensureConfigurationGroups(db);
  for (const definition of Object.values(CONFIG_DEFINITIONS)) {
    const rows = await db.all(`SELECT ${definition.select} FROM ${definition.table}`);
    for (const row of rows) {
      await syncMirrorItem(db, definition.key, row);
    }
  }
}

async function listConfigurationTypes(db) {
  const groups = await db.all(
    `SELECT cg.*,
            COALESCE(COUNT(ci.id), 0)::int AS item_count
     FROM configuration_groups cg
     LEFT JOIN configuration_items ci ON ci.group_id = cg.id
     GROUP BY cg.id
     ORDER BY cg.sort_order ASC, cg.name ASC`
  );

  return groups.map((group) => {
    const definition = Object.values(CONFIG_DEFINITIONS).find((entry) => entry.groupCode === group.code);
    return {
      key: definition?.key || group.code,
      label: definition?.label || group.name,
      description: definition?.description || group.description,
      itemCount: group.item_count,
    };
  });
}

async function listConfigurationRows(db, type) {
  const definition = getDefinition(type);
  return db.all(`SELECT ${definition.select} FROM ${definition.table} ORDER BY ${definition.orderBy}`);
}

async function listConfigurationBundle(db) {
  const types = await listConfigurationTypes(db);
  const rowsByType = {};
  for (const type of Object.keys(CONFIG_DEFINITIONS)) {
    rowsByType[type] = await listConfigurationRows(db, type);
  }
  return { types, rowsByType };
}

async function createConfigurationRow(db, type, payload, actorUserId = null) {
  const definition = getDefinition(type);
  const normalized = normalizePayload(type, payload);
  const fields = definition.fields;
  const placeholders = fields.map(() => "?").join(", ");
  const values = fields.map((field) => normalized[field] ?? null);
  const created = await db.exec(
    `INSERT INTO ${definition.table} (${fields.join(", ")})
     VALUES (${placeholders})
     RETURNING ${definition.select}`,
    values
  );
  await syncMirrorItem(db, type, created.rows[0]);
  await logAudit(db, actorUserId, "create", type, created.rows[0].id, normalized);
  return created.rows[0];
}

async function updateConfigurationRow(db, type, id, payload, actorUserId = null) {
  const definition = getDefinition(type);
  const normalized = normalizePayload(type, payload);
  const fields = definition.fields.filter((field) => normalized[field] !== undefined);
  const assignments = fields.map((field) => `${field} = ?`);
  if (definition.select.includes("updated_at")) {
    assignments.push("updated_at = NOW()");
  }
  const values = fields.map((field) => normalized[field]);
  const result = await db.exec(
    `UPDATE ${definition.table}
     SET ${assignments.join(", ")}
     WHERE id = ?
     RETURNING ${definition.select}`,
    [...values, id]
  );
  await syncMirrorItem(db, type, result.rows[0]);
  await logAudit(db, actorUserId, "update", type, Number(id), normalized);
  return result.rows[0];
}


const CONFIG_USAGE_CHECKS = {
  units: [
    { table: "products", column: "unit_of_measure_id", label: "products" },
  ],
  "product-categories": [
    { table: "products", column: "product_category_id", label: "products" },
  ],
  stores: [
    { table: "inventory_balances", column: "store_location_id", label: "inventory balances" },
    { table: "stock_batches", column: "store_location_id", label: "stock batches" },
    { table: "stock_movements", column: "store_location_id", label: "stock movements" },
    { table: "stock_adjustments", column: "store_location_id", label: "stock adjustments" },
    { table: "goods_received_notes", column: "store_location_id", label: "goods received notes" },
    { table: "store_issues", column: "source_store_location_id", label: "store issues" },
    { table: "kitchen_requisitions", column: "source_store_location_id", label: "kitchen requisitions" },
  ],
  departments: [
    { table: "purchase_requisitions", column: "department_id", label: "purchase requisitions" },
    { table: "cash_requisitions", column: "department_id", label: "cash requisitions" },
    { table: "kitchen_requisitions", column: "department_id", label: "kitchen requisitions" },
    { table: "store_issues", column: "department_id", label: "store issues" },
    { table: "production_batches", column: "department_id", label: "production batches" },
  ],
};

async function assertConfigurationDeletable(db, type, id) {
  const checks = CONFIG_USAGE_CHECKS[type] || [];
  const blockers = [];
  for (const check of checks) {
    try {
      const row = await db.get(
        `SELECT COUNT(*)::int AS count FROM ${check.table} WHERE ${check.column} = ?`,
        [id]
      );
      if (row?.count > 0) {
        blockers.push(`${row.count} ${check.label}`);
      }
    } catch (error) {
      // Table/column may not exist in older DBs — skip that check.
      if (!/does not exist|undefined_table|undefined_column/i.test(String(error.message || error))) {
        throw error;
      }
    }
  }
  if (blockers.length) {
    const error = new Error(
      `Cannot delete: still used by ${blockers.join(", ")}. Remove or reassign those records first.`
    );
    error.status = 409;
    throw error;
  }
}

async function deleteConfigurationRow(db, type, id, actorUserId = null) {
  const definition = getDefinition(type);
  const existing = await db.get(`SELECT ${definition.select} FROM ${definition.table} WHERE id = ?`, [id]);
  if (!existing) {
    const error = new Error("Configuration item not found");
    error.status = 404;
    throw error;
  }

  await assertConfigurationDeletable(db, type, id);

  await db.exec(`DELETE FROM configuration_items WHERE source_table = ? AND source_id = ?`, [
    definition.table,
    id,
  ]);
  const result = await db.exec(
    `DELETE FROM ${definition.table} WHERE id = ? RETURNING ${definition.select}`,
    [id]
  );
  if (!result.rows?.[0]) {
    const error = new Error("Configuration item not found");
    error.status = 404;
    throw error;
  }
  await logAudit(db, actorUserId, "delete", type, Number(id), existing);
  return result.rows[0];
}

async function toggleConfigurationRow(db, type, id, isActive, actorUserId = null) {
  const definition = getDefinition(type);
  const setUpdatedAt = definition.select.includes("updated_at") ? ", updated_at = NOW()" : "";
  const result = await db.exec(
    `UPDATE ${definition.table}
     SET is_active = ?${setUpdatedAt}
     WHERE id = ?
     RETURNING ${definition.select}`,
    [normalizeBoolean(isActive, true), id]
  );
  await syncMirrorItem(db, type, result.rows[0]);
  await logAudit(db, actorUserId, normalizeBoolean(isActive, true) ? "activate" : "deactivate", type, Number(id), {
    isActive: normalizeBoolean(isActive, true),
  });
  return result.rows[0];
}

async function getConfigurationReferenceData(db) {
  const [clients, locations, suppliers, products, categories, units, stores, departments, paymentTerms, deliveryTypes, statuses] =
    await Promise.all([
      db.all("SELECT id, name FROM clients ORDER BY name"),
      db.all("SELECT id, client_id, name FROM client_locations ORDER BY name"),
      db.all("SELECT id, name FROM suppliers ORDER BY name"),
      db.all(
        `SELECT p.id, p.name, p.standard_cost, p.unit_of_measure_id, uom.code AS unit_code, uom.name AS unit_name
         FROM products p
         LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
         ORDER BY p.name`
      ),
      db.all("SELECT id, name, description, sort_order, is_active FROM product_categories ORDER BY sort_order ASC, name ASC"),
      db.all("SELECT id, code, name, description, sort_order, is_active FROM units_of_measure ORDER BY sort_order ASC, name ASC"),
      db.all("SELECT id, name, location_type, sort_order, is_active FROM store_locations ORDER BY sort_order ASC, name ASC"),
      db.all("SELECT id, code, name, sort_order, is_active FROM departments ORDER BY sort_order ASC, name ASC"),
      db.all("SELECT id, name, days_due, sort_order, is_active FROM payment_terms ORDER BY sort_order ASC, days_due ASC, name ASC"),
      db.all("SELECT id, code, name, sort_order, is_active FROM delivery_types ORDER BY sort_order ASC, name ASC"),
      db.all(
        `SELECT id, status_name, status_code, module_key, color, sort_order, is_terminal, is_active
         FROM statuses
         WHERE is_active = TRUE
         ORDER BY module_key ASC, sort_order ASC, status_name ASC`
      ),
    ]);

  return {
    clients,
    locations,
    suppliers,
    products,
    categories,
    units,
    stores,
    departments,
    paymentTerms,
    deliveryTypes,
    statuses,
  };
}

module.exports = {
  CONFIG_DEFINITIONS,
  createConfigurationRow,
  ensureConfigurationGroups,
  getConfigurationReferenceData,
  getDefinition,
  listConfigurationBundle,
  listConfigurationRows,
  listConfigurationTypes,
  normalizePayload,
  syncConfigurationMirrors,
  deleteConfigurationRow,
  toggleConfigurationRow,
  updateConfigurationRow,
};
