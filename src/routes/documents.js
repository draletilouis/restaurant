const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { getDocumentDefinition, renderDocument } = require("../services/document-export-service");

function createDocumentRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/:type/:id/:format", async (req, res, next) => {
    try {
      const { type, id, format } = req.params;
      const definition = getDocumentDefinition(type);
      if (!definition) {
        res.status(400).json({ success: false, message: "Unknown document type" });
        return;
      }
      const normalizedFormat = String(format || "pdf").toLowerCase();
      if (!["pdf", "xlsx", "html"].includes(normalizedFormat)) {
        res.status(400).json({ success: false, message: "format must be pdf, xlsx, or html" });
        return;
      }

      const exported = await renderDocument(db, type, id, normalizedFormat);
      if (!exported) {
        res.status(404).json({ success: false, message: "Document not found" });
        return;
      }

      await logAudit(db, req.session.user.id, `export_${normalizedFormat}`, definition.entityType, Number(id), {
        documentNumber: exported.payload.number,
        format: normalizedFormat,
      });

      if (normalizedFormat === "html") {
        res.setHeader("Content-Type", exported.contentType);
        res.send(exported.body);
        return;
      }

      res.set({
        "Content-Type": exported.contentType,
        "Content-Disposition": `attachment; filename="${exported.filename}"`,
        "Content-Length": exported.body.length,
      });
      res.end(exported.body);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createDocumentRoutes;
