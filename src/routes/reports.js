const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { getBusinessBranding } = require("../services/branded-document");
const { fetchReport, getReportCatalog, getReportDefinition, normalizeRange } = require("../services/report-data-service");
const { buildReportHTML } = require("../services/report-html");
const { buildReportWorkbook } = require("../services/report-workbook-service");
const { renderToPDF } = require("../services/pdf-generator");

function sendExport(res, contentType, filename, body) {
  res.set({
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
  });
  if (Buffer.isBuffer(body)) {
    res.set("Content-Length", body.length);
    res.end(body);
    return;
  }
  res.send(body);
}

function createReportsRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  async function handleExport(req, res, next) {
    try {
      const type = req.query.type;
      const format = String(req.query.format || "pdf").toLowerCase();
      const definition = getReportDefinition(type);
      if (!definition) {
        res.status(400).json({ success: false, message: "Invalid report type." });
        return;
      }
      if (definition.periodRequired && (!req.query.startDate || !req.query.endDate)) {
        res.status(400).json({ success: false, message: "startDate and endDate are required." });
        return;
      }

      const range = normalizeRange(req.query, 30);
      const report = await fetchReport(db, type, range);
      const branding = await getBusinessBranding(db);
      const operator = req.session.user.fullName || req.session.user.full_name || req.session.user.username || "System";
      const periodLabel = report.period?.startDate
        ? `${report.period.startDate}_to_${report.period.endDate}`
        : "current";
      const safeTitle = report.title.replace(/\s+/g, "_");

      await logAudit(
        db,
        req.session.user.id,
        `export_${format}`,
        "report",
        null,
        { type, format, startDate: range.startDate, endDate: range.endDate }
      );

      if (format === "xlsx") {
        const buffer = await buildReportWorkbook(report, branding);
        sendExport(
          res,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          `${safeTitle}_${periodLabel}.xlsx`,
          Buffer.from(buffer)
        );
        return;
      }

      const { html, landscape } = buildReportHTML(report, {
        businessName: branding.business.business_name,
        businessEmail: branding.business.owner_email,
        businessPhone: branding.business.business_phone,
        businessLocation: branding.business.business_location,
        logoDataUri: branding.logoDataUri,
        from: range.startDate,
        to: range.endDate,
        operator,
        type: report.type,
      });

      if (format === "html") {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(html);
        return;
      }

      if (format !== "pdf") {
        res.status(400).json({ success: false, message: "format must be pdf, xlsx, or html." });
        return;
      }

      const pdfBuffer = await renderToPDF(html, { landscape });
      sendExport(res, "application/pdf", `${safeTitle}_${periodLabel}.pdf`, pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  router.get("/catalog", async (req, res, next) => {
    try {
      res.json({ success: true, data: getReportCatalog() });
    } catch (error) {
      next(error);
    }
  });

  router.get("/export", handleExport);
  router.get("/pdf", handleExport);

  router.get("/:type", async (req, res, next) => {
    try {
      const definition = getReportDefinition(req.params.type);
      if (!definition) {
        res.status(404).json({ success: false, message: "Report not found" });
        return;
      }
      const report = await fetchReport(db, req.params.type, req.query);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createReportsRoutes;
