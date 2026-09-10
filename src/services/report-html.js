"use strict";

const { escapeHtml, getBusinessProfileHeader } = require("./branded-document");

function esc(value) {
  return escapeHtml(value);
}

function fmtDate(value) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtCurrency(amount, includeSymbol = false) {
  const value = Number(amount || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return includeSymbol ? `UGX\u00a0${value}` : value;
}

function fmtQty(value) {
  const number = Number(value || 0);
  return number % 1 === 0 ? number.toLocaleString() : number.toFixed(2);
}

function formatCell(value, format) {
  if (format === "currency") return fmtCurrency(value, true);
  if (format === "number") return fmtQty(value);
  if (format === "percent") return `${fmtQty(value)}%`;
  if (format === "date") return fmtDate(value);
  return value == null || value === "" ? "—" : String(value);
}

function buildCSS() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Montserrat', Arial, Helvetica, sans-serif;
      font-size: 9.5pt;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .rpt-letterhead { padding: 8mm 15mm 0; }
    .rpt-header-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) auto minmax(0, 1fr);
      align-items: end;
      gap: 0 18px;
      padding-bottom: 10px;
    }
    .rpt-logo-panel { display: flex; align-items: end; min-height: 80px; }
    .rpt-logo-panel img {
      width: 200px;
      height: 80px;
      object-fit: contain;
      object-position: left center;
      display: block;
    }
    .rpt-logo-fallback {
      font-size: 26px;
      font-weight: 700;
      color: #000;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .rpt-header-copy { text-align: center; align-self: end; padding: 0 10px 4px; }
    .rpt-strip-title {
      font-size: 16pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      line-height: 1.15;
      color: #000;
    }
    .rpt-gen-line {
      font-size: 8pt;
      font-weight: 600;
      color: #444;
      margin-top: 1.5mm;
    }
    .rpt-contact-card {
      text-align: right;
      display: flex;
      flex-direction: column;
      justify-content: end;
      min-height: 80px;
    }
    .rpt-contact-line { font-size: 14px; color: #000; line-height: 1.65; }
    .rpt-contact-line.primary { font-size: 16px; font-weight: 700; line-height: 1.6; }
    .rpt-meta-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      align-items: center;
      padding: 10px 15mm 8px;
      border-top: 1pt solid #cccccc;
      border-bottom: 2pt solid #000;
      margin-bottom: 4mm;
    }
    .rpt-meta-col { text-align: center; padding: 0 5mm; }
    .rpt-meta-col:not(:last-child) { border-right: 0.5pt solid #cbd5e1; }
    .rpt-meta-label {
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      margin-bottom: 1mm;
    }
    .rpt-meta-value { font-size: 9.5pt; font-weight: 700; }
    .rpt-content { padding: 4mm 15mm; }
    .rpt-table { width: 100%; border-collapse: collapse; margin-bottom: 6mm; font-size: 8.5pt; }
    .rpt-table thead th {
      border-bottom: 1pt solid #000;
      border-top: 0.5pt solid #ccc;
      background: #fff;
      color: #000;
      padding: 3mm 2.5mm;
      text-align: left;
      font-size: 7.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .rpt-table thead th.num { text-align: right; }
    .rpt-table tbody tr:nth-child(even) td { background: #fafafa; }
    .rpt-table tbody td { padding: 2.5mm 2.5mm; border-bottom: 0.5pt solid #eee; }
    .rpt-table tbody td.num { text-align: right; font-weight: 700; }
    .rpt-table tfoot td {
      border-top: 1pt solid #000;
      border-bottom: 2pt solid #000;
      padding: 2.5mm 2.5mm;
      font-weight: 800;
      font-size: 9pt;
    }
    .rpt-table tfoot { display: table-row-group; }
    .rpt-table tfoot td.num { text-align: right; }
    .rpt-summary { margin-top: 8mm; page-break-inside: avoid; }
    .rpt-summary-title {
      font-size: 8.5pt;
      font-weight: 800;
      text-transform: uppercase;
      border-bottom: 1.5pt solid #000;
      padding-bottom: 1.5mm;
      margin-bottom: 3mm;
    }
    .rpt-summary-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
    .rpt-summary-table thead th {
      text-align: left;
      padding: 2mm 3mm;
      font-size: 7.5pt;
      font-weight: 800;
      text-transform: uppercase;
      border-bottom: 1pt solid #000;
      background: #f8f8f8;
    }
    .rpt-summary-table thead th.num,
    .rpt-summary-table tbody td.num,
    .rpt-summary-table tfoot td.num { text-align: right; }
    .rpt-summary-table tbody td { padding: 2.5mm 3mm; border-bottom: 0.5pt solid #eee; }
    .rpt-summary-table tfoot td {
      background: #eee;
      font-weight: 800;
      padding: 2.5mm 3mm;
      border-top: 1pt solid #000;
    }
  `;
}

function buildHeader(meta) {
  const {
    businessName,
    businessEmail,
    businessPhone,
    businessLocation,
    logoDataUri,
    title,
    from,
    to,
    operator,
    recordCount,
    type,
  } = meta;
  const isDateless = type === "inventory";
  const periodStr = isDateless ? "As of today" : `${from} to ${to}`;
  const generatedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  const profileHeader = getBusinessProfileHeader({
    business_name: businessName,
    business_location: businessLocation,
    business_phone: businessPhone,
    owner_email: businessEmail,
  });
  const contactLines = [
    profileHeader.primaryName,
    ...profileHeader.lines.map((line) => line.text),
  ].filter(Boolean);

  return `
    <div class="rpt-letterhead">
      <div class="rpt-header-grid">
        <div class="rpt-logo-panel">
          ${
            logoDataUri
              ? `<img id="biz-logo" src="${esc(logoDataUri)}" alt="${esc(businessName)} logo">`
              : `<div class="rpt-logo-fallback">${esc(profileHeader.mark || "C")}</div>`
          }
        </div>
        <div class="rpt-header-copy">
          <div class="rpt-strip-title">${esc(title)}</div>
          <div class="rpt-gen-line">Generated: ${generatedAt} | Operator: ${esc(operator)}</div>
        </div>
        <div class="rpt-contact-card">
          ${contactLines
            .map(
              (line, index) =>
                `<div class="rpt-contact-line${index === 0 ? " primary" : ""}">${esc(line)}</div>`
            )
            .join("")}
        </div>
      </div>
    </div>
    <div class="rpt-meta-bar">
      <div class="rpt-meta-col">
        <div class="rpt-meta-label">Report Period</div>
        <div class="rpt-meta-value">${esc(periodStr)}</div>
      </div>
      <div class="rpt-meta-col">
        <div class="rpt-meta-label">Document Type</div>
        <div class="rpt-meta-value">${esc(title)}</div>
      </div>
      <div class="rpt-meta-col">
        <div class="rpt-meta-label">Total Records</div>
        <div class="rpt-meta-value">${recordCount || 0} Entries</div>
      </div>
    </div>
  `;
}

function isNumericFormat(format) {
  return format === "currency" || format === "number" || format === "percent";
}

function buildTable(columns, rows) {
  const headers = columns
    .map(
      (column) =>
        `<th class="${isNumericFormat(column.format) ? "num" : ""}">${esc(column.header)}</th>`
    )
    .join("");
  const body =
    rows.length === 0
      ? `<tr><td colspan="${columns.length}" style="text-align:center;padding:6mm;color:#64748b;">No records found.</td></tr>`
      : rows
          .map((row) => {
            const cells = columns
              .map((column) => {
                const numeric = isNumericFormat(column.format);
                return `<td class="${numeric ? "num" : ""}">${esc(
                  formatCell(row[column.key], column.format)
                )}</td>`;
              })
              .join("");
            return `<tr>${cells}</tr>`;
          })
          .join("");

  const totals = columns
    .map((column, index) => {
      if (column.total === false) {
        return index === 0 ? "<td>Total</td>" : "<td></td>";
      }
      if (!isNumericFormat(column.format)) {
        return index === 0 ? `<td>Total &mdash; ${rows.length} Records</td>` : "<td></td>";
      }
      const sum = rows.reduce((acc, row) => acc + Number(row[column.key] || 0), 0);
      return `<td class="num">${esc(formatCell(sum, column.format === "percent" ? "number" : column.format))}</td>`;
    })
    .join("");

  return `
    <table class="rpt-table">
      <thead><tr>${headers}</tr></thead>
      <tbody>${body}</tbody>
      ${rows.length ? `<tfoot><tr>${totals}</tr></tfoot>` : ""}
    </table>
  `;
}

function buildSummary(summary = []) {
  if (!summary.length) {
    return "";
  }
  const rows = summary
    .map(
      (item) => `
        <tr>
          <td>${esc(item.label)}</td>
          <td class="num">${esc(item.display || formatCell(item.value, item.format || "text"))}</td>
        </tr>`
    )
    .join("");
  return `
    <div class="rpt-summary">
      <div class="rpt-summary-title">Summary</div>
      <table class="rpt-summary-table">
        <thead><tr><th>Metric</th><th class="num">Value</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function buildReportHTML(report, meta) {
  const landscape = Boolean(report.landscape) || (report.columns || []).length > 8;
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${esc(report.title)}</title>
<style>${buildCSS()}</style>
</head>
<body>
  ${buildHeader({ ...meta, title: report.title, type: report.type, recordCount: (report.rows || []).length })}
  <div class="rpt-content">
    ${buildSummary(report.summary || [])}
    ${buildTable(report.columns || [], report.rows || [])}
  </div>
  <script>
  (function () {
    var img = document.getElementById("biz-logo");
    if (!img) return;
    function trimWhitespace() {
      var c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      var ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      var px = ctx.getImageData(0, 0, c.width, c.height).data;
      var minX = c.width, minY = c.height, maxX = 0, maxY = 0, found = false;
      for (var y = 0; y < c.height; y++) {
        for (var x = 0; x < c.width; x++) {
          var i = (y * c.width + x) * 4;
          var isContent = px[i + 3] > 15 && !(px[i] > 240 && px[i + 1] > 240 && px[i + 2] > 240);
          if (isContent) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            found = true;
          }
        }
      }
      if (!found || maxX <= minX || maxY <= minY) return;
      var pad = 3;
      minX = Math.max(0, minX - pad);
      minY = Math.max(0, minY - pad);
      maxX = Math.min(c.width - 1, maxX + pad);
      maxY = Math.min(c.height - 1, maxY + pad);
      var out = document.createElement("canvas");
      out.width = maxX - minX + 1;
      out.height = maxY - minY + 1;
      out.getContext("2d").drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
      img.src = out.toDataURL("image/png");
    }
    if (img.complete && img.naturalWidth) trimWhitespace();
    else img.onload = trimWhitespace;
  })();
  </script>
</body>
</html>`;

  return {
    html,
    landscape,
  };
}

module.exports = {
  buildCSS,
  buildHeader,
  buildReportHTML,
  esc,
  fmtCurrency,
  fmtDate,
  fmtQty,
};
