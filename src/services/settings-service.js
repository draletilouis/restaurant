"use strict";

const DEFAULT_SETTINGS = {
  currencyCode: "UGX",
  taxLabel: "VAT",
  contractPrefix: "CTR",
  purchaseRequisitionPrefix: "PRQ",
  purchaseOrderPrefix: "PO",
  goodsReceivedPrefix: "GRN",
  kitchenRequisitionPrefix: "KRQ",
  storeIssuePrefix: "ISS",
  productionBatchPrefix: "PBN",
  stockAdjustmentPrefix: "ADJ",
  stockReturnPrefix: "RET",
  physicalCountPrefix: "CNT",
  defaultTheme: "light",
  workspaceDensity: "comfortable",
  defaultLanguage: "en",
  requirePurchaseApproval: false,
  requireRequisitionApproval: true,
  requireInvoiceApproval: false,
};

const BUSINESS_PROFILE_DEFAULTS = {
  businessName: "Cater ERP",
  businessPhone: "",
  businessLocation: "",
  ownerEmail: "",
  businessType: "catering",
  logoData: null,
  logoMimeType: null,
};

let schemaReadyPromise = null;

async function ensureSettingsSchema(db) {
  if (schemaReadyPromise) {
    return schemaReadyPromise;
  }

  schemaReadyPromise = (async () => {
    try {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS app_settings (
          id INTEGER PRIMARY KEY,
          settings JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      await db.exec(`
        ALTER TABLE business_profile
        ADD COLUMN IF NOT EXISTS business_type VARCHAR(40) NOT NULL DEFAULT 'catering'
      `);
    } catch (error) {
      if (!/pg_type_typname_nsp_index|already exists/i.test(String(error.message || ""))) {
        throw error;
      }
    }

    await db.exec(
      `INSERT INTO app_settings (id, settings)
       VALUES (1, ?::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [JSON.stringify(DEFAULT_SETTINGS)]
    );
  })().catch((error) => {
    schemaReadyPromise = null;
    throw error;
  });

  return schemaReadyPromise;
}

function normalizeBusinessProfile(profile = {}) {
  const normalizedMimeType = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(
    String(profile.logoMimeType || "").trim().toLowerCase()
  )
    ? String(profile.logoMimeType || "").trim().toLowerCase()
    : null;
  const normalizedLogoData = normalizedMimeType
    ? String(profile.logoData || "")
        .trim()
        .replace(/\s+/g, "")
    : "";
  const safeLogoData =
    normalizedMimeType && /^[A-Za-z0-9+/=]+$/.test(normalizedLogoData) && normalizedLogoData.length <= 3_000_000
      ? normalizedLogoData
      : null;

  return {
    businessName: String(profile.businessName || BUSINESS_PROFILE_DEFAULTS.businessName).trim() || BUSINESS_PROFILE_DEFAULTS.businessName,
    businessPhone: String(profile.businessPhone || "").trim(),
    businessLocation: String(profile.businessLocation || "").trim(),
    ownerEmail: String(profile.ownerEmail || "").trim(),
    businessType: String(profile.businessType || BUSINESS_PROFILE_DEFAULTS.businessType).trim().toLowerCase() === "restaurant"
      ? "restaurant"
      : "catering",
    logoData: safeLogoData,
    logoMimeType: safeLogoData ? normalizedMimeType : null,
  };
}

function normalizeSettings(settings = {}) {
  const merged = {
    ...DEFAULT_SETTINGS,
    ...(settings || {}),
  };

  return {
    currencyCode: String(merged.currencyCode || DEFAULT_SETTINGS.currencyCode).trim().toUpperCase().slice(0, 6) || DEFAULT_SETTINGS.currencyCode,
    taxLabel: String(merged.taxLabel || DEFAULT_SETTINGS.taxLabel).trim().slice(0, 20) || DEFAULT_SETTINGS.taxLabel,
    contractPrefix: String(merged.contractPrefix || DEFAULT_SETTINGS.contractPrefix).trim().toUpperCase().slice(0, 10) || DEFAULT_SETTINGS.contractPrefix,
    purchaseRequisitionPrefix:
      String(merged.purchaseRequisitionPrefix || DEFAULT_SETTINGS.purchaseRequisitionPrefix).trim().toUpperCase().slice(0, 10) ||
      DEFAULT_SETTINGS.purchaseRequisitionPrefix,
    purchaseOrderPrefix: String(merged.purchaseOrderPrefix || DEFAULT_SETTINGS.purchaseOrderPrefix).trim().toUpperCase().slice(0, 10) || DEFAULT_SETTINGS.purchaseOrderPrefix,
    goodsReceivedPrefix:
      String(merged.goodsReceivedPrefix || DEFAULT_SETTINGS.goodsReceivedPrefix).trim().toUpperCase().slice(0, 10) ||
      DEFAULT_SETTINGS.goodsReceivedPrefix,
    kitchenRequisitionPrefix:
      String(merged.kitchenRequisitionPrefix || DEFAULT_SETTINGS.kitchenRequisitionPrefix).trim().toUpperCase().slice(0, 10) ||
      DEFAULT_SETTINGS.kitchenRequisitionPrefix,
    storeIssuePrefix: String(merged.storeIssuePrefix || DEFAULT_SETTINGS.storeIssuePrefix).trim().toUpperCase().slice(0, 10) || DEFAULT_SETTINGS.storeIssuePrefix,
    productionBatchPrefix:
      String(merged.productionBatchPrefix || DEFAULT_SETTINGS.productionBatchPrefix).trim().toUpperCase().slice(0, 10) ||
      DEFAULT_SETTINGS.productionBatchPrefix,
    stockAdjustmentPrefix:
      String(merged.stockAdjustmentPrefix || DEFAULT_SETTINGS.stockAdjustmentPrefix).trim().toUpperCase().slice(0, 10) ||
      DEFAULT_SETTINGS.stockAdjustmentPrefix,
    stockReturnPrefix:
      String(merged.stockReturnPrefix || DEFAULT_SETTINGS.stockReturnPrefix).trim().toUpperCase().slice(0, 10) ||
      DEFAULT_SETTINGS.stockReturnPrefix,
    physicalCountPrefix:
      String(merged.physicalCountPrefix || DEFAULT_SETTINGS.physicalCountPrefix).trim().toUpperCase().slice(0, 10) ||
      DEFAULT_SETTINGS.physicalCountPrefix,
    defaultTheme: merged.defaultTheme === "dark" ? "dark" : "light",
    workspaceDensity: merged.workspaceDensity === "compact" ? "compact" : "comfortable",
    defaultLanguage: merged.defaultLanguage === "sw" ? "sw" : "en",
    requirePurchaseApproval: merged.requirePurchaseApproval === true,
    requireRequisitionApproval: merged.requireRequisitionApproval !== false,
    requireInvoiceApproval: merged.requireInvoiceApproval === true,
  };
}

async function getSettingsBundle(db) {
  await ensureSettingsSchema(db);

  const profileRow = await db.get(
    `SELECT business_name, business_phone, business_location, owner_email, business_type, logo_data, logo_mime_type
     FROM business_profile
     ORDER BY id ASC
     LIMIT 1`
  );
  const settingsRow = await db.get(`SELECT settings FROM app_settings WHERE id = 1`);

  return {
    profile: normalizeBusinessProfile({
      businessName: profileRow?.business_name,
      businessPhone: profileRow?.business_phone,
      businessLocation: profileRow?.business_location,
      ownerEmail: profileRow?.owner_email,
      businessType: profileRow?.business_type,
      logoData: profileRow?.logo_data,
      logoMimeType: profileRow?.logo_mime_type,
    }),
    settings: normalizeSettings(settingsRow?.settings || {}),
  };
}

async function updateSettingsBundle(db, payload = {}) {
  await ensureSettingsSchema(db);

  const current = await getSettingsBundle(db);
  const incomingProfile = payload.profile || {};
  const profileSource = { ...incomingProfile };

  if (incomingProfile.clearLogo === true) {
    profileSource.logoData = null;
    profileSource.logoMimeType = null;
  } else if (!Object.prototype.hasOwnProperty.call(incomingProfile, "logoData")) {
    profileSource.logoData = current.profile.logoData;
    profileSource.logoMimeType = current.profile.logoMimeType;
  }

  const profile = normalizeBusinessProfile(profileSource);
  const settings = normalizeSettings({
    ...current.settings,
    ...(payload.settings || {}),
  });

  await db.transaction(async (tx) => {
    const profileExists = await tx.get(`SELECT id FROM business_profile ORDER BY id ASC LIMIT 1`);

    if (profileExists) {
      await tx.exec(
        `UPDATE business_profile
         SET business_name = ?, business_phone = ?, business_location = ?, owner_email = ?, business_type = ?, logo_data = ?, logo_mime_type = ?
         WHERE id = ?`,
        [
          profile.businessName,
          profile.businessPhone || null,
          profile.businessLocation || null,
          profile.ownerEmail || null,
          profile.businessType,
          profile.logoData,
          profile.logoMimeType,
          profileExists.id,
        ]
      );
    } else {
      await tx.exec(
        `INSERT INTO business_profile (
           business_name, business_phone, business_location, owner_email, business_type, logo_data, logo_mime_type
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          profile.businessName,
          profile.businessPhone || null,
          profile.businessLocation || null,
          profile.ownerEmail || null,
          profile.businessType,
          profile.logoData,
          profile.logoMimeType,
        ]
      );
    }

    await tx.exec(
      `INSERT INTO app_settings (id, settings, updated_at)
       VALUES (1, ?::jsonb, NOW())
       ON CONFLICT (id)
       DO UPDATE SET settings = EXCLUDED.settings, updated_at = NOW()`,
      [JSON.stringify(settings)]
    );
  });

  return getSettingsBundle(db);
}

module.exports = {
  BUSINESS_PROFILE_DEFAULTS,
  DEFAULT_SETTINGS,
  ensureSettingsSchema,
  getSettingsBundle,
  normalizeSettings,
  updateSettingsBundle,
};
