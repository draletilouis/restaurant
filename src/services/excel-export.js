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

function excelLogoExtension(mimeType) {
  const mime = String(mimeType || "").trim().toLowerCase();
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpeg";
  if (mime === "image/gif") return "gif";
  return null;
}

function paintBrandBar(sheet, lastCol = 5) {
  for (let col = 1; col <= lastCol; col += 1) {
    sheet.getCell(1, col).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0E6B66" },
    };
  }
}

function applyBrandingHeader(workbook, sheet, business) {
  const name = business?.business_name || "Cater ERP";
  const extension = excelLogoExtension(business?.logo_mime_type);
  const hasLogo = Boolean(extension && business?.logo_data);

  paintBrandBar(sheet, 5);
  sheet.getRow(1).height = hasLogo ? 48 : 28;

  if (hasLogo) {
    const imageId = workbook.addImage({
      base64: String(business.logo_data).replace(/\s+/g, ""),
      extension,
    });
    sheet.mergeCells("B1:E1");
    const nameCell = sheet.getCell("B1");
    nameCell.value = name;
    nameCell.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
    nameCell.alignment = { vertical: "middle", horizontal: "left" };
    sheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 44, height: 44 },
    });
    return;
  }

  sheet.mergeCells("A1:E1");
  const cell = sheet.getCell("A1");
  cell.value = name;
  cell.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  cell.alignment = { vertical: "middle", horizontal: "left" };
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

  applyBrandingHeader(workbook, sheet, business);

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
  business = null,
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Cater ERP";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sanitizeSheetName(sheetName));
  if (business) {
    applyBrandingHeader(workbook, sheet, business);
    sheet.mergeCells("A2:E2");
    sheet.getCell("A2").value = title;
    sheet.getCell("A2").font = { size: 14, bold: true };
  } else {
    sheet.mergeCells("A1:E1");
    sheet.getCell("A1").value = title;
    sheet.getCell("A1").font = { size: 16, bold: true };
  }

  const headerRowIndex = business ? 4 : 3;
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
