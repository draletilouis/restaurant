const PURCHASE_TYPES = Object.freeze(["Daily", "Weekly"]);

function normalizePurchaseType(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  return PURCHASE_TYPES.find((purchaseType) => purchaseType.toLowerCase() === normalized) || null;
}

function assertPurchaseType(value, options = {}) {
  const { required = true, defaultValue = null } = options;
  const normalized = normalizePurchaseType(value) || normalizePurchaseType(defaultValue);
  if (normalized || (!required && (value === undefined || value === null || String(value).trim() === ""))) {
    return normalized;
  }

  const error = new Error(`Purchase type must be one of: ${PURCHASE_TYPES.join(" or ")}.`);
  error.status = 400;
  throw error;
}

function assertPurchaseTypeQuery(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }
  return assertPurchaseType(value);
}

module.exports = {
  PURCHASE_TYPES,
  normalizePurchaseType,
  assertPurchaseType,
  assertPurchaseTypeQuery,
};
