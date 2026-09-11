"use strict";

const ExcelJS = require("exceljs");
const { formatCurrency, formatDate } = require("./branded-document");

const HEADER_FILL = "0E6B66";
const MONEY_FORMAT = "#,##0;[Red](#,##0);-";
const COUNT_FORMAT = "#,##0.00";

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value).slice(0, 10);
  const parsed = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? text : parsed;
}

function sanitizeSheetName(name) {
  return String(name || "Report").replace(/[\\/*?:[\]]/g, " ").slice(0, 31);
}

function excelLogoExtension(mimeType) {
  const mime = String(mimeType || "").trim().toLowerCase();
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpeg";
  if (mime === "image/gif") return "gif";
  return null;
}

function embedWorkbookLogo(workbook, sheet, business) {
  const extension = excelLogoExtension(business?.logo_mime_type);
  if (!extension || !business?.logo_data) return;
  const imageId = workbook.addImage({
    base64: String(business.logo_data).replace(/\s+/g, ""),
    extension,
  });
  sheet.getRow(1).height = Math.max(sheet.getRow(1).height || 30, 48);
  sheet.addImage(imageId, {
    tl: { col: 0, row: 0 },
    ext: { width: 40, height: 40 },
  });
}


function styleTitle(sheet, title, subtitle, columnCount) {
  const lastColumn = Math.max(columnCount, 4);
  sheet.mergeCells(1, 1, 1, lastColumn);
  sheet.getCell(1, 1).value = title;
  sheet.getCell(1, 1).font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
  sheet.getCell(1, 1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: `FF${HEADER_FILL}` },
  };
  sheet.getCell(1, 1).alignment = { vertical: "middle" };
  sheet.getRow(1).height = 30;

  sheet.mergeCells(2, 1, 2, lastColumn);
  sheet.getCell(2, 1).value = subtitle;
  sheet.getCell(2, 1).font = { color: { argb: "FF475569" }, italic: true };
  sheet.getRow(2).height = 22;
  sheet.views = [{ state: "frozen", ySplit: 4 }];
  sheet.properties.showGridLines = false;
}

function styleTableHeader(row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: `FF${HEADER_FILL}` },
  };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 24;
}

function excelFormat(column) {
  if (column.format === "currency") return MONEY_FORMAT;
  if (column.format === "number" || column.format === "percent") return COUNT_FORMAT;
  if (column.format === "date") return "yyyy-mm-dd";
  return null;
}

async function buildReportWorkbook(report, branding = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Cater ERP";
  workbook.created = new Date();

  const columns = report.columns || [];
  const rows = report.rows || [];
  const period = report.period || {};
  const businessName = branding.business?.business_name || "Cater ERP";
  const periodLabel =
    period.startDate && period.endDate
      ? `${period.startDate} to ${period.endDate}`
      : "Current snapshot";

  const sheet = workbook.addWorksheet(sanitizeSheetName(report.title), {
    views: [{ state: "frozen", ySplit: 4 }],
  });
  styleTitle(sheet, report.title, `${businessName} | ${periodLabel}`, columns.length);
  embedWorkbookLogo(workbook, sheet, branding.business);

  (report.summary || []).forEach((item, index) => {
    const row = sheet.getRow(3);
    if (index === 0) {
      row.getCell(1).value = "Summary";
      row.getCell(1).font = { bold: true };
    }
  });

  if (report.summary?.length) {
    const summarySheet = workbook.addWorksheet("Summary");
    styleTitle(summarySheet, `${report.title} Summary`, `${businessName} | ${periodLabel}`, 3);
    embedWorkbookLogo(workbook, summarySheet, branding.business);
    const header = summarySheet.getRow(4);
    header.getCell(1).value = "Metric";
    header.getCell(2).value = "Value";
    styleTableHeader(header);
    summarySheet.getColumn(1).width = 36;
    summarySheet.getColumn(2).width = 24;
    report.summary.forEach((item) => {
      const row = summarySheet.addRow([
        item.label,
        item.format === "currency" ? number(item.value) : item.display || item.value,
      ]);
      if (item.format === "currency") {
        row.getCell(2).numFmt = MONEY_FORMAT;
      }
    });
  }

  const headerRow = sheet.getRow(4);
  columns.forEach((column, index) => {
    headerRow.getCell(index + 1).value = column.header;
    sheet.getColumn(index + 1).width = column.width || 18;
    const numFmt = excelFormat(column);
    if (numFmt) {
      sheet.getColumn(index + 1).numFmt = numFmt;
    }
  });
  styleTableHeader(headerRow);

  if (!rows.length) {
    sheet.getCell(5, 1).value = "No records for this reporting period.";
    sheet.getCell(5, 1).font = { italic: true, color: { argb: "FF64748B" } };
  } else {
    rows.forEach((row) => {
      const values = columns.map((column) => {
        if (column.format === "currency" || column.format === "number" || column.format === "percent") {
          return number(row[column.key]);
        }
        if (column.format === "date") {
          return dateValue(row[column.key]);
        }
        return row[column.key] ?? "";
      });
      sheet.addRow(values);
    });
    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: columns.length },
    };
  }

  return workbook.xlsx.writeBuffer();
}

function formatSummaryLine(report) {
  return (report.summary || [])
    .map((item) => `${item.label}: ${item.display || item.value}`)
    .join("  |  ");
}

module.exports = {
  buildReportWorkbook,
  formatCurrency,
  formatDate,
  formatSummaryLine,
};
