const { generateNextNumber } = require("./numbering-series-service");

const LEGACY_SEQUENCE_MAP = {
  contractPrefix: "contract",
  purchaseRequisitionPrefix: "purchase_requisition",
  purchaseOrderPrefix: "purchase_order",
  goodsReceivedPrefix: "goods_received_note",
  kitchenRequisitionPrefix: "kitchen_requisition",
  storeIssuePrefix: "store_issue",
  productionBatchPrefix: "production_batch",
  stockAdjustmentPrefix: "stock_adjustment",
  stockReturnPrefix: "stock_return",
  physicalCountPrefix: "physical_stock_count",
  supplierInvoicePrefix: "supplier_invoice",
};

async function getSettingsBundle(db) {
  const profile = await db.get("SELECT * FROM business_profile ORDER BY id ASC LIMIT 1");
  const settingsRow = await db.get("SELECT settings FROM app_settings WHERE id = 1");
  return {
    profile,
    settings: settingsRow?.settings || {},
  };
}

async function getNextSequence(db, prefixKey, tableName, columnName) {
  const seriesKey =
    LEGACY_SEQUENCE_MAP[prefixKey] || LEGACY_SEQUENCE_MAP[tableName] || prefixKey || tableName || columnName || "generic";
  return generateNextNumber(db, seriesKey);
}

async function getUserWithAccess(db, userId) {
  const user = await db.get(
    `SELECT id, full_name, username, email, is_active, created_at
     FROM users
     WHERE id = ?`,
    [userId]
  );

  if (!user) {
    return null;
  }

  const roles = await db.all(
    `SELECT r.code, r.name
     FROM user_roles ur
     INNER JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = ?
     ORDER BY r.name`,
    [userId]
  );

  const permissions = await db.all(
    `SELECT DISTINCT p.code, p.name, p.module_name
     FROM user_roles ur
     INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
     INNER JOIN permissions p ON p.id = rp.permission_id
     WHERE ur.user_id = ?
     ORDER BY p.module_name, p.name`,
    [userId]
  );

  return {
    id: user.id,
    fullName: user.full_name,
    username: user.username,
    email: user.email,
    isActive: user.is_active,
    createdAt: user.created_at,
    roles: roles.map((role) => role.code),
    roleNames: roles.map((role) => role.name),
    permissions: permissions.map((permission) => permission.code),
    permissionDetails: permissions,
  };
}

module.exports = {
  getNextSequence,
  getSettingsBundle,
  getUserWithAccess,
  LEGACY_SEQUENCE_MAP,
};
