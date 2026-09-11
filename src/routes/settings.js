const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { getSettingsBundle, updateSettingsBundle } = require("../services/settings-service");

function createSettingsRoutes(db) {
  const router = express.Router();

  router.get("/public-branding", async (req, res, next) => {
    try {
      const configuration = await getSettingsBundle(db);
      const profile = configuration?.profile || {};
      res.json({
        success: true,
        data: {
          businessName: profile.businessName || "Lefori",
          logoData: profile.logoData || null,
          logoMimeType: profile.logoMimeType || null,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const configuration = await getSettingsBundle(db);
      res.json({ success: true, data: configuration });
    } catch (error) {
      next(error);
    }
  });

  router.put("/", requireRole("admin"), async (req, res, next) => {
    try {
      const configuration = await updateSettingsBundle(db, req.body || {});
      const auditPayload =
        req.body?.profile?.logoData
          ? {
              ...req.body,
              profile: {
                ...req.body.profile,
                logoData: "[omitted]",
              },
            }
          : req.body || {};
      await logAudit(db, req.session.user.id, "update", "settings", 1, auditPayload);
      res.json({
        success: true,
        message: "Settings updated successfully",
        data: configuration,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createSettingsRoutes;
