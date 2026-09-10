"use strict";

const ExcelJS = require("exceljs");
const { formatCurrency, formatDate } = require("./branded-document");

function sanitizeSheetName(name) {
  return String(name || "Sheet").replace(/[\\/*?:[\]]/g, " ").slice(0, 31);
}

function applyHeaderRowStyle(row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0E6B66" },
  };
  row.alignment = { vertical: "middle", horizontal: "center" };
}

function configureColumns(sheet, columns) {
  columns.forEach((column, index) => {
    sheet.getColumn(index + 1).width = column.width || 20;
  });
}

async function renderWorkbook({
  business,
  title,
  documentLabel,
  documentNumber,
  documentDate,
  leftMetaRows = [],
  rightMetaRows = [],
  notes = "",
  columns = [],
  rows = [],
  totals = [],
  sheetName = "Document",
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Cater ERP";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sanitizeSheetName(sheetName), {
    views: [{ state: "frozen", ySplit: 7 }],
  });

  sheet.mergeCells("A1:E1");
  sheet.getCell("A1").value = business?.business_name || "Cater ERP";
  sheet.getCell("A1").font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0E6B66" },
  };
  sheet.getRow(1).height = 28;

  sheet.mergeCells("A2:E2");
  sheet.getCell("A2").value = title;
  sheet.getCell("A2").font = { size: 14, bold: true, color: { argb: "FF0E6B66" } };

  sheet.getCell("A3").value = documentLabel;
  sheet.getCell("B3").value = documentNumber;
  sheet.getCell("D3").value = "Date";
  sheet.getCell("E3").value = formatDate(documentDate);

  let metaRow = 5;
  const metaRows = Math.max(leftMetaRows.length, rightMetaRows.length);
  for (let index = 0; index < metaRows; index += 1) {
    const left = leftMetaRows[index];
    const right = rightMetaRows[index];
    if (left) {
      sheet.getCell(`A${metaRow}`).value = left.label;
      sheet.getCell(`B${metaRow}`).value = left.value;
    }
    if (right) {
      sheet.getCell(`D${metaRow}`).value = right.label;
      sheet.getCell(`E${metaRow}`).value = right.value;
    }
    metaRow += 1;
  }

  if (notes) {
    sheet.mergeCells(`A${metaRow}:E${metaRow}`);
    sheet.getCell(`A${metaRow}`).value = `Notes: ${notes}`;
    sheet.getCell(`A${metaRow}`).alignment = { wrapText: true };
    metaRow += 2;
  } else {
    metaRow += 1;
  }

  const headerRowIndex = metaRow;
  configureColumns(sheet, columns);
  const headerRow = sheet.getRow(headerRowIndex);
  columns.forEach((column, index) => {
    headerRow.getCell(index + 1).value = column.header;
  });
  applyHeaderRowStyle(headerRow);
  headerRow.commit();

  rows.forEach((rowData, rowOffset) => {
    const row = sheet.getRow(headerRowIndex + 1 + rowOffset);
    columns.forEach((column, index) => {
      row.getCell(index + 1).value = rowData[column.key];
    });
    row.commit();
  });

  const bodyStart = headerRowIndex + 1;
  const bodyEnd = sheet.rowCount;
  if (bodyEnd >= bodyStart) {
    for (let rowIndex = bodyStart; rowIndex <= bodyEnd; rowIndex += 1) {
      const row = sheet.getRow(rowIndex);
      row.alignment = { vertical: "top", wrapText: true };
    }
  }

  if (totals.length) {
    sheet.addRow([]);
    totals.forEach((item) => {
      const totalRow = Array.from({ length: Math.max(columns.length, 2) }, () => "");
      totalRow[totalRow.length - 2] = item.label;
      totalRow[totalRow.length - 1] = item.value;
      const row = sheet.addRow(totalRow);
      row.font = { bold: true };
      row.alignment = { vertical: "middle", wrapText: false };
    });
  }

  sheet.getColumn(Math.max(columns.length - 1, 1)).alignment = { horizontal: "right" };
  sheet.getColumn(Math.max(columns.length, 2)).alignment = { horizontal: "right" };

  return workbook.xlsx.writeBuffer();
}

async function renderTableWorkbook({
  title,
  sheetName = "Export",
  columns = [],
  rows = [],
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Cater ERP";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sanitizeSheetName(sheetName));
  sheet.mergeCells("A1:E1");
  sheet.getCell("A1").value = title;
  sheet.getCell("A1").font = { size: 16, bold: true };

  const headerRowIndex = 3;
  configureColumns(sheet, columns);
  const headerRow = sheet.getRow(headerRowIndex);
  columns.forEach((column, index) => {
    headerRow.getCell(index + 1).value = column.header;
  });
  applyHeaderRowStyle(headerRow);
  headerRow.commit();
  rows.forEach((rowData, rowOffset) => {
    const row = sheet.getRow(headerRowIndex + 1 + rowOffset);
    columns.forEach((column, index) => {
      row.getCell(index + 1).value = rowData[column.key];
    });
    row.commit();
  });
  return workbook.xlsx.writeBuffer();
}

module.exports = {
  formatCurrency,
  renderWorkbook,
  renderTableWorkbook,
};
