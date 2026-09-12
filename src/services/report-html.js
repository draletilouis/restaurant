const { escapeHtml, getBusinessProfileHeader } = require("./branded-document");

function esc(value) {
  return escapeHtml(value == null ? "" : String(value));
}

function fmtDate(value) {
  if (!value) return "â€”";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtCurrency(amount) {
  const n = Number(amount || 0);
  return n.toLocaleString("en-UG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtQty(value) {
  const n = Number(value || 0);
  return n.toLocaleString("en-UG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatCell(value, format) {
  if (format === "date") return fmtDate(value);
  if (format === "currency") return fmtCurrency(value);
  if (format === "number" || format === "percent") return fmtQty(value);
  if (value == null || value === "") return "â€”";
  return String(value);
}

function buildCSS() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;650;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      font-size: 9.5pt;
      color: #202924;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .rpt-letterhead { padding: 8mm 14mm 0; }
    .rpt-header-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) auto minmax(0, 1fr);
      align-items: end;
      gap: 0 16px;
      padding-bottom: 8px;
    }
    .rpt-logo-panel { display: flex; align-items: end; min-height: 56px; }
    .rpt-logo-panel img {
      width: 148px;
      height: 56px;
      object-fit: contain;
      object-position: left center;
      display: block;
    }
    .rpt-logo-fallback {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.4px;
      color: #0e6b66;
      line-height: 1.2;
    }
    .rpt-header-copy { text-align: center; align-self: end; padding: 0 8px 2px; }
    .rpt-strip-title {
      font-size: 14pt;
      font-weight: 700;
      letter-spacing: -0.3px;
      line-height: 1.2;
      color: #202924;
    }
    .rpt-gen-line {
      font-size: 8pt;
      font-weight: 500;
      color: #667085;
      margin-top: 1.5mm;
    }
    .rpt-contact-card {
      text-align: right;
      display: flex;
      flex-direction: column;
      justify-content: end;
      min-height: 56px;
    }
    .rpt-contact-line { font-size: 9pt; color: #344054; line-height: 1.45; }
    .rpt-contact-line.primary { font-size: 10.5pt; font-weight: 700; color: #202924; }
    .rpt-meta-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      align-items: center;
      padding: 8px 14mm;
      border-top: 1pt solid #d0d5dd;
      border-bottom: 2pt solid #0e6b66;
      margin-bottom: 3mm;
    }
    .rpt-meta-col { text-align: center; padding: 0 4mm; }
    .rpt-meta-col:not(:last-child) { border-right: 0.5pt solid #e4e7ec; }
    .rpt-meta-label {
      font-size: 7pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #667085;
      margin-bottom: 1mm;
    }
    .rpt-meta-value { font-size: 9.5pt; font-weight: 600; color: #202924; }
    .rpt-kpi-row {
      display: flex;
      flex-wrap: wrap;
      gap: 2.5mm;
      padding: 0 14mm 4mm;
    }
    .rpt-kpi {
      min-width: 28mm;
      padding: 2.5mm 3.5mm;
      border: 1pt solid #e4e7ec;
      border-radius: 2mm;
      background: #f8faf9;
    }
    .rpt-kpi-label {
      font-size: 6.5pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #667085;
      margin-bottom: 0.8mm;
    }
    .rpt-kpi-value {
      font-size: 11pt;
      font-weight: 700;
      color: #0e6b66;
      letter-spacing: -0.2px;
    }
    .rpt-content { padding: 2mm 14mm 8mm; }
    .rpt-table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; font-size: 8.2pt; }
    .rpt-table thead th {
      border-bottom: 1.25pt solid #0e6b66;
      border-top: 0;
      text-align: left;
      padding: 2.2mm 2mm;
      font-size: 7pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #475467;
      background: #f5f7f5;
    }
    .rpt-table thead th.num { text-align: right; }
    .rpt-table tbody tr:nth-child(even) td { background: #fafbfa; }
    .rpt-table tbody td { padding: 2.2mm 2mm; border-bottom: 0.5pt solid #eef0ee; vertical-align: top; }
    .rpt-table tbody td.num { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
    .rpt-table tfoot td {
      padding: 2.5mm 2mm;
      border-top: 1.25pt solid #0e6b66;
      font-weight: 700;
      background: #f5f7f5;
    }
    .rpt-table tfoot { display: table-row-group; }
    .rpt-table tfoot td.num { text-align: right; }
    .rpt-empty {
      text-align: center;
      padding: 10mm 6mm;
      color: #667085;
      border: 1pt dashed #d0d5dd;
      border-radius: 2mm;
      background: #fafbfa;
    }
    .rpt-empty strong { display: block; color: #202924; margin-bottom: 1.5mm; font-size: 10pt; }
    .rpt-empty span { font-size: 8.5pt; }
  `;
}

function buildHeader(meta) {
  const {
    title,
    businessName,
    businessEmail,
    businessPhone,
    businessLocation,
    logoDataUri,
    from,
    to,
    operator,
    recordCount,
  } = meta;
  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const profileHeader = getBusinessProfileHeader({
    business_name: businessName,
    owner_email: businessEmail,
    business_phone: businessPhone,
    business_location: businessLocation,
  });
  const contactLines = [
    profileHeader.primaryName,
    ...profileHeader.lines.map((line) => line.text),
  ].filter(Boolean);
  const periodStr =
    from && to ? `${fmtDate(from)} â€“ ${fmtDate(to)}` : from || to || "Current snapshot";

  return `
  <div class="rpt-letterhead">
    <div class="rpt-header-grid">
      <div class="rpt-logo-panel">
        ${
          logoDataUri
            ? `<img id="biz-logo" src="${logoDataUri}" alt="${esc(profileHeader.primaryName || "Lefori")}">`
            : `<div class="rpt-logo-fallback">${esc(profileHeader.primaryName || "Lefori")}</div>`
        }
      </div>
      <div class="rpt-header-copy">
        <div class="rpt-strip-title">${esc(title)}</div>
      <div class="rpt-gen-line">Generated: ${generatedAt} · ${esc(operator || "System")}</div>
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
      <div class="rpt-meta-label">Report period</div>
      <div class="rpt-meta-value">${esc(periodStr)}</div>
    </div>
    <div class="rpt-meta-col">
      <div class="rpt-meta-label">Document</div>
      <div class="rpt-meta-value">${esc(title)}</div>
    </div>
    <div class="rpt-meta-col">
      <div class="rpt-meta-label">Records</div>
      <div class="rpt-meta-value">${recordCount || 0}</div>
    </div>
  </div>`;
}

function buildKpis(summary = []) {
  if (!summary.length) return "";
  return `
    <div class="rpt-kpi-row">
      ${summary
        .map(
          (item) => `
        <div class="rpt-kpi">
          <div class="rpt-kpi-label">${esc(item.label)}</div>
          <div class="rpt-kpi-value">${esc(item.display || formatCell(item.value, item.format || "text"))}</div>
        </div>`
        )
        .join("")}
    </div>`;
}

function isNumericFormat(format) {
  return format === "number" || format === "currency" || format === "percent";
}

function resolveColumns(report, forPdf) {
  if (forPdf && Array.isArray(report.columnsPdf) && report.columnsPdf.length) {
    return report.columnsPdf;
  }
  return report.columns || [];
}

function buildTable(columns, rows, meta = {}) {
  const headers = columns
    .map(
      (column) =>
        `<th class="${isNumericFormat(column.format) ? "num" : ""}">${esc(column.header)}</th>`
    )
    .join("");

  if (!rows.length) {
    const periodLabel =
      meta.from && meta.to
        ? `${fmtDate(meta.from)} â€“ ${fmtDate(meta.to)}`
        : "the selected range";
    return `
      <div class="rpt-empty">
        <strong>No activity in this range</strong>
        <span>Nothing matched ${esc(periodLabel)}. Widen the dates or confirm records exist.</span>
      </div>`;
  }

  const body = rows
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
      if (!isNumericFormat(column.format) || column.format === "percent") {
        return index === 0 ? `<td>Total â€” ${rows.length} records</td>` : "<td></td>";
      }
      const sum = rows.reduce((acc, row) => acc + Number(row[column.key] || 0), 0);
      return `<td class="num">${esc(formatCell(sum, column.format))}</td>`;
    })
    .join("");

  return `
    <table class="rpt-table">
      <thead><tr>${headers}</tr></thead>
      <tbody>${body}</tbody>
      <tfoot><tr>${totals}</tr></tfoot>
    </table>
  `;
}

function buildReportHTML(report, meta) {
  const columns = resolveColumns(report, true);
  const landscape = Boolean(report.landscape) || columns.length > 8;
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${esc(report.title)}</title>
<style>${buildCSS()}</style>
</head>
<body>
  ${buildHeader({ ...meta, title: report.title, type: report.type, recordCount: (report.rows || []).length })}
  ${buildKpis(report.summary || [])}
  <div class="rpt-content">
    ${buildTable(columns, report.rows || [], meta)}
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

  return { html, landscape };
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
