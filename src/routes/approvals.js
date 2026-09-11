"use strict";

const express = require("express");

const { requireAuth, requirePermission } = require("../middleware/auth");

const APPROVAL_PERMISSIONS = [
  "procurement_requisitions.approve",
  "kitchen_requisitions.approve",
  "payment_vouchers.approve",
  "stock_adjustments.approve",
];

function isAdmin(user) {
  return (user?.roles || []).includes("admin");
}

function hasPermission(user, permission) {
  return isAdmin(user) || (user?.permissions || []).includes(permission);
}

function numeric(value) {
  return Number(value || 0);
}

function buildRecord(config, row, items, user) {
  if (!hasPermission(user, config.permission)) {
    return null;
  }

  const requesterId = row.requester_id ? Number(row.requester_id) : null;
  const selfApprovalBlocked =
    !isAdmin(user) && requesterId && requesterId === Number(user.id);
  const approvalItems = items || [];
  const amount = numeric(row.total_amount || row.amount);

  return {
    id: Number(row.id),
    entityType: config.entityType,
    documentType: config.documentType,
    documentTypeLabel: config.label,
    documentNumber:
      row.document_number ||
      row.requisition_number ||
      row.adjustment_number ||
      row.voucher_number,
    requesterId,
    requesterName: row.requester_name || "Unknown requester",
    requestedDate:
      row.request_date ||
      row.adjustment_date ||
      row.payment_date ||
      row.start_date ||
      row.created_at,
    createdAt: row.created_at,
    status: row.status,
    amount,
    currencyCode: row.currency_code || "UGX",
    itemCount: Number(row.item_count || approvalItems.length || 0),
    purpose: row.purpose || row.reason || row.notes || config.defaultPurpose,
    payeeName: row.payee_name || null,
    sourceLabel: row.source_label || null,
    supplierName: row.supplier_name || null,
    storeName: row.store_name || null,
    departmentName: row.department_name || null,
    startDate: row.start_date || null,
    endDate: row.end_date || null,
    items: approvalItems,
    approvePath: `${config.approveBasePath}/${Number(row.id)}/approve`,
    rejectPath: `${config.approveBasePath}/${Number(row.id)}/reject`,
    approveBody: config.approveBody(approvalItems),
    canAct: !selfApprovalBlocked,
    blockedReason: selfApprovalBlocked
      ? "You raised this request. Another approver must review it."
      : null,
  };
}

