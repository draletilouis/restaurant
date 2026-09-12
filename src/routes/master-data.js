const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { getConfigurationReferenceData, syncConfigurationMirrors } = require("../services/configuration-service");
const { getStatus } = require("../services/status-service");

async function resolvePaymentTerm(db, paymentTermId, paymentTerms) {
  if (paymentTermId) {
    const row = await db.get("SELECT id, name FROM payment_terms WHERE id = ?", [paymentTermId]);
    if (row) {
      return row;
    }
  }

  if (paymentTerms) {
    const row = await db.get("SELECT id, name FROM payment_terms WHERE LOWER(name) = LOWER(?)", [paymentTerms]);
    if (row) {
      return row;
    }
  }

  return null;
}

function createMasterDataRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/overview", async (req, res, next) => {
    try {
      const [clients, suppliers, products, units, categories, storeLocations] = await Promise.all([
        db.all("SELECT * FROM clients ORDER BY name"),
        db.all("SELECT * FROM suppliers ORDER BY name"),
        db.all(
          `SELECT p.*, pc.name AS category_name, uom.code AS unit_code, s.name AS default_supplier_name
           FROM products p
           LEFT JOIN product_categories pc ON pc.id = p.product_category_id
           LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
           LEFT JOIN suppliers s ON s.id = p.default_supplier_id
           ORDER BY p.name`
        ),
        db.all("SELECT * FROM units_of_measure ORDER BY name"),
        db.all("SELECT * FROM product_categories ORDER BY name"),
        db.all("SELECT * FROM store_locations ORDER BY name"),
      ]);

      res.json({
        success: true,
        data: {
          clients,
          suppliers,
          products,
          units,
          categories,
          storeLocations,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/clients", async (req, res, next) => {
    try {
      const clients = await db.all(
        `SELECT c.*,
                COALESCE(COUNT(cl.id), 0)::int AS location_count,
                COALESCE(COUNT(ct.id) FILTER (WHERE ct.status = 'Active'), 0)::int AS active_contract_count
         FROM clients c
         LEFT JOIN client_locations cl ON cl.client_id = c.id
         LEFT JOIN contracts ct ON ct.client_id = c.id
         GROUP BY c.id
         ORDER BY c.name`
      );
      res.json({ success: true, data: clients });
    } catch (error) {
      next(error);
    }
  });

  router.post("/clients", async (req, res, next) => {
    try {
      const { name, contactPerson, phone, email, address, status = "Active" } = req.body;
      const statusRow = await getStatus(db, "global", status, { fallbackName: "Active" });
      const result = await db.exec(
        `INSERT INTO clients (name, contact_person, phone, email, address, status_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         RETURNING *`,
        [name, contactPerson || null, phone || null, email || null, address || null, statusRow?.id || null, statusRow?.status_name || status]
      );
      await logAudit(db, req.session.user.id, "create", "client", result.rows[0].id, req.body);
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.put("/clients/:id", async (req, res, next) => {
    try {
      const { name, contactPerson, phone, email, address, status } = req.body;
      const statusRow = await getStatus(db, "global", status || "Active", { fallbackName: "Active" });
      const result = await db.exec(
        `UPDATE clients
         SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, status_id = ?, status = ?, updated_at = NOW()
         WHERE id = ?
         RETURNING *`,
        [
          name,
          contactPerson || null,
          phone || null,
          email || null,
          address || null,
          statusRow?.id || null,
          statusRow?.status_name || "Active",
          req.params.id,
        ]
      );
      await logAudit(db, req.session.user.id, "update", "client", Number(req.params.id), req.body);
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.get("/clients/:id", async (req, res, next) => {
    try {
      const client = await db.get("SELECT * FROM clients WHERE id = ?", [req.params.id]);
      if (!client) {
        res.status(404).json({ success: false, message: "Client not found" });
        return;
      }
      const [locations, contracts, auditTrail] = await Promise.all([
        db.all("SELECT * FROM client_locations WHERE client_id = ? ORDER BY name", [req.params.id]),
        db.all("SELECT * FROM contracts WHERE client_id = ? ORDER BY created_at DESC", [req.params.id]),
        db.all(
          `SELECT *
           FROM audit_logs
           WHERE entity_type = 'client' AND entity_id = ?
           ORDER BY created_at DESC`,
          [req.params.id]
        ),
      ]);
      res.json({ success: true, data: { client, locations, contracts, auditTrail } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/client-locations", async (req, res, next) => {
    try {
      const { clientId, name, address, contactPerson, phone, deliveryNotes, isActive = true } = req.body;
      const result = await db.exec(
        `INSERT INTO client_locations (client_id, name, address, contact_person, phone, delivery_notes, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         RETURNING *`,
        [clientId, name, address || null, contactPerson || null, phone || null, deliveryNotes || null, isActive]
      );
      await logAudit(db, req.session.user.id, "create", "client_location", result.rows[0].id, req.body);
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.get("/suppliers", async (req, res, next) => {
    try {
      const suppliers = await db.all(
        `SELECT s.*,
                COALESCE(SUM(si.total_amount - si.amount_paid), 0) AS balance_due
         FROM suppliers s
         LEFT JOIN supplier_invoices si ON si.supplier_id = s.id
         GROUP BY s.id
         ORDER BY s.name`
      );
      res.json({ success: true, data: suppliers });
    } catch (error) {
      next(error);
    }
  });

  router.post("/suppliers", async (req, res, next) => {
    try {
      const { name, contactPerson, phone, email, address, paymentTerms, status = "Active" } = req.body;
      const paymentTerm = await resolvePaymentTerm(db, req.body.paymentTermId, paymentTerms);
      const statusRow = await getStatus(db, "global", status, { fallbackName: "Active" });
      const result = await db.exec(
        `INSERT INTO suppliers (name, contact_person, phone, email, address, payment_terms, payment_term_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`,
        [
          name,
          contactPerson || null,
          phone || null,
          email || null,
          address || null,
          paymentTerm?.name || paymentTerms || null,
          paymentTerm?.id || null,
          statusRow?.status_name || status,
        ]
      );
      await logAudit(db, req.session.user.id, "create", "supplier", result.rows[0].id, req.body);
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.put("/suppliers/:id", async (req, res, next) => {
    try {
      const { name, contactPerson, phone, email, address, paymentTerms, status = "Active" } = req.body;
      const paymentTerm = await resolvePaymentTerm(db, req.body.paymentTermId, paymentTerms);
      const statusRow = await getStatus(db, "global", status, { fallbackName: "Active" });
      const result = await db.exec(
        `UPDATE suppliers
         SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, payment_terms = ?, payment_term_id = ?, status = ?, updated_at = NOW()
         WHERE id = ?
         RETURNING *`,
        [
          name,
          contactPerson || null,
          phone || null,
          email || null,
          address || null,
          paymentTerm?.name || paymentTerms || null,
          paymentTerm?.id || null,
          statusRow?.status_name || status,
          req.params.id,
        ]
      );
      await logAudit(db, req.session.user.id, "update", "supplier", Number(req.params.id), req.body);
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.get("/products", async (req, res, next) => {
    try {
      const products = await db.all(
        `SELECT p.*, pc.name AS category_name, uom.code AS unit_code, s.name AS default_supplier_name
         FROM products p
         LEFT JOIN product_categories pc ON pc.id = p.product_category_id
         LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
         LEFT JOIN suppliers s ON s.id = p.default_supplier_id
         ORDER BY p.name`
      );
      res.json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  });

  router.post("/products", async (req, res, next) => {
    try {
      const {
        name,
        sku,
        productType = "Raw Material",
        productCategoryId,
        unitOfMeasureId,
        minimumStockLevel = 0,
        reorderLevel = 0,
        standardCost = 0,
        isPerishable = false,
        defaultSupplierId,
        status = "Active",
        description,
      } = req.body;

      const result = await db.exec(
        `INSERT INTO products
           (name, sku, product_type, product_category_id, unit_of_measure_id, minimum_stock_level, reorder_level, standard_cost, is_perishable, default_supplier_id, status, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`,
        [
          name,
          sku || null,
          productType,
          productCategoryId || null,
          unitOfMeasureId || null,
          minimumStockLevel,
          reorderLevel,
          standardCost,
          Boolean(isPerishable),
          defaultSupplierId || null,
          status,
          description || null,
        ]
      );
      await logAudit(db, req.session.user.id, "create", "product", result.rows[0].id, req.body);
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.put("/products/:id", async (req, res, next) => {
    try {
      const {
        name,
        sku,
        productType = "Raw Material",
        productCategoryId,
        unitOfMeasureId,
        minimumStockLevel = 0,
        reorderLevel = 0,
        standardCost = 0,
        isPerishable = false,
        defaultSupplierId,
        status = "Active",
        description,
      } = req.body;

      const result = await db.exec(
        `UPDATE products
         SET name = ?, sku = ?, product_type = ?, product_category_id = ?, unit_of_measure_id = ?, minimum_stock_level = ?,
             reorder_level = ?, standard_cost = ?, is_perishable = ?, default_supplier_id = ?, status = ?, description = ?, updated_at = NOW()
         WHERE id = ?
         RETURNING *`,
        [
          name,
          sku || null,
          productType,
          productCategoryId || null,
          unitOfMeasureId || null,
          minimumStockLevel,
          reorderLevel,
          standardCost,
          Boolean(isPerishable),
          defaultSupplierId || null,
          status,
          description || null,
          req.params.id,
        ]
      );
      await logAudit(db, req.session.user.id, "update", "product", Number(req.params.id), req.body);
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });


  router.delete("/products/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = await db.get("SELECT * FROM products WHERE id = ?", [id]);
      if (!existing) {
        const error = new Error("Product not found");
        error.status = 404;
        throw error;
      }

      const usageChecks = [
        { table: "purchase_requisition_items", column: "product_id", label: "purchase requisition lines" },
        { table: "purchase_order_items", column: "product_id", label: "purchase order lines" },
        { table: "goods_received_note_items", column: "product_id", label: "goods received lines" },
        { table: "contract_items", column: "product_id", label: "contract items" },
        { table: "kitchen_requisition_items", column: "product_id", label: "kitchen requisition lines" },
        { table: "store_issue_items", column: "product_id", label: "store issue lines" },
        { table: "stock_batches", column: "product_id", label: "stock batches" },
        { table: "stock_movements", column: "product_id", label: "stock movements" },
        { table: "stock_adjustment_items", column: "product_id", label: "stock adjustment lines" },
        { table: "wastage_records", column: "product_id", label: "wastage records" },
        { table: "production_batch_items", column: "product_id", label: "production batch lines" },
      ];
      const blockers = [];
      for (const check of usageChecks) {
        try {
          const row = await db.get(
            `SELECT COUNT(*)::int AS count FROM ${check.table} WHERE ${check.column} = ?`,
            [id]
          );
          if (row?.count > 0) blockers.push(`${row.count} ${check.label}`);
        } catch (error) {
          if (!/does not exist|undefined_table|undefined_column/i.test(String(error.message || error))) {
            throw error;
          }
        }
      }
      const balance = await db.get(
        `SELECT COALESCE(SUM(quantity_on_hand), 0)::float AS qty
         FROM inventory_balances WHERE product_id = ?`,
        [id]
      ).catch(() => ({ qty: 0 }));
      if (Number(balance?.qty || 0) > 0) {
        blockers.push(`${balance.qty} on-hand stock`);
      }
      if (blockers.length) {
        const error = new Error(
          `Cannot delete: still used by ${blockers.join(", ")}. Clear or reassign those records first.`
        );
        error.status = 409;
        throw error;
      }

      await db.exec("DELETE FROM inventory_balances WHERE product_id = ?", [id]);
      const result = await db.exec("DELETE FROM products WHERE id = ? RETURNING *", [id]);
      await logAudit(db, req.session.user.id, "delete", "product", id, {
        name: existing.name,
        sku: existing.sku,
      });
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.get("/reference-data", async (req, res, next) => {
    try {
      const data = await getConfigurationReferenceData(db);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  });

  router.post("/units", async (req, res, next) => {
    try {
      const result = await db.exec(
        `INSERT INTO units_of_measure (code, name, description, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active
         RETURNING *`,
        [req.body.code, req.body.name, req.body.description || null, req.body.sortOrder || 0, req.body.isActive !== false]
      );
      await syncConfigurationMirrors(db);
      await logAudit(db, req.session.user.id, "create", "unit_of_measure", result.rows[0].id, req.body);
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.post("/categories", async (req, res, next) => {
    try {
      const result = await db.exec(
        `INSERT INTO product_categories (name, description, sort_order, is_active)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active
         RETURNING *`,
        [req.body.name, req.body.description || null, req.body.sortOrder || 0, req.body.isActive !== false]
      );
      await syncConfigurationMirrors(db);
      await logAudit(db, req.session.user.id, "create", "product_category", result.rows[0].id, req.body);
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  router.post("/store-locations", async (req, res, next) => {
    try {
      const result = await db.exec(
        `INSERT INTO store_locations (name, location_type, description, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?)
         RETURNING *`,
        [
          req.body.name,
          req.body.locationType || "Central Store",
          req.body.description || null,
          req.body.sortOrder || 0,
          req.body.isActive !== false,
        ]
      );
      await syncConfigurationMirrors(db);
      await logAudit(db, req.session.user.id, "create", "store_location", result.rows[0].id, req.body);
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createMasterDataRoutes;
