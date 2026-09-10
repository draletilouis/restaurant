const Database = require("../database/database");

function getCurrentPeriodParts(referenceDate = new Date()) {
  const date = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

function formatDocumentNumber(series, currentNumber) {
  const year = Number(series.current_year || getCurrentPeriodParts().year);
  return `${series.prefix}-${year}-${String(currentNumber).padStart(Number(series.padding_length || 4), "0")}`;
}

async function getSeriesByKey(db, seriesKey, options = {}) {
  return db.get(
    `SELECT *
     FROM numbering_series
     WHERE is_active = TRUE
       AND (document_key = ? OR document_type = ?)
     ORDER BY document_key = ? DESC, document_type = ? DESC
     LIMIT 1${options.forUpdate ? " FOR UPDATE" : ""}`,
    [seriesKey, seriesKey, seriesKey, seriesKey]
  );
}

async function generateNextNumber(db, seriesKey, options = {}) {
  const referenceDate = options.referenceDate ? new Date(options.referenceDate) : new Date();
  const period = getCurrentPeriodParts(referenceDate);
  const series = await getSeriesByKey(db, seriesKey, { forUpdate: options.forUpdate === true });

  if (!series) {
    const error = new Error(`No active numbering series configured for ${seriesKey}.`);
    error.status = 500;
    throw error;
  }

  let nextNumber = Number(series.current_number || 0) + 1;
  const resetFrequency = String(series.reset_frequency || "Never");
  const currentYear = Number(series.current_year || 0);
  const currentMonth = Number(series.current_month || 0);

  if (resetFrequency === "Yearly" && currentYear && currentYear !== period.year) {
    nextNumber = 1;
  }

  if (
    resetFrequency === "Monthly" &&
    currentYear &&
    currentMonth &&
    (currentYear !== period.year || currentMonth !== period.month)
  ) {
    nextNumber = 1;
  }

  const exec =
    (typeof db.exec === "function" && db.exec.bind(db)) ||
    (typeof db.run === "function" && db.run.bind(db)) ||
    (db.pool
      ? async (sql, params = []) => db.pool.query(Database.toPgSql(sql), params)
      : null);

  if (!exec) {
    const error = new Error("Numbering series requires a database executor.");
    error.status = 500;
    throw error;
  }

  await exec(
    `UPDATE numbering_series
     SET current_number = ?, current_year = ?, current_month = ?, updated_at = NOW()
     WHERE id = ?`,
    [nextNumber, period.year, period.month, series.id]
  );

  return formatDocumentNumber(
    {
      ...series,
      current_year: period.year,
      current_month: period.month,
      current_number: nextNumber,
    },
    nextNumber
  );
}

module.exports = {
  formatDocumentNumber,
  generateNextNumber,
  getSeriesByKey,
  getCurrentPeriodParts,
};
