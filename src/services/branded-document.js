"use strict";

const { ensureSettingsSchema } = require("./settings-service");

const DEFAULT_ACCENT_COLOR = "#0e6b66";
const DEFAULT_DOCUMENT_SETTINGS = {
  currencyCode: "UGX",
  taxLabel: "VAT",
  purchaseOrderPrefix: "PO",
  goodsReceiptPrefix: "GRN",
  cateringOrderPrefix: "CO",
  invoicePrefix: "INV",
  requisitionPrefix: "REQ",
  documentDesign: {
    template: "modern",
    accentColor: DEFAULT_ACCENT_COLOR,
    headerNote: "",
    showBusinessContact: true,
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function formatCurrency(value, currencyCode = "UGX") {
  return `${currencyCode} ` + Math.round(Number(value || 0)).toLocaleString("en-UG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return escapeHtml(value);
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function getBusinessBranding(db) {
  await ensureSettingsSchema(db);

  const business = await db.get(
    `SELECT business_name, business_phone, business_location, owner_email, logo_data, logo_mime_type
     FROM business_profile
     ORDER BY id ASC
     LIMIT 1`
  );
  const settingsRow = await db.get(
    `SELECT settings
     FROM app_settings
     WHERE id = 1`
  );

  const fallbackBusiness = business || {
    business_name: "Cater ERP",
    business_phone: "",
    business_location: "",
    owner_email: "",
    logo_data: null,
    logo_mime_type: null,
  };

  const logoDataUri = fallbackBusiness.logo_data
    ? `data:${fallbackBusiness.logo_mime_type};base64,${fallbackBusiness.logo_data}`
    : null;
  const settings = {
    ...DEFAULT_DOCUMENT_SETTINGS,
    ...(settingsRow?.settings || {}),
  };

  return {
    business: fallbackBusiness,
    logoDataUri,
    settings,
  };
}

function formatDocumentCode(prefix, id) {
  return `${prefix}-${String(id).padStart(6, "0")}`;
}

function buildMetaRowsHtml(rows = []) {
  return rows
    .filter((row) => row && row.value !== undefined && row.value !== null && row.value !== "")
    .map((row) => {
      const toneClass = row.tone === "danger" ? " tone-danger" : "";
      const boldClass = row.bold ? " bold" : "";
      return `
        <div class="meta-row">
          <span class="meta-lbl">${escapeHtml(row.label)}</span>
          <span class="meta-val${boldClass}${toneClass}">: ${escapeHtml(row.value)}</span>
        </div>`;
    })
    .join("");
}

function buildBrandedDocumentHtml({
  business,
  logoDataUri,
  titleWord,
  documentLabel,
  documentNumber,
  documentDate,
  leftMetaRows = [],
  rightMetaRows = [],
  notes = "",
  bodyHtml = "",
  showSignature = true,
  signatureLabel = "Authorized Signature",
  documentSettings = null,
}) {
  const notesHtml = notes
    ? `
      <div class="note-card">
        <div class="note-title">Notes</div>
        <div class="note-body">${escapeHtml(notes)}</div>
      </div>`
    : "";
  const accentColor = resolveAccentColor(documentSettings || DEFAULT_DOCUMENT_SETTINGS);
  const profileHeader = getBusinessProfileHeader(business || {});
  const signatureHtml = showSignature
    ? `
      <div class="signature-section">
        <div class="approval-grid">
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">${escapeHtml(signatureLabel)}</div>
          </div>
        </div>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  :root {
    --sp-xs: 4px;
    --sp-sm: 8px;
    --sp-md: 14px;
    --sp-lg: 20px;
    --sp-xl: 30px;
    --sp-2xl: 44px;
    --text-sm: 13px;
    --text-md: 14px;
    --text-lg: 16px;
    --color-text: #1a1a1a;
    --color-muted: #555555;
    --color-border: #cccccc;
    --color-danger: #c0392b;
    --color-surface: #f4f5f7;
    --color-accent: ${escapeHtml(accentColor)};
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 210mm; height: 297mm; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: var(--text-md);
    color: var(--color-text);
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 14mm 16mm 12mm;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) auto minmax(0, 1fr);
    align-items: end;
    gap: 0 var(--sp-lg);
    padding-bottom: 10px;
  }

  .header-logo img {
    width: 200px;
    height: 80px;
    object-fit: contain;
    object-position: left center;
  }

  .header-logo-fallback {
    font-size: 26px;
    font-weight: 700;
    color: var(--color-text);
    text-transform: uppercase;
    line-height: 1.2;
  }

  .header-title {
    text-align: center;
    align-self: end;
    padding: 0 10px 4px;
  }

  .document-word {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: var(--color-accent);
    line-height: 1.08;
    white-space: nowrap;
  }

  .header-biz { text-align: right; }

  .biz-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.6;
  }

  .biz-detail {
    font-size: 14px;
    color: var(--color-text);
    line-height: 1.65;
  }

  .sub-header {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 10px 0 8px;
    border-top: 1px solid var(--color-border);
    border-bottom: 2px solid var(--color-accent);
    margin-bottom: var(--sp-xl);
    font-size: var(--text-sm);
  }

  .sub-left { color: var(--color-muted); font-weight: 600; }
  .sub-mid {
    font-size: 13px;
    font-weight: 700;
    text-align: center;
    white-space: nowrap;
    letter-spacing: 0.9px;
    text-transform: uppercase;
  }
  .sub-right { text-align: right; color: var(--color-muted); }

  .meta-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 var(--sp-2xl);
    margin-bottom: var(--sp-lg);
  }

  .meta-row {
    display: flex;
    gap: var(--sp-sm);
    padding: 2px 0;
    font-size: var(--text-md);
    line-height: 1.6;
  }

  .meta-lbl {
    color: var(--color-muted);
    min-width: 100px;
    flex-shrink: 0;
  }

  .meta-val { color: var(--color-text); }
  .meta-val.bold { font-weight: 700; }
  .meta-val.tone-danger { color: var(--color-danger); }

  .note-card {
    margin-bottom: var(--sp-lg);
    padding: 12px 14px;
    border: 1px solid #d0d0d0;
    background: var(--color-surface);
  }

  .note-title {
    font-size: var(--text-sm);
    font-weight: 700;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  .note-body { line-height: 1.6; white-space: pre-wrap; }

  .items-section {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: var(--text-md);
  }

  thead tr { background: #f0f0f0; }

  thead th {
    padding: 10px 12px;
    font-size: var(--text-md);
    font-weight: 700;
    color: var(--color-text);
    border: 1px solid #d0d0d0;
  }

  tbody td {
    padding: 10px 12px;
    font-size: var(--text-md);
    vertical-align: middle;
    border: 1px solid #d0d0d0;
    white-space: normal;
    word-break: break-word;
  }

  tfoot tr td {
    padding: 7px 12px;
    font-size: var(--text-md);
    color: var(--color-muted);
    border: none;
  }

  tfoot .tf-label { text-align: left; }
  tfoot tr td:last-child { text-align: right; }
  tfoot .tf-sep td { border-top: 1px solid #d0d0d0 !important; }
  tfoot .tf-discount td { color: var(--color-danger); }
  tfoot .tf-total td {
    font-weight: 700;
    font-size: var(--text-lg);
    color: var(--color-accent);
    border-top: 1px solid #d0d0d0 !important;
    padding: 10px 12px;
  }
  tfoot .tf-total-cell { white-space: nowrap; }
  tfoot .tf-total-line {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 24px;
    white-space: nowrap;
  }
  tfoot .tf-total-line .tf-label,
  tfoot .tf-total-line .tf-value {
    display: inline-block;
    white-space: nowrap;
  }
  tfoot .tf-total-line .tf-value { text-align: right; }

  .signature-section {
    margin-top: 18px;
    display: flex;
    justify-content: flex-end;
  }
  .approval-grid {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    gap: 12mm;
  }
  .signature-block { width: 68mm; }
  .signature-line {
    border-top: 1px solid var(--color-text);
    height: 1px;
  }
  .signature-label {
    margin-top: 8px;
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .col-sku { width: 18%; text-align: left; }
  .col-unit { width: 12%; text-align: center; }
  .col-batch { width: 16%; text-align: left; }
  .col-name { width: 34%; text-align: left; }
  .col-qty { width: 10%; text-align: center; }
  .col-price { width: 19%; text-align: right; }
  .col-total { width: 19%; text-align: right; }

</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-logo">
      ${logoDataUri
        ? `<img id="biz-logo" src="${logoDataUri}" alt="${escapeHtml(profileHeader.primaryName)}">`
        : `<div class="header-logo-fallback">${escapeHtml(profileHeader.mark)}</div>`}
    </div>
    <div class="header-title">
      <div class="document-word">${escapeHtml(titleWord)}</div>
    </div>
    <div class="header-biz">
      <div class="biz-name">${escapeHtml(business?.business_name || "")}</div>
      ${business?.business_location ? `<div class="biz-detail">${escapeHtml(business.business_location)}</div>` : ""}
      ${business?.business_phone ? `<div class="biz-detail">Tel: ${escapeHtml(business.business_phone)}</div>` : ""}
      ${business?.owner_email ? `<div class="biz-detail">${escapeHtml(business.owner_email)}</div>` : ""}
    </div>
  </div>

  <div class="sub-header">
    <div class="sub-left">${escapeHtml(documentLabel)}</div>
    <div class="sub-mid"># ${escapeHtml(documentNumber)}</div>
    <div class="sub-right">${formatDate(documentDate)}</div>
  </div>

  <div class="meta-section">
    <div class="meta-col">${buildMetaRowsHtml(leftMetaRows)}</div>
    <div class="meta-col">${buildMetaRowsHtml(rightMetaRows)}</div>
  </div>

  ${notesHtml}

  <div class="items-section">${bodyHtml}</div>

  ${signatureHtml}

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
    var minX = c.width;
    var minY = c.height;
    var maxX = 0;
    var maxY = 0;
    var found = false;

    for (var y = 0; y < c.height; y++) {
      for (var x = 0; x < c.width; x++) {
        var i = (y * c.width + x) * 4;
        var r = px[i];
        var g = px[i + 1];
        var b = px[i + 2];
        var a = px[i + 3];
        var isContent = a > 15 && !(r > 240 && g > 240 && b > 240);
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

    var w = maxX - minX + 1;
    var h = maxY - minY + 1;
    var out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    out.getContext("2d").drawImage(c, minX, minY, w, h, 0, 0, w, h);
    img.src = out.toDataURL("image/png");
  }

  if (img.complete && img.naturalWidth) {
    trimWhitespace();
  } else {
    img.onload = trimWhitespace;
  }
})();
</script>
</body>
</html>`;
}

function getBusinessMark(value) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "C";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function resolveAccentColor(documentSettings = {}) {
  const color = String(documentSettings?.documentDesign?.accentColor || DEFAULT_ACCENT_COLOR).trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_ACCENT_COLOR;
}

function getBusinessProfileHeader(business = {}) {
  const primaryName = String(business.business_name || "Cater ERP").trim();
  const lines = [];
  if (business.business_location) {
    lines.push({ text: business.business_location });
  }
  if (business.business_phone) {
    lines.push({ text: `Tel: ${business.business_phone}` });
  }
  if (business.owner_email) {
    lines.push({ text: business.owner_email });
  }
  return {
    primaryName,
    mark: getBusinessMark(primaryName),
    lines,
  };
}

module.exports = {
  buildBrandedDocumentHtml,
  escapeHtml,
  formatCurrency,
  formatDate,
  formatDocumentCode,
  getBusinessBranding,
  getBusinessMark,
  getBusinessProfileHeader,
  resolveAccentColor,
};
