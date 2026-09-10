const DEFAULT_STATUS_COLOR = "#98A2B3";

function normalizeStatusKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toTitleCase(value) {
  return String(value || "")
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

async function getStatus(db, moduleKey, statusKey, options = {}) {
  const normalized = normalizeStatusKey(statusKey || options.fallbackName);
  if (!normalized) {
    return null;
  }

  const status = await db.get(
    `SELECT *
     FROM statuses
     WHERE is_active = TRUE
       AND (module_key = ? OR module_key = 'global')
       AND (status_code = ? OR LOWER(status_name) = LOWER(?))
     ORDER BY CASE WHEN module_key = ? THEN 0 ELSE 1 END, sort_order ASC, status_name ASC
     LIMIT 1`,
    [moduleKey || "global", normalized, statusKey || options.fallbackName || normalized, moduleKey || "global"]
  );

  if (status) {
    return status;
  }

  if (options.allowFallback === false) {
    return null;
  }

  return {
    id: null,
    module_key: moduleKey || "global",
    status_name: toTitleCase(statusKey || options.fallbackName || normalized),
    status_code: normalized,
    color: options.fallbackColor || DEFAULT_STATUS_COLOR,
    sort_order: 999,
    is_terminal: false,
    is_active: true,
  };
}

async function resolveStatusName(db, moduleKey, statusKey, options = {}) {
  const status = await getStatus(db, moduleKey, statusKey, options);
  return status?.status_name || null;
}

async function listStatuses(db, moduleKey = null) {
  if (moduleKey) {
    return db.all(
      `SELECT *
       FROM statuses
       WHERE is_active = TRUE
         AND (module_key = ? OR module_key = 'global')
       ORDER BY sort_order ASC, status_name ASC`,
      [moduleKey]
    );
  }

  return db.all(
    `SELECT *
     FROM statuses
     WHERE is_active = TRUE
     ORDER BY module_key ASC, sort_order ASC, status_name ASC`
  );
}

module.exports = {
  DEFAULT_STATUS_COLOR,
  getStatus,
  listStatuses,
  normalizeStatusKey,
  resolveStatusName,
  toTitleCase,
};
