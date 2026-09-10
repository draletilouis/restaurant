const { assertNotSelfApproval } = require("./approval-service");

const APPROVAL_PERMISSION_BY_DOCUMENT = {
  purchase_requisition: "procurement_requisitions.approve",
  goods_requisition: "procurement_requisitions.approve",
  cash_requisition: "procurement_requisitions.approve",
  kitchen_requisition: "kitchen_requisitions.approve",
};

async function getWorkflowForAmount(db, documentType, amount = 0) {
  return db.get(
    `SELECT *
     FROM approval_workflows
     WHERE is_active = TRUE
       AND document_type = ?
       AND (? >= COALESCE(min_amount, 0))
       AND (? <= COALESCE(max_amount, 999999999999))
     ORDER BY approval_level ASC, id ASC
     LIMIT 1`,
    [documentType, Number(amount || 0), Number(amount || 0)]
  );
}

async function ensureApprovalAllowed(req, db, options = {}) {
  const workflow = await getWorkflowForAmount(db, options.documentType, options.amount || 0);
  const requiredPermission = options.permission || APPROVAL_PERMISSION_BY_DOCUMENT[options.documentType];
  const user = req.session?.user;
  const isAdmin = (user?.roles || []).includes("admin");
  const userPermissions = user?.permissions || [];

  if (requiredPermission && !isAdmin && !userPermissions.includes(requiredPermission)) {
    const error = new Error("You do not have permission to approve this requisition.");
    error.status = 403;
    throw error;
  }

  if (workflow?.can_creator_approve === false) {
    assertNotSelfApproval(req, options.record, options.creatorFields || []);
  }

  if (!workflow && options.enforceSelfApproval !== false) {
    assertNotSelfApproval(req, options.record, options.creatorFields || []);
  }

  return workflow;
}

module.exports = {
  ensureApprovalAllowed,
  getWorkflowForAmount,
};