function createApprovalsRoutes(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.get(
    "/pending",
    requirePermission(...APPROVAL_PERMISSIONS),
    async (req, res, next) => {
      try {
        const [
          legacyRequisitions,
          goodsRequisitions,
          cashRequisitions,
          kitchenRequisitions,
          paymentVouchers,
          stockAdjustments,
        ] = await Promise.all([
          db.all(
            `SELECT pr.id, pr.requisition_number AS document_number, pr.request_date, pr.purchase_type,
                    pr.status, pr.requested_by AS requester_id, pr.created_at,
                    u.full_name AS requester_name,
                    COALESCE(COUNT(pri.id), 0)::int AS item_count,
                    COALESCE(SUM(pri.quantity_requested * COALESCE(pri.estimated_unit_cost, 0)), 0) AS total_amount
             FROM purchase_requisitions pr
             LEFT JOIN users u ON u.id = pr.requested_by
             LEFT JOIN purchase_requisition_items pri ON pri.purchase_requisition_id = pr.id
             WHERE pr.requisition_type = 'LEGACY'
               AND LOWER(pr.status) = 'submitted'
             GROUP BY pr.id, u.full_name
             ORDER BY pr.created_at DESC`
          ),
          db.all(
            `SELECT pr.id, pr.requisition_number AS document_number, pr.request_date, pr.required_date,
                    pr.purpose, pr.status, pr.requested_by AS requester_id, pr.created_at,
                    u.full_name AS requester_name, d.name AS department_name,
                    COALESCE(COUNT(pri.id), 0)::int AS item_count,
                    COALESCE(SUM(pri.quantity_requested * COALESCE(pri.estimated_unit_cost, 0)), 0) AS total_amount
             FROM purchase_requisitions pr
             LEFT JOIN users u ON u.id = pr.requested_by
             LEFT JOIN departments d ON d.id = pr.department_id
             LEFT JOIN purchase_requisition_items pri ON pri.purchase_requisition_id = pr.id
             WHERE pr.requisition_type = 'GOODS'
               AND LOWER(pr.status) = 'submitted'
             GROUP BY pr.id, u.full_name, d.name
             ORDER BY pr.created_at DESC`
          ),
          db.all(
            `SELECT cr.id, cr.requisition_number AS document_number, cr.request_date, cr.required_date,
                    cr.purpose, cr.payee_name, cr.amount AS total_amount, cr.currency_code,
                    cr.status, cr.requested_by AS requester_id, cr.created_at,
                    u.full_name AS requester_name, d.name AS department_name
             FROM cash_requisitions cr
             LEFT JOIN users u ON u.id = cr.requested_by
             LEFT JOIN departments d ON d.id = cr.department_id
             WHERE LOWER(cr.status) = 'submitted'
             ORDER BY cr.created_at DESC`
          ),
          db.all(
            `SELECT kr.id, kr.requisition_number AS document_number, kr.request_date, kr.production_date,
                    kr.department_name, kr.source_store_location_id, kr.status,
                    kr.requested_by AS requester_id, kr.created_at, u.full_name AS requester_name,
                    sl.name AS store_name,
                    COALESCE(COUNT(kri.id), 0)::int AS item_count,
                    COALESCE(SUM(kri.requested_quantity * COALESCE(p.standard_cost, 0)), 0) AS total_amount
             FROM kitchen_requisitions kr
             LEFT JOIN users u ON u.id = kr.requested_by
             LEFT JOIN store_locations sl ON sl.id = kr.source_store_location_id
             LEFT JOIN kitchen_requisition_items kri ON kri.kitchen_requisition_id = kr.id
             LEFT JOIN products p ON p.id = kri.product_id
             WHERE LOWER(kr.status) = 'submitted'
             GROUP BY kr.id, u.full_name, sl.name
             ORDER BY kr.created_at DESC`
          ),
          db.all(
            `SELECT pv.id, pv.voucher_number AS document_number, pv.payment_date, pv.amount AS total_amount,
                    pv.payment_method, pv.status, pv.prepared_by AS requester_id, pv.created_at,
                    COALESCE(pv.payee_name, s.name, cr.payee_name) AS payee_name,
                    COALESCE(pv.purpose, cr.purpose) AS purpose,
                    u.full_name AS requester_name,
                    CASE
                      WHEN pv.cash_requisition_id IS NOT NULL THEN CONCAT('Cash requisition ', cr.requisition_number)
                      WHEN pv.supplier_invoice_id IS NOT NULL THEN CONCAT('Supplier invoice ', si.invoice_number)
                      ELSE NULL
                    END AS source_label
             FROM payment_vouchers pv
             LEFT JOIN users u ON u.id = pv.prepared_by
             LEFT JOIN suppliers s ON s.id = pv.supplier_id
             LEFT JOIN supplier_invoices si ON si.id = pv.supplier_invoice_id
             LEFT JOIN cash_requisitions cr ON cr.id = pv.cash_requisition_id
             WHERE LOWER(pv.status) = 'submitted'
             ORDER BY pv.created_at DESC`
          ),
          db.all(
            `SELECT sa.id, sa.adjustment_number AS document_number, sa.adjustment_date, sa.reason AS purpose,
                    sa.status, sa.requested_by AS requester_id, sa.created_at, sa.notes,
                    u.full_name AS requester_name, sl.name AS store_name,
                    COALESCE(COUNT(sai.id), 0)::int AS item_count
             FROM stock_adjustments sa
             LEFT JOIN users u ON u.id = sa.requested_by
             LEFT JOIN store_locations sl ON sl.id = sa.store_location_id
             LEFT JOIN stock_adjustment_items sai ON sai.stock_adjustment_id = sa.id
             WHERE LOWER(sa.status) = 'submitted'
             GROUP BY sa.id, u.full_name, sl.name
             ORDER BY sa.created_at DESC`
          ),
        ]);

        const itemRows = await Promise.all([
          Promise.all(
            legacyRequisitions.map((row) =>
              db.all(
                `SELECT pri.id, p.name AS product_name, COALESCE(uom.code, uom.name) AS unit_code,
                        pri.quantity_requested, COALESCE(NULLIF(pri.quantity_approved, 0), pri.quantity_requested) AS approval_quantity,
                        pri.estimated_unit_cost, pri.preferred_supplier_id
                 FROM purchase_requisition_items pri
                 INNER JOIN products p ON p.id = pri.product_id
                 LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
                 WHERE pri.purchase_requisition_id = ?
                 ORDER BY p.name`,
                [row.id]
              )
            )
          ),
          Promise.all(
            goodsRequisitions.map((row) =>
              db.all(
                `SELECT pri.id, p.name AS product_name, COALESCE(uom.code, uom.name) AS unit_code,
                        pri.quantity_requested, COALESCE(NULLIF(pri.quantity_approved, 0), pri.quantity_requested) AS approval_quantity,
                        pri.estimated_unit_cost, pri.preferred_supplier_id
                 FROM purchase_requisition_items pri
                 INNER JOIN products p ON p.id = pri.product_id
                 LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
                 WHERE pri.purchase_requisition_id = ?
                 ORDER BY p.name`,
                [row.id]
              )
            )
          ),
          Promise.all(
            kitchenRequisitions.map((row) =>
              db.all(
                `SELECT kri.id, p.name AS product_name, COALESCE(uom.code, uom.name) AS unit_code,
                        kri.requested_quantity, COALESCE(NULLIF(kri.approved_quantity, 0), kri.requested_quantity) AS approval_quantity
                 FROM kitchen_requisition_items kri
                 INNER JOIN products p ON p.id = kri.product_id
                 LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
                 WHERE kri.kitchen_requisition_id = ?
                 ORDER BY p.name`,
                [row.id]
              )
            )
          ),
          Promise.all(
            stockAdjustments.map((row) =>
              db.all(
                `SELECT sai.id, p.name AS product_name, COALESCE(uom.code, uom.name) AS unit_code,
                        sai.quantity_delta AS quantity_requested, sai.quantity_delta AS approval_quantity
                 FROM stock_adjustment_items sai
                 INNER JOIN products p ON p.id = sai.product_id
                 LEFT JOIN units_of_measure uom ON uom.id = p.unit_of_measure_id
                 WHERE sai.stock_adjustment_id = ?
                 ORDER BY p.name`,
                [row.id]
              )
            )
          ),
        ]);

        const configs = {
          legacyRequisition: {
            entityType: "purchase_requisition",
            documentType: "Purchase Requisition",
            label: "Purchase Requisition",
            permission: "procurement_requisitions.approve",
            approveBasePath: "/api/procurement/purchase-requisitions",
            defaultPurpose: "Purchase requisition review",
            approveBody: (items) => ({
              items: items.map((item) => ({
                id: item.id,
                quantityApproved: numeric(item.approval_quantity),
                estimatedUnitCost: numeric(item.estimated_unit_cost),
                preferredSupplierId: item.preferred_supplier_id || null,
              })),
            }),
          },
          goodsRequisition: {
            entityType: "goods_requisition",
            documentType: "Goods Requisition",
            label: "Goods Requisition",
            permission: "procurement_requisitions.approve",
            approveBasePath: "/api/procurement-system/goods-requisitions",
            defaultPurpose: "Goods requisition review",
            approveBody: (items) => ({
              items: items.map((item) => ({
                id: item.id,
                quantityApproved: numeric(item.approval_quantity),
                estimatedUnitCost: numeric(item.estimated_unit_cost),
                preferredSupplierId: item.preferred_supplier_id || null,
              })),
            }),
          },
          cashRequisition: {
            entityType: "cash_requisition",
            documentType: "Cash Requisition",
            label: "Cash Requisition",
            permission: "procurement_requisitions.approve",
            approveBasePath: "/api/procurement-system/cash-requisitions",
            defaultPurpose: "Cash requisition review",
            approveBody: () => ({}),
          },
          kitchenRequisition: {
            entityType: "kitchen_requisition",
            documentType: "Kitchen Requisition",
            label: "Kitchen Requisition",
            permission: "kitchen_requisitions.approve",
            approveBasePath: "/api/kitchen/requisitions",
            defaultPurpose: "Kitchen stock request review",
            approveBody: (items) => ({
              items: items.map((item) => ({
                id: item.id,
                approvedQuantity: numeric(item.approval_quantity),
              })),
            }),
          },
          paymentVoucher: {
            entityType: "payment_voucher",
            documentType: "Payment Voucher",
            label: "Payment Voucher",
            permission: "payment_vouchers.approve",
            approveBasePath: "/api/procurement-system/payment-vouchers",
            defaultPurpose: "Payment voucher review",
            approveBody: () => ({}),
          },
          stockAdjustment: {
            entityType: "stock_adjustment",
            documentType: "Stock Adjustment",
            label: "Stock Adjustment",
            permission: "stock_adjustments.approve",
            approveBasePath: "/api/inventory/stock-adjustments",
            defaultPurpose: "Stock adjustment review",
            approveBody: () => ({}),
          },
        };

        const records = [
          ...legacyRequisitions.map((row, index) =>
            buildRecord(configs.legacyRequisition, row, itemRows[0][index], req.session.user)
          ),
          ...goodsRequisitions.map((row, index) =>
            buildRecord(configs.goodsRequisition, row, itemRows[1][index], req.session.user)
          ),
          ...cashRequisitions.map((row) =>
            buildRecord(configs.cashRequisition, row, [], req.session.user)
          ),
          ...kitchenRequisitions.map((row, index) =>
            buildRecord(configs.kitchenRequisition, row, itemRows[2][index], req.session.user)
          ),
          ...paymentVouchers.map((row) =>
            buildRecord(configs.paymentVoucher, row, [], req.session.user)
          ),
          ...stockAdjustments.map((row, index) =>
            buildRecord(configs.stockAdjustment, row, itemRows[3][index], req.session.user)
          ),
        ]
          .filter(Boolean)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
          success: true,
          data: records,
          meta: {
            total: records.length,
            actionable: records.filter((row) => row.canAct).length,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

module.exports = createApprovalsRoutes;
