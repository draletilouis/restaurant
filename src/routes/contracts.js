const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { resolveDeliveryType, resolvePaymentTerm } = require("../services/config-lookup-service");
const { getNextSequence } = require("../services/system-service");
const { getStatus } = require("../services/status-service");

function normalizeDeliveryDays(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeScheduleType(value) {
  const normalized = String(value || "Daily").trim().toLowerCase();
  if (normalized === "weekly") {
    return "Weekly";
  }
  if (normalized === "monthly") {
    return "Monthly";
  }
  if (normalized === "custom") {
    return "Custom";
  }
  return "Daily";
}

function normalizeContractSchedules(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((schedule) => ({
      scheduleType: normalizeScheduleType(schedule.scheduleType || schedule.schedule_type),
      dayOfWeek: schedule.dayOfWeek ?? schedule.day_of_week ?? null,
      dayOfMonth: schedule.dayOfMonth ?? schedule.day_of_month ?? null,
      specificDate: schedule.specificDate ?? schedule.specific_date ?? null,
      quantity: Number(schedule.quantity || 0),
      deliveryTime: schedule.deliveryTime ?? schedule.delivery_time ?? null,
      isActive: schedule.isActive !== false && schedule.is_active !== false,
    }))
    .filter((schedule) => schedule.scheduleType !== "Custom" || schedule.specificDate);
}

async function upsertContractParties(tx, payload) {
  const clientName = String(payload.clientName || "").trim();
  const locationName = String(payload.locationName || "").trim();
  let clientId = payload.clientId ? Number(payload.clientId) : null;
  let clientLocationId = payload.clientLocationId ? Number(payload.clientLocationId) : null;

  if (!clientName && !clientId) {
    const error = new Error("Client name is required.");
    error.status = 400;
    throw error;
  }

  if (!locationName && !clientLocationId) {
    const error = new Error("Delivery location name is required.");
    error.status = 400;
    throw error;
  }

  if (clientId && clientName) {
    const clientResult = await tx.exec(
      `UPDATE clients
       SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, updated_at = NOW()
       WHERE id = ?
       RETURNING *`,
      [
        clientName,
        payload.clientContactPerson || null,
        payload.clientPhone || null,
        payload.clientEmail || null,
        payload.clientAddress || null,
        clientId,
      ]
    );
    clientId = clientResult.rows[0]?.id || clientId;
  } else if (!clientId) {
    const clientResult = await tx.exec(
      `INSERT INTO clients (name, contact_person, phone, email, address, status)
       VALUES (?, ?, ?, ?, ?, 'Active')
       RETURNING *`,
      [
        clientName,
        payload.clientContactPerson || null,
        payload.clientPhone || null,
        payload.clientEmail || null,
        payload.clientAddress || null,
      ]
    );
    clientId = clientResult.rows[0].id;
  }

  if (clientLocationId && locationName) {
    const locationResult = await tx.exec(
      `UPDATE client_locations
       SET client_id = ?, name = ?, address = ?, contact_person = ?, phone = ?, delivery_notes = ?, updated_at = NOW()
       WHERE id = ?
       RETURNING *`,
      [
        clientId,
        locationName,
        payload.locationAddress || null,
        payload.locationContactPerson || null,
        payload.locationPhone || null,
        payload.locationDeliveryNotes || null,
        clientLocationId,
      ]
    );
    clientLocationId = locationResult.rows[0]?.id || clientLocationId;
  } else if (!clientLocationId) {
    const locationResult = await tx.exec(
      `INSERT INTO client_locations (client_id, name, address, contact_person, phone, delivery_notes, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        clientId,
        locationName,
        payload.locationAddress || null,
        payload.locationContactPerson || null,
        payload.locationPhone || null,
        payload.locationDeliveryNotes || null,
        true,
      ]
    );
    clientLocationId = locationResult.rows[0].id;
  }

  return { clientId, clientLocationId };
}

function createContractsRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const contracts = await db.all(
        `SELECT c.*, cl.name AS client_name, loc.name AS location_name,
                COALESCE(SUM(ci.quantity_per_delivery), 0) AS total_contract_quantity
         FROM contracts c
         INNER JOIN clients cl ON cl.id = c.client_id
         INNER JOIN client_locations loc ON loc.id = c.client_location_id
         LEFT JOIN contract_items ci ON ci.contract_id = c.id
         GROUP BY c.id, cl.name, loc.name
         ORDER BY c.created_at DESC`
      );
      res.json({ success: true, data: contracts });
    } catch (error) {
      next(error);
    }
  });

  router.get("/active", async (req, res, next) => {
    try {
      const contracts = await db.all(
        `SELECT c.*, cl.name AS client_name, loc.name AS location_name,
                COALESCE(SUM(ci.quantity_per_delivery), 0) AS total_contract_quantity
         FROM contracts c
         INNER JOIN clients cl ON cl.id = c.client_id
         INNER JOIN client_locations loc ON loc.id = c.client_location_id
         LEFT JOIN contract_items ci ON ci.contract_id = c.id
         WHERE c.status = 'Active'
         GROUP BY c.id, cl.name, loc.name
         ORDER BY c.start_date ASC`
      );
      res.json({ success: true, data: contracts });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const contract = await db.get(
        `SELECT c.*,
                cl.name AS client_name,
                cl.contact_person AS client_contact_person,
                cl.phone AS client_phone,
                cl.email AS client_email,
                cl.address AS client_address,
                loc.name AS location_name,
                loc.contact_person AS location_contact_person,
                loc.phone AS location_phone,
                loc.address AS location_address,
                loc.delivery_notes AS location_delivery_notes
         FROM contracts c
         INNER JOIN clients cl ON cl.id = c.client_id
         INNER JOIN client_locations loc ON loc.id = c.client_location_id
         WHERE c.id = ?`,
        [req.params.id]
      );
      if (!contract) {
        res.status(404).json({ success: false, message: "Contract not found" });
        return;
      }

      const [schedules, items, auditTrail] = await Promise.all([
        db.all("SELECT * FROM contract_schedules WHERE contract_id = ? ORDER BY id", [req.params.id]),
        db.all(
          `SELECT ci.*, p.name AS product_name
           FROM contract_items ci
           INNER JOIN products p ON p.id = ci.product_id
           WHERE ci.contract_id = ?
           ORDER BY ci.id`,
          [req.params.id]
        ),
        db.all(
          `SELECT *
           FROM audit_logs
           WHERE entity_type = 'contract' AND entity_id = ?
           ORDER BY created_at DESC`,
          [req.params.id]
        ),
      ]);

      res.json({ success: true, data: { contract, schedules, items, auditTrail } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const {
        clientId,
        clientLocationId,
        clientName,
        clientContactPerson,
        clientPhone,
        clientEmail,
        clientAddress,
        locationName,
        locationContactPerson,
        locationPhone,
        locationAddress,
        locationDeliveryNotes,
        startDate,
        endDate,
        billingCycle,
        paymentTerms,
        pricePerUnit,
        expectedDailyQuantity = 0,
        deliveryDays = [],
        notes,
        schedules = [],
        items = [],
      } = req.body;
      const normalizedSchedules = normalizeContractSchedules(schedules);
      const paymentTerm = await resolvePaymentTerm(db, req.body.paymentTermId, paymentTerms);
      const deliveryType = await resolveDeliveryType(db, req.body.deliveryTypeId, req.body.deliveryType || "Lunch");
      const draftStatus = await getStatus(db, "contracts", "draft", { fallbackName: "Draft" });

      const contract = await db.transaction(async (tx) => {
        const partyIds = await upsertContractParties(tx, {
          clientId,
          clientLocationId,
          clientName,
          clientContactPerson,
          clientPhone,
          clientEmail,
          clientAddress,
          locationName,
          locationContactPerson,
          locationPhone,
          locationAddress,
          locationDeliveryNotes,
        });
        const contractNumber = await getNextSequence(
          { ...db, get: tx.get.bind(tx) },
          "contractPrefix",
          "contracts",
          "contract_number"
        );
        const insertResult = await tx.exec(
          `INSERT INTO contracts
             (client_id, client_location_id, contract_number, start_date, end_date, billing_cycle, payment_terms, payment_term_id, delivery_type_id, price_per_unit, expected_daily_quantity, delivery_days, status_id, status, notes, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING *`,
          [
            partyIds.clientId,
            partyIds.clientLocationId,
            contractNumber,
            startDate,
            endDate,
            billingCycle,
            paymentTerm?.name || paymentTerms || null,
            paymentTerm?.id || null,
            deliveryType?.id || null,
            pricePerUnit || 0,
            expectedDailyQuantity || 0,
            normalizeDeliveryDays(deliveryDays),
            draftStatus?.id || null,
            draftStatus?.status_name || "Draft",
            notes || null,
            req.session.user.id,
          ]
        );

        for (const schedule of normalizedSchedules) {
          await tx.exec(
            `INSERT INTO contract_schedules
               (contract_id, schedule_type, day_of_week, day_of_month, specific_date, quantity, delivery_time, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              insertResult.rows[0].id,
              schedule.scheduleType,
              schedule.dayOfWeek ?? null,
              schedule.dayOfMonth ?? null,
              schedule.specificDate ?? null,
              schedule.quantity || 0,
              schedule.deliveryTime || null,
              schedule.isActive !== false,
            ]
          );
        }

        for (const item of items) {
          await tx.exec(
            `INSERT INTO contract_items
               (contract_id, product_id, service_unit, quantity_per_delivery, unit_price, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              insertResult.rows[0].id,
              item.productId,
              item.serviceUnit || "Meal",
              item.quantityPerDelivery || 0,
              item.unitPrice || 0,
              item.notes || null,
            ]
          );
        }

        return insertResult.rows[0];
      });

      await logAudit(db, req.session.user.id, "create", "contract", contract.id, req.body);
      res.status(201).json({ success: true, data: contract });
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      const {
        clientId,
        clientLocationId,
        clientName,
        clientContactPerson,
        clientPhone,
        clientEmail,
        clientAddress,
        locationName,
        locationContactPerson,
        locationPhone,
        locationAddress,
        locationDeliveryNotes,
        startDate,
        endDate,
        billingCycle,
        paymentTerms,
        pricePerUnit,
        expectedDailyQuantity = 0,
        deliveryDays = [],
        notes,
        schedules = [],
        items = [],
        status = "Draft",
      } = req.body;
      const normalizedSchedules = normalizeContractSchedules(schedules);
      const paymentTerm = await resolvePaymentTerm(db, req.body.paymentTermId, paymentTerms);
      const deliveryType = await resolveDeliveryType(db, req.body.deliveryTypeId, req.body.deliveryType || "Lunch");
      const statusRow = await getStatus(db, "contracts", status, { fallbackName: "Draft" });

      const contract = await db.transaction(async (tx) => {
        const partyIds = await upsertContractParties(tx, {
          clientId,
          clientLocationId,
          clientName,
          clientContactPerson,
          clientPhone,
          clientEmail,
          clientAddress,
          locationName,
          locationContactPerson,
          locationPhone,
          locationAddress,
          locationDeliveryNotes,
        });
        const updateResult = await tx.exec(
          `UPDATE contracts
           SET client_id = ?, client_location_id = ?, start_date = ?, end_date = ?, billing_cycle = ?, payment_terms = ?, payment_term_id = ?, delivery_type_id = ?,
               price_per_unit = ?, expected_daily_quantity = ?, delivery_days = ?, notes = ?, status_id = ?, status = ?, updated_at = NOW()
           WHERE id = ?
           RETURNING *`,
          [
            partyIds.clientId,
            partyIds.clientLocationId,
            startDate,
            endDate,
            billingCycle,
            paymentTerm?.name || paymentTerms || null,
            paymentTerm?.id || null,
            deliveryType?.id || null,
            pricePerUnit || 0,
            expectedDailyQuantity || 0,
            normalizeDeliveryDays(deliveryDays),
            notes || null,
            statusRow?.id || null,
            statusRow?.status_name || status,
            req.params.id,
          ]
        );

        await tx.exec("DELETE FROM contract_schedules WHERE contract_id = ?", [req.params.id]);
        await tx.exec("DELETE FROM contract_items WHERE contract_id = ?", [req.params.id]);

        for (const schedule of normalizedSchedules) {
          await tx.exec(
            `INSERT INTO contract_schedules
               (contract_id, schedule_type, day_of_week, day_of_month, specific_date, quantity, delivery_time, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              req.params.id,
              schedule.scheduleType,
              schedule.dayOfWeek ?? null,
              schedule.dayOfMonth ?? null,
              schedule.specificDate ?? null,
              schedule.quantity || 0,
              schedule.deliveryTime || null,
              schedule.isActive !== false,
            ]
          );
        }

        for (const item of items) {
          await tx.exec(
            `INSERT INTO contract_items
               (contract_id, product_id, service_unit, quantity_per_delivery, unit_price, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              req.params.id,
              item.productId,
              item.serviceUnit || "Meal",
              item.quantityPerDelivery || 0,
              item.unitPrice || 0,
              item.notes || null,
            ]
          );
        }

        return updateResult.rows[0];
      });

      await logAudit(db, req.session.user.id, "update", "contract", Number(req.params.id), req.body);
      res.json({ success: true, data: contract });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/activate", async (req, res, next) => {
    try {
      const contract = await db.get("SELECT * FROM contracts WHERE id = ?", [req.params.id]);
      if (!contract) {
        res.status(404).json({ success: false, message: "Contract not found" });
        return;
      }
      const activeStatus = await getStatus(db, "contracts", "active", { fallbackName: "Active" });
      const result = await db.exec(
        `UPDATE contracts
         SET status_id = ?, status = ?, approved_by = ?, updated_at = NOW()
         WHERE id = ?
         RETURNING *`,
        [activeStatus?.id || null, activeStatus?.status_name || "Active", req.session.user.id, req.params.id]
      );
      await logAudit(db, req.session.user.id, "activate", "contract", Number(req.params.id), {});
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/suspend", async (req, res, next) => {
    try {
      const contract = await db.get("SELECT * FROM contracts WHERE id = ?", [req.params.id]);
      if (!contract) {
        res.status(404).json({ success: false, message: "Contract not found" });
        return;
      }
      const suspendedStatus = await getStatus(db, "contracts", "suspended", { fallbackName: "Suspended" });
      const result = await db.exec(
        `UPDATE contracts
         SET status_id = ?, status = ?, approved_by = ?, updated_at = NOW()
         WHERE id = ?
         RETURNING *`,
        [suspendedStatus?.id || null, suspendedStatus?.status_name || "Suspended", req.session.user.id, req.params.id]
      );
      await logAudit(db, req.session.user.id, "suspend", "contract", Number(req.params.id), {});
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/expire", async (req, res, next) => {
    try {
      const contract = await db.get("SELECT * FROM contracts WHERE id = ?", [req.params.id]);
      if (!contract) {
        res.status(404).json({ success: false, message: "Contract not found" });
        return;
      }
      const expiredStatus = await getStatus(db, "contracts", "expired", { fallbackName: "Expired" });
      const result = await db.exec(
        `UPDATE contracts
         SET status_id = ?, status = ?, approved_by = ?, updated_at = NOW()
         WHERE id = ?
         RETURNING *`,
        [expiredStatus?.id || null, expiredStatus?.status_name || "Expired", req.session.user.id, req.params.id]
      );
      await logAudit(db, req.session.user.id, "expire", "contract", Number(req.params.id), {});
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createContractsRoutes;
