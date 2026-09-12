const navIcon = (path) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"></path></svg>`;

const moduleIcons = {
  dashboard: navIcon(
    "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z",
  ),
  approvals: navIcon("M5 12.5 9.5 17 19 7"),
  contracts: navIcon("M7 4h7l5 5v11H7z M14 4v5h5 M9 13h6 M9 17h4"),
  procurement: navIcon(
    "M6 7h15l-1.5 8H8L6 7z M6 7 5 4H3 M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  ),
  inventory: navIcon("M4 7 12 3l8 4-8 4z M4 7v10l8 4 8-4V7 M12 11v10"),
  kitchen: navIcon("M4 8h16v11H4z M8 8V5h8v3 M9 13h6"),
  production: navIcon("M4 20h16M7 20V10l5-5 5 5v10 M9 14h6"),
  consumption: navIcon("M4 19h16M6 16l4-6 3 4 5-8"),
  reports: navIcon("M6 4h9l5 5v11H6z M15 4v5h5 M9 13h6 M9 17h4"),
  suppliers: navIcon(
    "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M4 19a4 4 0 0 1 8 0 M16 11h5 M16 15h4 M16 7h5",
  ),
  "cash-requisitions": navIcon(
    "M4 7h16v10H4z M8 4h8 M9 12h6 M12 9v6",
  ),
  "payment-vouchers": navIcon(
    "M4 6h16v12H4z M8 10h8 M8 14h5 M7 6V4h10v2",
  ),
  "approval-matrix": navIcon(
    "M5 6h6v6H5z M13 6h6v6h-6z M5 14h6v6H5z M13 14h6v6h-6z",
  ),
  configurations: navIcon(
    "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M4 12h3 M17 12h3 M12 4v3 M12 17v3",
  ),
  settings: navIcon(
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M4.5 12a7.5 7.5 0 0 1 .4-2.4l-1.7-1.3 1.6-2.8 2 .6A7.6 7.6 0 0 1 9.4 4.6L9.7 2.5h3.1l.3 2.1a7.6 7.6 0 0 1 2.6 1.5l2-.6 1.6 2.8-1.7 1.3a7.5 7.5 0 0 1 0 4.8l1.7 1.3-1.6 2.8-2-.6a7.6 7.6 0 0 1-2.6 1.5l-.3 2.1H9.7l-.3-2.1a7.6 7.6 0 0 1-2.6-1.5l-2 .6-1.6-2.8 1.7-1.3A7.5 7.5 0 0 1 4.5 12z",
  ),
};

const APPROVAL_PERMISSIONS = [
  "procurement_requisitions.approve",
  "kitchen_requisitions.approve",
  "payment_vouchers.approve",
  "stock_adjustments.approve",
];
const PAYMENT_VOUCHER_APPROVAL_PERMISSION = "payment_vouchers.approve";
const STOCK_ADJUSTMENT_APPROVAL_PERMISSION = "stock_adjustments.approve";

const PROCUREMENT_REQUISITION_APPROVAL_PERMISSION = "procurement_requisitions.approve";
const KITCHEN_REQUISITION_APPROVAL_PERMISSION = "kitchen_requisitions.approve";
const CASH_REQUISITION_RELEASE_PERMISSION = "cash_requisitions.release";
const CASH_REQUISITION_SETTLE_PERMISSION = "cash_requisitions.settle";

const modules = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: moduleIcons.dashboard,
    group: "Workspace",
    sectionKey: "dashboard",
    copy: "",
  },
  {
    key: "approvals",
    label: "Approvals",
    icon: moduleIcons.approvals,
    group: "Workspace",
    sectionKey: "approvals",
    copy: "",
  },
  {
    key: "contracts",
    label: "Contracts",
    icon: moduleIcons.contracts,
    group: "Workspace",
    sectionKey: "contracts",
    copy: "",
  },
  {
    key: "procurement",
    label: "Procurement",
    icon: moduleIcons.procurement,
    group: "Supply chain",
    sectionKey: "procurement",
    copy: "",
  },
  {
    key: "cash-requisitions",
    label: "Cash requisitions",
    icon: moduleIcons["cash-requisitions"],
    group: "Supply chain",
    sectionKey: "procurement",
    procurementTab: "cash requisitions",
    copy: "",
  },
  {
    key: "payment-vouchers",
    label: "Payment vouchers",
    icon: moduleIcons["payment-vouchers"],
    group: "Supply chain",
    sectionKey: "procurement",
    procurementTab: "payments",
    copy: "",
  },
  {
    key: "suppliers",
    label: "Suppliers",
    icon: moduleIcons.suppliers,
    group: "Supply chain",
    sectionKey: "suppliers",
    copy: "",
  },
  {
    key: "inventory",
    label: "Inventory & stores",
    icon: moduleIcons.inventory,
    group: "Supply chain",
    sectionKey: "inventory",
    copy: "",
  },
  {
    key: "kitchen",
    label: "Kitchen requests",
    icon: moduleIcons.kitchen,
    group: "Kitchen",
    sectionKey: "kitchen",
    copy: "",
  },
  {
    key: "production",
    label: "Production",
    icon: moduleIcons.production,
    group: "Kitchen",
    sectionKey: "production",
    copy: "",
  },
  {
    key: "consumption",
    label: "Consumption",
    icon: moduleIcons.consumption,
    group: "Workspace",
    sectionKey: "consumption",
    copy: "",
  },
  {
    key: "reports",
    label: "Reports",
    icon: moduleIcons.reports,
    group: "Workspace",
    sectionKey: "reports",
    copy: "",
  },
  {
    key: "configurations",
    label: "Configurations",
    icon: moduleIcons.configurations,
    group: "Administration",
    sectionKey: "configurations",
    copy: "",
  },
  {
    key: "approval-matrix",
    label: "Approval Matrix",
    icon: moduleIcons["approval-matrix"],
    group: "Administration",
    sectionKey: "approval-matrix",
    copy: "",
  },
  {
    key: "settings",
    label: "Settings",
    icon: moduleIcons.settings,
    group: "Administration",
    sectionKey: "settings",
    copy: "",
  },
];

const workspaceDescriptions = {
  approvals: "Review requests assigned to you and approve or reject them from one queue.",
  contracts: "Client agreements, delivery schedules and meal commitments.",
  procurement:
    "Raise a purchase order when stock is needed, then receive, invoice, and pay.",
  "cash-requisitions":
    "Request, release, and settle cash for operational spending.",
  "payment-vouchers":
    "Prepare payment vouchers from supplier invoices or approved cash requisitions.",
  inventory:
    "Stock balances, batches and every movement through central stores.",
  kitchen: "Review kitchen requests and issue approved stock.",
  production: "Record output, wastage and unused stock returned to stores.",
  consumption: "Compare purchased, issued, consumed and remaining quantities.",
  suppliers: "Supplier contacts, payment terms and outstanding balances.",
  reports: "Review operational results and export the underlying records.",
  configurations: "Maintain the shared definitions used across operations.",
  "approval-matrix": "Define who reviews each transaction and approval stage.",
  settings: "Manage access, review roles and inspect the audit trail.",
};
const state = {
  activeModule: "dashboard",
  user: null,
  reference: {
    clients: [],
    locations: [],
    suppliers: [],
    products: [],
    categories: [],
    units: [],
    stores: [],
    departments: [],
    paymentTerms: [],
    deliveryTypes: [],
    statuses: [],
  },
  consumptionRange: {
    startDate: "",
    endDate: "",
  },
  moduleData: {},
  filters: {
    contracts: { search: "", tab: "active" },
    approvals: { search: "", tab: "pending" },
    procurement: { search: "", tab: "purchase orders", purchaseType: "" },
    "cash-requisitions": { search: "", tab: "pending" },
    "payment-vouchers": { search: "", tab: "all" },
    inventory: { search: "", tab: "current stock" },
    kitchen: { search: "", tab: "pending" },
    production: { search: "", tab: "today's batches" },
    reports: { search: "", tab: "operational", period: "month", startDate: "", endDate: "" },
    suppliers: { search: "", tab: "all" },
    configurations: { search: "", tab: "master-data", type: "units" },
    "approval-matrix": { search: "", tab: "matrix" },
  },
  selected: {},
  exports: {},
  tablePages: {},
  tableSort: {},
  ui: {
    darkTheme: false,
    activeFormId: null,
    formModalStack: [],
    tableModels: {},
    previousFocus: null,
  },
};

const workspaceTabs = {
  approvals: [{ key: "pending", label: "Pending approvals" }],
  contracts: [
    { key: "active", label: "Active" },
    { key: "expiring", label: "Expiring" },
    { key: "suspended", label: "Suspended" },
    { key: "expired", label: "Expired" },
    { key: "all", label: "All Contracts" },
  ],
  procurement: [
    { key: "purchase requisitions", label: "Purchase Requisitions" },
    { key: "purchase orders", label: "Purchase Orders" },
    { key: "goods received", label: "Goods Received" },
    { key: "suppliers", label: "Suppliers" },
    { key: "invoices", label: "Invoices" },
  ],
  "cash-requisitions": [
    { key: "pending", label: "Pending approval" },
    { key: "in progress", label: "Approved / release" },
    { key: "closed", label: "Closed" },
    { key: "all", label: "All" },
  ],
  "payment-vouchers": [
    { key: "all", label: "All vouchers" },
    { key: "open", label: "Open" },
    { key: "paid", label: "Paid" },
  ],
  inventory: [
    { key: "current stock", label: "Current Stock" },
    { key: "alerts", label: "Alerts" },
    { key: "products", label: "Products" },
    { key: "stock movements", label: "Stock Movements" },
    { key: "adjustments", label: "Adjustments" },
    { key: "physical counts", label: "Physical Counts" },
  ],
  kitchen: [
    { key: "pending", label: "Pending Approval" },
    { key: "active requests", label: "Active Requests" },
    { key: "issued", label: "Issued" },
    { key: "store issues", label: "Store Issues" },
    { key: "closed", label: "Closed" },
  ],
  production: [
    { key: "today's batches", label: "Today's Batches" },
    { key: "completed", label: "Completed" },
    { key: "waste", label: "Wastage" },
    { key: "returns", label: "Returns" },
  ],
  consumption: [
    { key: "overview", label: "Overview" },
    { key: "variance", label: "Variance" },
    { key: "waste analysis", label: "Waste Analysis" },
    { key: "trends", label: "Trends" },
  ],
  reports: [
    { key: "operational", label: "Operational" },
    { key: "inventory", label: "Inventory" },
    { key: "procurement", label: "Procurement" },
    { key: "finance", label: "Finance" },
    { key: "contracts", label: "Contracts" },
    { key: "production", label: "Production" },
    { key: "management", label: "Management" },
  ],
  suppliers: [{ key: "directory", label: "Supplier Directory" }],
  configurations: [
    { key: "master-data", label: "Master Data" },
    { key: "workflow-controls", label: "Workflow Controls" },
    { key: "commercial-finance", label: "Commercial & Finance" },
    { key: "alerts", label: "Alerts" },
  ],
  "approval-matrix": [{ key: "matrix", label: "Approval Rules" }],
  settings: [
    { key: "users", label: "Users" },
    { key: "roles", label: "Roles" },
    { key: "audit", label: "Audit Trail" },
  ],
};

const configurationTabGroups = [
  {
    key: "master-data",
    label: "Master Data",
    types: ["units", "product-categories", "stores", "departments"],
  },
  {
    key: "workflow-controls",
    label: "Workflow Controls",
    types: ["statuses", "numbering-series"],
  },
  {
    key: "commercial-finance",
    label: "Commercial & Finance",
    types: [
      "payment-terms",
      "delivery-types",
      "expense-categories",
      "tax-settings",
    ],
  },
  {
    key: "alerts",
    label: "Alerts",
    types: ["notification-rules"],
  },
];

const formModalMeta = {
  "client-form": {
    eyebrow: "Contracts",
    title: "Client Profile",
    description:
      "Create or update a corporate client before attaching delivery locations and contracts.",
  },
  "client-location-form": {
    eyebrow: "Contracts",
    title: "Delivery Location",
    description:
      "Capture the branch or office delivery point used by active catering contracts.",
  },
  "contract-form": {
    eyebrow: "Contracts",
    title: "Contract Workspace",
    description:
      "Define commercial terms, schedules, and contract items for the selected client location.",
  },
  "purchase-requisition-form": {
    eyebrow: "Procurement",
    title: "Purchase Requisition",
    description:
      "Choose the purchase period, add the ingredients and quantities needed, save the draft, then submit it for approval.",
  },
  "purchase-requisition-approve-form": {
    eyebrow: "Procurement",
    title: "Approve Purchase Requisition",
    description:
      "Review approved quantities, supplier choices, and commercial assumptions for this request.",
  },
  "purchase-requisition-reject-form": {
    eyebrow: "Procurement",
    title: "Reject Purchase Requisition",
    description:
      "Record the rejection reason so the requestor can correct or resubmit the requisition.",
  },
  "purchase-order-form": {
    eyebrow: "Procurement",
    title: "Purchase Order",
    description:
      "Raise a supplier order when stock is needed. Link a requisition only if one already exists.",
  },
  "goods-received-form": {
    eyebrow: "Procurement",
    title: "Goods Received",
    description:
      "Receive supplier deliveries into the central store and create the inventory movements automatically.",
  },
  "supplier-invoice-form": {
    eyebrow: "Finance",
    title: "Supplier Invoice",
    description:
      "Record the supplier bill that relates to a purchase order or goods received note.",
  },
  "payment-voucher-form": {
    eyebrow: "Finance",
    title: "Payment Voucher",
    description:
      "Link a supplier invoice or cash requisition, then capture payee, purpose, amount, method, and reference — everything that prints on the voucher.",
  },
  "cash-requisition-form": {
    eyebrow: "Cash Requisitions",
    title: "Cash Requisition",
    description:
      "Request a controlled cash advance for an approved business purchase or expense.",
  },
  "cash-requisition-action-form": {
    eyebrow: "Cash Requisitions",
    title: "Cash Requisition Decision",
    description:
      "Record a reason when returning or rejecting a cash request.",
  },
  "cash-requisition-release-form": {
    eyebrow: "Cash Requisitions",
    title: "Release Cash",
    description:
      "Confirm how the approved amount was released before the requester spends it.",
  },
  "cash-requisition-settle-form": {
    eyebrow: "Cash Requisitions",
    title: "Settle Cash Requisition",
    description:
      "Reconcile actual spending, cash returned, and receipt evidence to close the request.",
  },
  "product-form": {
    eyebrow: "Inventory",
    title: "Product Master",
    description:
      "Manage product setup, default supplier, units, and stock control thresholds.",
  },
  "stock-adjustment-form": {
    eyebrow: "Inventory",
    title: "Stock Adjustment",
    description:
      "Create an auditable stock adjustment that will only post after approval.",
  },
  "stock-adjustment-approve-form": {
    eyebrow: "Inventory",
    title: "Approve Adjustment",
    description:
      "Approve a pending stock adjustment and post the resulting inventory movements.",
  },
  "physical-count-form": {
    eyebrow: "Inventory",
    title: "Physical Stock Count",
    description:
      "Submit a counted quantity set so the system can reconcile book stock to physical stock.",
  },
  "kitchen-requisition-form": {
    eyebrow: "Kitchen",
    title: "Kitchen Requisition",
    description:
      "Request ingredients or supplies from the central store for a scheduled production run.",
  },
  "kitchen-submit-form": {
    eyebrow: "Kitchen",
    title: "Submit Requisition",
    description:
      "Send the draft kitchen requisition into the approval workflow.",
  },
  "kitchen-approve-form": {
    eyebrow: "Kitchen",
    title: "Approve Kitchen Requisition",
    description:
      "Approve the requisition quantities that the store is allowed to issue.",
  },
  "kitchen-reject-form": {
    eyebrow: "Kitchen",
    title: "Reject Kitchen Requisition",
    description:
      "Record the rejection reason and return the requisition to the requestor.",
  },
  "store-issue-form": {
    eyebrow: "Kitchen",
    title: "Store Issue",
    description:
      "Issue approved stock to the kitchen and post the inventory reduction.",
  },
  "production-batch-form": {
    eyebrow: "Production",
    title: "Production Batch",
    description:
      "Record the stock consumed and the planned output for an active production run.",
  },
  "complete-batch-form": {
    eyebrow: "Production",
    title: "Complete Batch",
    description:
      "Close the production batch with actual output and total wastage captured.",
  },
  "wastage-form": {
    eyebrow: "Production",
    title: "Record Wastage",
    description:
      "Log spoiled or lost stock so the production and consumption reports stay accurate.",
  },
  "return-form": {
    eyebrow: "Production",
    title: "Return Unused Stock",
    description:
      "Move unused issued stock back into inventory through an auditable return workflow.",
  },
  "supplier-form": {
    eyebrow: "Suppliers",
    title: "Supplier Profile",
    description:
      "Create or update a supplier record, contact details, and payment terms.",
  },
  "user-form": {
    eyebrow: "Settings",
    title: "User Account",
    description:
      "Create a system user and select one or more roles to control access.",
  },
  "user-roles-form": {
    eyebrow: "Settings",
    title: "Edit User Roles",
    description: "Assign one or more roles to this user.",
  },
  "configuration-form": {
    eyebrow: "Configurations",
    title: "Configuration Item",
    description:
      "Create or update a reusable system definition and make it available across the ERP.",
  },
};

function $(selector) {
  return document.querySelector(selector);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[character] || character;
  });
}

const DETAIL_HIDDEN_KEYS = new Set([
  "id",
  "entity_id",
  "actor_user_id",
  "user_id",
  "password_hash",
  "metadata",
  "lpo_number",
  "po_number",
  "purchase_order_number",
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function shouldHideDetailKey(key, value) {
  const normalizedKey = String(key || "").toLowerCase();
  if (!normalizedKey) {
    return true;
  }
  if (DETAIL_HIDDEN_KEYS.has(normalizedKey)) {
    return true;
  }
  if (
    normalizedKey.endsWith("_id") ||
    normalizedKey.endsWith("json") ||
    normalizedKey.includes("password") ||
    normalizedKey.includes("token")
  ) {
    return true;
  }
  if (Array.isArray(value) && !value.length) {
    return true;
  }
  if (isPlainObject(value) && !Object.keys(value).length) {
    return true;
  }
  return false;
}

function formatDetailLabel(key) {
  return titleCaseWords(String(key || "").replace(/_/g, " "));
}

function formatDetailValue(key, value) {
  if (Array.isArray(value)) {
    const primitives = value.filter(
      (entry) => !isPlainObject(entry) && !Array.isArray(entry),
    );
    return primitives.length ? primitives.join(", ") : "";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (value === null || value === undefined || value === "") {
    return "";
  }
  const normalizedKey = String(key || "").toLowerCase();
  if (normalizedKey.endsWith("_at")) {
    return formatDateTime(value);
  }
  if (normalizedKey.endsWith("_date") || normalizedKey === "date") {
    return formatDate(value);
  }
  return String(value);
}

function sanitizeDetailRows(rows) {
  return (rows || [])
    .map((row) =>
      Object.fromEntries(
        Object.entries(row || {})
          .filter(([key, value]) => !shouldHideDetailKey(key, value))
          .map(([key, value]) => [key, formatDetailValue(key, value)])
          .filter(([, value]) => value !== ""),
      ),
    )
    .filter((row) => Object.keys(row).length);
}

function api(path, options = {}) {
  return fetch(path, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        payload.message || `Request failed with status ${response.status}`,
      );
    }
    return payload;
  });
}

function showToast(message, type = "success") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.classList.remove("hidden");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(
    () => toast.classList.add("hidden"),
    2800,
  );
}

function ensureDynamicStatus(form) {
  let target = form.querySelector(".dynamic-status");
  if (!target) {
    target = document.createElement("div");
    target.className = "form-status dynamic-status";
    target.setAttribute("role", "status");
    target.setAttribute("aria-live", "polite");
    form.appendChild(target);
  }
  return target;
}

function setFormStatus(targetId, message = "", tone = "info") {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }
  target.textContent = message;
  target.className = `form-status ${tone}`;
}

function setDynamicFormStatus(form, message = "", tone = "info") {
  const target = ensureDynamicStatus(form);
  target.textContent = message;
  target.className = `form-status dynamic-status ${tone}`;
}

function parseJsonArray(raw, label) {
  if (!raw || !String(raw).trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`${label} data must contain a list of rows.`);
    }
    return parsed;
  } catch (error) {
    throw new Error(`${label} data could not be read. ${error.message}`);
  }
}

const collectionEditorConfigs = {
  "contract-form": {
    customDatesJson: {
      addLabel: "Add Custom Date",
      fields: [
        { key: "specificDate", label: "Date", type: "date" },
        {
          key: "quantity",
          label: "Expected Units",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "deliveryTime",
          label: "Delivery Time",
          type: "text",
          placeholder: "12:30 PM",
          optional: true,
        },
        {
          key: "isActive",
          label: "Active",
          type: "checkbox",
          defaultValue: true,
        },
      ],
    },
    itemsJson: {
      addLabel: "Add Contract Item",
      fields: [
        {
          key: "productId",
          label: "Product",
          type: "select",
          source: "products",
        },
        {
          key: "serviceUnit",
          label: "Service Unit",
          type: "select",
          source: "units",
          optional: true,
        },
        {
          key: "quantityPerDelivery",
          label: "Qty / Delivery",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "unitPrice",
          label: "Unit Price",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
        { key: "notes", label: "Notes", type: "text", optional: true },
      ],
    },
  },
  "purchase-requisition-form": {
    itemsJson: {
      addLabel: "Add Requisition Item",
      fields: [
        {
          key: "productId",
          label: "Product",
          type: "select",
          source: "products",
        },
        {
          key: "unitCode",
          label: "Unit",
          type: "text",
          readOnly: true,
          derived: "productUnit",
        },
        {
          key: "quantityRequested",
          label: "Requested Qty",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "quantityApproved",
          label: "Approved Qty",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "estimatedUnitCost",
          label: "Estimated Unit Cost",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "preferredSupplierId",
          label: "Preferred Supplier",
          type: "select",
          source: "suppliers",
          optional: true,
        },
      ],
    },
  },
  "purchase-requisition-approve-form": {
    itemsJson: {
      addLabel: "Add Approval Item",
      fields: [
        {
          key: "id",
          label: "Requisition Item ID",
          type: "number",
          min: 1,
          step: 1,
          hidden: true,
        },
        {
          key: "quantityApproved",
          label: "Approved Qty",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "estimatedUnitCost",
          label: "Estimated Unit Cost",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "preferredSupplierId",
          label: "Preferred Supplier",
          type: "select",
          source: "suppliers",
          optional: true,
        },
      ],
    },
  },
  "purchase-order-form": {
    itemsJson: {
      addLabel: "Add Order Item",
      fields: [
        {
          key: "productId",
          label: "Product",
          type: "select",
          source: "products",
        },
        {
          key: "unitCode",
          label: "Unit",
          type: "text",
          readOnly: true,
          derived: "productUnit",
        },
        {
          key: "quantityOrdered",
          label: "Quantity Ordered",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "unitCost",
          label: "Unit Cost",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
      ],
    },
  },
  "goods-received-form": {
    itemsJson: {
      addLabel: "Add Received Item",
      fields: [
        {
          key: "productId",
          label: "Product",
          type: "select",
          source: "products",
        },
        {
          key: "unitCode",
          label: "Unit",
          type: "text",
          readOnly: true,
          derived: "productUnit",
        },
        {
          key: "quantityReceived",
          label: "Quantity Received",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "unitCost",
          label: "Unit Cost",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "batchNumber",
          label: "Batch Number",
          type: "text",
          optional: true,
        },
        {
          key: "expiryDate",
          label: "Expiry Date",
          type: "date",
          optional: true,
        },
      ],
    },
  },
  "stock-adjustment-form": {
    itemsJson: {
      addLabel: "Add Adjustment Item",
      fields: [
        {
          key: "productId",
          label: "Product",
          type: "select",
          source: "products",
        },
        {
          key: "quantityDelta",
          label: "Quantity Delta",
          type: "number",
          step: "0.01",
          defaultValue: 0,
        },
      ],
    },
  },
  "physical-count-form": {
    itemsJson: {
      addLabel: "Add Count Item",
      fields: [
        {
          key: "productId",
          label: "Product",
          type: "select",
          source: "products",
        },
        {
          key: "countedQuantity",
          label: "Counted Quantity",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
      ],
    },
  },
  "kitchen-requisition-form": {
    itemsJson: {
      addLabel: "Add Requisition Item",
      fields: [
        {
          key: "productId",
          label: "Product",
          type: "select",
          source: "products",
        },
        {
          key: "unitCode",
          label: "Unit",
          type: "text",
          readOnly: true,
          derived: "productUnit",
        },
        {
          key: "requestedQuantity",
          label: "Requested Quantity",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
      ],
    },
  },
  "kitchen-approve-form": {
    itemsJson: {
      addLabel: "Add Approval Row",
      fields: [
        {
          key: "id",
          label: "Requisition Item ID",
          type: "number",
          min: 1,
          step: 1,
          hidden: true,
        },
        {
          key: "approvedQuantity",
          label: "Approved Quantity",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
      ],
    },
  },
  "store-issue-form": {
    itemsJson: {
      addLabel: "Add Issue Item",
      fields: [
        {
          key: "kitchenRequisitionItemId",
          label: "Requisition Item ID",
          type: "number",
          min: 1,
          step: 1,
          optional: true,
          hidden: true,
        },
        {
          key: "productId",
          label: "Product",
          type: "select",
          source: "products",
        },
        {
          key: "issuedQuantity",
          label: "Issued Quantity",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "unitCost",
          label: "Unit Cost",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
      ],
    },
  },
  "production-batch-form": {
    itemsJson: {
      addLabel: "Add Production Item",
      fields: [
        {
          key: "productId",
          label: "Product",
          type: "select",
          source: "products",
        },
        {
          key: "quantityConsumed",
          label: "Quantity Consumed",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
      ],
    },
  },
  "return-form": {
    itemsJson: {
      addLabel: "Add Return Item",
      fields: [
        {
          key: "productId",
          label: "Product",
          type: "select",
          source: "products",
        },
        {
          key: "quantityReturned",
          label: "Quantity Returned",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "unitCost",
          label: "Unit Cost",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
      ],
    },
  },
  "goods-requisition-form": {
    itemsJson: {
      addLabel: "Add Item",
      fields: [
        {
          key: "productId",
          label: "Product",
          type: "select",
          source: "products",
        },
        {
          key: "unitCode",
          label: "Unit",
          type: "text",
          readOnly: true,
          derived: "productUnit",
        },
        {
          key: "quantityRequested",
          label: "Quantity",
          type: "number",
          min: 0.01,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "estimatedUnitCost",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
          hidden: true,
        },
      ],
    },
  },
  "lpo-form": {
    itemsJson: {
      addLabel: "Add LPO Item",
      fields: [
        {
          key: "productId",
          label: "Product",
          type: "select",
          source: "products",
        },
        {
          key: "unitCode",
          label: "Unit",
          type: "text",
          readOnly: true,
          derived: "productUnit",
        },
        {
          key: "quantityOrdered",
          label: "Quantity",
          type: "number",
          min: 0.01,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "unitCost",
          label: "Unit Cost",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
      ],
    },
  },
  "delivery-form": {
    itemsJson: {
      addLabel: "Add Delivered Item",
      fields: [
        {
          key: "productId",
          label: "Product",
          type: "select",
          source: "products",
        },
        {
          key: "unitCode",
          label: "Unit",
          type: "text",
          readOnly: true,
          derived: "productUnit",
        },
        {
          key: "quantityReceived",
          label: "Received Qty",
          type: "number",
          min: 0.01,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "unitCost",
          label: "Unit Cost",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: 0,
        },
        {
          key: "batchNumber",
          label: "Batch No.",
          type: "text",
          optional: true,
        },
        {
          key: "expiryDate",
          label: "Expiry Date",
          type: "date",
          optional: true,
        },
      ],
    },
  },
  "store-transfer-form": {
    itemsJson: {
      addLabel: "Add Transfer Item",
      fields: [
        {
          key: "productId",
          label: "Product",
          type: "select",
          source: "products",
        },
        {
          key: "unitCode",
          label: "Unit",
          type: "text",
          readOnly: true,
          derived: "productUnit",
        },
        {
          key: "quantity",
          label: "Quantity",
          type: "number",
          min: 0.01,
          step: "0.01",
          defaultValue: 0,
        },
      ],
    },
  },
};

function getCollectionTextarea(formId, fieldName) {
  const form = document.getElementById(formId);
  if (!form) {
    return null;
  }
  return form.querySelector(`[name="${fieldName}"]`);
}

function getCollectionConfig(formId, fieldName) {
  return collectionEditorConfigs[formId]?.[fieldName] || null;
}

function getProductUnitLabel(product) {
  if (!product) {
    return "";
  }
  return product.unit_code || product.unit_name || "";
}

function findReferenceProduct(productId) {
  return (state.reference.products || []).find(
    (row) => Number(row.id) === Number(productId),
  );
}

function getCollectionSourceOptions(source) {
  if (source === "products") {
    return (state.reference.products || []).map((row) => ({
      value: row.id,
      label: getProductUnitLabel(row)
        ? `${row.name} (${getProductUnitLabel(row)})`
        : row.name,
    }));
  }
  if (source === "suppliers") {
    return (state.reference.suppliers || []).map((row) => ({
      value: row.id,
      label: row.name,
    }));
  }
  if (source === "units") {
    return (state.reference.units || []).map((row) => ({
      value: row.code || row.name,
      label: `${row.code || row.name} - ${row.name}`,
    }));
  }
  if (source === "scheduleTypes") {
    return ["Daily", "Weekly", "Monthly", "Custom"].map((value) => ({
      value,
      label: value,
    }));
  }
  if (source === "daysOfWeek") {
    return [
      { value: 0, label: "Sunday" },
      { value: 1, label: "Monday" },
      { value: 2, label: "Tuesday" },
      { value: 3, label: "Wednesday" },
      { value: 4, label: "Thursday" },
      { value: 5, label: "Friday" },
      { value: 6, label: "Saturday" },
    ];
  }
  return [];
}

function normalizeCollectionRows(formId, fieldName) {
  const textarea = getCollectionTextarea(formId, fieldName);
  if (!textarea) {
    return [];
  }
  try {
    return parseJsonArray(textarea.value, fieldName);
  } catch (error) {
    return [];
  }
}

function buildCollectionEmptyRow(config) {
  const row = {};
  for (const field of config.fields) {
    if (field.defaultValue !== undefined) {
      row[field.key] = field.defaultValue;
      continue;
    }
    if (field.type === "checkbox") {
      row[field.key] = false;
    } else if (field.type === "number") {
      row[field.key] = field.optional ? null : 0;
    } else {
      row[field.key] = "";
    }
  }
  return row;
}

function setCollectionData(formId, fieldName, rows, options = {}) {
  const textarea = getCollectionTextarea(formId, fieldName);
  if (!textarea) {
    return;
  }
  textarea.value = JSON.stringify(rows || [], null, 2);
  if (options.render !== false) {
    renderCollectionEditor(formId, fieldName);
  }
}

function coerceCollectionValue(field, rawValue, checked = false) {
  if (field.type === "checkbox") {
    return checked;
  }
  if (field.type === "number") {
    if (rawValue === "" || rawValue === null || rawValue === undefined) {
      return field.optional ? null : 0;
    }
    return Number(rawValue);
  }
  if (field.type === "select" && field.optional && rawValue === "") {
    return null;
  }
  return rawValue;
}

function renderCollectionFieldInput(formId, fieldName, rowIndex, field, row) {
  let value = row?.[field.key];
  if (field.derived === "productUnit") {
    value = getProductUnitLabel(findReferenceProduct(row?.productId)) || "—";
  }
  const dataset = `data-collection-form="${formId}" data-collection-field="${fieldName}" data-row-index="${rowIndex}" data-field-key="${field.key}" aria-label="${escapeHtml(field.label)} row ${rowIndex + 1}" id="collection-${formId}-${fieldName}-${rowIndex}-${field.key}"`;
  if (field.type === "select") {
    const options = getCollectionSourceOptions(field.source);
    const optionMarkup = [];
    if (field.optional) {
      optionMarkup.push('<option value="">Optional</option>');
    } else if (value === "" || value === null || value === undefined) {
      optionMarkup.push(
        `<option value="" selected disabled>Choose ${escapeHtml(field.label.toLowerCase())}</option>`,
      );
    }
    optionMarkup.push(
      ...options.map((option) => {
        const selected =
        String(option.value) === String(value ?? "") ? "selected" : "";
        return `<option value="${escapeHtml(option.value)}" ${selected}>${escapeHtml(option.label)}</option>`;
      }),
    );
    return `<select ${dataset} ${field.optional ? "" : "required"}>${optionMarkup.join("")}</select>`;
  }
  if (field.type === "checkbox") {
    return `<input type="checkbox" ${dataset} ${value ? "checked" : ""} />`;
  }
  const attrs = [
    `type="${field.type || "text"}"`,
    dataset,
    field.min !== undefined ? `min="${field.min}"` : "",
    field.max !== undefined ? `max="${field.max}"` : "",
    field.step !== undefined ? `step="${field.step}"` : "",
    field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : "",
    field.readOnly || field.derived ? "readonly tabindex=\"-1\"" : "",
    `value="${escapeHtml(value ?? "")}"`,
  ]
    .filter(Boolean)
    .join(" ");
  return `<input ${attrs} />`;
}

function renderCollectionEditor(formId, fieldName) {
  const config = getCollectionConfig(formId, fieldName);
  const textarea = getCollectionTextarea(formId, fieldName);
  if (!config || !textarea) {
    return;
  }

  const visibleFields = config.fields.filter((field) => !field.hidden);

  textarea.classList.add("collection-source-textarea");
  let editor = textarea.parentElement.querySelector(
    `.collection-editor[data-field-name="${fieldName}"]`,
  );
  if (!editor) {
    editor = document.createElement("div");
    editor.className = "collection-editor";
    editor.dataset.formId = formId;
    editor.dataset.fieldName = fieldName;
    textarea.insertAdjacentElement("afterend", editor);
  }

  const rows = normalizeCollectionRows(formId, fieldName);
  const header = visibleFields
    .map((field) => `<th>${escapeHtml(field.label)}</th>`)
    .join("");

  editor.innerHTML =
    `<div class="collection-editor-toolbar">` +
    `<button type="button" class="ghost-btn slim-btn" data-collection-add="${formId}:${fieldName}">${escapeHtml(config.addLabel)}</button>` +
    `</div>` +
    (rows.length
      ? `<div class="table-shell collection-table-shell"><table><thead><tr>${header}<th>Actions</th></tr></thead><tbody>` +
        rows
          .map(
            (row, rowIndex) =>
              `<tr>` +
              visibleFields
                .map(
                  (field) =>
                    `<td data-label="${escapeHtml(field.label)}">${renderCollectionFieldInput(formId, fieldName, rowIndex, field, row)}</td>`,
                )
                .join("") +
              `<td class="collection-actions"><button type="button" class="ghost-btn slim-btn" data-collection-remove="${formId}:${fieldName}:${rowIndex}">Remove</button></td>` +
              `</tr>`,
          )
          .join("") +
        `</tbody></table></div>`
      : `<div class="empty-state">No rows added yet.</div>`);
}

function refreshCollectionEditors(formId = null) {
  const targetForms = formId ? [formId] : Object.keys(collectionEditorConfigs);
  for (const targetFormId of targetForms) {
    const fieldConfigs = collectionEditorConfigs[targetFormId] || {};
    for (const fieldName of Object.keys(fieldConfigs)) {
      renderCollectionEditor(targetFormId, fieldName);
    }
  }
}

function handleCollectionEditorInput(element) {
  const {
    collectionForm: formId,
    collectionField: fieldName,
    rowIndex,
    fieldKey,
  } = element.dataset;
  const config = getCollectionConfig(formId, fieldName);
  if (!config) {
    return;
  }
  const rows = normalizeCollectionRows(formId, fieldName);
  const field = config.fields.find((entry) => entry.key === fieldKey);
  if (!field || field.derived || field.readOnly || !rows[Number(rowIndex)]) {
    return;
  }
  rows[Number(rowIndex)][fieldKey] = coerceCollectionValue(
    field,
    element.value,
    element.checked,
  );
  const shouldRerender = fieldKey === "productId";
  setCollectionData(formId, fieldName, rows, { render: shouldRerender });
}

function formatNumber(value, digits = 0) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatCurrency(value) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }
  return date.toLocaleDateString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }
  return date.toLocaleString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isSameDay(value, compare = new Date()) {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  return date.toDateString() === compare.toDateString();
}

function sumBy(rows, selector) {
  return (rows || []).reduce((sum, row) => sum + Number(selector(row) || 0), 0);
}

function titleCaseWords(value) {
  return String(value || "")
    .split(/[\s,_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function csvToArray(raw) {
  return String(raw || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const CONTRACT_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const DEFAULT_DAILY_CONTRACT_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

function getContractFormElement() {
  return document.getElementById("contract-form");
}

function inferContractBillingCycle(contract, schedules = []) {
  const scheduleType = String(
    schedules[0]?.schedule_type || schedules[0]?.scheduleType || "",
  )
    .trim()
    .toLowerCase();
  if (scheduleType === "weekly") {
    return "Weekly";
  }
  if (scheduleType === "monthly") {
    return "Monthly";
  }
  if (scheduleType === "custom") {
    return "Custom";
  }
  const billingCycle = String(contract?.billing_cycle || "").trim();
  if (["Daily", "Weekly", "Monthly", "Custom"].includes(billingCycle)) {
    return billingCycle;
  }
  return "Daily";
}

function setContractDays(form, days = DEFAULT_DAILY_CONTRACT_DAYS) {
  const selectedDays = new Set((days || []).map((value) => String(value)));
  form.querySelectorAll('input[name="dailyDeliveryDays"]').forEach((input) => {
    input.checked = selectedDays.has(input.value);
  });
}

function getContractDays(form) {
  return Array.from(
    form.querySelectorAll('input[name="dailyDeliveryDays"]:checked'),
  ).map((input) => input.value);
}

function setActiveContractTab(tabKey = "overview") {
  const form = getContractFormElement();
  if (!form) return;
  form.querySelectorAll("[data-contract-tab]").forEach((button) => {
    const active = button.dataset.contractTab === tabKey;
    button.classList.toggle("active", active);
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
    button.id = "contract-tab-" + button.dataset.contractTab;
    button.setAttribute(
      "aria-controls",
      "contract-panel-" + button.dataset.contractTab,
    );
  });
  form.querySelectorAll("[data-contract-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.contractPanel === tabKey);
    panel.setAttribute("role", "tabpanel");
    panel.id = "contract-panel-" + panel.dataset.contractPanel;
    panel.setAttribute(
      "aria-labelledby",
      "contract-tab-" + panel.dataset.contractPanel,
    );
  });
}

function syncContractCyclePanels(options = {}) {
  const form = getContractFormElement();
  if (!form) {
    return;
  }

  const billingCycle = String(
    form.elements.namedItem("billingCycle")?.value || "Monthly",
  );
  const cycleKey = billingCycle.toLowerCase();
  form.querySelectorAll("[data-contract-cycle-panel]").forEach((panel) => {
    panel.classList.toggle(
      "hidden",
      panel.dataset.contractCyclePanel !== cycleKey,
    );
  });

  const customTab = form.querySelector('[data-contract-tab="custom-dates"]');
  if (customTab) {
    const showCustomTab = cycleKey === "custom";
    customTab.classList.toggle("hidden", !showCustomTab);
    customTab.hidden = !showCustomTab;
    if (
      !showCustomTab &&
      form
        .querySelector('[data-contract-panel="custom-dates"]')
        ?.classList.contains("active")
    ) {
      setActiveContractTab("schedule");
    } else if (showCustomTab && options.openCustomTab) {
      setActiveContractTab("custom-dates");
    }
  }

  if (options.tabKey) {
    setActiveContractTab(options.tabKey);
  }
}

function hydrateContractScheduleWorkspace(contract, schedules = []) {
  const form = getContractFormElement();
  if (!form) {
    return;
  }

  const billingCycle = inferContractBillingCycle(contract, schedules);
  const primarySchedule = schedules[0] || {};
  const customSchedules = schedules.filter(
    (schedule) =>
      String(schedule.schedule_type || "").toLowerCase() === "custom",
  );

  form.elements.namedItem("billingCycle").value = billingCycle;
  form.elements.namedItem("dailyDeliveryTime").value =
    primarySchedule.delivery_time || "";
  form.elements.namedItem("weeklyDeliveryDay").value =
    primarySchedule.day_of_week ?? 1;
  form.elements.namedItem("weeklyDeliveryTime").value =
    primarySchedule.delivery_time || "";
  form.elements.namedItem("monthlyDeliveryDay").value =
    primarySchedule.day_of_month ?? 1;
  form.elements.namedItem("monthlyDeliveryTime").value =
    primarySchedule.delivery_time || "";
  setContractDays(
    form,
    contract?.delivery_days?.length
      ? contract.delivery_days
      : DEFAULT_DAILY_CONTRACT_DAYS,
  );
  setCollectionData(
    "contract-form",
    "customDatesJson",
    customSchedules.map((schedule) => ({
      specificDate: schedule.specific_date
        ? String(schedule.specific_date).slice(0, 10)
        : "",
      quantity: Number(
        schedule.quantity || contract?.expected_daily_quantity || 0,
      ),
      deliveryTime: schedule.delivery_time || "",
      isActive: schedule.is_active !== false,
    })),
  );

  syncContractCyclePanels({
    tabKey: billingCycle === "Custom" ? "custom-dates" : "overview",
  });
}

function buildContractSchedulePayload(formData, form) {
  const billingCycle = String(formData.get("billingCycle") || "Monthly");
  const expectedUnits = Number(formData.get("expectedDailyQuantity") || 0);

  if (billingCycle === "Daily") {
    return {
      deliveryDays: getContractDays(form),
      schedules: [
        {
          scheduleType: "Daily",
          quantity: expectedUnits,
          deliveryTime: formData.get("dailyDeliveryTime") || null,
          isActive: true,
        },
      ],
    };
  }

  if (billingCycle === "Weekly") {
    const dayOfWeek = Number(formData.get("weeklyDeliveryDay") || 1);
    return {
      deliveryDays: [CONTRACT_DAYS[(dayOfWeek + 6) % 7] || "Monday"],
      schedules: [
        {
          scheduleType: "Weekly",
          dayOfWeek,
          quantity: expectedUnits,
          deliveryTime: formData.get("weeklyDeliveryTime") || null,
          isActive: true,
        },
      ],
    };
  }

  if (billingCycle === "Monthly") {
    return {
      deliveryDays: [],
      schedules: [
        {
          scheduleType: "Monthly",
          dayOfMonth: Number(formData.get("monthlyDeliveryDay") || 1),
          quantity: expectedUnits,
          deliveryTime: formData.get("monthlyDeliveryTime") || null,
          isActive: true,
        },
      ],
    };
  }

  const customDates = parseJsonArray(
    formData.get("customDatesJson"),
    "Custom dates",
  )
    .filter((row) => row.specificDate)
    .map((row) => ({
      scheduleType: "Custom",
      specificDate: row.specificDate,
      quantity: Number(row.quantity || expectedUnits || 0),
      deliveryTime: row.deliveryTime || null,
      isActive: row.isActive !== false,
    }));

  if (!customDates.length) {
    throw new Error("Add at least one custom contract date before saving.");
  }

  return {
    deliveryDays: [],
    schedules: customDates,
  };
}

function renderStatusBadge(value) {
  const configured = getConfiguredStatusInfo(value);
  const lower = String(value || "").toLowerCase();
  let tone = "draft";
  if (
    [
      "active",
      "approved",
      "completed",
      "confirmed",
      "issued",
      "paid",
      "closed",
      "fully received",
    ].includes(lower)
  )
    tone = "approved";
  else if (["submitted", "reviewed", "sent"].includes(lower))
    tone = "submitted";
  else if (
    [
      "pending",
      "partially received",
      "partially paid",
      "suspended",
      "expired",
    ].includes(lower)
  )
    tone = "pending";
  else if (["rejected", "overdue", "urgent"].includes(lower)) tone = "rejected";
  const dot = /^#[0-9a-f]{6}$/i.test(configured?.color || "")
    ? ' style="--status-dot:' + configured.color + '"'
    : "";
  return (
    '<span class="status-badge ' +
    tone +
    '"' +
    dot +
    ">" +
    escapeHtml(configured?.status_name || value || "Unknown") +
    "</span>"
  );
}

function renderMetricGrid(targetId, metrics) {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }
  target.innerHTML = (metrics || [])
    .map(
      (metric) =>
        `<article class="metric-card tone-${escapeHtml(metric.tone || "green")} compact-metric-card">` +
        `<div class="metric-icon">${escapeHtml(metric.icon || "MM")}</div>` +
        `<div class="metric-copy">` +
        `<div class="eyebrow">${escapeHtml(metric.label)}</div>` +
        `<strong>${escapeHtml(metric.value)}</strong>` +
        `<p>${escapeHtml(metric.note || "")}</p>` +
        `</div>` +
        `</article>`,
    )
    .join("");
}

function renderPlaceholder(targetId, message, tone = "empty-state") {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }
  const isLoading = /^loading/i.test(String(message || ""));
  target.setAttribute("aria-busy", String(isLoading));
  target.innerHTML = isLoading
    ? `<div class="loading-state" role="status" aria-label="${escapeHtml(message)}">` +
      `<span class="skeleton-line skeleton-line-wide"></span>` +
      `<span class="skeleton-line"></span>` +
      `<span class="skeleton-line skeleton-line-short"></span>` +
      `</div>`
    : `<div class="state-card ${escapeHtml(tone)}"><span class="state-icon" aria-hidden="true">&#9671;</span><span>${escapeHtml(message)}</span></div>`;
}

function getWorkspaceTabs(moduleKey) {
  return workspaceTabs[moduleKey] || [];
}

function getActiveWorkspace(moduleKey) {
  const tabs = getWorkspaceTabs(moduleKey);
  const current = state.filters[moduleKey]?.tab;
  const activeNav = modules.find((entry) => entry.key === state.activeModule);
  if (
    moduleKey === "procurement" &&
    activeNav?.procurementTab &&
    state.activeModule !== "procurement"
  ) {
    return activeNav.procurementTab;
  }
  if (tabs.some((tab) => tab.key === current)) {
    return current;
  }
  if (
    moduleKey === "procurement" &&
    ["cash requisitions", "payments"].includes(current)
  ) {
    return current;
  }
  return tabs[0]?.key || current || "";
}

function getConfigurationGroup(groupKey) {
  return (
    configurationTabGroups.find((group) => group.key === groupKey) ||
    configurationTabGroups[0]
  );
}

function getActiveConfigurationGroup() {
  return getConfigurationGroup(state.filters.configurations?.tab).key;
}

function getActiveConfigurationType() {
  const group = getConfigurationGroup(getActiveConfigurationGroup());
  const requestedType = state.filters.configurations?.type;
  return group.types.includes(requestedType) ? requestedType : group.types[0];
}

function setActiveConfigurationType(type) {
  const group =
    configurationTabGroups.find((entry) => entry.types.includes(type)) ||
    configurationTabGroups[0];
  state.filters.configurations = {
    ...(state.filters.configurations || {}),
    tab: group.key,
    type,
  };
}

function buildActionButtonMarkup(action, moduleKey) {
  const className = action.className || "ghost-btn slim-btn";
  if (action.type === "open-form") {
    const resetAttr = action.reset ? ' data-reset-form="true"' : "";
    const titleAttr = action.title
      ? ` data-form-title="${escapeHtml(action.title)}"`
      : "";
    return `<button type="button" class="${className}" data-open-form="${escapeHtml(action.formId)}"${resetAttr}${titleAttr}>${escapeHtml(action.label)}</button>`;
  }
  if (action.type === "export") {
    return `<button type="button" class="${className}" data-export-module="${escapeHtml(moduleKey)}">${escapeHtml(action.label || "Export CSV")}</button>`;
  }
  if (action.type === "reset") {
    return `<button type="button" class="${className}" data-reset-module="${escapeHtml(moduleKey)}">${escapeHtml(action.label || "Reset")}</button>`;
  }
  if (action.type === "refresh") {
    return `<button type="button" class="${className}" data-load="${escapeHtml(moduleKey)}">${escapeHtml(action.label || "Refresh")}</button>`;
  }
  if (action.type === "quick-action") {
    return `<button type="button" class="${className}" data-quick-action="${escapeHtml(action.quickAction)}">${escapeHtml(action.label)}</button>`;
  }
  if (action.type === "detail") {
    return `<button type="button" class="${className}" data-detail-message="${escapeHtml(action.message || "")}" data-detail-title="${escapeHtml(action.title || action.label)}">${escapeHtml(action.label)}</button>`;
  }
  return "";
}

function ensureWorkspacePrimaryPanel(moduleKey) {
  const section = document.querySelector(`.module[data-module="${moduleKey}"]`);
  if (!section) {
    return null;
  }

  let primaryPanel = section.querySelector(".module-primary-panel");
  if (!primaryPanel) {
    primaryPanel = document.createElement("article");
    primaryPanel.className = "panel module-primary-panel";
    section.querySelector(".module-screen")?.prepend(primaryPanel);
  }

  let hero = primaryPanel.querySelector(".workspace-hero");
  if (!hero) {
    hero = document.createElement("div");
    hero.className = "workspace-hero";
    hero.innerHTML =
      `<div>` +
      `<p class="eyebrow workspace-kicker"></p>` +
      `<h1 class="workspace-title">Workspace</h1>` +
      `<p class="workspace-copy"></p>` +
      `</div>` +
      `<div class="workspace-actions"></div>`;
    primaryPanel.prepend(hero);
  }

  let tabsHost = primaryPanel.querySelector(".module-tabs");
  if (!tabsHost) {
    tabsHost = document.createElement("div");
    tabsHost.className = "module-tabs";
  }
  if (hero.nextElementSibling !== tabsHost) {
    hero.insertAdjacentElement("afterend", tabsHost);
  }

  let searchBar = primaryPanel.querySelector(".search-filter-bar");
  if (!searchBar) {
    searchBar = document.createElement("div");
    searchBar.className = "search-filter-bar";
    searchBar.innerHTML =
      `<label class="search-box">` +
      `<span class="search-box-icon" aria-hidden="true"><svg class="ui-icon" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg></span>` +
      `<input type="search" data-search-module="${escapeHtml(moduleKey)}" placeholder="Search..." />` +
      `</label>` +
      `<div class="bar-actions"></div>`;
  }
  if (tabsHost.nextElementSibling !== searchBar) {
    tabsHost.insertAdjacentElement("afterend", searchBar);
  }

  if (!searchBar.querySelector(".search-box")) {
    const label = document.createElement("label");
    label.className = "search-box";
    label.innerHTML =
      '<span class="search-box-icon" aria-hidden="true"><svg class="ui-icon" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg></span><input type="search" data-search-module="' +
      moduleKey +
      '" />';
    searchBar.prepend(label);
  }
  if (!searchBar.querySelector(".bar-actions")) {
    const actions = document.createElement("div");
    actions.className = "bar-actions";
    searchBar.appendChild(actions);
  }
  return primaryPanel;
}

function configureWorkspaceChrome(moduleKey, view) {
  const primaryPanel = ensureWorkspacePrimaryPanel(moduleKey);
  if (!primaryPanel) {
    return;
  }

  const section = primaryPanel.closest(".module");
  const tabsHost = primaryPanel.querySelector(".module-tabs");
  const hero = primaryPanel.querySelector(".workspace-hero");
  const searchInput = primaryPanel.querySelector(
    `[data-search-module="${moduleKey}"]`,
  );
  const actionHost = primaryPanel.querySelector(".bar-actions");

  const activeNav = modules.find((entry) => entry.key === state.activeModule);
  const aliasModule =
    moduleKey === "procurement" &&
    activeNav?.procurementTab &&
    state.activeModule !== "procurement"
      ? state.activeModule
      : null;
  const tabsModuleKey = aliasModule || moduleKey;
  const tabs = getWorkspaceTabs(tabsModuleKey);
  tabsHost.setAttribute("aria-label", `${titleCaseWords(tabsModuleKey)} views`);
  tabsHost.classList.toggle("hidden", tabs.length <= 1 && Boolean(aliasModule));
  tabsHost.innerHTML = tabs
    .map(
      (tab) =>
        `<button type="button" class="module-tab${getActiveWorkspace(tabsModuleKey) === tab.key ? " active" : ""}" aria-pressed="${getActiveWorkspace(tabsModuleKey) === tab.key}" data-workspace-key="${escapeHtml(tab.key)}" data-tabs-module="${escapeHtml(tabsModuleKey)}">${escapeHtml(tab.label)}</button>`,
    )
    .join("");

  if (hero) {
    const heroActions = [
      ...(view.heroActions || []),
      ...(view.actions || []).filter((action) => action.type === "open-form"),
    ];
    hero.querySelector(".workspace-kicker").textContent =
      view.eyebrow || titleCaseWords(moduleKey);
    hero.querySelector(".workspace-title").textContent =
      (aliasModule && activeNav?.label) ||
      view.title ||
      modules.find((module) => module.key === moduleKey)?.label ||
      titleCaseWords(moduleKey);
    hero.querySelector(".workspace-copy").textContent =
      view.description || workspaceDescriptions[moduleKey] || "";
    hero.querySelector(".workspace-actions").innerHTML = heroActions
      .map((action) => buildActionButtonMarkup(action, moduleKey))
      .join("");
    hero.classList.remove("hidden");
  }

  if (searchInput) {
    searchInput.placeholder = view.searchPlaceholder || "Search...";
    searchInput.setAttribute("aria-label", searchInput.placeholder);
    searchInput.value = state.filters[moduleKey]?.search || "";
    searchInput
      .closest(".search-box")
      ?.classList.toggle("hidden", view.hideSearch === true);
  }

  if (actionHost) {
    actionHost.innerHTML = (view.actions || [])
      .filter((action) => action.type !== "open-form")
      .map((action) => buildActionButtonMarkup(action, moduleKey))
      .join("");
  }

  section
    ?.querySelectorAll(".module-work-grid, .module-chart-grid")
    .forEach((grid) => {
      grid.classList.add("workspace-legacy-grid");
    });

  if (moduleKey === "settings") {
    primaryPanel
      .querySelectorAll(":scope > .panel-header")
      .forEach((header) => header.classList.add("hidden"));
  }
}

function ensureWorkspaceSecondaryTarget(moduleKey) {
  const panel = ensureWorkspacePrimaryPanel(moduleKey);
  if (!panel) {
    return null;
  }

  let secondary = panel.querySelector(".workspace-secondary");
  if (!secondary) {
    secondary = document.createElement("div");
    secondary.className = "workspace-secondary";
    panel.appendChild(secondary);
  }
  return secondary;
}

const documentExportEntities = {
  "purchase-requisition": "purchase-requisitions",
  "purchase-order": "purchase-orders",
  "goods-received": "goods-received",
  "supplier-invoice": "supplier-invoices",
  "payment-voucher": "payment-vouchers",
  "kitchen-requisition": "kitchen-requisitions",
  "production-batch": "production-batches",
};

function isExportRowAction(action) {
  return ["print", "pdf", "excel", "export"].includes(
    String(action?.action || "").toLowerCase(),
  );
}

function isViewRowAction(action) {
  return String(action?.action || "").toLowerCase() === "view";
}

function isDangerRowAction(action) {
  return ["suspend", "reject", "cancel", "delete", "return"].includes(
    String(action?.action || "").toLowerCase(),
  );
}

function isPrimaryRowAction(action) {
  if (action?.primary === true) return true;
  if (action?.primary === false) return false;
  return [
    "submit",
    "pay",
    "send",
    "receive",
    "issue",
    "release",
    "settle",
    "create-po",
    "create-voucher",
    "edit",
    "load-approve",
    "approve",
    "open",
    "convert",
  ].includes(String(action?.action || "").toLowerCase());
}

function renderRowActionControl(action, variant = "link") {
  const danger = isDangerRowAction(action);
  const className =
    variant === "primary"
      ? "primary-btn slim-btn table-action-primary"
      : variant === "menu"
        ? "table-action-menu-item" + (danger ? " danger-action" : "")
        : "table-action-link" + (danger ? " danger-action" : "");
  return (
    '<button type="button" class="' +
    className +
    '" data-row-action="' +
    escapeHtml(action.action) +
    '" data-entity="' +
    escapeHtml(action.entity) +
    '" data-id="' +
    escapeHtml(action.id) +
    '"' +
    (action.type ? ' data-type="' + escapeHtml(action.type) + '"' : "") +
    ">" +
    escapeHtml(action.label) +
    "</button>"
  );
}

function renderActionButtons(actions = []) {
  const list = Array.isArray(actions) ? actions.filter(Boolean) : [];
  if (!list.length) {
    return '<div class="table-actions-wrap"></div>';
  }

  const first = list[0];
  const autoExports =
    first && documentExportEntities[first.entity]
      ? [
          { entity: first.entity, id: first.id, label: "PDF", action: "pdf" },
          { entity: first.entity, id: first.id, label: "Excel", action: "excel" },
        ]
      : [];

  const seenExport = new Set();
  const exports = [];
  for (const action of [...list.filter(isExportRowAction), ...autoExports]) {
    const key = String(action.action).toLowerCase();
    if (seenExport.has(key)) continue;
    seenExport.add(key);
    exports.push(action);
  }

  const views = list.filter(isViewRowAction);
  const workflow = list.filter(
    (action) => !isViewRowAction(action) && !isExportRowAction(action),
  );

  let primary = workflow.find((action) => action.primary === true);
  if (!primary) {
    primary = workflow.find(isPrimaryRowAction);
  }
  if (!primary && workflow.length === 1 && !isDangerRowAction(workflow[0])) {
    primary = workflow[0];
  }

  const remainder = workflow.filter((action) => action !== primary);
  const secondary = remainder.filter((action) => !isDangerRowAction(action)).slice(0, 1);
  const overflow = remainder.filter((action) => !secondary.includes(action));

  let html = '<div class="table-actions-wrap">';
  if (primary) {
    html += renderRowActionControl(primary, "primary");
  }
  for (const view of views) {
    html += renderRowActionControl(view, "link");
  }
  for (const action of secondary) {
    html += renderRowActionControl(action, "link");
  }
  if (exports.length) {
    html +=
      '<details class="table-action-menu">' +
      '<summary class="table-action-menu-summary">Export</summary>' +
      '<div class="table-action-menu-panel" role="menu">' +
      exports.map((action) => renderRowActionControl(action, "menu")).join("") +
      "</div></details>";
  }
  if (overflow.length) {
    html +=
      '<details class="table-action-menu">' +
      '<summary class="table-action-menu-summary" aria-label="More actions">More</summary>' +
      '<div class="table-action-menu-panel" role="menu">' +
      overflow.map((action) => renderRowActionControl(action, "menu")).join("") +
      "</div></details>";
  }
  html += "</div>";
  return html;
}

function renderTable(targetId, columns, rows, options = {}) {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  target.setAttribute("aria-busy", "false");
  columns = columns.map((column) => ({
    ...column,
    numeric:
      column.numeric ??
      /quantity|amount|cost|price|balance|value|stock|usage|wastage|consumption_per|total_output/.test(
        column.key || "",
      ),
  }));
  const pageKey = options.pageKey || targetId;
  state.ui.tableModels[pageKey] = { targetId, columns, rows, options };

  if (options.error) {
    target.innerHTML = `<div class="state-card empty-state error-text" role="alert"><span class="state-icon" aria-hidden="true">!</span><span>${escapeHtml(options.error)}</span></div>`;
    return;
  }

  if (!rows || !rows.length) {
    const moduleKey = target.closest(".module")?.dataset.module;
    const searching = Boolean(state.filters[moduleKey]?.search);
    target.innerHTML =
      '<div class="state-card empty-state" role="status"><span class="state-icon" aria-hidden="true">—</span><strong>' +
      (searching ? "No matching records" : "No records in this view") +
      "</strong><span>" +
      escapeHtml(
        options.emptyMessage ||
          "Records will appear here when they are created.",
      ) +
      "</span>" +
      (searching
        ? '<button type="button" class="ghost-btn slim-btn" data-clear-search="' +
          escapeHtml(moduleKey) +
          '">Clear search</button>'
        : "") +
      "</div>";
    return;
  }

  const pageSize = options.pageSize || 20;
  const sort = state.tableSort[pageKey] || {};
  const sortedRows = [...rows];
  if (sort.key) {
    sortedRows.sort((left, right) => {
      const leftValue = left?.[sort.key];
      const rightValue = right?.[sort.key];
      const leftNumber = Number(leftValue);
      const rightNumber = Number(rightValue);
      const comparison =
        Number.isFinite(leftNumber) &&
        Number.isFinite(rightNumber) &&
        leftValue !== "" &&
        rightValue !== ""
          ? leftNumber - rightNumber
          : String(leftValue ?? "").localeCompare(
              String(rightValue ?? ""),
              undefined,
              {
                numeric: true,
                sensitivity: "base",
              },
            );
      return sort.direction === "desc" ? -comparison : comparison;
    });
  }

  const pageCount = Math.max(Math.ceil(sortedRows.length / pageSize), 1);
  const currentPage = Math.min(state.tablePages[pageKey] || 1, pageCount);
  state.tablePages[pageKey] = currentPage;
  const pageRows = options.hideTableFooter
    ? sortedRows
    : sortedRows.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      );

  const head = columns
    .map((column) => {
      const sortable =
        column.sortable !== false && column.key && column.key !== "actions";
      const activeSort = sort.key === column.key;
      const direction = activeSort ? sort.direction : "none";
      const indicator = activeSort
        ? sort.direction === "asc"
          ? "&#8593;"
          : "&#8595;"
        : "&#8597;";
      const numericClass =
        column.numeric || column.align === "right" ? ' class="numeric"' : "";
      return (
        `<th scope="col"${numericClass} aria-sort="${direction === "none" ? "none" : direction === "asc" ? "ascending" : "descending"}">` +
        (sortable
          ? `<button type="button" class="table-sort-btn" data-table-sort="${escapeHtml(pageKey)}:${escapeHtml(column.key)}">${escapeHtml(column.label)}<span aria-hidden="true">${indicator}</span></button>`
          : escapeHtml(column.label)) +
        `</th>`
      );
    })
    .join("");
  const body = pageRows
    .map((row) => {
      const cells = columns
        .map((column) => {
          const content = column.render
            ? column.render(row)
            : escapeHtml(row[column.key] ?? "");
          const numericClass =
            column.numeric || column.align === "right"
              ? ' class="numeric"'
              : "";
          return `<td data-label="${escapeHtml(column.label)}"${numericClass}>${content}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const pagination = options.hideTableFooter
    ? ""
    : '<div class="table-pagination"><span>' +
      ((currentPage - 1) * pageSize + 1) +
      "–" +
      Math.min(currentPage * pageSize, sortedRows.length) +
      " of " +
      sortedRows.length +
      " records</span>" +
      (pageCount > 1
        ? '<div class="table-pagination-controls"><button type="button" class="ghost-btn slim-btn" data-table-page="' +
          escapeHtml(pageKey) +
          ':prev" ' +
          (currentPage <= 1 ? "disabled" : "") +
          ">Previous</button><span>Page " +
          currentPage +
          " of " +
          pageCount +
          '</span><button type="button" class="ghost-btn slim-btn" data-table-page="' +
          escapeHtml(pageKey) +
          ':next" ' +
          (currentPage >= pageCount ? "disabled" : "") +
          ">Next</button></div>"
        : "") +
      "</div>";
  const tableLabel = options.label || targetId.replace(/-/g, " ");
  const scrollHint = options.hideTableFooter
    ? ""
    : `<p class="table-scroll-hint">Scroll horizontally to see all columns.</p>`;
  target.innerHTML = `<div class="table-shell" role="region" tabindex="0" aria-label="${escapeHtml(titleCaseWords(tableLabel))} — scroll for more columns"><table aria-label="${escapeHtml(titleCaseWords(tableLabel))}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>${scrollHint}${pagination}`;
}

function fillSelect(
  targetId,
  rows,
  valueKey = "id",
  labelBuilder = (row) => row.name,
  placeholder = null,
) {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }
  const options = [];
  if (placeholder) {
    options.push(`<option value="">${escapeHtml(placeholder)}</option>`);
  }
  options.push(
    ...(rows || []).map(
      (row) =>
        `<option value="${escapeHtml(row[valueKey])}">${escapeHtml(labelBuilder(row))}</option>`,
    ),
  );
  target.innerHTML = options.join("");
}

const configurationFormFieldMap = {
  units: [
    { key: "code", label: "Code", type: "text", required: true },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea" },
    { key: "sort_order", label: "Sort Order", type: "number" },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  "product-categories": [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea" },
    { key: "sort_order", label: "Sort Order", type: "number" },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  stores: [
    { key: "name", label: "Store Name", type: "text", required: true },
    {
      key: "location_type",
      label: "Location Type",
      type: "select",
      options: [
        "Central Store",
        "Kitchen Store",
        "Cold Store",
        "Dry Store",
        "Transit Store",
        "Store",
      ],
    },
    { key: "description", label: "Description", type: "textarea" },
    { key: "sort_order", label: "Sort Order", type: "number" },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  departments: [
    { key: "code", label: "Code", type: "text", required: true },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea" },
    { key: "sort_order", label: "Sort Order", type: "number" },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  statuses: [
    { key: "status_name", label: "Status Name", type: "text", required: true },
    { key: "status_code", label: "Status Code", type: "text", required: true },
    {
      key: "module_key",
      label: "Applies To",
      type: "select",
      options: [
        { value: "global", label: "Global" },
        { value: "contracts", label: "Contracts" },
        { value: "purchase_requisition", label: "Purchase Requisitions" },
        { value: "purchase_order", label: "Purchase Orders" },
        { value: "goods_received", label: "Goods Received" },
        { value: "inventory", label: "Inventory" },
        { value: "stock_adjustment", label: "Stock Adjustments" },
        { value: "kitchen_requisition", label: "Kitchen Requisitions" },
        { value: "store_issue", label: "Store Issues" },
        { value: "production_batch", label: "Production Batches" },
        { value: "wastage", label: "Wastage" },
        { value: "supplier_invoice", label: "Supplier Invoices" },
      ],
    },
    { key: "color", label: "Color", type: "color" },
    { key: "sort_order", label: "Sort Order", type: "number" },
    { key: "is_terminal", label: "Terminal", type: "checkbox" },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  "numbering-series": [
    {
      key: "document_type",
      label: "Document Type",
      type: "select",
      options: [
        { value: "purchase_requisition", label: "Purchase Requisition" },
        { value: "purchase_order", label: "Purchase Order" },
        { value: "goods_received", label: "Goods Received Note" },
        { value: "kitchen_requisition", label: "Kitchen Requisition" },
        { value: "store_issue", label: "Store Issue" },
        { value: "production_batch", label: "Production Batch" },
        { value: "supplier_invoice", label: "Supplier Invoice" },
        { value: "contract", label: "Contract" },
      ],
    },
    {
      key: "document_key",
      label: "Document Key",
      type: "text",
      required: true,
    },
    { key: "prefix", label: "Prefix", type: "text", required: true },
    { key: "current_number", label: "Current Number", type: "number" },
    { key: "padding_length", label: "Padding Length", type: "number" },
    {
      key: "reset_frequency",
      label: "Reset Frequency",
      type: "select",
      options: ["Never", "Yearly", "Monthly"],
    },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  "approval-workflows": [
    {
      key: "workflow_name",
      label: "Workflow Name",
      type: "text",
      required: true,
    },
    {
      key: "document_type",
      label: "Document Type",
      type: "select",
      options: [
        { value: "purchase_requisition", label: "Purchase Requisition" },
        { value: "purchase_order", label: "Purchase Order" },
        { value: "stock_adjustment", label: "Stock Adjustment" },
        { value: "kitchen_requisition", label: "Kitchen Requisition" },
      ],
    },
    {
      key: "required_role",
      label: "Approver Role",
      type: "select",
      options: [
        { value: "manager", label: "Manager" },
        { value: "procurement_officer", label: "Procurement Officer" },
        { value: "store_manager", label: "Store Manager" },
        { value: "kitchen_supervisor", label: "Kitchen Supervisor" },
        { value: "finance_officer", label: "Finance Officer" },
        { value: "admin", label: "Admin" },
      ],
    },
    { key: "approval_level", label: "Approval Level", type: "number" },
    { key: "min_amount", label: "Minimum Amount", type: "number" },
    { key: "max_amount", label: "Maximum Amount", type: "number" },
    {
      key: "can_creator_approve",
      label: "Creator Can Approve",
      type: "checkbox",
    },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  "payment-terms": [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "days_due", label: "Days Due", type: "number" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "sort_order", label: "Sort Order", type: "number" },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  "delivery-types": [
    { key: "code", label: "Code", type: "text", required: true },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea" },
    { key: "sort_order", label: "Sort Order", type: "number" },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  "expense-categories": [
    { key: "code", label: "Code", type: "text", required: true },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea" },
    { key: "sort_order", label: "Sort Order", type: "number" },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  "tax-settings": [
    { key: "tax_name", label: "Tax Name", type: "text", required: true },
    { key: "tax_rate", label: "Tax Rate", type: "number" },
    {
      key: "applies_to_purchases",
      label: "Applies To Purchases",
      type: "checkbox",
    },
    { key: "applies_to_sales", label: "Applies To Sales", type: "checkbox" },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  "notification-rules": [
    { key: "rule_name", label: "Rule Name", type: "text", required: true },
    {
      key: "trigger_type",
      label: "Trigger Type",
      type: "select",
      options: [
        { value: "low_stock", label: "Low Stock" },
        { value: "expiry", label: "Expiry" },
        { value: "contract_expiry", label: "Contract Expiry" },
        { value: "pending_approval", label: "Pending Approval" },
        { value: "supplier_invoice_due", label: "Supplier Invoice Due" },
      ],
    },
    { key: "threshold_value", label: "Threshold", type: "number" },
    {
      key: "recipient_role",
      label: "Recipient Role",
      type: "select",
      options: [
        { value: "store_manager", label: "Store Manager" },
        { value: "manager", label: "Manager" },
        { value: "finance_officer", label: "Finance Officer" },
        { value: "procurement_officer", label: "Procurement Officer" },
        { value: "kitchen_supervisor", label: "Kitchen Supervisor" },
        { value: "admin", label: "Admin" },
      ],
    },
    { key: "description", label: "Description", type: "textarea" },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
};

function hexToRgba(hexColor, alpha = 0.12) {
  const hex = String(hexColor || "")
    .replace("#", "")
    .trim();
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `rgba(31, 41, 55, ${alpha})`;
  }
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getConfiguredStatusInfo(value) {
  const lower = String(value || "").toLowerCase();
  return (state.reference.statuses || []).find((row) => {
    const nameMatch = String(row.status_name || "").toLowerCase() === lower;
    const codeMatch =
      String(row.status_code || "").toLowerCase() ===
      lower.replace(/\s+/g, "_");
    return nameMatch || codeMatch;
  });
}

function getStatusOptionsForModule(moduleKey) {
  return (state.reference.statuses || []).filter(
    (row) => row.module_key === moduleKey || row.module_key === "global",
  );
}

function fillStatusSelect(targetId, moduleKey, placeholder = null) {
  fillSelect(
    targetId,
    getStatusOptionsForModule(moduleKey),
    "status_name",
    (row) => row.status_name,
    placeholder,
  );
}

function syncPaymentVoucherSourceFields() {
  const form = document.getElementById("payment-voucher-form");
  if (!form) {
    return;
  }
  const sourceType = form.elements.namedItem("sourceType");
  const invoiceSelect = form.elements.namedItem("supplierInvoiceId");
  const cashSelect = form.elements.namedItem("cashRequisitionId");
  const invoiceField = document.getElementById("payment-voucher-invoice-field");
  const cashField = document.getElementById("payment-voucher-cash-field");
  const purposeFieldWrap = document.getElementById("payment-voucher-purpose-field");
  const payeeField = document.getElementById("payment-voucher-payee");
  const purposeField = form.elements.namedItem("purpose");
  const supplierIdField = form.elements.namedItem("supplierId");
  if (
    !sourceType ||
    !invoiceSelect ||
    !cashSelect ||
    !invoiceField ||
    !cashField ||
    !payeeField ||
    !purposeField ||
    !supplierIdField
  ) {
    return;
  }

  if (!form.dataset.paymentSourceBound) {
    sourceType.addEventListener("change", syncPaymentVoucherSourceFields);
    invoiceSelect.addEventListener("change", syncPaymentVoucherSourceFields);
    cashSelect.addEventListener("change", syncPaymentVoucherSourceFields);
    form.dataset.paymentSourceBound = "true";
  }

  const isCash = sourceType.value === "cash_requisition";
  invoiceField.classList.toggle("hidden", isCash);
  cashField.classList.toggle("hidden", !isCash);
  purposeFieldWrap?.classList.toggle("hidden", false);
  invoiceSelect.required = !isCash;
  cashSelect.required = isCash;
  purposeField.required = isCash;
  purposeField.placeholder = isCash
    ? "What this cash payment is for"
    : "Optional line description on the voucher";
  const purposeLabel = document.getElementById("payment-voucher-purpose-label");
  if (purposeLabel) {
    purposeLabel.textContent = isCash ? "Purpose" : "Payment description";
  }

  const invoices = state.moduleData.procurement?.invoices || [];
  const cashRequisitions = state.moduleData.procurement?.cashRequisitions || [];
  const invoice = !isCash
    ? invoices.find((row) => Number(row.id) === Number(invoiceSelect.value))
    : null;
  const cashRequisition = isCash
    ? cashRequisitions.find((row) => Number(row.id) === Number(cashSelect.value))
    : null;
  const source = invoice || cashRequisition;
  const autoPayee = invoice?.supplier_name || cashRequisition?.payee_name || "";
  const autoPurpose = invoice
    ? `Payment against supplier invoice ${invoice.invoice_number}`
    : cashRequisition?.purpose || "";

  supplierIdField.value = invoice?.supplier_id || "";

  if (source) {
    if (!payeeField.value || payeeField.value === form.dataset.autofillPayee) {
      payeeField.value = autoPayee;
    }
    form.dataset.autofillPayee = autoPayee;

    if (!purposeField.value || purposeField.value === form.dataset.autofillPurpose) {
      purposeField.value = autoPurpose;
    }
    form.dataset.autofillPurpose = autoPurpose;

    form.elements.namedItem("amount").value = invoice
      ? Math.max(
          Number(invoice.total_amount || 0) - Number(invoice.amount_paid || 0),
          0,
        )
      : Number(cashRequisition.amount || 0);
    if (!form.elements.namedItem("paymentDate").value) {
      form.elements.namedItem("paymentDate").value = new Date()
        .toISOString()
        .slice(0, 10);
    }
    if (
      !form.elements.namedItem("paymentMethod").dataset.touched ||
      form.elements.namedItem("paymentMethod").value ===
        form.dataset.autofillMethod
    ) {
      form.elements.namedItem("paymentMethod").value = invoice
        ? "Bank Transfer"
        : cashRequisition.release_payment_method || "Cash";
    }
    form.dataset.autofillMethod = invoice
      ? "Bank Transfer"
      : cashRequisition.release_payment_method || "Cash";

    const referenceField = form.elements.namedItem("referenceNumber");
    const autoReference = cashRequisition?.release_reference_number || "";
    if (!referenceField.value || referenceField.value === form.dataset.autofillReference) {
      referenceField.value = autoReference;
    }
    form.dataset.autofillReference = autoReference;
  } else {
    if (payeeField.value === form.dataset.autofillPayee) payeeField.value = "";
    if (purposeField.value === form.dataset.autofillPurpose) purposeField.value = "";
    form.elements.namedItem("amount").value = "";
    form.dataset.autofillPayee = "";
    form.dataset.autofillPurpose = "";
    form.dataset.autofillMethod = "";
    form.dataset.autofillReference = "";
  }
}

function addDaysToDate(value, days) {
  const date = new Date(`${String(value || "").slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function syncSupplierInvoicePaymentFields() {
  const form = document.getElementById("supplier-invoice-form");
  if (!form) {
    return;
  }
  const method = form.elements.namedItem("paymentMethod");
  const dueDate = form.elements.namedItem("dueDate");
  const dueDateField = document.getElementById("invoice-due-date-field");
  if (!method || !dueDate || !dueDateField) {
    return;
  }
  const isCredit = method.value === "Credit";
  dueDateField.classList.toggle("hidden", !isCredit);
  dueDate.required = isCredit;
  if (!isCredit) {
    dueDate.value = "";
  }
}

function syncSupplierInvoicePurchaseOrderFields() {
  const form = document.getElementById("supplier-invoice-form");
  const orderSelect = form?.elements.namedItem("purchaseOrderId");
  if (!form || !orderSelect) {
    return;
  }
  if (!form.dataset.purchaseOrderBound) {
    orderSelect.addEventListener("change", syncSupplierInvoicePurchaseOrderFields);
    form.elements.namedItem("paymentMethod")?.addEventListener("change", syncSupplierInvoicePaymentFields);
    form.dataset.purchaseOrderBound = "true";
  }

  const orders = state.moduleData.procurement?.orders || [];
  const order = orders.find((row) => Number(row.id) === Number(orderSelect.value));
  const supplierSelect = form.elements.namedItem("supplierId");
  const paymentTermSelect = form.elements.namedItem("paymentTermId");
  const grnSelect = form.elements.namedItem("goodsReceivedNoteId");
  const totalAmount = form.elements.namedItem("totalAmount");
  const invoiceDate = form.elements.namedItem("invoiceDate");
  const dueDate = form.elements.namedItem("dueDate");
  if (!order) {
    syncSupplierInvoicePaymentFields();
    return;
  }

  if (supplierSelect && order.supplier_id) {
    supplierSelect.value = String(order.supplier_id);
  }
  if (paymentTermSelect) {
    paymentTermSelect.value = order.payment_term_id ? String(order.payment_term_id) : "";
  }
  if (totalAmount && Number(order.total_amount || 0) > 0) {
    totalAmount.value = Number(order.total_amount).toFixed(2);
  }

  const matchingReceipts = (state.moduleData.procurement?.received || []).filter(
    (row) => Number(row.purchase_order_id) === Number(order.id),
  );
  if (grnSelect && matchingReceipts.length === 1) {
    grnSelect.value = String(matchingReceipts[0].id);
  }

  const paymentTerm = (state.reference.paymentTerms || []).find(
    (row) => Number(row.id) === Number(order.payment_term_id),
  );
  const termName = String(paymentTerm?.name || "").toLowerCase();
  const isCashTerm = termName === "cash" || termName.includes("cash");
  const method = form.elements.namedItem("paymentMethod");
  if (method) {
    method.value = isCashTerm ? "Cash" : "Credit";
  }
  if (dueDate && invoiceDate && !isCashTerm && paymentTerm?.days_due > 0) {
    dueDate.value = addDaysToDate(invoiceDate.value, paymentTerm.days_due);
  }
  syncSupplierInvoicePaymentFields();
}

function fillWorkflowSelects() {
  const requisitions = state.moduleData.procurement?.requisitions || [];
  const orders = state.moduleData.procurement?.orders || [];
  const received = state.moduleData.procurement?.received || [];
  const invoices = state.moduleData.procurement?.invoices || [];
  const departments = state.reference.departments || [];
  const kitchenRequisitions = state.moduleData.kitchen?.requisitions || [];
  const storeIssues =
    state.moduleData.kitchen?.issues ||
    state.moduleData.production?.issues ||
    [];
  const productionBatches = state.moduleData.production?.batches || [];

  fillSelect(
    "purchase-order-requisition-select",
    requisitions,
    "id",
    (row) =>
      `${row.requisition_number} | ${titleCaseWords(row.status || "draft")}`,
    "No requisition — raise this order directly",
  );
  fillSelect(
    "goods-received-order-select",
    orders,
    "id",
    (row) => `${row.order_number} | ${row.supplier_name || "Supplier"}`,
    "Select purchase order",
  );
  fillSelect(
    "invoice-order-select",
    orders,
    "id",
    (row) => `${row.order_number} | ${row.supplier_name || "Supplier"}`,
    "Link purchase order (optional)",
  );
  fillSelect(
    "invoice-grn-select",
    received,
    "id",
    (row) => `${row.grn_number} | ${row.supplier_name || "Supplier"}`,
    "Link goods received note (optional)",
  );
  fillSelect(
    "cash-requisition-department-select",
    departments,
    "id",
    (row) => row.name,
    "Select department (optional)",
  );
  fillSelect(
    "payment-voucher-supplier-select",
    state.reference.suppliers,
    "id",
    (row) => row.name,
    "Select supplier",
  );
  fillSelect(
    "payment-voucher-invoice-select",
    invoices.filter((row) => Number(row.total_amount || 0) - Number(row.amount_paid || 0) > 0.0001),
    "id",
    (row) =>
      `${row.invoice_number} | ${formatCurrency(Number(row.total_amount || 0) - Number(row.amount_paid || 0))} due`,
    "Select supplier invoice",
  );
  fillSelect(
    "payment-voucher-cash-requisition-select",
    (state.moduleData.procurement?.cashRequisitions || []).filter((row) =>
      ["approved", "cash released"].includes(String(row.status || "").toLowerCase()) && !row.payment_voucher_number,
    ),
    "id",
    (row) => `${row.requisition_number} | ${row.payee_name || "Cash request"} | ${formatCurrency(row.amount, row.currency_code || "UGX")}`,
    "Select approved cash requisition",
  );
  syncSupplierInvoicePurchaseOrderFields();
  syncPaymentVoucherSourceFields();
  fillSelect(
    "store-issue-requisition-select",
    kitchenRequisitions,
    "id",
    (row) => `${row.requisition_number} | ${row.department_name || "Kitchen"}`,
    "Select kitchen requisition",
  );
  fillSelect(
    "production-requisition-select",
    kitchenRequisitions,
    "id",
    (row) => `${row.requisition_number} | ${row.department_name || "Kitchen"}`,
    "Select kitchen requisition",
  );
  fillSelect(
    "return-requisition-select",
    kitchenRequisitions,
    "id",
    (row) => `${row.requisition_number} | ${row.department_name || "Kitchen"}`,
    "Select kitchen requisition",
  );
  fillSelect(
    "production-issue-select",
    storeIssues,
    "id",
    (row) => `${row.issue_number} | ${titleCaseWords(row.status || "issued")}`,
    "Link store issue (optional)",
  );
  fillSelect(
    "wastage-issue-select",
    storeIssues,
    "id",
    (row) => `${row.issue_number} | ${titleCaseWords(row.status || "issued")}`,
    "Link store issue (optional)",
  );
  fillSelect(
    "return-issue-select",
    storeIssues,
    "id",
    (row) => `${row.issue_number} | ${titleCaseWords(row.status || "issued")}`,
    "Select store issue",
  );
  fillSelect(
    "wastage-batch-select",
    productionBatches,
    "id",
    (row) => `${row.batch_number} | ${row.shift || "Shift"}`,
    "Link production batch (optional)",
  );
  fillSelect(
    "wastage-product-select",
    state.reference.products,
    "id",
    (row) => row.name,
    "Select product",
  );
}

function setTodayDefaults() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  document.querySelectorAll('input[type="date"]').forEach((input) => {
    if (!input.value) {
      input.value = today;
    }
  });
  state.consumptionRange = {
    startDate: monthAgo,
    endDate: today,
  };
  const consumptionForm = document.getElementById("consumption-range-form");
  if (consumptionForm) {
    consumptionForm.startDate.value = monthAgo;
    consumptionForm.endDate.value = today;
  }
}

function enhanceForms(root = document) {
  root.querySelectorAll("form label").forEach((label) => {
    if (label.querySelector(":scope > .field-label-text")) {
      return;
    }

    const textNodes = [...label.childNodes].filter(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
    );
    const labelText = textNodes
      .map((node) => node.textContent.trim())
      .join(" ");
    if (!labelText) {
      return;
    }

    textNodes.forEach((node) => node.remove());
    const labelSpan = document.createElement("span");
    labelSpan.className = "field-label-text";
    labelSpan.textContent = labelText;
    const control = label.querySelector("input, select, textarea");
    if (control?.required) {
      const required = document.createElement("span");
      required.className = "required-marker";
      required.setAttribute("aria-hidden", "true");
      required.textContent = " *";
      labelSpan.appendChild(required);
    }
    label.insertBefore(labelSpan, label.firstChild);
  });

  root.querySelectorAll("input,select,textarea").forEach((control, index) => {
    if (!control.id)
      control.id =
        "field-" +
        (control.form?.id || "app") +
        "-" +
        (control.name || "control") +
        "-" +
        index;
  });
  root.querySelectorAll(".form-status").forEach((status) => {
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
  });
}

function readLocationState() {
  const [rawModuleKey, tabKey] = window.location.hash
    .replace(/^#/, "")
    .split("/")
    .map(decodeURIComponent);
  const moduleKey = rawModuleKey;
  if (modules.some((module) => module.key === moduleKey)) {
    state.activeModule = moduleKey;
    const mod = modules.find((entry) => entry.key === moduleKey);
    if (mod?.procurementTab) {
      state.filters.procurement = {
        ...(state.filters.procurement || {}),
        tab: mod.procurementTab,
      };
    } else if (tabKey && state.filters[moduleKey]) {
      state.filters[moduleKey].tab = tabKey;
    }
  }
}

function updateLocationState() {
  if (!state.user) {
    return;
  }
  const activeNav = modules.find((entry) => entry.key === state.activeModule);
  const tab = activeNav?.procurementTab
    ? ""
    : getActiveWorkspace(state.activeModule);
  const nextHash = `#${encodeURIComponent(state.activeModule)}${tab ? `/${encodeURIComponent(tab)}` : ""}`;
  if (window.location.hash !== nextHash) {
    window.history.pushState(null, "", nextHash);
  }
}

function closeMobileNavigation() {
  const wasOpen = document.body.classList.contains("sidebar-open");
  document.body.classList.remove("sidebar-open");
  syncOverlayAccessibility();
  if (wasOpen) document.getElementById("sidebar-menu-btn")?.focus();
  document
    .getElementById("sidebar-menu-btn")
    ?.setAttribute("aria-expanded", "false");
}

function renderNav() {
  const groups = [
    ...new Set(modules.map((module) => module.group || "Workspace")),
  ];
  $("#nav").innerHTML = groups
    .map((group) => {
      const items = modules
        .filter(
          (module) =>
          (module.group || "Workspace") === group &&
            (module.key !== "approvals" || hasPermission(...APPROVAL_PERMISSIONS)) &&
            (module.key !== "settings" || hasRole("admin")),
        )
        .map(
          (module) =>
            `<button type="button" data-module="${module.key}" class="${state.activeModule === module.key ? "active" : ""}" ` +
            `title="${escapeHtml(module.label)}" aria-label="${escapeHtml(module.label)}" ${state.activeModule === module.key ? 'aria-current="page"' : ""}>` +
            `<span class="nav-icon" aria-hidden="true">${module.icon || ""}</span>` +
            `<span class="nav-text">${escapeHtml(module.label)}</span>` +
            `</button>`,
        )
        .join("");
      return `<div class="nav-group"><div class="nav-group-label">${escapeHtml(group)}</div>${items}</div>`;
    })
    .join("");
}

function showModule(key) {
  state.activeModule = key;
  const module = modules.find((entry) => entry.key === key);
  const sectionKey = module?.sectionKey || key;
  if (module?.procurementTab) {
    state.filters.procurement = {
      ...(state.filters.procurement || {}),
      tab: module.procurementTab,
    };
    if (key === "cash-requisitions" && !state.filters["cash-requisitions"]?.tab) {
      state.filters["cash-requisitions"] = {
        ...(state.filters["cash-requisitions"] || {}),
        tab: "pending",
      };
    }
  }
  document.querySelectorAll(".module").forEach((section) => {
    section.classList.toggle("hidden", section.dataset.module !== sectionKey);
  });
  $("#page-kicker").textContent = module?.group || "Workspace";
  $("#page-title").textContent = module ? module.label : "Workspace";
  $("#page-copy").textContent = "";
  document.title = `${module?.label || "Workspace"} · Lefori`;
  renderNav();
  syncModuleTabs();
  updateLocationState();
  closeMobileNavigation();
  document.getElementById("workspace")?.scrollTo({ top: 0, behavior: "auto" });
  const globalSearch = document.getElementById("global-search");
  const moduleSearch =
    document.querySelector(`[data-search-module="${sectionKey}"]`) ||
    document.querySelector(`[data-search-module="${key}"]`);
  if (globalSearch) {
    globalSearch.value = moduleSearch?.value || "";
    globalSearch.placeholder =
      moduleSearch?.placeholder || "Search this workspace";
    globalSearch.disabled = !moduleSearch;
  }
  if (sectionKey === "procurement" && key !== "procurement") {
    rerenderModule("procurement");
  }
}

function getDashboardGreetingName() {
  const fullName = String(state.user?.fullName || "").trim();
  const primaryRole = String(state.user?.roleNames?.[0] || "").trim();
  if (fullName.toLowerCase() === "system administrator" && primaryRole) {
    return primaryRole;
  }
  return fullName.split(/\s+/)[0] || primaryRole || "Admin";
}

function hasRole(...roleCodes) {
  const roles = state.user?.roles || [];
  return roles.some((role) => roleCodes.includes(role));
}

function hasPermission(...permissionCodes) {
  if (hasRole("admin")) {
    return true;
  }
  const permissions = state.user?.permissions || [];
  return permissionCodes.some((permission) => permissions.includes(permission));
}

function canAccessApprovalQueue() {
  return hasPermission(...APPROVAL_PERMISSIONS);
}

function updateAuthState() {
  const signedIn = Boolean(state.user);
  $("#login-section").classList.toggle("hidden", signedIn);
  $("#workspace").classList.toggle("hidden", !signedIn);
  document.getElementById("logout-btn")?.classList.toggle("hidden", !signedIn);
  const initials = signedIn
    ? state.user.fullName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("")
    : "C";
  const roleLabel = signedIn
    ? state.user.roleNames.map(titleCaseWords).join(", ")
    : "Admin";
  const sessionName = document.getElementById("user-chip");
  const sessionRole = document.getElementById("user-role-chip");
  const sessionAvatar = document.getElementById("session-avatar");
  if (sessionName) sessionName.textContent = signedIn ? state.user.fullName : "Signed out";
  if (sessionRole) sessionRole.textContent = roleLabel;
  if (sessionAvatar) sessionAvatar.textContent = initials;
  const topbarAvatar = document.getElementById("topbar-avatar");
  const topbarName = document.getElementById("topbar-user-name");
  const topbarRole = document.getElementById("topbar-user-role");
  if (topbarAvatar) {
    topbarAvatar.textContent = initials;
  }
  if (topbarName) {
    topbarName.textContent = signedIn ? state.user.fullName : "Signed out";
  }
  if (topbarRole) {
    topbarRole.textContent = roleLabel;
  }
  document.body.classList.toggle("signed-out", !signedIn);
  if (signedIn) {
    applyPermissionState();
    showModule(state.activeModule);
  }
}

function applyPermissionState() {
  const formPermissions = [
    ["purchase-requisition-approve-form", PROCUREMENT_REQUISITION_APPROVAL_PERMISSION],
    ["purchase-requisition-reject-form", PROCUREMENT_REQUISITION_APPROVAL_PERMISSION],
    ["cash-requisition-action-form", PROCUREMENT_REQUISITION_APPROVAL_PERMISSION],
    ["cash-requisition-release-form", CASH_REQUISITION_RELEASE_PERMISSION],
    ["cash-requisition-settle-form", CASH_REQUISITION_SETTLE_PERMISSION],
    ["kitchen-approve-form", KITCHEN_REQUISITION_APPROVAL_PERMISSION],
    ["kitchen-reject-form", KITCHEN_REQUISITION_APPROVAL_PERMISSION],
  ];

  for (const [formId, permission] of formPermissions) {
    const form = document.getElementById(formId);
    if (!form) {
      continue;
    }
    const allowed = hasPermission(permission);
    let permissionNote = form.querySelector(
      ":scope > .permission-denied-state",
    );
    if (!allowed && !permissionNote) {
      permissionNote = document.createElement("div");
      permissionNote.className = "permission-denied-state full-span";
      permissionNote.setAttribute("role", "note");
      permissionNote.textContent =
        "You can view this workflow, but your role cannot submit or approve this action.";
      form.prepend(permissionNote);
    } else if (allowed) {
      permissionNote?.remove();
    }
    form
      .querySelectorAll("input, select, textarea, button")
      .forEach((element) => {
        if (element.type === "hidden" || element.dataset.closeForm) {
          return;
        }
        element.disabled = !allowed;
        if (!allowed) {
          element.dataset.permissionLocked = "true";
          element.title = "Your role cannot perform this action.";
        } else {
          delete element.dataset.permissionLocked;
          element.removeAttribute("title");
        }
      });
  }
}

async function loadHealth() {
  try {
    await api("/health");
    $("#health-pill").className = "pill success";
    $("#db-pill").className = "pill success";
    $("#health-pill").textContent = "API";
    $("#db-pill").textContent = "Database";
  } catch (error) {
    $("#health-pill").className = "pill danger";
    $("#db-pill").className = "pill warning";
    $("#health-pill").textContent = "API error";
    $("#db-pill").textContent = "Database error";
  }
}

async function loadSession() {
  const response = await api("/api/auth/me");
  state.user = response.user;
  updateAuthState();
}

function filterLocationsForClient(clientId) {
  const locations = clientId
    ? state.reference.locations.filter(
        (location) => Number(location.client_id) === Number(clientId),
      )
    : state.reference.locations;
  fillSelect(
    "contract-location-select",
    locations,
    "id",
    (row) => row.name,
    locations.length ? null : "No locations",
  );
}

async function loadReferenceData() {
  const response = await api("/api/master-data/reference-data");
  state.reference = response.data;

  fillSelect(
    "location-client-select",
    state.reference.clients,
    "id",
    (row) => row.name,
    "Select client",
  );
  fillSelect(
    "product-category-select",
    state.reference.categories,
    "id",
    (row) => row.name,
    "Select category",
  );
  fillSelect(
    "product-unit-select",
    state.reference.units,
    "id",
    (row) => `${row.code} - ${row.name}`,
    "Select unit",
  );
  fillSelect(
    "product-supplier-select",
    state.reference.suppliers,
    "id",
    (row) => row.name,
    "Optional supplier",
  );
  fillSelect(
    "purchase-order-supplier-select",
    state.reference.suppliers,
    "id",
    (row) => row.name,
    "Select supplier",
  );
  fillSelect(
    "invoice-supplier-select",
    state.reference.suppliers,
    "id",
    (row) => row.name,
    "Select supplier",
  );
  fillSelect(
    "payment-supplier-select",
    state.reference.suppliers,
    "id",
    (row) => row.name,
    "Select supplier",
  );
  fillSelect(
    "adjustment-store-select",
    state.reference.stores,
    "id",
    (row) => row.name,
    "Select store",
  );
  fillSelect(
    "count-store-select",
    state.reference.stores,
    "id",
    (row) => row.name,
    "Select store",
  );
  fillSelect(
    "kitchen-store-select",
    state.reference.stores,
    "id",
    (row) => row.name,
    "Select store",
  );
  fillSelect(
    "return-store-select",
    state.reference.stores,
    "id",
    (row) => row.name,
    "Select store",
  );
  fillSelect(
    "payment-term-select",
    state.reference.paymentTerms,
    "id",
    (row) => row.name,
    "Select payment term",
  );
  fillSelect(
    "contract-payment-term-select",
    state.reference.paymentTerms,
    "id",
    (row) => row.name,
    "Select payment term",
  );
  fillSelect(
    "purchase-order-payment-term-select",
    state.reference.paymentTerms,
    "id",
    (row) => row.name,
    "Select payment term",
  );
  fillSelect(
    "invoice-payment-term-select",
    state.reference.paymentTerms,
    "id",
    (row) => row.name,
    "Select payment term",
  );
  fillSelect(
    "contract-delivery-type-select",
    state.reference.deliveryTypes,
    "id",
    (row) => row.name,
    "Select delivery type",
  );
  fillSelect(
    "kitchen-department-select",
    state.reference.departments,
    "id",
    (row) => row.name,
    "Select department",
  );
  fillSelect(
    "production-department-select",
    state.reference.departments,
    "id",
    (row) => row.name,
    "Select department",
  );
  fillSelect(
    "production-delivery-type-select",
    state.reference.deliveryTypes,
    "id",
    (row) => row.name,
    "Select delivery type",
  );
  fillWorkflowSelects();
  refreshCollectionEditors();
}

function matchesSearch(row, search, keys) {
  if (!search) {
    return true;
  }
  const query = search.toLowerCase();
  return keys.some((key) =>
    String(row[key] ?? "")
      .toLowerCase()
      .includes(query),
  );
}

function setExportState(moduleKey, filename, columns, rows) {
  state.exports[moduleKey] = { filename, columns, rows };
}

function getPeriodDates(period) {
  const today = new Date();
  const endDate = today.toISOString().slice(0, 10);
  if (period === "today") {
    return { startDate: endDate, endDate };
  }
  if (period === "week") {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return { startDate: start.toISOString().slice(0, 10), endDate };
  }
  if (period === "year") {
    return { startDate: `${today.getFullYear()}-01-01`, endDate };
  }
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return { startDate: `${today.getFullYear()}-${month}-01`, endDate };
}

function getReportRange() {
  const filters = state.filters.reports;
  if (filters.period === "custom" && filters.startDate && filters.endDate) {
    return { startDate: filters.startDate, endDate: filters.endDate };
  }
  return getPeriodDates(filters.period || "month");
}

function downloadFileFromUrl(url) {
  const link = document.createElement("a");
  link.href = url;
  link.download = "";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadCsv(filename, columns, rows) {
  const lines = [
    columns
      .map((column) => `"${String(column.label).replace(/"/g, '""')}"`)
      .join(","),
    ...rows.map((row) =>
      columns
        .map((column) => {
          const raw = column.export
            ? column.export(row)
            : column.key
              ? row[column.key]
              : "";
          return `"${String(raw ?? "").replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ];

  const blob = new Blob([lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function syncModuleTabs() {
  document.querySelectorAll(".module").forEach((section) => {
    const firstTab = section.querySelector(".module-tab[data-tabs-module]");
    const moduleKey = firstTab?.dataset.tabsModule || section.dataset.module;
    const activeTab = getActiveWorkspace(moduleKey);
    section.querySelectorAll(".module-tab").forEach((tab, index) => {
      const tabKey =
        tab.dataset.workspaceKey || tab.textContent.trim().toLowerCase();
      const isActive = activeTab ? tabKey === activeTab : index === 0;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-pressed", String(isActive));
    });
  });
}

function getFocusableElements(container) {
  return [
    ...container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter(
    (element) => !element.closest(".hidden") && element.offsetParent !== null,
  );
}

function trapModalFocus(event, modal) {
  if (event.key !== "Tab") {
    return;
  }
  const focusable = getFocusableElements(modal);
  if (!focusable.length) {
    event.preventDefault();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function syncOverlayAccessibility() {
  const formOpen = !$("#form-modal").classList.contains("hidden");
  const detailOpen = !$("#detail-modal").classList.contains("hidden");
  const mobile = window.matchMedia("(max-width:960px)").matches;
  const navOpen = mobile && document.body.classList.contains("sidebar-open");
  $("#workspace").inert = formOpen || detailOpen || navOpen;
  $(".topbar").inert = formOpen || detailOpen || navOpen;
  $(".sidebar").inert = formOpen || detailOpen || (mobile && !navOpen);
  $("#detail-modal").inert = formOpen;
}

function openDetailModal(title, bodyHtml) {
  const modal = $("#detail-modal");
  modal.__previousFocus = document.activeElement;
  $("#detail-modal-title").textContent = title;
  $("#detail-modal-body").innerHTML = bodyHtml;
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  syncOverlayAccessibility();
  $("#detail-modal-close")?.focus();
}

function closeDetailModal() {
  const modal = $("#detail-modal");
  modal.classList.add("hidden");
  if ($("#form-modal")?.classList.contains("hidden")) {
    document.body.classList.remove("modal-open");
  }
  syncOverlayAccessibility();
  modal.__previousFocus?.focus?.();
}

function getFormModalMeta(formId) {
  const base = formModalMeta[formId] || {
    eyebrow: "Workspace Action",
    title: titleCaseWords(formId.replace(/-form$/, "").replace(/-/g, " ")),
    description: "Complete the form and save to continue the workflow.",
  };

  if (
    formId === "contract-form" &&
    document.querySelector('#contract-form [name="id"]')?.value
  ) {
    return {
      ...base,
      title: "Edit Contract",
    };
  }

  if (
    ["client-form", "supplier-form", "product-form"].includes(formId) &&
    document.querySelector(`#${formId} [name="id"]`)?.value
  ) {
    return {
      ...base,
      title: `Edit ${base.title}`,
    };
  }

  if (formId === "configuration-form") {
    const type =
      document.querySelector('#configuration-form [name="type"]')?.value ||
      getActiveConfigurationType();
    const definition =
      (state.moduleData.configurations?.definitions || []).find(
        (entry) => entry.key === type,
      ) || workspaceTabs.configurations.find((entry) => entry.key === type);
    const editing = Boolean(
      document.querySelector('#configuration-form [name="id"]')?.value,
    );
    return {
      ...base,
      title: `${editing ? "Edit" : "Create"} ${definition?.label || titleCaseWords(type.replace(/-/g, " "))}`,
      description: definition?.description || base.description,
    };
  }

  return base;
}

function openFormModal(formId, options = {}) {
  const form = document.getElementById(formId);
  const modal = document.getElementById("form-modal");
  const body = document.getElementById("form-modal-body");
  if (!form || !modal || !body) {
    return;
  }

  const previousFocus = document.activeElement;

  if (!form.__modalPlaceholder) {
    const placeholder = document.createElement("div");
    placeholder.className = "form-modal-placeholder hidden";
    form.parentNode?.insertBefore(placeholder, form);
    form.__modalPlaceholder = placeholder;
  }

  const currentFormId = state.ui.activeFormId;
  if (currentFormId && currentFormId !== formId && !options.skipStackPush) {
    state.ui.formModalStack.push(currentFormId);
    closeFormModal({ restoreParent: false });
  } else if (currentFormId === formId) {
    closeFormModal({ restoreParent: false });
  } else {
    closeFormModal({ restoreParent: false });
  }

  if (options.reset) {
    if (formId === "contract-form") {
      resetContractForm();
    } else if (formId === "configuration-form") {
      form.reset();
    } else {
      resetForm(formId);
    }
  }

  if (formId === "configuration-form") {
    prepareConfigurationForm(
      options.configurationType || getActiveConfigurationType(),
      options.configurationRow || null,
    );
  }

  if (formId === "user-form") renderUserRoleOptions("create-user-role-options");

  const meta = getFormModalMeta(formId);
  document.getElementById("form-modal-kicker").textContent = meta.eyebrow;
  document.getElementById("form-modal-title").textContent =
    options.title || meta.title;
  document.getElementById("form-modal-copy").textContent =
    "Fields marked * are required.";

  form.__wasHiddenBeforeModal = form.classList.contains("hidden");
  form.classList.remove("hidden");
  form.classList.add("form-modal-form");
  body.innerHTML = "";
  body.appendChild(form);
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  state.ui.activeFormId = formId;
  modal.__previousFocus = previousFocus;
  modal.classList.toggle(
    "complex-form",
    formId === "contract-form" ||
      Boolean(form.querySelector(".collection-editor")),
  );
  if (!form.querySelector(".form-action-footer")) {
    const footer = document.createElement("div");
    footer.className = "form-action-footer";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "ghost-btn";
    cancel.textContent = "Cancel";
    cancel.dataset.closeForm = "true";
    footer.appendChild(cancel);
    form
      .querySelectorAll(':scope > button[type="submit"]')
      .forEach((button) => footer.appendChild(button));
    form.appendChild(footer);
  }
  form.dataset.dirty = "false";
  setDynamicFormStatus(form, "");
  enhanceForms(form);
  syncOverlayAccessibility();

  const input = form.querySelector(
    "input:not([type='hidden']), select, textarea:not(.collection-source-textarea)",
  );
  input?.focus();
}

function closeFormModal(options = {}) {
  const activeForm = document.getElementById(state.ui.activeFormId);
  if (options.confirmDiscard) {
    if (activeForm?.dataset.busy === "true") {
      showToast("Please wait for this action to finish.", "info");
      return;
    }
    if (
      activeForm?.dataset.dirty === "true" &&
      !window.confirm("Discard your unsaved changes?")
    )
      return;
  }
  const restoreParent = options.restoreParent !== false;
  const formId = state.ui.activeFormId;
  if (formId) {
    const form = document.getElementById(formId);
    if (form?.__modalPlaceholder?.parentNode) {
      form.classList.remove("form-modal-form");
      if (form.__wasHiddenBeforeModal) {
        form.classList.add("hidden");
      }
      form.__modalPlaceholder.parentNode.insertBefore(
        form,
        form.__modalPlaceholder,
      );
    }
  }
  document.getElementById("form-modal")?.classList.add("hidden");
  document.getElementById("form-modal-body")?.replaceChildren();
  state.ui.activeFormId = null;
  syncOverlayAccessibility();
  if (document.getElementById("detail-modal")?.classList.contains("hidden")) {
    document.body.classList.remove("modal-open");
  }

  if (restoreParent && state.ui.formModalStack.length) {
    const parentFormId = state.ui.formModalStack.pop();
    openFormModal(parentFormId, { skipStackPush: true });
  } else if (restoreParent) {
    document.getElementById("form-modal")?.__previousFocus?.focus?.();
  }
}

function renderKeyValueGrid(record) {
  const detailEntries = Object.entries(record || {})
    .filter(([key, value]) => !shouldHideDetailKey(key, value))
    .map(([key, value]) => [
      formatDetailLabel(key),
      formatDetailValue(key, value),
    ])
    .filter(([, value]) => value !== "");

  if (!detailEntries.length) {
    return '<div class="state-card empty-state">No additional details available.</div>';
  }

  return (
    `<div class="detail-grid">` +
    detailEntries
      .map(
        ([key, value]) =>
          `<div class="detail-field"><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></div>`,
      )
      .join("") +
    `</div>`
  );
}

function renderSectionTable(title, rows) {
  const cleanRows = sanitizeDetailRows(rows);
  if (!cleanRows.length) {
    return "";
  }
  const columns = Object.keys(cleanRows[0]);
  const head = columns
    .map(
      (column) =>
        `<th scope="col">${escapeHtml(formatDetailLabel(column))}</th>`,
    )
    .join("");
  const body = cleanRows
    .map(
      (row) =>
        `<tr>${columns
          .map(
            (column) =>
              `<td data-label="${escapeHtml(formatDetailLabel(column))}">${escapeHtml(row[column] ?? "")}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");
  return (
    `<section class="detail-section"><h4>${escapeHtml(title)}</h4>` +
    `<div class="table-shell" role="region" tabindex="0" aria-label="${escapeHtml(title)}"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></section>`
  );
}

function renderDetailPayload(title, payload) {
  if (!payload || typeof payload !== "object") {
    openDetailModal(
      title,
      `<div class="empty-state">No details available.</div>`,
    );
    return;
  }

  const record =
    payload.contract ||
    payload.requisition ||
    payload.order ||
    payload.batch ||
    payload.plan ||
    payload;
  const identity =
    record.contract_number ||
    record.requisition_number ||
    record.order_number ||
    record.batch_number ||
    record.plan_number ||
    record.name ||
    record.product_name;
  const identityHtml = identity
    ? '<div class="detail-identity"><strong>' +
      escapeHtml(identity) +
      "</strong>" +
      (record.status ? renderStatusBadge(record.status) : "") +
      "</div>"
    : "";
  const sections = [];
  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value)) {
      sections.push(renderSectionTable(titleCaseWords(key), value));
    } else if (value && typeof value === "object") {
      sections.push(
        `<section class="detail-section"><h4>${escapeHtml(titleCaseWords(key))}</h4>${renderKeyValueGrid(value)}</section>`,
      );
    } else {
      sections.push("");
    }
  }

  if (!sections.filter(Boolean).length) {
    openDetailModal(title, identityHtml + renderKeyValueGrid(payload));
    return;
  }

  openDetailModal(title, identityHtml + sections.join(""));
}

function focusForm(formId) {
  openFormModal(formId);
}

function resetForm(formId) {
  const form = document.getElementById(formId);
  if (!form) {
    return;
  }
  form.reset();
  form.querySelectorAll('input[type="hidden"]').forEach((input) => {
    input.value = "";
  });
  setDynamicFormStatus(form, "");
  setTodayDefaults();
  refreshCollectionEditors(formId);
  if (formId === "supplier-invoice-form") {
    syncSupplierInvoicePaymentFields();
  }
}

function getContractSearchRows() {
  const contracts = state.moduleData.contracts?.contracts || [];
  const search = state.filters.contracts.search;
  const tab = state.filters.contracts.tab || "all";
  const today = new Date();
  return contracts.filter((row) => {
    const status = String(row.status || "").toLowerCase();
    const endDate = new Date(row.end_date);
    const expiring =
      endDate instanceof Date &&
      !Number.isNaN(endDate.getTime()) &&
      endDate.getMonth() === today.getMonth() &&
      endDate.getFullYear() === today.getFullYear();

    let tabMatch = true;
    if (tab === "active") {
      tabMatch = status === "active";
    } else if (tab === "suspended") {
      tabMatch = status === "suspended";
    } else if (tab === "expired") {
      tabMatch = status === "expired";
    } else if (tab === "expiring") {
      tabMatch = expiring;
    }

    return (
      tabMatch &&
      matchesSearch(row, search, [
        "contract_number",
        "client_name",
        "location_name",
        "status",
      ])
    );
  });
}


function approvalAgeLabel(value) {
  if (!value) return "";
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return "";
  const hours = Math.max(0, Math.floor((Date.now() - then.getTime()) / 3600000));
  if (hours < 1) return "just now";
  if (hours < 24) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
}

function buildApprovalActions(approvalRows) {
  return (approvalRows || []).map((row) => ({
    id: row.documentNumber || row.document_number || String(row.id),
    title: "Approve " + (row.documentNumber || row.document_number || row.documentTypeLabel || "request"),
    detail: [
      row.documentTypeLabel || row.entityType || "Approval",
      row.requesterName || row.requester_name,
      approvalAgeLabel(row.createdAt || row.created_at),
    ]
      .filter(Boolean)
      .join(" - "),
    tone: "info",
    verb: "Approve",
    target: "approvals",
    tab: "pending",
    severity: 2,
    count: 1,
    source: "approvals",
  }));
}

function mergeWorkQueueActions(serverActions, approvalRows) {
  const attentionItems = [...buildApprovalActions(approvalRows), ...(serverActions || [])];
  attentionItems.sort((a, b) => {
    const as = Number(a.severity || 99);
    const bs = Number(b.severity || 99);
    if (as !== bs) return as - bs;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
  return attentionItems;
}

function renderExceptionChips(data, approvalCount) {
  const stockRisks = Number(data.stockRiskItems != null
    ? data.stockRiskItems
    : Number(data.lowStockItems || 0) + Number(data.expiringStockItems || 0));
  const chips = [
    { source: "approvals", label: "Needs your approval", value: approvalCount, target: "approvals", tab: "pending" },
    { source: "requisitions", label: "Open purchase requisitions", value: data.pendingPurchaseRequisitions, target: "procurement", tab: "purchase requisitions" },
    { source: "orders", label: "POs awaiting receipt", value: data.pendingPurchaseOrders, target: "procurement", tab: "purchase orders" },
    { source: "kitchen", label: "Kitchen waiting", value: data.pendingKitchenRequisitions, target: "kitchen", tab: "pending" },
    { source: "stock", label: "Stock risks", value: stockRisks, target: "inventory", tab: "alerts" },
    { source: "production", label: "Today's batches", value: data.todaysProductionBatches, target: "production", tab: "batches" },
  ];
  renderDashboardCards(
    chips.map((chip) => {
      const count = Number(chip.value || 0);
      return {
        label: chip.label,
        value: formatNumber(count),
        note: count === 0 ? "Clear" : "Open items",
        target: chip.target,
        tab: chip.tab,
        tone: count === 0 ? "neutral" : count > 0 && (chip.source === "stock" || chip.source === "orders") ? "warning" : "info",
        source: chip.source,
      };
    }),
  );
  const strip = $("#dashboard-metrics");
  if (strip) {
    strip.querySelectorAll(".stat-item").forEach((btn, index) => {
      const chip = chips[index];
      if (!chip) return;
      btn.dataset.workSource = chip.source;
      btn.classList.toggle("is-zero", Number(chip.value || 0) === 0);
    });
  }
}

function renderWorkQueue(attentionItems, deliveries, filterSource) {
  const target = $("#dashboard-attention");
  if (!target) return;
  let rows = attentionItems || [];
  if (filterSource) {
    rows = rows.filter((item) => item.source === filterSource);
  }
  const visible = rows.slice(0, 8);
  target.setAttribute("aria-busy", "false");
  if (!visible.length) {
    const next = (deliveries || [])[0];
    const calm = next
      ? "Queues clear - next delivery " + (next.location || next.client || "scheduled") + (next.schedule ? " - " + String(next.schedule).split(",")[0].trim() : "")
      : "Queues clear - no deliveries scheduled today";
    target.innerHTML =
      '<button type="button" class="attention-item attention-clear" data-nav-target="contracts">' +
      '<span class="attention-indicator attention-info" aria-hidden="true"></span>' +
      '<span class="attention-copy"><strong>' + escapeHtml(calm) + "</strong>" +
      "<span>Structure stays ready for the next exception.</span></span>" +
      '<span class="attention-side"><span class="attention-count">0</span>' +
      '<span class="attention-action">Open</span></span></button>';
    return;
  }
  target.innerHTML = visible
    .map((item) => {
      const countLabel = Number(item.count) > 1 ? formatNumber(item.count) : "—";
      return (
        '<button type="button" class="attention-item" data-nav-target="' +
        escapeHtml(item.target) +
        '" data-nav-tab="' +
        escapeHtml(item.tab || "") +
        '" data-attention-tone="' +
        escapeHtml(item.tone || "info") +
        '" data-work-source="' +
        escapeHtml(item.source || "") +
        '"><span class="attention-indicator attention-' +
        escapeHtml(item.tone || "info") +
        '" aria-hidden="true"></span><span class="attention-copy"><strong>' +
        escapeHtml(item.title) +
        "</strong><span>" +
        escapeHtml(item.detail || "") +
        '</span></span><span class="attention-side"><span class="attention-count">' +
        escapeHtml(String(countLabel)) +
        '</span><span class="attention-action">' +
        escapeHtml(item.verb || "Review") +
        "</span></span></button>"
      );
    })
    .join("");
  if (rows.length > visible.length) {
    target.innerHTML +=
      '<p class="dashboard-more-note">Showing ' +
      formatNumber(visible.length) +
      " of " +
      formatNumber(rows.length) +
      " open actions.</p>";
  }
}


function renderDashboardCards(metrics) {
  $("#dashboard-metrics").innerHTML = metrics
    .map(
      (metric) =>
        `<button type="button" class="stat-item tone-${escapeHtml(metric.tone)}${Number(String(metric.value).replace(/[^0-9.-]/g, "")) === 0 ? " is-zero" : ""}" ${
          metric.target
            ? `data-nav-target="${escapeHtml(metric.target)}"${metric.tab ? ` data-nav-tab="${escapeHtml(metric.tab)}"` : ""}`
            : ""
        }${metric.source ? ` data-work-source="${escapeHtml(metric.source)}"` : ""}>` +
        `<span class="stat-label">${escapeHtml(metric.label)}</span>` +
        `<strong class="stat-value">${escapeHtml(metric.value)}</strong>` +
        `<span class="stat-note">${escapeHtml(metric.note)}</span>` +
        `</button>`,
    )
    .join("");
}

function getDaysUntil(value) {
  if (!value) {
    return null;
  }
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
}

function renderDashboardStockRisks(lowStockRows, expiringRows) {
  const target = $("#dashboard-stock-exceptions");
  if (!target) {
    return;
  }

  const risks = [];
  (lowStockRows || []).forEach((row) => {
    const current = Number(row.current_stock || 0);
    const reorder = Number(row.reorder_level || row.minimum_stock_level || 0);
    const threshold =
      reorder > 0
        ? `reorder level ${formatNumber(reorder)}`
        : "no reorder threshold set";
    risks.push({
      tone: current <= 0 ? "danger" : "warning",
      product: row.product_name,
      detail:
        current <= 0
          ? `Out of stock · ${threshold}`
          : `On hand ${formatNumber(current)} · ${threshold}`,
      action: "Review stock",
      sort: current <= 0 ? 0 : 1,
    });
  });
  (expiringRows || []).forEach((row) => {
    const days = getDaysUntil(row.expiry_date);
    const expiryLabel =
      days === null
        ? "Expiry date unavailable"
        : days < 0
          ? `Expired ${formatNumber(Math.abs(days))} days ago`
          : days === 0
            ? "Expires today"
            : `Expires in ${formatNumber(days)} days`;
    risks.push({
      tone: days !== null && days <= 0 ? "danger" : "warning",
      product: row.product_name,
      detail: `${expiryLabel} · ${formatNumber(row.quantity_remaining)} remaining`,
      action: "Review expiry",
      sort: days !== null && days <= 0 ? 0 : 2,
    });
  });

  risks.sort((left, right) => left.sort - right.sort || left.product.localeCompare(right.product));
  const visibleRisks = risks.slice(0, 6);
  target.setAttribute("aria-busy", "false");
  target.innerHTML = visibleRisks.length
    ? '<div class="risk-list" role="list">' +
      visibleRisks
        .map(
          (risk) =>
            `<button type="button" class="risk-item risk-${risk.tone}" data-nav-target="inventory" data-nav-tab="alerts">` +
            '<span class="risk-indicator" aria-hidden="true"></span>' +
            '<span class="risk-copy"><strong>' +
            escapeHtml(risk.product) +
            "</strong><span>" +
            escapeHtml(risk.detail) +
            '</span></span><span class="risk-action">' +
            escapeHtml(risk.action) +
            " →</span></button>",
        )
        .join("") +
      "</div>" +
      (risks.length > visibleRisks.length
        ? `<p class="dashboard-more-note">Showing ${formatNumber(visibleRisks.length)} of ${formatNumber(risks.length)} risks.</p>`
        : "")
    : '<div class="empty-state"><strong>Stock is within thresholds</strong><span>No shortage or expiry risks need attention.</span></div>';
}

function renderDashboardUsage(rows) {
  const target = $("#dashboard-top-consumption");
  if (!target) {
    return;
  }
  const visibleRows = (rows || []).slice(0, 5);
  if (!visibleRows.length) {
    target.innerHTML = '<div class="empty-state"><strong>No issued stock yet</strong><span>Consumption rankings will appear after store issues are recorded.</span></div>';
    return;
  }
  const max = Math.max(...visibleRows.map((row) => Number(row.total_issued || 0)), 1);
  target.innerHTML = '<div class="usage-list">' +
    visibleRows
      .map((row) => {
        const issued = Number(row.total_issued || 0);
        const width = Math.max(4, Math.min(100, (issued / max) * 100));
        return (
          '<div class="usage-row"><div class="usage-row-top"><span>' +
          escapeHtml(row.name || row.product_name || "Unnamed product") +
          '</span><strong>' +
          formatNumber(issued) +
          '</strong></div><div class="usage-track" aria-hidden="true"><span style="width:' +
          width.toFixed(1) +
          '%"></span></div></div>'
        );
      })
      .join("") +
    '</div><p class="dashboard-more-note">Issued quantity · top five products</p>';
}

function renderDashboardPurchaseActivity(rows) {
  const target = $("#dashboard-purchase-activity");
  if (!target) {
    return;
  }
  const visibleRows = (rows || []).slice(0, 4);
  if (!visibleRows.length) {
    target.innerHTML = '<div class="empty-state"><strong>No purchase activity</strong><span>Purchase orders will appear here as procurement begins.</span></div>';
    return;
  }
  target.innerHTML = '<div class="pipeline-list">' +
    visibleRows
      .map(
        (row) =>
          '<div class="pipeline-row"><div><strong>' +
          escapeHtml(titleCaseWords(row.purchase_type || "Purchase")) +
          '</strong><span>' +
          formatNumber(row.order_count) +
          " orders</span></div><strong>" +
          formatCurrency(row.order_value) +
          "</strong></div>",
      )
      .join("") +
    "</div>";
}

async function loadDashboard() {
  for (const id of [
    "dashboard-attention",
    "dashboard-activities",
    "dashboard-upcoming-deliveries",
  ])
    renderPlaceholder(id, "Loading operations...");
  const [
    dashboardResponse,
    auditResponse,
    contractsResponse,
    approvalsResponse,
  ] = await Promise.all([
    api("/api/dashboard"),
    api("/api/audit").catch((error) => ({ data: [], error: error.message })),
    api("/api/contracts/active"),
    canAccessApprovalQueue()
      ? api("/api/approvals/pending").catch((error) => ({ data: [], error: error.message }))
      : Promise.resolve({ data: [] }),
  ]);
  const data = dashboardResponse.data || {};
  const approvalRows = approvalsResponse.data || [];
  const attentionItems = mergeWorkQueueActions(data.topActions || [], canAccessApprovalQueue() ? approvalRows : []);
  renderExceptionChips(data, approvalRows.length);
  const date = new Date();
  const primaryRole = String(state.user?.roleNames?.[0] || "").trim();
  $("#dashboard-date-chip").dateTime = date.toISOString().slice(0, 10);
  $("#dashboard-date-chip").textContent = date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  $("#dashboard-scope").textContent = primaryRole
    ? `All central stores · ${titleCaseWords(primaryRole)} view`
    : "All central stores";
  $("#dashboard-refresh-status").textContent = `Updated ${date.toLocaleTimeString("en-UG", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const deliveries = (contractsResponse.data || [])
    .filter((row) => {
      const deliveryDays = row.delivery_days || [];
      return (
        !deliveryDays.length ||
        deliveryDays.some((day) => String(day).toLowerCase() === weekday.toLowerCase())
      );
    })
    .map((row) => ({
      contract: row.contract_number,
      client: row.client_name,
      location: row.location_name,
      quantity: row.total_contract_quantity || row.expected_daily_quantity || 0,
      schedule: (row.delivery_days || []).join(", ") || "View contract schedule",
      status: row.status,
    }));
  state.moduleData.dashboard = {
    ...data,
    pendingApprovals: approvalRows.length,
    attentionItems,
    workFilter: null,
    activities: [],
    deliveries,
  };
  renderWorkQueue(attentionItems, deliveries, null);
  const activities = (auditResponse.data || [])
    .filter(
      (entry) =>
        !String(entry.action || "")
          .toLowerCase()
          .includes("login"),
    )
    .slice(0, 5);
  $("#dashboard-activities").setAttribute("aria-busy", "false");
  $("#dashboard-activities").innerHTML = auditResponse.error
    ? '<div class="empty-state">Recent activity is unavailable for this session.</div>'
    : activities.length === 0
      ? '<div class="empty-state">No recent activity.</div>'
      : activities
          .map(
            (entry) =>
              '<div class="activity-row"><div class="activity-copy"><strong>' +
              escapeHtml(titleCaseWords(entry.action)) +
              " · " +
              escapeHtml(titleCaseWords(entry.entity_type || "record")) +
              "</strong><p>" +
              escapeHtml(entry.actor_name || "System") +
              '</p></div><time class="activity-time">' +
              escapeHtml(formatDateTime(entry.created_at)) +
              "</time></div>",
          )
          .join("");
  renderTable(
    "dashboard-supplier-balances",
    [
      { key: "name", label: "Supplier" },
      {
        key: "balance_due",
        label: "Outstanding",
        numeric: true,
        render: (row) => formatCurrency(row.balance_due),
      },
    ],
    data.supplierBalances || [],
    { emptyMessage: "No supplier balances recorded.", pageSize: 5 },
  );
  $("#dashboard-service-summary").textContent = deliveries.length
    ? `${formatNumber(deliveries.reduce((total, row) => total + Number(row.quantity || 0), 0))} meals across ${formatNumber(deliveries.length)} client locations today.`
    : "No active client deliveries are scheduled for today.";
  renderTable(
    "dashboard-upcoming-deliveries",
    [
      {
        key: "client",
        label: "Client / contract",
        render: (row) =>
          "<strong>" +
          escapeHtml(row.client) +
          '</strong><div class="table-subcopy">' +
          escapeHtml(row.contract) +
          "</div>",
      },
      { key: "location", label: "Delivery location" },
      {
        key: "quantity",
        label: "Quantity",
        numeric: true,
        render: (row) => formatNumber(row.quantity),
      },
      { key: "schedule", label: "Delivery days" },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
    ],
    deliveries,
    {
      emptyMessage: "No client deliveries are scheduled for today.",
      label: "Today's service commitments",
      pageSize: 5,
    },
  );
  state.moduleData.dashboard.activities = activities;
}


function approvalKey(record) {
  return `${record.entityType}:${record.id}`;
}

function getApprovalRecord(key) {
  return (state.moduleData.approvals?.records || []).find(
    (record) => approvalKey(record) === key,
  );
}

function approvalQuantity(item) {
  return item.approval_quantity ?? item.quantity_requested ?? item.quantity_delta ?? 0;
}

function renderApprovalLine(item) {
  const quantity = Number(approvalQuantity(item));
  const quantityLabel = item.quantity_delta !== undefined && quantity > 0
    ? `+${formatNumber(quantity, 2)}`
    : formatNumber(quantity, 2);
  return (
    `<li><span>${escapeHtml(item.product_name || "Line item")}</span>` +
    `<strong>${escapeHtml(quantityLabel)} ${escapeHtml(item.unit_code || "")}</strong></li>`
  );
}

function approvalSearchText(record) {
  return [
    record.documentNumber,
    record.documentTypeLabel,
    record.requesterName,
    record.purpose,
    record.payeeName,
    record.sourceLabel,
    record.supplierName,
    record.storeName,
    record.departmentName,
    record.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function renderApprovalCard(record) {
  const key = approvalKey(record);
  const isCashLike = ["cash_requisition", "payment_voucher"].includes(record.entityType);
  const visibleItems = (record.items || []).slice(0, 4);
  const extraItems = Math.max((record.items || []).length - visibleItems.length, 0);
  let bodyMarkup;
  if (isCashLike) {
    bodyMarkup =
      '<div class="approval-cash-body">' +
      (record.payeeName
        ? '<p class="approval-payee"><small>Payment to</small><strong>' +
          escapeHtml(record.payeeName) +
          "</strong></p>"
        : "") +
      '<p class="approval-purpose">' +
      escapeHtml(record.purpose || "No purpose provided.") +
      "</p>" +
      (record.sourceLabel
        ? '<p class="approval-source">' + escapeHtml(record.sourceLabel) + "</p>"
        : "") +
      "</div>";
  } else if (visibleItems.length) {
    bodyMarkup =
      '<ul class="approval-line-list">' +
      visibleItems.map(renderApprovalLine).join("") +
      "</ul>" +
      (extraItems
        ? '<p class="approval-more-lines">+' +
          extraItems +
          " more line" +
          (extraItems === 1 ? "" : "s") +
          "</p>"
        : "");
  } else {
    bodyMarkup =
      '<p class="approval-purpose">' +
      escapeHtml(record.purpose || "No additional details provided.") +
      "</p>";
  }

  const actionMarkup = record.canAct
    ? '<div class="approval-actions">' +
      '<button type="button" class="primary-btn slim-btn" data-approval-action="approve" data-approval-key="' +
      escapeHtml(key) +
      '">Approve</button>' +
      '<button type="button" class="ghost-btn slim-btn danger-action" data-approval-action="reject" data-approval-key="' +
      escapeHtml(key) +
      '">Reject</button>' +
      "</div>"
    : '<div class="approval-blocked" role="note">' +
      escapeHtml(record.blockedReason || "Another approver must review this request.") +
      "</div>";

  const thirdMeta = record.amount
    ? '<span><small>Amount</small><strong>' +
      escapeHtml(formatCurrency(record.amount)) +
      "</strong></span>"
    : record.storeName
      ? '<span><small>Store</small><strong>' +
        escapeHtml(record.storeName) +
        "</strong></span>"
      : '<span><small>Lines</small><strong>' +
        escapeHtml(String(record.itemCount || 0)) +
        "</strong></span>";

  return (
    '<article class="approval-card' +
    (record.canAct ? "" : " approval-card-blocked") +
    '" data-approval-key="' +
    escapeHtml(key) +
    '">' +
    '<div class="approval-card-header">' +
    '<div><p class="eyebrow">' +
    escapeHtml(record.documentTypeLabel) +
    "</p>" +
    '<h3><button type="button" class="approval-document-link" data-approval-view="' +
    escapeHtml(key) +
    '">' +
    escapeHtml(record.documentNumber || "Request " + record.id) +
    "</button></h3></div>" +
    renderStatusBadge(record.status) +
    "</div>" +
    '<div class="approval-meta">' +
    '<span><small>Raised by</small><strong>' +
    escapeHtml(record.requesterName) +
    "</strong></span>" +
    '<span><small>Date</small><strong>' +
    escapeHtml(formatDate(record.requestedDate)) +
    "</strong></span>" +
    thirdMeta +
    "</div>" +
    '<div class="approval-card-body">' +
    bodyMarkup +
    "</div>" +
    '<div class="approval-card-footer"><button type="button" class="ghost-btn slim-btn" data-approval-view="' +
    escapeHtml(key) +
    '">View details</button>' +
    actionMarkup +
    "</div>" +
    "</article>"
  );
}

function openApprovalDetails(record) {
  const lines = (record.items || []).length
    ? '<ul class="approval-detail-lines">' + record.items.map(renderApprovalLine).join("") + "</ul>"
    : '<div class="empty-state">No line items on this request.</div>';
  const links =
    '<div class="approval-detail-grid">' +
    "<div><span>Raised by</span><strong>" +
    escapeHtml(record.requesterName) +
    "</strong></div>" +
    "<div><span>Date</span><strong>" +
    escapeHtml(formatDate(record.requestedDate)) +
    "</strong></div>" +
    "<div><span>Status</span><strong>" +
    renderStatusBadge(record.status) +
    "</strong></div>" +
    "<div><span>Amount</span><strong>" +
    escapeHtml(record.amount ? formatCurrency(record.amount) : "Not specified") +
    "</strong></div>" +
    (record.payeeName
      ? "<div><span>Payment to</span><strong>" + escapeHtml(record.payeeName) + "</strong></div>"
      : "") +
    (record.sourceLabel
      ? "<div><span>Source</span><strong>" + escapeHtml(record.sourceLabel) + "</strong></div>"
      : "") +
    (record.storeName
      ? "<div><span>Store</span><strong>" + escapeHtml(record.storeName) + "</strong></div>"
      : "") +
    "</div>";
  openDetailModal(
    record.documentTypeLabel + " — " + (record.documentNumber || "Request " + record.id),
    links +
      '<section class="detail-section"><h4>Request details</h4><p>' +
      escapeHtml(record.purpose || "No additional details provided.") +
      "</p></section>" +
      '<section class="detail-section"><h4>Items</h4>' +
      lines +
      "</section>" +
      (record.canAct
        ? '<div class="approval-modal-actions"><button type="button" class="primary-btn" data-approval-action="approve" data-approval-key="' +
          escapeHtml(approvalKey(record)) +
          '">Approve</button><button type="button" class="ghost-btn danger-action" data-approval-action="reject" data-approval-key="' +
          escapeHtml(approvalKey(record)) +
          '">Reject</button></div>'
        : '<div class="approval-blocked" role="note">' +
          escapeHtml(record.blockedReason || "Another approver must review this request.") +
          "</div>"),
  );
}

function openApprovalRejectDialog(record) {
  openDetailModal(
    `Reject ${record.documentTypeLabel}`,
    `<form class="approval-decision-form">` +
      `<p class="workspace-copy">${escapeHtml(record.documentNumber || `Request ${record.id}`)} will be returned as rejected.</p>` +
      `<label>Reason<textarea id="approval-reject-reason" rows="4" placeholder="Explain what needs to change or why this is not approved."></textarea></label>` +
      `<div class="approval-modal-actions"><button type="button" class="ghost-btn" data-close-detail>Cancel</button><button type="button" class="ghost-btn danger-action" data-approval-reject-confirm="${escapeHtml(approvalKey(record))}">Reject request</button></div>` +
    `</form>`,
  );
  document.getElementById("approval-reject-reason")?.focus();
}

async function executeApprovalAction(record, action, reason = "") {
  if (!record || !record.canAct) {
    return;
  }
  const path = action === "approve" ? record.approvePath : record.rejectPath;
  const body = action === "approve" ? record.approveBody || {} : { reason };
  await api(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!$("#detail-modal").classList.contains("hidden")) {
    closeDetailModal();
  }
  await Promise.all([
    loadApprovals(),
    loadDashboard(),
    loadProcurement().catch(() => null),
    typeof loadInventory === "function" ? loadInventory().catch(() => null) : Promise.resolve(),
    typeof loadKitchen === "function" ? loadKitchen().catch(() => null) : Promise.resolve(),
  ]);
  if (
    action === "approve" &&
    record.entityType === "cash_requisition" &&
    state.activeModule === "cash-requisitions"
  ) {
    state.filters["cash-requisitions"] = {
      ...(state.filters["cash-requisitions"] || {}),
      tab: "in progress",
    };
    renderProcurement();
  }
  showToast(`${record.documentTypeLabel} ${action === "approve" ? "approved" : "rejected"}`);
}

function renderApprovals() {
  const target = document.getElementById("approvals-queue");
  if (!target) {
    return;
  }
  const records = state.moduleData.approvals?.records || [];
  const search = String(state.filters.approvals?.search || "").trim().toLowerCase();
  const filtered = search
    ? records.filter((record) => approvalSearchText(record).includes(search))
    : records;
  const procurementCount = records.filter((record) =>
    ["purchase_requisition", "goods_requisition", "cash_requisition"].includes(record.entityType),
  ).length;
  const kitchenStoreCount = records.filter((record) =>
    ["kitchen_requisition", "stock_adjustment"].includes(record.entityType),
  ).length;
  const financeCount = records.filter((record) => record.entityType === "payment_voucher").length;
  renderMetricGrid("approvals-metrics", [
    { label: "Pending approvals", value: formatNumber(records.length), note: "All requests in your queue", icon: "PA", tone: "green" },
{ label: "Procurement", value: formatNumber(procurementCount), note: "Requisitions", icon: "PR", tone: "blue" },
    { label: "Kitchen & stores", value: formatNumber(kitchenStoreCount), note: "Stock and kitchen requests", icon: "KS", tone: "amber" },
    { label: "Finance", value: formatNumber(financeCount), note: "Payment vouchers", icon: "FN", tone: "purple" },
  ]);
  target.setAttribute("aria-busy", "false");
  if (!filtered.length) {
    target.innerHTML =
      `<div class="state-card empty-state" role="status"><span class="state-icon" aria-hidden="true">✓</span><strong>${search ? "No matching approvals" : "Everything is up to date"}</strong><span>${search ? "Try another search." : "There are no pending approvals assigned to you."}</span>${search ? `<button type="button" class="ghost-btn slim-btn" data-clear-search="approvals">Clear search</button>` : ""}</div>`;
    return;
  }
  target.innerHTML = `<div class="approval-queue">${filtered.map(renderApprovalCard).join("")}</div>`;
}

async function loadApprovals() {
  if (!canAccessApprovalQueue()) {
    state.moduleData.approvals = { records: [], meta: { total: 0, actionable: 0 } };
    renderApprovals();
    return;
  }
  renderPlaceholder("approvals-queue", "Loading approvals...");
  const response = await api("/api/approvals/pending");
  state.moduleData.approvals = {
    records: response.data || [],
    meta: response.meta || { total: (response.data || []).length, actionable: 0 },
  };
  renderApprovals();
}

async function loadSecurity() {
  try {
    renderPlaceholder("users-table", "Loading users...");
    renderPlaceholder("roles-table", "Loading roles...");
    const [usersResponse, rolesResponse] = await Promise.all([
      api("/api/auth/users"),
      api("/api/auth/roles"),
    ]);
    renderTable(
      "users-table",
      [
        { key: "full_name", label: "Name" },
        { key: "username", label: "Username" },
        { key: "email", label: "Email" },
        {
          key: "roles",
          label: "Roles",
          render: (row) => escapeHtml(userRoleNames(row.roles)),
        },
      ],
      usersResponse.data,
    );
    renderTable(
      "roles-table",
      [
        { key: "name", label: "Role" },
        { key: "description", label: "Description" },
        { key: "user_count", label: "Users" },
      ],
      rolesResponse.data,
    );
    state.moduleData.settings = {
      ...(state.moduleData.settings || {}),
      users: usersResponse.data,
      roles: rolesResponse.data,
    };
  } catch (error) {
    renderTable("users-table", [{ key: "message", label: "Users" }], [], {
      error: error.message,
    });
    setFormStatus("user-status", error.message, "error");
  }
}

async function loadMasterData() {
  renderPlaceholder("clients-table", "Loading clients...");
  renderPlaceholder("suppliers-table", "Loading suppliers...");
  renderPlaceholder("products-table", "Loading products...");

  const [clientsResponse, suppliersResponse, productsResponse] =
    await Promise.all([
      api("/api/master-data/clients"),
      api("/api/master-data/suppliers"),
      api("/api/master-data/products"),
    ]);

  const clients = clientsResponse.data || [];
  const suppliers = suppliersResponse.data || [];
  const products = productsResponse.data || [];

  renderTable(
    "clients-table",
    [
      { key: "name", label: "Client" },
      { key: "contact_person", label: "Contact" },
      { key: "location_count", label: "Locations" },
      { key: "active_contract_count", label: "Active Contracts" },
      {
        key: "actions",
        label: "Actions",
        render: (row) =>
          renderActionButtons([
            { entity: "client", id: row.id, label: "View", action: "view" },
            { entity: "client", id: row.id, label: "Edit", action: "edit" },
          ]),
      },
    ],
    clients,
  );

  renderTable(
    "suppliers-table",
    [
      { key: "name", label: "Supplier" },
      { key: "payment_terms", label: "Terms" },
      {
        key: "balance_due",
        label: "Balance",
        render: (row) => formatCurrency(row.balance_due),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) =>
          renderActionButtons([
            { entity: "supplier", id: row.id, label: "View", action: "view" },
            { entity: "supplier", id: row.id, label: "Edit", action: "edit" },
          ]),
      },
    ],
    suppliers,
  );

  renderTable(
    "products-table",
    [
      { key: "name", label: "Product" },
      { key: "product_type", label: "Type" },
      { key: "category_name", label: "Category" },
      { key: "unit_code", label: "Unit" },
      {
        key: "minimum_stock_level",
        label: "Min Stock",
        render: (row) => formatNumber(row.minimum_stock_level),
      },
      {
        key: "reorder_level",
        label: "Reorder",
        render: (row) => formatNumber(row.reorder_level),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) =>
          renderActionButtons([
            { entity: "product", id: row.id, label: "View", action: "view" },
            { entity: "product", id: row.id, label: "Edit", action: "edit" },
          ]),
      },
    ],
    products,
  );

  renderTable(
    "suppliers-product-preview",
    [
      { key: "name", label: "Product" },
      {
        key: "default_supplier_name",
        label: "Default Supplier",
        render: (row) => escapeHtml(row.default_supplier_name || "Unassigned"),
      },
      {
        key: "standard_cost",
        label: "Cost",
        render: (row) => formatCurrency(row.standard_cost),
      },
    ],
    products.slice(0, 8),
    { emptyMessage: "No products linked to suppliers yet." },
  );

  state.moduleData.masterData = { clients, suppliers, products };
}

function renderContracts() {
  const contracts = getContractSearchRows();
  const activeRows = state.moduleData.contracts?.activeContracts || [];
  const today = new Date();
  const expiringThisMonth = (
    state.moduleData.contracts?.contracts || []
  ).filter((row) => {
    const endDate = new Date(row.end_date);
    return (
      endDate.getMonth() === today.getMonth() &&
      endDate.getFullYear() === today.getFullYear()
    );
  }).length;
  const monthlyRevenue = sumBy(
    activeRows,
    (row) =>
      Number(row.price_per_unit || 0) *
      Number(row.expected_daily_quantity || 0) *
      30,
  );
  const mealsPerDay = sumBy(activeRows, (row) => row.expected_daily_quantity);
  const activeTab = getActiveWorkspace("contracts");

  configureWorkspaceChrome("contracts", {
    eyebrow: "Contract Management",
    title:
      activeTab === "active" ? "Active Contracts" : titleCaseWords(activeTab),
    description:
      "Keep active contracts front and center, then open each record only when you need schedules, pricing, or renewal details.",
    searchPlaceholder: "Search contracts, clients, or locations...",
    actions: [
      { type: "reset", label: "Reset" },
      { type: "export", label: "Export CSV" },
      {
        type: "open-form",
        label: "New Contract",
        formId: "contract-form",
        className: "refresh-btn",
        reset: true,
        title: "New Contract",
      },
    ],
  });

  renderMetricGrid("contracts-metrics", [
    {
      label: "Active Contracts",
      value: formatNumber(activeRows.length),
      note: "Current agreements",
      tone: "green",
      icon: "CT",
    },
    {
      label: "Expiring This Month",
      value: formatNumber(expiringThisMonth),
      note: "Needs renewal review",
      tone: "red",
      icon: "EX",
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(monthlyRevenue),
      note: "Projected billing",
      tone: "blue",
      icon: "RV",
    },
    {
      label: "Total Meals / Day",
      value: formatNumber(mealsPerDay),
      note: "Across active sites",
      tone: "violet",
      icon: "ML",
    },
  ]);

  const tableColumns = [
    {
      key: "contract_number",
      label: "Contract No.",
      render: (row) =>
        `<span class="mono-cell">${escapeHtml(row.contract_number || "")}</span>`,
    },
    { key: "client_name", label: "Client" },
    { key: "location_name", label: "Location" },
    {
      key: "expected_daily_quantity",
      label: "Meals / Day",
      numeric: true,
      render: (row) => formatNumber(row.expected_daily_quantity),
    },
    {
      key: "start_date",
      label: "Start Date",
      render: (row) => formatDate(row.start_date),
    },
    {
      key: "end_date",
      label: "End Date",
      render: (row) => formatDate(row.end_date),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => renderStatusBadge(row.status),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        const status = String(row.status || "").toLowerCase();
        const actions = [
          { entity: "contract", id: row.id, label: "View", action: "view" },
        ];
        if (
          ["active", "expiring", "expired"].includes(activeTab) ||
          status === "active"
        ) {
          actions.push({
            entity: "contract",
            id: row.id,
            label: "Renew",
            action: "renew",
          });
        } else {
          actions.push({
            entity: "contract",
            id: row.id,
            label: "Edit",
            action: "edit",
          });
        }
        if (status !== "active") {
          actions.push({
            entity: "contract",
            id: row.id,
            label: "Activate",
            action: "activate",
          });
        }
        if (status === "active") {
          actions.push({
            entity: "contract",
            id: row.id,
            label: "Suspend",
            action: "suspend",
          });
        }
        return renderActionButtons(actions);
      },
    },
  ];

  renderTable("contracts-table", tableColumns, contracts, {
    emptyMessage: "No contracts match the current filter.",
  });
  renderTable(
    "active-contracts-table",
    [
      { key: "client_name", label: "Client" },
      { key: "location_name", label: "Location" },
      {
        key: "total_contract_quantity",
        label: "Expected Qty",
        render: (row) => formatNumber(row.total_contract_quantity),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
    ],
    activeRows,
    { emptyMessage: "No active contracts yet." },
  );

  setExportState(
    "contracts",
    "contracts.csv",
    [
      { label: "Contract No", key: "contract_number" },
      { label: "Client", key: "client_name" },
      { label: "Location", key: "location_name" },
      { label: "Meals / Day", key: "expected_daily_quantity" },
      { label: "Status", key: "status" },
    ],
    contracts,
  );
}

async function loadContracts() {
  renderPlaceholder("contracts-table", "Loading contracts...");
  renderPlaceholder(
    "active-contracts-table",
    "Loading active contract demand...",
  );
  const [contractsResponse, activeResponse] = await Promise.all([
    api("/api/contracts"),
    api("/api/contracts/active"),
  ]);
  state.moduleData.contracts = {
    contracts: contractsResponse.data || [],
    activeContracts: activeResponse.data || [],
  };
  renderContracts();
}





function getProcurementRows() {
  const requisitions = state.moduleData.procurement?.requisitions || [];
  const search = state.filters.procurement.search;
  const purchaseType = state.filters.procurement.purchaseType || "";
  return requisitions.filter(
    (row) =>
      (!purchaseType || row.purchase_type === purchaseType) &&
      matchesSearch(row, search, [
        "requisition_number",
        "requested_by_name",
        "purchase_type",
        "status",
        "request_date",
      ]),
  );
}

function filterProcurementRows(rows) {
  const purchaseType = state.filters.procurement.purchaseType || "";
  return rows.filter(
    (row) => !purchaseType || row.purchase_type === purchaseType,
  );
}

function renderProcurement() {
  const requisitionRows = getProcurementRows();
  const orderRows = filterProcurementRows(
    state.moduleData.procurement?.orders || [],
  );
  const receivedRows = filterProcurementRows(
    state.moduleData.procurement?.received || [],
  );
  const invoiceRows = state.moduleData.procurement?.invoices || [];
  const paymentVouchers = state.moduleData.procurement?.paymentVouchers || [];
  const cashRequisitionRows =
    state.moduleData.procurement?.cashRequisitions || [];
  const supplierRows = (state.moduleData.masterData?.suppliers || []).filter(
    (row) =>
      matchesSearch(row, state.filters.procurement.search, [
        "name",
        "payment_terms",
        "status",
      ]),
  );
  const search = state.filters.procurement.search;
  const activeTab = getActiveWorkspace("procurement");

  const getPaymentVoucherPayee = (row) => {
    const supplier = (state.reference.suppliers || []).find(
      (entry) => Number(entry.id) === Number(row.supplier_id),
    );
    const invoice = invoiceRows.find(
      (entry) => Number(entry.id) === Number(row.supplier_invoice_id),
    );
    const cashRequisition = cashRequisitionRows.find(
      (entry) => Number(entry.id) === Number(row.cash_requisition_id),
    );
    return (
      row.payee_name ||
      row.supplier_name ||
      row.cash_payee_name ||
      supplier?.name ||
      invoice?.supplier_name ||
      cashRequisition?.payee_name ||
      "-"
    );
  };

  const pendingRequisitions = requisitionRows.filter(
    (row) =>
      !["approved", "rejected", "converted to po"].includes(
        String(row.status || "").toLowerCase(),
      ),
  ).length;
  const pendingOrders = orderRows.filter(
    (row) =>
      !["fully received", "cancelled"].includes(
        String(row.status || "").toLowerCase(),
      ),
  ).length;
  const goodsToReceive = orderRows.filter((row) =>
    ["sent", "partially received", "approved", "draft"].includes(
      String(row.status || "").toLowerCase(),
    ),
  ).length;
  const pendingCashRequisitions = cashRequisitionRows.filter((row) =>
    ["draft", "submitted", "approved", "cash released", "returned for revision"].includes(
      String(row.status || "").toLowerCase(),
    ),
  ).length;
  const supplierPayables = sumBy(
    invoiceRows,
    (row) => Number(row.total_amount || 0) - Number(row.amount_paid || 0),
  );

  const cashView = getActiveWorkspace("cash-requisitions") || "pending";
  configureWorkspaceChrome("procurement", {
    eyebrow: state.activeModule === "cash-requisitions" ? "Supply chain" : state.activeModule === "payment-vouchers" ? "Supply chain" : "Procurement",
    title: titleCaseWords(activeTab),
    description:
      activeTab === "purchase requisitions"
        ? "Create the request, submit it for approval, then create the purchase order after approval."
        : activeTab === "invoices"
          ? "Link a purchase order to carry over the supplier, terms, receipt, and total. Credit invoices need a due date."
          : activeTab === "cash requisitions"
            ? cashView === "pending"
              ? "Draft, submitted, and returned cash requests waiting for the next action."
              : cashView === "in progress"
                ? "Approved requests ready to release cash or prepare a payment voucher."
                : cashView === "closed"
                  ? "Rejected or fully settled cash requisitions."
                  : "All cash requisitions across the workflow."
          : activeTab === "payments"
            ? "Prepare payment vouchers from supplier invoices or approved cash requisitions."
            : "Manage purchase orders, receipts, invoices, and payment vouchers in one place.",
    searchPlaceholder:
      activeTab === "purchase orders"
        ? "Search purchase orders..."
        : activeTab === "goods received"
          ? "Search goods received notes..."
          : activeTab === "suppliers"
            ? "Search suppliers..."
              : activeTab === "invoices"
              ? "Search supplier invoices..."
              : activeTab === "cash requisitions"
                ? "Search cash requisitions..."
              : activeTab === "payments"
                ? "Search payment vouchers..."
                : "Search purchase requisitions...",
    actions:
      activeTab === "purchase orders"
        ? [
            { type: "reset", label: "Reset" },
            { type: "export", label: "Export CSV" },
            {
              type: "open-form",
              label: "New Purchase Order",
              formId: "purchase-order-form",
              className: "refresh-btn",
              reset: true,
            },
          ]
        : activeTab === "goods received"
          ? [
              { type: "reset", label: "Reset" },
              {
                type: "open-form",
                label: "Receive Goods",
                formId: "goods-received-form",
                className: "refresh-btn",
                reset: true,
              },
            ]
          : activeTab === "suppliers"
            ? [
                { type: "reset", label: "Reset" },
                {
                  type: "open-form",
                  label: "New Supplier",
                  formId: "supplier-form",
                  className: "refresh-btn",
                  reset: true,
                },
              ]
              : activeTab === "invoices"
              ? [
                  { type: "reset", label: "Reset" },
                  {
                    type: "open-form",
                    label: "Record Invoice",
                    formId: "supplier-invoice-form",
                    className: "refresh-btn",
                    reset: true,
                  },
                ]
              : activeTab === "cash requisitions"
                ? [
                    { type: "reset", label: "Reset" },
                    { type: "export", label: "Export CSV" },
                    {
                      type: "open-form",
                      label: "New Cash Requisition",
                      formId: "cash-requisition-form",
                      className: "refresh-btn",
                      reset: true,
                    },
                  ]
              : activeTab === "payments"
                ? [
                    { type: "reset", label: "Reset" },
                    {
                      type: "open-form",
                      label: "New Payment Voucher",
                      formId: "payment-voucher-form",
                      className: "refresh-btn",
                      reset: true,
                    },
                  ]
                : [
                    { type: "reset", label: "Reset" },
                    { type: "export", label: "Export CSV" },
                    {
                      type: "open-form",
                      label: "New Purchase Order",
                      formId: "purchase-order-form",
                      reset: true,
                    },
                    {
                      type: "open-form",
                      label: "New Requisition",
                      formId: "purchase-requisition-form",
                      className: "refresh-btn",
                      reset: true,
                    },
                  ],
  });

  const purchaseTypeFilter = document.querySelector(
    '[data-purchase-type-filter="procurement"]',
  );
  purchaseTypeFilter?.classList.toggle(
    "hidden",
    !["purchase requisitions", "purchase orders", "goods received"].includes(
      activeTab,
    ),
  );

  renderMetricGrid("procurement-metrics", [
    {
      label: "Pending Requisitions",
      value: formatNumber(pendingRequisitions),
      note: "Awaiting action",
      tone: "blue",
      icon: "RQ",
    },
    {
      label: "Pending PO's",
      value: formatNumber(pendingOrders),
      note: "Open supplier orders",
      tone: "red",
      icon: "PO",
    },
    {
      label: "Goods to Receive",
      value: formatNumber(goodsToReceive),
      note: "Orders not closed",
      tone: "amber",
      icon: "GR",
    },
    {
      label: "Supplier Payables",
      value: formatCurrency(supplierPayables),
      note: "Outstanding invoices",
      tone: "violet",
      icon: "AP",
    },
    {
      label: "Cash Requests",
      value: formatNumber(pendingCashRequisitions),
      note: "Awaiting workflow action",
      tone: "amber",
      icon: "CR",
    },
  ]);

  renderTable(
    "purchase-requisitions-table",
    [
      { key: "requisition_number", label: "PR Number" },
      {
        key: "purchase_type",
        label: "Purchase Type",
        render: (row) =>
          `${escapeHtml(row.purchase_type || "Weekly")} Purchase`,
      },
      {
        key: "requested_by_name",
        label: "Requested By",
        render: (row) => escapeHtml(row.requested_by_name || "Procurement"),
      },
      {
        key: "request_date",
        label: "Date",
        render: (row) => formatDate(row.request_date),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
      {
        key: "item_count",
        label: "Items",
        render: (row) => formatNumber(row.item_count),
      },
      {
        key: "total_amount",
        label: "Est. Cost",
        render: (row) => formatCurrency(row.total_amount),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => {
          const status = String(row.status || "").toLowerCase();
          const actions = [
            {
              entity: "purchase-requisition",
              id: row.id,
              label: "View",
              action: "view",
            },
          ];
          if (status === "draft") {
            actions.push({
              entity: "purchase-requisition",
              id: row.id,
              label: "Submit",
              action: "submit",
              primary: true,
            });
          }
          if (status === "approved") {
            actions.push({
              entity: "purchase-requisition",
              id: row.id,
              label: "Create PO",
              action: "create-po",
            });
          }
          return renderActionButtons(actions);
        },
      },
    ],
    requisitionRows,
    { emptyMessage: "No purchase requisitions match the current filter." },
  );

  renderTable(
    "purchase-orders-table",
    [
      { key: "order_number", label: "PO" },
      {
        key: "purchase_type",
        label: "Purchase Type",
        render: (row) =>
          `${escapeHtml(row.purchase_type || "Weekly")} Purchase`,
      },
      { key: "supplier_name", label: "Supplier" },
      {
        key: "order_date",
        label: "Order Date",
        render: (row) => formatDate(row.order_date),
      },
      {
        key: "total_amount",
        label: "Total",
        render: (row) => formatCurrency(row.total_amount),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => {
          const status = String(row.status || "").toLowerCase();
          const actions = [
            {
              entity: "purchase-order",
              id: row.id,
              label: "View",
              action: "view",
            },
          ];
          if (status === "draft") {
            actions.push({
              entity: "purchase-order",
              id: row.id,
              label: "Send",
              action: "send",
            });
          }
          if (!["fully received", "cancelled"].includes(status)) {
            actions.push({
              entity: "purchase-order",
              id: row.id,
              label: "Receive",
              action: "receive",
            });
          }
          return renderActionButtons(actions);
        },
      },
    ],
    orderRows,
    { emptyMessage: "No purchase orders yet.", hideTableFooter: true },
  );

  renderTable(
    "goods-received-table",
    [
      { key: "grn_number", label: "GRN" },
      { key: "order_number", label: "PO" },
      {
        key: "purchase_type",
        label: "Purchase Type",
        render: (row) =>
          `${escapeHtml(row.purchase_type || "Weekly")} Purchase`,
      },
      { key: "supplier_name", label: "Supplier" },
      {
        key: "item_count",
        label: "Items",
        render: (row) => formatNumber(row.item_count),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) =>
          renderActionButtons([
            {
              entity: "goods-received",
              id: row.id,
              label: "View",
              action: "view",
            },
          ]),
      },
    ],
    receivedRows,
    { emptyMessage: "No goods received notes yet." },
  );

  renderTable(
    "supplier-invoices-table",
    [
      { key: "invoice_number", label: "Invoice" },
      { key: "supplier_name", label: "Supplier" },
      { key: "payment_method", label: "Payment Method" },
      {
        key: "total_amount",
        label: "Total",
        render: (row) => formatCurrency(row.total_amount),
      },
      {
        key: "payment_status",
        label: "Payment",
        render: (row) => renderStatusBadge(row.payment_status),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) =>
          renderActionButtons([
            {
              entity: "supplier-invoice",
              id: row.id,
              label: "View",
              action: "view",
            },
            {
              entity: "supplier-invoice",
              id: row.id,
              label: "Pay",
              action: "pay",
            },
          ]),
      },
    ],
    invoiceRows,
    { emptyMessage: "No supplier invoices yet." },
  );

  let workspaceColumns = [];
  let workspaceRows = [];
  let workspaceOptions = {};
  let exportFilename = "purchase-requisitions.csv";
  let exportColumns = [
    { label: "Requisition", key: "requisition_number" },
    { label: "Requested By", key: "requested_by_name" },
    { label: "Date", key: "request_date" },
    { label: "Status", key: "status" },
    { label: "Total Amount", key: "total_amount" },
  ];

  if (activeTab === "purchase orders") {
    workspaceColumns = [
      { key: "order_number", label: "PO" },
      { key: "supplier_name", label: "Supplier" },
      {
        key: "order_date",
        label: "Order Date",
        render: (row) => formatDate(row.order_date),
      },
      {
        key: "expected_delivery_date",
        label: "Expected Delivery",
        render: (row) => formatDate(row.expected_delivery_date),
      },
      {
        key: "total_amount",
        label: "Total",
        render: (row) => formatCurrency(row.total_amount),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => {
          const status = String(row.status || "").toLowerCase();
          const actions = [
            {
              entity: "purchase-order",
              id: row.id,
              label: "View",
              action: "view",
            },
          ];
          if (status === "draft") {
            actions.push({
              entity: "purchase-order",
              id: row.id,
              label: "Send",
              action: "send",
            });
          }
          if (!["fully received", "cancelled"].includes(status)) {
            actions.push({
              entity: "purchase-order",
              id: row.id,
              label: "Receive",
              action: "receive",
            });
          }
          return renderActionButtons(actions);
        },
      },
    ];
    workspaceRows = orderRows.filter((row) =>
      matchesSearch(row, search, [
        "order_number",
        "supplier_name",
        "status",
        "order_date",
      ]),
    );
    workspaceOptions = {
      emptyMessage: "No purchase orders match the current filter.",
      hideTableFooter: true,
    };
    exportFilename = "purchase-orders.csv";
    exportColumns = [
      { label: "PO", key: "order_number" },
      { label: "Supplier", key: "supplier_name" },
      { label: "Order Date", key: "order_date" },
      { label: "Total", key: "total_amount" },
    ];
  } else if (activeTab === "goods received") {
    workspaceColumns = [
      { key: "grn_number", label: "GRN Number" },
      { key: "order_number", label: "Purchase Order" },
      { key: "supplier_name", label: "Supplier" },
      {
        key: "receipt_date",
        label: "Date",
        render: (row) => formatDate(row.receipt_date),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) =>
          renderActionButtons([
            {
              entity: "goods-received",
              id: row.id,
              label: "View",
              action: "view",
            },
          ]),
      },
    ];
    workspaceRows = receivedRows.filter((row) =>
      matchesSearch(row, search, [
        "grn_number",
        "order_number",
        "supplier_name",
      ]),
    );
    workspaceOptions = {
      emptyMessage: "No goods received notes match the current filter.",
    };
  } else if (activeTab === "suppliers") {
    workspaceColumns = [
      { key: "name", label: "Supplier" },
      { key: "payment_terms", label: "Payment Terms" },
      { key: "phone", label: "Phone" },
      {
        key: "balance_due",
        label: "Balance",
        render: (row) => formatCurrency(row.balance_due),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) =>
          renderActionButtons([
            { entity: "supplier", id: row.id, label: "View", action: "view" },
            { entity: "supplier", id: row.id, label: "Edit", action: "edit" },
          ]),
      },
    ];
    workspaceRows = supplierRows;
    workspaceOptions = {
      emptyMessage: "No suppliers match the current filter.",
    };
  } else if (activeTab === "invoices") {
    workspaceColumns = [
      { key: "invoice_number", label: "Invoice" },
      { key: "supplier_name", label: "Supplier" },
      { key: "payment_method", label: "Payment Method" },
      {
        key: "invoice_date",
        label: "Invoice Date",
        render: (row) => formatDate(row.invoice_date),
      },
      {
        key: "due_date",
        label: "Due Date",
        render: (row) => formatDate(row.due_date),
      },
      {
        key: "total_amount",
        label: "Total",
        render: (row) => formatCurrency(row.total_amount),
      },
      {
        key: "payment_status",
        label: "Payment",
        render: (row) => renderStatusBadge(row.payment_status),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) =>
          renderActionButtons([
            {
              entity: "supplier-invoice",
              id: row.id,
              label: "View",
              action: "view",
            },
            {
              entity: "supplier-invoice",
              id: row.id,
              label: "Pay",
              action: "pay",
            },
          ]),
      },
    ];
    workspaceRows = invoiceRows.filter((row) =>
      matchesSearch(row, search, [
      "invoice_number",
      "supplier_name",
      "payment_method",
      "payment_status",
        "status",
      ]),
    );
    workspaceOptions = {
      emptyMessage: "No supplier invoices match the current filter.",
    };
  } else if (activeTab === "cash requisitions") {
    workspaceColumns = [
      { key: "requisition_number", label: "CRQ" },
      {
        key: "request_date",
        label: "Requested",
        render: (row) => formatDate(row.request_date),
      },
      { key: "department_name", label: "Department" },
      { key: "payee_name", label: "Payee" },
      {
        key: "amount",
        label: "Amount",
        render: (row) => formatCurrency(row.amount, row.currency_code || "UGX"),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
      {
        key: "settlement",
        label: "Settlement",
        render: (row) => {
          const status = String(row.status || "").toLowerCase();
          if (status === "closed") {
            return row.variance_amount && Math.abs(Number(row.variance_amount)) > 0.01
              ? `<span class="status-badge pending">Variance ${escapeHtml(formatCurrency(row.variance_amount, row.currency_code || "UGX"))}</span>`
              : '<span class="status-badge approved">Reconciled</span>';
          }
          return '<span class="muted-copy">Not settled</span>';
        },
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => {
          const status = String(row.status || "").toLowerCase();
          const actions = [
            { entity: "cash-requisition", id: row.id, label: "View", action: "view" },
          ];
          if (["draft", "returned for revision"].includes(status)) {
            actions.push({ entity: "cash-requisition", id: row.id, label: "Edit", action: "edit" });
            actions.push({ entity: "cash-requisition", id: row.id, label: "Submit", action: "submit", primary: true });
          }
          // Approve / return / reject for submitted cash requisitions live on Approvals.
          if (["approved", "cash released"].includes(status) && !row.payment_voucher_number) {
            actions.push({ entity: "cash-requisition", id: row.id, label: "Prepare Voucher", action: "create-voucher" });
          }
          if (status === "approved" && hasPermission(CASH_REQUISITION_RELEASE_PERMISSION) && !row.payment_voucher_number) {
            actions.push({ entity: "cash-requisition", id: row.id, label: "Release Cash", action: "release" });
          }
          if (status === "cash released" && hasPermission(CASH_REQUISITION_SETTLE_PERMISSION)) {
            actions.push({ entity: "cash-requisition", id: row.id, label: "Settle", action: "settle" });
          }
          return renderActionButtons(actions);
        },
      },
    ];
    const cashView = getActiveWorkspace("cash-requisitions") || "pending";
    workspaceRows = cashRequisitionRows.filter((row) => {
      const status = String(row.status || "").toLowerCase();
      const viewMatch =
        cashView === "all" ||
        (cashView === "pending" &&
          ["draft", "submitted", "returned for revision"].includes(status)) ||
        (cashView === "in progress" &&
          ["approved", "cash released"].includes(status)) ||
        (cashView === "closed" &&
          ["rejected", "closed", "cancelled"].includes(status));
      return (
        viewMatch &&
        matchesSearch(row, search, [
          "requisition_number",
          "department_name",
          "payee_name",
          "purpose",
          "status",
          "request_date",
        ])
      );
    });
    workspaceOptions = {
      emptyMessage: "No cash requisitions match the current filter.",
    };
    exportFilename = "cash-requisitions.csv";
    exportColumns = [
      { label: "CRQ", key: "requisition_number" },
      { label: "Requested", key: "request_date" },
      { label: "Department", key: "department_name" },
      { label: "Payee", key: "payee_name" },
      { label: "Amount", key: "amount" },
      { label: "Status", key: "status" },
      { label: "Settlement Date", key: "settlement_date" },
      { label: "Actual Spent", key: "actual_spent_amount" },
      { label: "Cash Returned", key: "cash_returned_amount" },
      { label: "Variance", key: "variance_amount" },
    ];
  } else if (activeTab === "payments") {
    workspaceColumns = [
      { key: "voucher_number", label: "Voucher" },
      {
        key: "payment_date",
        label: "Date",
        render: (row) => formatDate(row.payment_date),
      },
      {
        key: "payee_name",
        label: "Payment To",
        render: (row) => escapeHtml(getPaymentVoucherPayee(row)),
      },
      {
        key: "source",
        label: "Source",
        render: (row) => escapeHtml(row.invoice_number || row.cash_requisition_number || "-"),
      },
      {
        key: "amount",
        label: "Amount",
        render: (row) => formatCurrency(row.amount),
      },
      { key: "payment_method", label: "Method" },
      { key: "reference_number", label: "Reference" },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => {
          const status = String(row.status || "").toLowerCase();
          const actions = [
            { entity: "payment-voucher", id: row.id, label: "View", action: "view" },
            { entity: "payment-voucher", id: row.id, label: "Print", action: "print" },
          ];
          if (status === "draft") {
            actions.push({ entity: "payment-voucher", id: row.id, label: "Submit", action: "submit", primary: true });
          }
          // Approve / reject for submitted payment vouchers live on Approvals.
          if (status === "approved") {
            actions.push({ entity: "payment-voucher", id: row.id, label: "Mark Paid", action: "pay", primary: true });
          }
          return renderActionButtons(actions);
        },
      },
    ];
    workspaceRows = paymentVouchers.filter((row) =>
      matchesSearch(row, search, [
        "voucher_number",
        "invoice_number",
        "cash_requisition_number",
        "payee_name",
        "supplier_name",
        "payment_method",
        "reference_number",
        "status",
      ]),
    );
    workspaceOptions = {
      emptyMessage: "No payment vouchers match the current filter.",
    };
    exportFilename = "payment-vouchers.csv";
    exportColumns = [
      { label: "Voucher", key: "voucher_number" },
      { label: "Date", key: "payment_date" },
      {
        label: "Payment To",
        export: (row) => getPaymentVoucherPayee(row),
      },
      {
        label: "Source",
        export: (row) => row.invoice_number || row.cash_requisition_number || "",
      },
      { label: "Amount", key: "amount" },
      { label: "Method", key: "payment_method" },
      { label: "Reference", key: "reference_number" },
      { label: "Status", key: "status" },
    ];
  } else {
    workspaceColumns = [
      { key: "requisition_number", label: "PR Number" },
      {
        key: "requested_by_name",
        label: "Requested By",
        render: (row) => escapeHtml(row.requested_by_name || "Procurement"),
      },
      {
        key: "request_date",
        label: "Date",
        render: (row) => formatDate(row.request_date),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
      {
        key: "item_count",
        label: "Items",
        render: (row) => formatNumber(row.item_count),
      },
      {
        key: "total_amount",
        label: "Est. Cost",
        render: (row) => formatCurrency(row.total_amount),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => {
          const status = String(row.status || "").toLowerCase();
          const actions = [
            {
              entity: "purchase-requisition",
              id: row.id,
              label: "View",
              action: "view",
            },
          ];
          if (status === "draft") {
            actions.push({
              entity: "purchase-requisition",
              id: row.id,
              label: "Submit",
              action: "submit",
              primary: true,
            });
          }
          if (status === "approved") {
            actions.push({
              entity: "purchase-requisition",
              id: row.id,
              label: "Create PO",
              action: "create-po",
            });
          }
          return renderActionButtons(actions);
        },
      },
    ];
    workspaceRows = requisitionRows;
    workspaceOptions = {
      emptyMessage: "No purchase requisitions match the current filter.",
    };
  }

  renderTable("purchase-requisitions-table", workspaceColumns, workspaceRows, {
    ...workspaceOptions,
    pageKey: `procurement-${activeTab}`,
  });
  setExportState("procurement", exportFilename, exportColumns, workspaceRows);
}

async function loadProcurement() {
  renderPlaceholder("purchase-requisitions-table", "Loading requisitions...");
  renderPlaceholder("purchase-orders-table", "Loading purchase orders...");
  renderPlaceholder("goods-received-table", "Loading receipts...");
  renderPlaceholder("supplier-invoices-table", "Loading invoices...");

  const [requisitions, orders, received, invoices, paymentVouchers, cashRequisitions] =
    await Promise.all([
      api("/api/procurement/purchase-requisitions"),
      api("/api/procurement/purchase-orders"),
      api("/api/procurement/goods-received"),
      api("/api/procurement/supplier-invoices"),
      api("/api/procurement-system/payment-vouchers?view=full"),
      api("/api/procurement-system/cash-requisitions?view=full"),
    ]);

  state.moduleData.procurement = {
    requisitions: requisitions.data || [],
    orders: orders.data || [],
    received: received.data || [],
    invoices: invoices.data || [],
    paymentVouchers: paymentVouchers.data || [],
    cashRequisitions: cashRequisitions.data || [],
  };
  renderProcurement();
  fillWorkflowSelects();
}

function getInventoryRows() {
  const balances = state.moduleData.inventory?.balances || [];
  const search = state.filters.inventory.search;
  return balances.filter((row) =>
    matchesSearch(row, search, ["product_name", "category_name", "store_name"]),
  );
}

function renderInventory() {
  const balanceRows = getInventoryRows();
  const lowStockRows = state.moduleData.inventory?.lowStock || [];
  const expiringRows = state.moduleData.inventory?.expiring || [];
  const movementRows = state.moduleData.inventory?.movements || [];
  const adjustmentRows = state.moduleData.inventory?.adjustments || [];
  const countRows = state.moduleData.inventory?.counts || [];
  const stockValue = sumBy(balanceRows, (row) => row.stock_value);
  const totalProducts = new Set(balanceRows.map((row) => row.product_name))
    .size;
  const search = state.filters.inventory.search;
  const activeTab = getActiveWorkspace("inventory");

  configureWorkspaceChrome("inventory", {
    eyebrow: "Inventory & Stores",
    title:
      activeTab === "current stock"
        ? "Current Stock"
        : titleCaseWords(activeTab),
    description:
      "Start with what is on hand, then open alerts, movements, and stock controls only when you need them.",
    searchPlaceholder:
      activeTab === "products"
        ? "Search products..."
        : activeTab === "stock movements"
          ? "Search stock movements..."
          : activeTab === "adjustments"
            ? "Search adjustments..."
            : activeTab === "physical counts"
              ? "Search physical counts..."
              : activeTab === "alerts"
                ? "Search low stock or expiring items..."
                : "Search current stock...",
    actions:
      activeTab === "products"
        ? [
            { type: "reset", label: "Reset" },
            { type: "export", label: "Export CSV" },
            {
              type: "open-form",
              label: "New Product",
              formId: "product-form",
              className: "refresh-btn",
              reset: true,
            },
          ]
        : activeTab === "adjustments"
          ? [
              { type: "reset", label: "Reset" },
              {
                type: "open-form",
                label: "New Adjustment",
                formId: "stock-adjustment-form",
                className: "refresh-btn",
                reset: true,
              },
            ]
          : activeTab === "physical counts"
            ? [
                { type: "reset", label: "Reset" },
                {
                  type: "open-form",
                  label: "New Count",
                  formId: "physical-count-form",
                  className: "refresh-btn",
                  reset: true,
                },
              ]
            : [
                { type: "reset", label: "Reset" },
                { type: "export", label: "Export CSV" },
              ],
  });

  renderMetricGrid("inventory-metrics", [
    {
      label: "Stock Value",
      value: formatCurrency(stockValue),
      note: "Current store value",
      tone: "green",
      icon: "SV",
    },
    {
      label: "Total Products",
      value: formatNumber(totalProducts),
      note: "Tracked SKUs",
      tone: "blue",
      icon: "PD",
    },
    {
      label: "Low Stock Items",
      value: formatNumber(lowStockRows.length),
      note: "Needs replenishment",
      tone: "amber",
      icon: "LS",
    },
    {
      label: "Expiring Items",
      value: formatNumber(expiringRows.length),
      note: "Batch attention needed",
      tone: "red",
      icon: "EX",
    },
  ]);

  renderTable(
    "inventory-balances-table",
    [
      { key: "product_name", label: "Product" },
      {
        key: "category_name",
        label: "Category",
        render: (row) => escapeHtml(row.category_name || "-"),
      },
      { key: "store_name", label: "Store" },
      {
        key: "quantity_on_hand",
        label: "On Hand",
        render: (row) => formatNumber(row.quantity_on_hand),
      },
      {
        key: "stock_value",
        label: "Value",
        render: (row) => formatCurrency(row.stock_value),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) =>
          renderActionButtons([
            {
              entity: "inventory-balance",
              id: row.id,
              label: "View",
              action: "view",
            },
          ]),
      },
    ],
    balanceRows,
    { emptyMessage: "No inventory balances match the current filter." },
  );

  renderTable(
    "inventory-low-stock-table",
    [
      { key: "product_name", label: "Low Stock Product" },
      {
        key: "current_stock",
        label: "Current",
        render: (row) => formatNumber(row.current_stock),
      },
      {
        key: "reorder_level",
        label: "Reorder Level",
        render: (row) => formatNumber(row.reorder_level),
      },
    ],
    lowStockRows,
    { emptyMessage: "No low stock items." },
  );

  renderTable(
    "inventory-expiring-table",
    [
      { key: "product_name", label: "Expiring Product" },
      { key: "batch_number", label: "Batch" },
      {
        key: "expiry_date",
        label: "Expiry",
        render: (row) => formatDate(row.expiry_date),
      },
      {
        key: "quantity_remaining",
        label: "Remaining",
        render: (row) => formatNumber(row.quantity_remaining),
      },
    ],
    expiringRows,
    { emptyMessage: "No expiring batches." },
  );

  renderTable(
    "inventory-movements-table",
    [
      {
        key: "movement_date",
        label: "Date",
        render: (row) => formatDate(row.movement_date),
      },
      { key: "product_name", label: "Product" },
      { key: "movement_type", label: "Movement" },
      {
        key: "quantity_in",
        label: "In",
        render: (row) => formatNumber(row.quantity_in),
      },
      {
        key: "quantity_out",
        label: "Out",
        render: (row) => formatNumber(row.quantity_out),
      },
    ],
    movementRows,
    { emptyMessage: "No stock movements yet." },
  );

  renderTable(
    "inventory-adjustments-table",
    [
      { key: "adjustment_number", label: "Adjustment" },
      { key: "store_name", label: "Store" },
      {
        key: "adjustment_date",
        label: "Date",
        render: (row) => formatDate(row.adjustment_date),
      },
      {
        key: "item_count",
        label: "Items",
        render: (row) => formatNumber(row.item_count),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => {
          const status = String(row.status || "").toLowerCase();
          const actions = [];
          if (status === "draft") {
            actions.push({
              entity: "stock-adjustment",
              id: row.id,
              label: "Submit",
              action: "submit",
              primary: true,
            });
          }
          // Approve submitted stock adjustments on Approvals.
          return renderActionButtons(actions);
        },
      },
    ],
    adjustmentRows,
    { emptyMessage: "No stock adjustments yet." },
  );

  renderTable(
    "inventory-counts-table",
    [
      { key: "count_number", label: "Count" },
      { key: "store_name", label: "Store" },
      {
        key: "count_date",
        label: "Date",
        render: (row) => formatDate(row.count_date),
      },
      {
        key: "item_count",
        label: "Items",
        render: (row) => formatNumber(row.item_count),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
    ],
    countRows,
    { emptyMessage: "No physical stock counts yet." },
  );

  const alertRows = [
    ...lowStockRows.map((row) => ({
      ...row,
      alert_type: "Low Stock",
      reference: row.reorder_level,
      reference_label: "Reorder Level",
      date_value: null,
    })),
    ...expiringRows.map((row) => ({
      ...row,
      product_name: row.product_name,
      alert_type: "Expiring Batch",
      reference: row.quantity_remaining,
      reference_label: "Remaining Qty",
      date_value: row.expiry_date,
    })),
  ].filter((row) =>
    matchesSearch(row, search, [
      "product_name",
      "alert_type",
      "batch_number",
      "store_name",
    ]),
  );

  let workspaceColumns = [];
  let workspaceRows = [];
  let workspaceOptions = {};
  let exportFilename = "inventory-balances.csv";
  let exportColumns = [
    { label: "Product", key: "product_name" },
    { label: "Category", key: "category_name" },
    { label: "Store", key: "store_name" },
    { label: "On Hand", key: "quantity_on_hand" },
    { label: "Value", key: "stock_value" },
  ];

  if (activeTab === "products") {
    workspaceColumns = [
      { key: "name", label: "Product" },
      { key: "product_type", label: "Type" },
      { key: "category_name", label: "Category" },
      { key: "unit_code", label: "Unit" },
      {
        key: "minimum_stock_level",
        label: "Min Stock",
        render: (row) => formatNumber(row.minimum_stock_level),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) =>
          renderActionButtons([
            { entity: "product", id: row.id, label: "View", action: "view" },
            { entity: "product", id: row.id, label: "Edit", action: "edit" },
          ]),
      },
    ];
    workspaceRows = (state.moduleData.masterData?.products || []).filter(
      (row) =>
        matchesSearch(row, search, [
          "name",
          "product_type",
          "category_name",
          "unit_code",
        ]),
    );
    workspaceOptions = {
      emptyMessage: "No products match the current filter.",
    };
    exportFilename = "products.csv";
    exportColumns = [
      { label: "Product", key: "name" },
      { label: "Type", key: "product_type" },
      { label: "Category", key: "category_name" },
      { label: "Unit", key: "unit_code" },
    ];
  } else if (activeTab === "stock movements") {
    workspaceColumns = [
      {
        key: "movement_date",
        label: "Date",
        render: (row) => formatDate(row.movement_date),
      },
      { key: "product_name", label: "Product" },
      { key: "movement_type", label: "Movement" },
      {
        key: "quantity_in",
        label: "In",
        render: (row) => formatNumber(row.quantity_in),
      },
      {
        key: "quantity_out",
        label: "Out",
        render: (row) => formatNumber(row.quantity_out),
      },
    ];
    workspaceRows = movementRows.filter((row) =>
      matchesSearch(row, search, [
        "product_name",
        "movement_type",
        "reference_type",
        "notes",
      ]),
    );
    workspaceOptions = {
      emptyMessage: "No stock movements match the current filter.",
    };
  } else if (activeTab === "adjustments") {
    workspaceColumns = [
      { key: "adjustment_number", label: "Adjustment" },
      { key: "store_name", label: "Store" },
      {
        key: "adjustment_date",
        label: "Date",
        render: (row) => formatDate(row.adjustment_date),
      },
      {
        key: "item_count",
        label: "Items",
        render: (row) => formatNumber(row.item_count),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => {
          const status = String(row.status || "").toLowerCase();
          const actions = [];
          if (status === "draft") {
            actions.push({
              entity: "stock-adjustment",
              id: row.id,
              label: "Submit",
              action: "submit",
            });
          }
          // Approve submitted stock adjustments on Approvals.
          return renderActionButtons(actions);
        },
      },
    ];
    workspaceRows = adjustmentRows.filter((row) =>
      matchesSearch(row, search, ["adjustment_number", "store_name", "status"]),
    );
    workspaceOptions = {
      emptyMessage: "No stock adjustments match the current filter.",
    };
  } else if (activeTab === "physical counts") {
    workspaceColumns = [
      { key: "count_number", label: "Count" },
      { key: "store_name", label: "Store" },
      {
        key: "count_date",
        label: "Date",
        render: (row) => formatDate(row.count_date),
      },
      {
        key: "item_count",
        label: "Items",
        render: (row) => formatNumber(row.item_count),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
    ];
    workspaceRows = countRows.filter((row) =>
      matchesSearch(row, search, ["count_number", "store_name", "status"]),
    );
    workspaceOptions = {
      emptyMessage: "No physical counts match the current filter.",
    };
  } else if (activeTab === "alerts") {
    workspaceColumns = [
      { key: "product_name", label: "Product" },
      { key: "alert_type", label: "Alert" },
      {
        key: "batch_number",
        label: "Batch",
        render: (row) => escapeHtml(row.batch_number || "-"),
      },
      {
        key: "date_value",
        label: "Expiry",
        render: (row) => (row.date_value ? formatDate(row.date_value) : "-"),
      },
      {
        key: "reference",
        label: "Reference",
        render: (row) => formatNumber(row.reference),
      },
      { key: "reference_label", label: "Reference Type" },
    ];
    workspaceRows = alertRows;
    workspaceOptions = {
      emptyMessage: "No current stock alerts match the current filter.",
    };
  } else {
    workspaceColumns = [
      { key: "product_name", label: "Product" },
      {
        key: "category_name",
        label: "Category",
        render: (row) => escapeHtml(row.category_name || "-"),
      },
      { key: "store_name", label: "Store" },
      {
        key: "quantity_on_hand",
        label: "On Hand",
        render: (row) => formatNumber(row.quantity_on_hand),
      },
      {
        key: "stock_value",
        label: "Value",
        render: (row) => formatCurrency(row.stock_value),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) =>
          renderActionButtons([
            {
              entity: "inventory-balance",
              id: row.id,
              label: "View",
              action: "view",
            },
          ]),
      },
    ];
    workspaceRows = balanceRows;
    workspaceOptions = {
      emptyMessage: "No current stock records match the current filter.",
    };
  }

  renderTable("inventory-balances-table", workspaceColumns, workspaceRows, {
    ...workspaceOptions,
    pageKey: `inventory-${activeTab}`,
  });
  setExportState("inventory", exportFilename, exportColumns, workspaceRows);
}

async function loadInventory() {
  renderPlaceholder(
    "inventory-balances-table",
    "Loading inventory balances...",
  );
  renderPlaceholder("inventory-movements-table", "Loading stock movements...");
  renderPlaceholder(
    "inventory-adjustments-table",
    "Loading stock adjustments...",
  );
  renderPlaceholder("inventory-counts-table", "Loading physical counts...");

  const [balances, lowStock, expiring, movements, adjustments, counts] =
    await Promise.all([
      api("/api/inventory/balances"),
      api("/api/inventory/low-stock"),
      api("/api/inventory/expiring"),
      api("/api/inventory/movements"),
      api("/api/inventory/stock-adjustments"),
      api("/api/inventory/physical-stock-counts"),
    ]);

  state.moduleData.inventory = {
    balances: balances.data || [],
    lowStock: lowStock.data || [],
    expiring: expiring.data || [],
    movements: movements.data || [],
    adjustments: adjustments.data || [],
    counts: counts.data || [],
  };
  renderInventory();
  fillWorkflowSelects();
}

function getKitchenRows() {
  const requisitions = state.moduleData.kitchen?.requisitions || [];
  const search = state.filters.kitchen.search;
  const tab = state.filters.kitchen.tab || "pending";

  return requisitions.filter((row) => {
    const status = String(row.status || "").toLowerCase();
    let tabMatch = true;
    if (tab === "pending") {
      tabMatch = ["submitted", "pending", "approved"].includes(status);
    } else if (tab === "active requests") {
      tabMatch = !["closed", "rejected", "issued"].includes(status);
    } else if (tab === "issued") {
      tabMatch = status === "issued";
    } else if (tab === "closed") {
      tabMatch = status === "closed";
    } else if (tab === "store issues") {
      tabMatch = true;
    } else {
      tabMatch = true;
    }
    return (
      tabMatch &&
      matchesSearch(row, search, [
        "requisition_number",
        "department_name",
        "requested_by_name",
        "status",
      ])
    );
  });
}

function renderKitchen() {
  const requisitionRows = getKitchenRows();
  const issueRows = state.moduleData.kitchen?.issues || [];
  const batchRows = state.moduleData.kitchen?.batches || [];
  const search = state.filters.kitchen.search;
  const activeTab = getActiveWorkspace("kitchen");
  const pendingRequests = requisitionRows.filter((row) =>
    ["draft", "submitted", "approved", "pending"].includes(
      String(row.status || "").toLowerCase(),
    ),
  ).length;
  const issuedToday = issueRows.filter((row) =>
    isSameDay(row.issue_date),
  ).length;
  const rejectedCount = requisitionRows.filter(
    (row) => String(row.status || "").toLowerCase() === "rejected",
  ).length;
  const awaitingApproval = requisitionRows.filter((row) =>
    ["submitted", "pending"].includes(String(row.status || "").toLowerCase()),
  ).length;

  configureWorkspaceChrome("kitchen", {
    eyebrow: "Kitchen Requisitions",
    title:
      activeTab === "pending"
        ? "Pending Kitchen Requests"
        : titleCaseWords(activeTab),
    description:
      "Show pending and active requisitions first, then move to issue history only when needed.",
    searchPlaceholder:
      activeTab === "store issues"
        ? "Search store issues..."
        : "Search kitchen requisitions...",
    actions:
      activeTab === "store issues"
        ? [
            { type: "reset", label: "Reset" },
            {
              type: "open-form",
              label: "Issue Stock",
              formId: "store-issue-form",
              className: "refresh-btn",
              reset: true,
            },
          ]
        : [
            { type: "reset", label: "Reset" },
            { type: "export", label: "Export CSV" },
            {
              type: "open-form",
              label: "New Requisition",
              formId: "kitchen-requisition-form",
              className: "refresh-btn",
              reset: true,
            },
          ],
  });

  renderMetricGrid("kitchen-metrics", [
    {
      label: "Pending Requests",
      value: formatNumber(pendingRequests),
      note: "Open kitchen demand",
      tone: "blue",
      icon: "RQ",
    },
    {
      label: "Issued Today",
      value: formatNumber(issuedToday),
      note: "Store issues posted",
      tone: "green",
      icon: "IS",
    },
    {
      label: "Rejected",
      value: formatNumber(rejectedCount),
      note: "Needs correction",
      tone: "red",
      icon: "RJ",
    },
    {
      label: "Awaiting Approval",
      value: formatNumber(awaitingApproval),
      note: "Pending review",
      tone: "amber",
      icon: "AP",
    },
  ]);

  renderTable(
    "kitchen-requisitions-table",
    [
      { key: "requisition_number", label: "KR Number" },
      { key: "department_name", label: "Kitchen" },
      { key: "requested_by_name", label: "Owner" },
      {
        key: "request_date",
        label: "Requested",
        render: (row) => formatDate(row.request_date),
      },
      {
        key: "item_count",
        label: "Items",
        render: (row) => formatNumber(row.item_count),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => {
          const status = String(row.status || "").toLowerCase();
          const actions = [
            {
              entity: "kitchen-requisition",
              id: row.id,
              label: "View",
              action: "view",
            },
          ];
          if (status === "draft") {
            actions.push({
              entity: "kitchen-requisition",
              id: row.id,
              label: "Submit",
              action: "submit",
            });
          }
          // Approve/Reject live on Approvals for submitted kitchen requisitions.
          if (status === "approved") {
            actions.push({
              entity: "kitchen-requisition",
              id: row.id,
              label: "Issue",
              action: "issue",
            });
          }
          return renderActionButtons(actions);
        },
      },
    ],
    requisitionRows,
    { emptyMessage: "No kitchen requisitions match the current filter." },
  );

  renderTable(
    "kitchen-store-issues-table",
    [
      { key: "issue_number", label: "Issue Number" },
      { key: "requisition_number", label: "Requisition" },
      {
        key: "issue_date",
        label: "Issue Date",
        render: (row) => formatDate(row.issue_date),
      },
      {
        key: "total_issued_quantity",
        label: "Issued Qty",
        render: (row) => formatNumber(row.total_issued_quantity),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) =>
          renderActionButtons([
            {
              entity: "store-issue",
              id: row.id,
              label: "View",
              action: "view",
            },
          ]),
      },
    ],
    issueRows,
    { emptyMessage: "No store issues posted yet." },
  );

  renderTable(
    "kitchen-production-batches-table",
    [
      { key: "batch_number", label: "Batch Number" },
      { key: "shift", label: "Shift" },
      {
        key: "production_date",
        label: "Date",
        render: (row) => formatDate(row.production_date),
      },
      {
        key: "actual_output",
        label: "Actual Output",
        render: (row) => formatNumber(row.actual_output),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
    ],
    batchRows,
    { emptyMessage: "No production batches linked yet." },
  );

  setExportState(
    "kitchen",
    "kitchen-requisitions.csv",
    [
      { label: "Requisition", key: "requisition_number" },
      { label: "Kitchen", key: "department_name" },
      { label: "Requested By", key: "requested_by_name" },
      { label: "Status", key: "status" },
    ],
    requisitionRows,
  );

  if (activeTab === "store issues") {
    renderTable(
      "kitchen-requisitions-table",
      [
        { key: "issue_number", label: "Issue Number" },
        { key: "requisition_number", label: "Requisition" },
        {
          key: "issue_date",
          label: "Issue Date",
          render: (row) => formatDate(row.issue_date),
        },
        {
          key: "status",
          label: "Status",
          render: (row) => renderStatusBadge(row.status),
        },
        {
          key: "actions",
          label: "Actions",
          render: (row) =>
            renderActionButtons([
              {
                entity: "store-issue",
                id: row.id,
                label: "View",
                action: "view",
              },
            ]),
        },
      ],
      issueRows.filter((row) =>
        matchesSearch(row, search, [
          "issue_number",
          "requisition_number",
          "status",
        ]),
      ),
      {
        emptyMessage: "No store issues match the current filter.",
        pageKey: "kitchen-store-issues",
      },
    );
    return;
  }

  renderTable(
    "kitchen-requisitions-table",
    [
      { key: "requisition_number", label: "Requisition" },
      { key: "department_name", label: "Kitchen / Department" },
      {
        key: "requested_by_name",
        label: "Requested By",
        render: (row) => escapeHtml(row.requested_by_name || "-"),
      },
      {
        key: "production_date",
        label: "Production Date",
        render: (row) => formatDate(row.production_date),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => {
          const status = String(row.status || "").toLowerCase();
          const actions = [
            {
              entity: "kitchen-requisition",
              id: row.id,
              label: "View",
              action: "view",
            },
          ];
          if (status === "draft") {
            actions.push({
              entity: "kitchen-requisition",
              id: row.id,
              label: "Submit",
              action: "submit",
            });
          }
          // Approve/Reject live on Approvals for submitted kitchen requisitions.
          if (status === "approved") {
            actions.push({
              entity: "kitchen-requisition",
              id: row.id,
              label: "Issue",
              action: "issue",
            });
          }
          return renderActionButtons(actions);
        },
      },
    ],
    requisitionRows,
    {
      emptyMessage: "No kitchen requisitions match the current filter.",
      pageKey: `kitchen-${activeTab}`,
    },
  );
}

async function loadKitchen() {
  renderPlaceholder(
    "kitchen-requisitions-table",
    "Loading kitchen requisitions...",
  );
  renderPlaceholder("kitchen-store-issues-table", "Loading store issues...");
  renderPlaceholder(
    "kitchen-production-batches-table",
    "Loading production batches...",
  );

  const [requisitions, issues, batches] = await Promise.all([
    api("/api/kitchen/requisitions"),
    api("/api/kitchen/store-issues"),
    api("/api/kitchen/production-batches"),
  ]);

  state.moduleData.kitchen = {
    requisitions: requisitions.data || [],
    issues: issues.data || [],
    batches: batches.data || [],
  };
  renderKitchen();
  fillWorkflowSelects();
}

function getProductionRows() {
  const batches = state.moduleData.production?.batches || [];
  const search = state.filters.production.search;
  const tab = state.filters.production.tab || "today's batches";

  return batches.filter((row) => {
    const status = String(row.status || "").toLowerCase();
    let tabMatch = true;
    if (tab === "completed") {
      tabMatch = ["completed", "closed"].includes(status);
    } else if (tab === "waste" || tab === "returns") {
      tabMatch = true;
    } else if (tab === "today's batches") {
      tabMatch = true;
    }
    return (
      tabMatch &&
      matchesSearch(row, search, [
        "batch_number",
        "requisition_number",
        "shift",
        "status",
      ])
    );
  });
}

function renderProduction() {
  const batchRows = getProductionRows();
  const issueRows = state.moduleData.production?.issues || [];
  const wastageRows = state.moduleData.production?.wastage || [];
  const returnRows = state.moduleData.production?.returns || [];
  const search = state.filters.production.search;
  const activeTab = getActiveWorkspace("production");
  const todaysProduction = sumBy(
    batchRows.filter((row) => isSameDay(row.production_date)),
    (row) => row.actual_output || row.planned_output,
  );
  const completed = batchRows.filter((row) =>
    ["completed", "closed"].includes(String(row.status || "").toLowerCase()),
  ).length;
  const pending = batchRows.filter(
    (row) =>
      !["completed", "closed"].includes(String(row.status || "").toLowerCase()),
  ).length;
  const waste = sumBy(batchRows, (row) => row.wastage_quantity);

  configureWorkspaceChrome("production", {
    eyebrow: "Production",
    title:
      activeTab === "today's batches"
        ? "Today's Batches"
        : titleCaseWords(activeTab),
    description:
      "Keep the day focused on active batches. Open wastage and return records only when you need to close the loop.",
    searchPlaceholder:
      activeTab === "waste"
        ? "Search wastage records..."
        : activeTab === "returns"
          ? "Search stock returns..."
          : "Search production batches...",
    actions:
      activeTab === "waste"
        ? [
            { type: "reset", label: "Reset" },
            {
              type: "open-form",
              label: "Record Wastage",
              formId: "wastage-form",
              className: "refresh-btn",
              reset: true,
            },
          ]
        : activeTab === "returns"
          ? [
              { type: "reset", label: "Reset" },
              {
                type: "open-form",
                label: "Return Stock",
                formId: "return-form",
                className: "refresh-btn",
                reset: true,
              },
            ]
          : [
              { type: "reset", label: "Reset" },
              { type: "export", label: "Export CSV" },
              {
                type: "open-form",
                label: "New Batch",
                formId: "production-batch-form",
                className: "refresh-btn",
                reset: true,
              },
            ],
  });

  renderMetricGrid("production-metrics", [
    {
      label: "Today's Production",
      value: formatNumber(todaysProduction),
      note: "Meal output today",
      tone: "blue",
      icon: "TD",
    },
    {
      label: "Completed",
      value: formatNumber(completed),
      note: "Closed batches",
      tone: "green",
      icon: "CP",
    },
    {
      label: "Pending",
      value: formatNumber(pending),
      note: "Open production runs",
      tone: "amber",
      icon: "PN",
    },
    {
      label: "Waste",
      value: formatNumber(waste),
      note: "Recorded wastage",
      tone: "red",
      icon: "WS",
    },
  ]);

  renderTable(
    "production-batches-table",
    [
      { key: "batch_number", label: "Batch Number" },
      { key: "shift", label: "Shift" },
      {
        key: "planned_output",
        label: "Planned Meals",
        render: (row) => formatNumber(row.planned_output),
      },
      {
        key: "actual_output",
        label: "Actual Meals",
        render: (row) => formatNumber(row.actual_output),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => {
          const status = String(row.status || "").toLowerCase();
          const actions = [
            {
              entity: "production-batch",
              id: row.id,
              label: "View",
              action: "view",
            },
          ];
          if (!["completed", "closed"].includes(status)) {
            actions.push({
              entity: "production-batch",
              id: row.id,
              label: "Complete",
              action: "complete",
            });
          }
          return renderActionButtons(actions);
        },
      },
    ],
    batchRows,
    { emptyMessage: "No production batches match the current filter." },
  );

  renderTable(
    "store-issues-table",
    [
      { key: "issue_number", label: "Issue Number" },
      { key: "requisition_number", label: "Requisition" },
      {
        key: "issue_date",
        label: "Issue Date",
        render: (row) => formatDate(row.issue_date),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
    ],
    issueRows,
    { emptyMessage: "No store issues available for production." },
  );

  setExportState(
    "production",
    "production-batches.csv",
    [
      { label: "Batch", key: "batch_number" },
      { label: "Shift", key: "shift" },
      { label: "Production Date", key: "production_date" },
      { label: "Actual Output", key: "actual_output" },
      { label: "Status", key: "status" },
    ],
    batchRows,
  );

  let workspaceColumns = [];
  let workspaceRows = [];
  let workspaceOptions = {};

  if (activeTab === "waste") {
    workspaceColumns = [
      {
        key: "record_date",
        label: "Date",
        render: (row) => formatDate(row.record_date),
      },
      { key: "product_name", label: "Product" },
      {
        key: "quantity",
        label: "Quantity",
        render: (row) => formatNumber(row.quantity),
      },
      { key: "wastage_type", label: "Type" },
      {
        key: "wastage_value",
        label: "Value",
        render: (row) => formatCurrency(row.wastage_value),
      },
    ];
    workspaceRows = wastageRows.filter((row) =>
      matchesSearch(row, search, [
        "product_name",
        "wastage_type",
        "record_date",
      ]),
    );
    workspaceOptions = {
      emptyMessage: "No wastage records match the current filter.",
    };
  } else if (activeTab === "returns") {
    workspaceColumns = [
      { key: "return_number", label: "Return Number" },
      { key: "requisition_number", label: "Requisition" },
      { key: "issue_number", label: "Store Issue" },
      { key: "store_name", label: "Store" },
      {
        key: "return_date",
        label: "Return Date",
        render: (row) => formatDate(row.return_date),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
    ];
    workspaceRows = returnRows.filter((row) =>
      matchesSearch(row, search, [
        "return_number",
        "requisition_number",
        "issue_number",
        "store_name",
        "status",
      ]),
    );
    workspaceOptions = {
      emptyMessage: "No stock returns match the current filter.",
    };
  } else {
    workspaceColumns = [
      { key: "batch_number", label: "Batch Number" },
      { key: "shift", label: "Shift" },
      {
        key: "planned_output",
        label: "Planned Meals",
        render: (row) => formatNumber(row.planned_output),
      },
      {
        key: "actual_output",
        label: "Actual Meals",
        render: (row) => formatNumber(row.actual_output),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => {
          const status = String(row.status || "").toLowerCase();
          const actions = [
            {
              entity: "production-batch",
              id: row.id,
              label: "View",
              action: "view",
            },
          ];
          if (!["completed", "closed"].includes(status)) {
            actions.push({
              entity: "production-batch",
              id: row.id,
              label: "Complete",
              action: "complete",
            });
          }
          return renderActionButtons(actions);
        },
      },
    ];
    workspaceRows = batchRows;
    workspaceOptions = {
      emptyMessage: "No production batches match the current filter.",
    };
  }

  renderTable("production-batches-table", workspaceColumns, workspaceRows, {
    ...workspaceOptions,
    pageKey: `production-${activeTab}`,
  });
}

async function loadProduction() {
  renderPlaceholder(
    "production-batches-table",
    "Loading production batches...",
  );
  renderPlaceholder("store-issues-table", "Loading available store issues...");
  const [issues, batches, wastage, returns] = await Promise.all([
    api("/api/kitchen/store-issues"),
    api("/api/kitchen/production-batches"),
    api("/api/kitchen/wastage").catch(() => ({ data: [] })),
    api("/api/kitchen/returns").catch(() => ({ data: [] })),
  ]);

  state.moduleData.production = {
    issues: issues.data || [],
    batches: batches.data || [],
    wastage: wastage.data || [],
    returns: returns.data || [],
  };
  renderProduction();
  fillWorkflowSelects();
}

async function loadConsumption() {
  const query = new URLSearchParams(state.consumptionRange).toString();
  renderPlaceholder(
    "consumption-products-table",
    "Loading consumption analysis...",
  );
  renderPlaceholder("consumption-variance-table", "Loading variance...");
  renderPlaceholder("consumption-daily-table", "Loading daily output...");

  const [products, variance, daily, weekly, monthly, wastage] =
    await Promise.all([
      api(`/api/consumption/products?${query}`),
      api(`/api/consumption/variance?${query}`),
      api(`/api/consumption/daily?${query}`),
      api(`/api/consumption/weekly?${query}`),
      api(`/api/consumption/monthly?${query}`),
      api(`/api/consumption/wastage?${query}`),
    ]);

  const productRows = products.data || [];
  const varianceRows = variance.data || [];
  const dailyRows = daily.data || [];
  const weeklyRows = weekly.data || [];
  const monthlyRows = monthly.data || [];
  const wastageRows = wastage.data || [];

  const totalConsumed = sumBy(productRows, (row) => row.consumed_quantity);
  const totalIssued = Math.max(
    sumBy(productRows, (row) => row.issued_quantity),
    1,
  );
  const totalWastage = sumBy(wastageRows, (row) => row.quantity);
  const topProduct = [...productRows].sort(
    (left, right) =>
      Number(right.consumed_quantity || 0) -
      Number(left.consumed_quantity || 0),
  )[0];
  const activeTab = getActiveWorkspace("consumption");
  const secondaryTarget = ensureWorkspaceSecondaryTarget("consumption");

  configureWorkspaceChrome("consumption", {
    eyebrow: "Consumption Analysis",
    title: titleCaseWords(activeTab),
    description:
      "Use dedicated analysis workspaces to compare purchased, issued, consumed, wasted, and remaining stock across the selected period.",
    searchPlaceholder:
      activeTab === "variance"
        ? "Search variance rows..."
        : activeTab === "waste analysis"
          ? "Search wastage rows..."
          : activeTab === "trends"
            ? "Search daily, weekly, or monthly trend rows..."
            : "Search consumption overview...",
    hideSearch: true,
    actions: [
      { type: "reset", label: "Reset Dates" },
      { type: "refresh", label: "Reload" },
    ],
  });

  const rangeForm = document.getElementById("consumption-range-form");
  const consumptionBar = document.querySelector(
    '[data-module="consumption"] .module-primary-panel .search-filter-bar',
  );
  if (rangeForm && consumptionBar && rangeForm.parentElement !== consumptionBar)
    consumptionBar.prepend(rangeForm);
  renderMetricGrid("consumption-metrics", [
    {
      label: "Total Consumed",
      value: formatNumber(totalConsumed),
      note: "Across selected range",
      tone: "green",
      icon: "TC",
    },
    {
      label: "Waste %",
      value: `${formatNumber((totalWastage / totalIssued) * 100, 2)}%`,
      note: "Issued vs wasted",
      tone: "red",
      icon: "WT",
    },
    {
      label: "Most Consumed",
      value: topProduct ? escapeHtml(topProduct.product_name) : "None",
      note: topProduct
        ? formatNumber(topProduct.consumed_quantity)
        : "No usage yet",
      tone: "amber",
      icon: "MC",
    },
    {
      label: "Range End",
      value: formatDate(state.consumptionRange.endDate),
      note: "Live reporting window",
      tone: "violet",
      icon: "RG",
    },
  ]);

  renderTrendChart("consumption-trend-chart", dailyRows);
  renderDonutChart(
    "consumption-donut-chart",
    productRows.map((row) => ({
      name: row.product_name,
      total_issued: row.consumed_quantity,
    })),
  );

  renderTable(
    "consumption-products-table",
    [
      { key: "product_name", label: "Product" },
      {
        key: "purchased_quantity",
        label: "Purchased",
        render: (row) => formatNumber(row.purchased_quantity),
      },
      {
        key: "issued_quantity",
        label: "Issued",
        render: (row) => formatNumber(row.issued_quantity),
      },
      {
        key: "returned_quantity",
        label: "Returned",
        render: (row) => formatNumber(row.returned_quantity),
      },
      {
        key: "wastage_quantity",
        label: "Wastage",
        render: (row) => formatNumber(row.wastage_quantity),
      },
      {
        key: "consumed_quantity",
        label: "Consumed",
        render: (row) => formatNumber(row.consumed_quantity),
      },
      {
        key: "remaining_quantity",
        label: "Remaining",
        render: (row) => formatNumber(row.remaining_quantity),
      },
      {
        key: "consumption_per_unit",
        label: "Per Unit",
        render: (row) => formatNumber(row.consumption_per_unit, 4),
      },
    ],
    productRows,
    { emptyMessage: "No consumption records in the selected range." },
  );

  renderTable(
    "consumption-variance-table",
    [
      { key: "product_name", label: "Product" },
      {
        key: "actual_usage",
        label: "Recorded usage",
        render: (row) => formatNumber(row.actual_usage),
      },
      {
        key: "variance_quantity",
        label: "Variance",
        render: (row) => formatNumber(row.variance_quantity),
      },
    ],
    varianceRows,
    { emptyMessage: "No variance rows for the selected range." },
  );

  renderTable(
    "consumption-daily-table",
    [
      {
        key: "report_date",
        label: "Day",
        render: (row) => formatDate(row.report_date),
      },
      {
        key: "total_output",
        label: "Output",
        render: (row) => formatNumber(row.total_output),
      },
      {
        key: "total_wastage",
        label: "Wastage",
        render: (row) => formatNumber(row.total_wastage),
      },
    ],
    dailyRows,
    { emptyMessage: "No daily output rows for the selected range." },
  );

  renderTable(
    "consumption-weekly-table",
    [
      {
        key: "week_start",
        label: "Week",
        render: (row) => formatDate(row.week_start),
      },
      {
        key: "total_output",
        label: "Output",
        render: (row) => formatNumber(row.total_output),
      },
      {
        key: "total_wastage",
        label: "Wastage",
        render: (row) => formatNumber(row.total_wastage),
      },
    ],
    weeklyRows,
    { emptyMessage: "No weekly output rows for the selected range." },
  );

  renderTable(
    "consumption-monthly-table",
    [
      {
        key: "month_start",
        label: "Month",
        render: (row) => formatDate(row.month_start),
      },
      {
        key: "total_output",
        label: "Output",
        render: (row) => formatNumber(row.total_output),
      },
      {
        key: "total_wastage",
        label: "Wastage",
        render: (row) => formatNumber(row.total_wastage),
      },
    ],
    monthlyRows,
    { emptyMessage: "No monthly output rows for the selected range." },
  );

  renderTable(
    "consumption-wastage-table",
    [
      {
        key: "record_date",
        label: "Date",
        render: (row) => formatDate(row.record_date),
      },
      { key: "product_name", label: "Product" },
      {
        key: "quantity",
        label: "Quantity",
        render: (row) => formatNumber(row.quantity),
      },
      {
        key: "wastage_value",
        label: "Value",
        render: (row) => formatCurrency(row.wastage_value),
      },
    ],
    wastageRows,
    { emptyMessage: "No wastage records for the selected range." },
  );

  state.moduleData.consumption = {
    products: productRows,
    variance: varianceRows,
    daily: dailyRows,
    weekly: weeklyRows,
    monthly: monthlyRows,
    wastage: wastageRows,
  };

  if (secondaryTarget) {
    secondaryTarget.innerHTML = "";
    if (activeTab === "overview" || activeTab === "trends") {
      secondaryTarget.innerHTML =
        `<div class="two-column workspace-chart-grid">` +
        `<article class="panel chart-panel"><div class="panel-header"><div><p class="eyebrow">Trend</p><h3>Consumption Trend</h3></div></div><div id="workspace-consumption-trend" class="chart-canvas"></div></article>` +
        `<article class="panel chart-panel"><div class="panel-header"><div><p class="eyebrow">Mix</p><h3>Top Products</h3></div></div><div id="workspace-consumption-donut" class="donut-layout"></div></article>` +
        `</div>`;
      renderTrendChart("workspace-consumption-trend", dailyRows);
      renderDonutChart(
        "workspace-consumption-donut",
        productRows.map((row) => ({
          name: row.product_name,
          total_issued: row.consumed_quantity,
        })),
      );
    }
  }

  if (activeTab === "variance") {
    renderTable(
      "consumption-products-table",
      [
        { key: "product_name", label: "Product" },
        {
          key: "actual_usage",
          label: "Recorded usage",
          render: (row) => formatNumber(row.actual_usage),
        },
        {
          key: "variance_quantity",
          label: "Variance",
          render: (row) => formatNumber(row.variance_quantity),
        },
      ],
      varianceRows,
      {
        emptyMessage: "No variance rows for the selected range.",
        pageKey: "consumption-variance-main",
      },
    );
  } else if (activeTab === "waste analysis") {
    renderTable(
      "consumption-products-table",
      [
        {
          key: "record_date",
          label: "Date",
          render: (row) => formatDate(row.record_date),
        },
        { key: "product_name", label: "Product" },
        {
          key: "quantity",
          label: "Quantity",
          render: (row) => formatNumber(row.quantity),
        },
        {
          key: "wastage_value",
          label: "Value",
          render: (row) => formatCurrency(row.wastage_value),
        },
      ],
      wastageRows,
      {
        emptyMessage: "No wastage rows for the selected range.",
        pageKey: "consumption-waste-main",
      },
    );
  } else if (activeTab === "trends") {
    renderTable(
      "consumption-products-table",
      [
        {
          key: "report_date",
          label: "Day",
          render: (row) => formatDate(row.report_date),
        },
        {
          key: "total_output",
          label: "Output",
          render: (row) => formatNumber(row.total_output),
        },
        {
          key: "total_wastage",
          label: "Wastage",
          render: (row) => formatNumber(row.total_wastage),
        },
      ],
      dailyRows,
      {
        emptyMessage: "No daily trend rows for the selected range.",
        pageKey: "consumption-trends-main",
      },
    );
    if (secondaryTarget) {
      secondaryTarget.insertAdjacentHTML(
        "beforeend",
        `<div class="stack-space" id="workspace-consumption-periods"></div>`,
      );
      renderTable(
        "workspace-consumption-periods",
        [
          {
            key: "week_start",
            label: "Week / Month Start",
            render: (row) => formatDate(row.week_start || row.month_start),
          },
          {
            key: "total_output",
            label: "Output",
            render: (row) => formatNumber(row.total_output),
          },
          {
            key: "total_wastage",
            label: "Wastage",
            render: (row) => formatNumber(row.total_wastage),
          },
        ],
        [...weeklyRows, ...monthlyRows],
        {
          emptyMessage: "No weekly or monthly trend rows.",
          pageKey: "consumption-periods",
        },
      );
    }
  } else {
    renderTable(
      "consumption-products-table",
      [
        { key: "product_name", label: "Product" },
        {
          key: "purchased_quantity",
          label: "Purchased",
          render: (row) => formatNumber(row.purchased_quantity),
        },
        {
          key: "issued_quantity",
          label: "Issued",
          render: (row) => formatNumber(row.issued_quantity),
        },
        {
          key: "returned_quantity",
          label: "Returned",
          render: (row) => formatNumber(row.returned_quantity),
        },
        {
          key: "wastage_quantity",
          label: "Wastage",
          render: (row) => formatNumber(row.wastage_quantity),
        },
        {
          key: "consumed_quantity",
          label: "Consumed",
          render: (row) => formatNumber(row.consumed_quantity),
        },
        {
          key: "remaining_quantity",
          label: "Remaining",
          render: (row) => formatNumber(row.remaining_quantity),
        },
        {
          key: "consumption_per_unit",
          label: "Per Unit",
          render: (row) => formatNumber(row.consumption_per_unit, 4),
        },
      ],
      productRows,
      {
        emptyMessage: "No consumption records in the selected range.",
        pageKey: "consumption-products-main",
      },
    );
  }
}

function renderTrendChart(targetId, rows) {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }
  if (!rows?.length) {
    target.innerHTML =
      '<div class="state-card empty-state">No trend data yet.</div>';
    return;
  }

  const points = rows.slice(0, 7).map((row) => Number(row.total_output || 0));
  const max = Math.max(...points, 1);
  const stepX = points.length > 1 ? 240 / (points.length - 1) : 240;
  const polyline = points
    .map((point, index) => `${24 + index * stepX},${180 - (point / max) * 120}`)
    .join(" ");

  target.innerHTML =
    `<svg viewBox="0 0 320 220" class="trend-svg" role="img" aria-label="Consumption trend">` +
    `<path d="M24 180 H296" class="chart-axis"></path>` +
    `<path d="M24 60 V180" class="chart-axis"></path>` +
    `<polyline points="${polyline}" class="chart-line"></polyline>` +
    points
      .map((point, index) => {
        const x = 24 + index * stepX;
        const y = 180 - (point / max) * 120;
        return `<circle cx="${x}" cy="${y}" r="4" class="chart-point"></circle>`;
      })
      .join("") +
    `</svg>`;
}

function renderDonutChart(targetId, rows) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const ranked = (rows || [])
    .filter((row) => Number(row.total_issued) > 0)
    .sort((a, b) => Number(b.total_issued) - Number(a.total_issued))
    .slice(0, 5);
  target.classList.remove("donut-layout");
  if (!ranked.length) {
    target.innerHTML =
      '<div class="empty-state">No product consumption data yet.</div>';
    return;
  }
  const max = Number(ranked[0].total_issued);
  target.innerHTML =
    '<div class="product-ranking">' +
    ranked
      .map(
        (row) =>
          '<div class="ranking-row"><div><span>' +
          escapeHtml(row.name) +
          "</span><strong>" +
          formatNumber(row.total_issued) +
          '</strong></div><div class="ranking-track" aria-hidden="true"><span style="width:' +
          (Number(row.total_issued) / max) * 100 +
          '%"></span></div></div>',
      )
      .join("") +
    "</div>";
}

function getReportCards() {
  const catalog = state.moduleData.reports?.catalog || [];
  if (catalog.length) {
    return catalog.map((entry) => ({
      key: entry.type,
      title: entry.title,
      summary: entry.description,
      tabs: entry.tabs || [entry.category, "management"],
      periodRequired: entry.periodRequired !== false,
    }));
  }
  return [
    {
      key: "operational",
      title: "Operational Snapshot",
      summary: "Active contracts, pending procurement, and kitchen activity.",
      tabs: ["operational", "management"],
    },
    {
      key: "inventory",
      title: "Inventory Health",
      summary: "Current store balances, low stock, and expiring batches.",
      tabs: ["inventory", "management"],
    },
    {
      key: "procurement",
      title: "Procurement Pipeline",
      summary: "Purchase requisitions and purchase orders.",
      tabs: ["procurement", "management"],
    },
    {
      key: "purchases",
      title: "Purchase Report (LPO / PO)",
      summary: "Purchase orders and LPOs with suppliers, values, and status.",
      tabs: ["procurement", "finance", "management"],
    },
    {
      key: "cash-requisitions",
      title: "Cash Requisition Report",
      summary: "Cash requests, payees, amounts, release, and settlement.",
      tabs: ["finance", "procurement", "management"],
    },
    {
      key: "all-purchases",
      title: "All Purchases",
      summary: "Combined purchases from LPOs/POs and cash requisitions.",
      tabs: ["finance", "procurement", "management"],
    },
    {
      key: "finance",
      title: "Supplier Payables",
      summary: "Supplier invoices, payments, and aging.",
      tabs: ["finance", "management"],
    },
    {
      key: "contracts",
      title: "Contract Demand Outlook",
      summary: "Active and upcoming contracts with expected demand.",
      tabs: ["contracts", "management"],
    },
    {
      key: "production",
      title: "Production Batches",
      summary: "Planned versus actual output and recorded wastage.",
      tabs: ["production", "management"],
    },
  ];
}

function renderReports() {
  const activeTab = getActiveWorkspace("reports");
  configureWorkspaceChrome("reports", {
    eyebrow: "Reports",
    title: titleCaseWords(activeTab),
    description:
      "Each report category behaves like a focused reporting workspace with preview and export actions.",
    searchPlaceholder: "Search reports...",
    actions: [
      { type: "reset", label: "Reset" },
      {
        type: "quick-action",
        label: "Export guide",
        quickAction: "show-report-help",
        className: "refresh-btn",
      },
    ],
  });

  const cards = getReportCards().filter((card) => {
    const search = state.filters.reports.search;
    const tab = state.filters.reports.tab || "operational";
    const searchMatch =
      !search ||
      card.title.toLowerCase().includes(search.toLowerCase()) ||
      String(card.summary || "")
        .toLowerCase()
        .includes(search.toLowerCase());
    const tabMatch = (card.tabs || [card.key, "management"]).includes(tab);
    return searchMatch && tabMatch;
  });

  const target = document.getElementById("reports-grid");
  if (!cards.length) {
    target.innerHTML =
      '<div class="state-card empty-state">No reports match the current category or search.</div>';
    return;
  }
  target.innerHTML = cards
    .map(
      (card) =>
        `<article class="report-card">` +
        `<h4>${escapeHtml(card.title)}</h4>` +
        `<p>${escapeHtml(card.summary)}</p>` +
        renderActionButtons([
          { entity: "report", id: card.key, label: "Preview", action: "preview", primary: true },
          { entity: "report", id: card.key, label: "PDF", action: "pdf" },
          { entity: "report", id: card.key, label: "Excel", action: "excel" },
          { entity: "report", id: card.key, label: "CSV", action: "export" },
        ]) +
        `</article>`,
    )
    .join("");
}

function buildReportExportUrl(type, format) {
  const range = getReportRange();
  const params = new URLSearchParams({
    type,
    format,
    startDate: range.startDate,
    endDate: range.endDate,
  });
  return `/api/reports/export?${params.toString()}`;
}

async function fetchReportData(type) {
  const range = getReportRange();
  const params = new URLSearchParams({
    startDate: range.startDate,
    endDate: range.endDate,
  });
  const response = await api(`/api/reports/${encodeURIComponent(type)}?${params.toString()}`);
  return response.data;
}

async function loadReports() {
  const catalogResponse = await api("/api/reports/catalog");
  state.moduleData.reports = {
    catalog: catalogResponse.data || [],
  };
  syncReportPeriodControls();
  renderReports();
}

function renderSuppliers() {
  const supplierRows = (state.moduleData.suppliers?.suppliers || []).filter(
    (row) =>
      matchesSearch(row, state.filters.suppliers.search, [
        "name",
        "payment_terms",
        "status",
      ]),
  );
  const invoiceRows = state.moduleData.suppliers?.invoices || [];
  const totalSuppliers = supplierRows.length;
  const supplierBalances = sumBy(supplierRows, (row) => row.balance_due);
  const activeTerms = supplierRows.filter((row) => row.payment_terms).length;
  const invoiceCount = invoiceRows.length;

  configureWorkspaceChrome("suppliers", {
    eyebrow: "Suppliers",
    title: "Supplier Directory",
    description:
      "Maintain vendor records and review supplier exposure without mixing supplier setup into other workspaces.",
    searchPlaceholder: "Search suppliers...",
    actions: [
      { type: "reset", label: "Reset" },
      { type: "export", label: "Export CSV" },
      {
        type: "open-form",
        label: "New Supplier",
        formId: "supplier-form",
        className: "refresh-btn",
        reset: true,
      },
    ],
  });

  renderMetricGrid("suppliers-metrics", [
    {
      label: "Total Suppliers",
      value: formatNumber(totalSuppliers),
      note: "Approved vendors",
      tone: "green",
      icon: "SP",
    },
    {
      label: "Supplier Payables",
      value: formatCurrency(supplierBalances),
      note: "Open balances",
      tone: "violet",
      icon: "AP",
    },
    {
      label: "Terms Configured",
      value: formatNumber(activeTerms),
      note: "Payment terms on file",
      tone: "blue",
      icon: "TM",
    },
    {
      label: "Invoices Recorded",
      value: formatNumber(invoiceCount),
      note: "Vendor billing documents",
      tone: "amber",
      icon: "IV",
    },
  ]);

  renderTable(
    "suppliers-table",
    [
      { key: "name", label: "Supplier" },
      { key: "payment_terms", label: "Terms" },
      {
        key: "balance_due",
        label: "Balance",
        render: (row) => formatCurrency(row.balance_due),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) =>
          renderActionButtons([
            { entity: "supplier", id: row.id, label: "View", action: "view" },
            { entity: "supplier", id: row.id, label: "Edit", action: "edit" },
          ]),
      },
    ],
    supplierRows,
    { emptyMessage: "No suppliers match the current filter." },
  );

  renderTable(
    "suppliers-product-preview",
    [
      { key: "name", label: "Product" },
      {
        key: "default_supplier_name",
        label: "Default Supplier",
        render: (row) => escapeHtml(row.default_supplier_name || "Unassigned"),
      },
      {
        key: "standard_cost",
        label: "Cost",
        render: (row) => formatCurrency(row.standard_cost),
      },
    ],
    (state.moduleData.masterData?.products || [])
      .filter((row) => row.default_supplier_name)
      .slice(0, 12),
    { emptyMessage: "No products are currently linked to default suppliers." },
  );

  setExportState(
    "suppliers",
    "suppliers.csv",
    [
      { label: "Supplier", key: "name" },
      { label: "Payment Terms", key: "payment_terms" },
      { label: "Balance", key: "balance_due" },
    ],
    supplierRows,
  );
}

async function loadSuppliers() {
  renderPlaceholder("suppliers-table", "Loading suppliers...");
  const [suppliersResponse, invoicesResponse] = await Promise.all([
    api("/api/master-data/suppliers"),
    api("/api/procurement/supplier-invoices"),
  ]);
  state.moduleData.suppliers = {
    suppliers: suppliersResponse.data || [],
    invoices: invoicesResponse.data || [],
  };
  renderSuppliers();
}

function renderConfigurationFormField(field, value) {
  if (field.type === "textarea") {
    return `<label class="full-span">${escapeHtml(field.label)}<textarea name="${escapeHtml(field.key)}">${escapeHtml(value ?? "")}</textarea></label>`;
  }
  if (field.type === "checkbox") {
    return `<label>${escapeHtml(field.label)}<input name="${escapeHtml(field.key)}" type="checkbox" ${value !== false ? "checked" : ""} /></label>`;
  }
  if (field.type === "select") {
    const options = (field.options || [])
      .map((option) => {
        const optionValue = typeof option === "string" ? option : option.value;
        const optionLabel = typeof option === "string" ? option : option.label;
        return `<option value="${escapeHtml(optionValue)}" ${String(value ?? "") === String(optionValue) ? "selected" : ""}>${escapeHtml(
          optionLabel,
        )}</option>`;
      })
      .join("");
    return `<label>${escapeHtml(field.label)}<select name="${escapeHtml(field.key)}">${options}</select></label>`;
  }
  return `<label>${escapeHtml(field.label)}<input name="${escapeHtml(field.key)}" type="${escapeHtml(field.type || "text")}" value="${escapeHtml(
    value ?? "",
  )}" ${field.required ? "required" : ""} /></label>`;
}

function prepareConfigurationForm(type, row = null) {
  const form = document.getElementById("configuration-form");
  const fieldHost = document.getElementById("configuration-form-fields");
  const definition =
    (state.moduleData.configurations?.definitions || []).find(
      (entry) => entry.key === type,
    ) ||
    (type === "approval-workflows"
      ? {
          label: "Approval Matrix",
          description:
            "Define approval levels, required roles, amount bands, and creator-approval boundaries.",
        }
      : null);
  if (!form || !fieldHost) {
    return;
  }

  form.querySelector('[name="type"]').value = type;
  form.querySelector('[name="id"]').value = row?.id || "";
  fieldHost.innerHTML = (configurationFormFieldMap[type] || [])
    .map((field) => renderConfigurationFormField(field, row?.[field.key]))
    .join("");

  document.getElementById("form-modal-kicker").textContent = "Configurations";
  document.getElementById("form-modal-title").textContent = row?.id
    ? `Edit ${definition?.label || titleCaseWords(type)}`
    : `Create ${definition?.label || titleCaseWords(type)}`;
  document.getElementById("form-modal-copy").textContent =
    definition?.description ||
    "Create or update a reusable configuration item.";
}

const CONFIG_HARD_DELETE_TYPES = new Set([
  "units",
  "product-categories",
  "stores",
  "departments",
]);

function getConfigurationColumns(type) {
  const actionColumn = {
    key: "actions",
    label: "Actions",
    render: (row) => {
      const buttons = [
        {
          entity: "configuration",
          id: row.id,
          type: type,
          label: "Edit",
          action: "edit",
          primary: true,
        },
      ];
      if (CONFIG_HARD_DELETE_TYPES.has(type)) {
        buttons.push({
          entity: "configuration",
          id: row.id,
          type: type,
          label: "Delete",
          action: "delete",
        });
      } else {
        buttons.push({
          entity: "configuration",
          id: row.id,
          type: type,
          label: row.is_active ? "Deactivate" : "Activate",
          action: "toggle",
        });
      }
      return renderActionButtons(buttons);
    },
  };
  const activeColumn = {
    key: "is_active",
    label: "Status",
    render: (row) => renderStatusBadge(row.is_active ? "Active" : "Inactive"),
  };

  const columnMap = {
    units: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "description", label: "Description" },
      activeColumn,
      actionColumn,
    ],
    "product-categories": [
      { key: "name", label: "Category" },
      { key: "description", label: "Description" },
      activeColumn,
      actionColumn,
    ],
    stores: [
      { key: "name", label: "Store" },
      { key: "location_type", label: "Type" },
      { key: "description", label: "Description" },
      activeColumn,
      actionColumn,
    ],
    departments: [
      { key: "code", label: "Code" },
      { key: "name", label: "Department" },
      { key: "description", label: "Description" },
      activeColumn,
      actionColumn,
    ],
    statuses: [
      { key: "status_name", label: "Status" },
      { key: "status_code", label: "Code" },
      { key: "module_key", label: "Module" },
      {
        key: "color",
        label: "Color",
        render: (row) =>
          `<span class="status-badge configured" style="background:${escapeHtml(hexToRgba(row.color, 0.14))};color:${escapeHtml(row.color)};border:1px solid ${escapeHtml(hexToRgba(row.color, 0.2))}">${escapeHtml(row.color)}</span>`,
      },
      {
        key: "is_terminal",
        label: "Terminal",
        render: (row) => (row.is_terminal ? "Yes" : "No"),
      },
      activeColumn,
      actionColumn,
    ],
    "numbering-series": [
      { key: "document_type", label: "Document" },
      { key: "prefix", label: "Prefix" },
      { key: "current_number", label: "Current Number" },
      { key: "padding_length", label: "Padding" },
      { key: "reset_frequency", label: "Reset" },
      activeColumn,
      actionColumn,
    ],
    "approval-workflows": [
      { key: "workflow_name", label: "Workflow" },
      { key: "document_type", label: "Document" },
      { key: "required_role", label: "Role" },
      { key: "approval_level", label: "Level" },
      {
        key: "min_amount",
        label: "Min Amount",
        render: (row) => formatCurrency(row.min_amount || 0),
      },
      {
        key: "max_amount",
        label: "Max Amount",
        render: (row) => formatCurrency(row.max_amount || 0),
      },
      {
        key: "can_creator_approve",
        label: "Creator Approval",
        render: (row) => (row.can_creator_approve ? "Allowed" : "Blocked"),
      },
      activeColumn,
      actionColumn,
    ],
    "payment-terms": [
      { key: "name", label: "Term" },
      { key: "days_due", label: "Days Due" },
      { key: "description", label: "Description" },
      activeColumn,
      actionColumn,
    ],
    "delivery-types": [
      { key: "code", label: "Code" },
      { key: "name", label: "Delivery Type" },
      { key: "description", label: "Description" },
      activeColumn,
      actionColumn,
    ],
    "expense-categories": [
      { key: "code", label: "Code" },
      { key: "name", label: "Category" },
      { key: "description", label: "Description" },
      activeColumn,
      actionColumn,
    ],
    "tax-settings": [
      { key: "tax_name", label: "Tax" },
      {
        key: "tax_rate",
        label: "Rate",
        render: (row) => `${formatNumber(Number(row.tax_rate || 0) * 100)}%`,
      },
      {
        key: "applies_to_purchases",
        label: "Purchases",
        render: (row) => (row.applies_to_purchases ? "Yes" : "No"),
      },
      {
        key: "applies_to_sales",
        label: "Sales",
        render: (row) => (row.applies_to_sales ? "Yes" : "No"),
      },
      activeColumn,
      actionColumn,
    ],
    "notification-rules": [
      { key: "rule_name", label: "Rule" },
      { key: "trigger_type", label: "Trigger" },
      { key: "threshold_value", label: "Threshold" },
      { key: "recipient_role", label: "Recipient Role" },
      activeColumn,
      actionColumn,
    ],
  };

  return (
    columnMap[type] || [
      { key: "name", label: "Name" },
      activeColumn,
      actionColumn,
    ]
  );
}

function ensureConfigurationTypeStrip() {
  const panel = ensureWorkspacePrimaryPanel("configurations");
  if (!panel) {
    return null;
  }

  let strip = panel.querySelector(".configuration-type-strip");
  if (!strip) {
    strip = document.createElement("div");
    strip.className = "configuration-type-strip";
    panel
      .querySelector(".search-filter-bar")
      ?.insertAdjacentElement("beforebegin", strip);
  }
  return strip;
}

function renderConfigurationsWorkspace() {
  const activeGroup = getActiveConfigurationGroup();
  const activeTab = getActiveConfigurationType();
  const group = getConfigurationGroup(activeGroup);
  const definition =
    (state.moduleData.configurations?.definitions || []).find(
      (entry) => entry.key === activeTab,
    ) || workspaceTabs.configurations.find((entry) => entry.key === activeTab);
  const rows = state.moduleData.configurations?.rowsByType?.[activeTab] || [];
  const auditRows =
    state.moduleData.configurations?.auditByType?.[activeTab] || [];
  const search = state.filters.configurations?.search || "";
  const filteredRows = rows.filter((row) =>
    Object.values(row || {}).some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
  );

  configureWorkspaceChrome("configurations", {
    eyebrow: "Configurations",
    title: definition?.label || "Configurations",
    description:
      definition?.description ||
      "Centralize reusable definitions across the ERP.",
    searchPlaceholder: `Search ${(definition?.label || "configurations").toLowerCase()}...`,
    actions: [
      { type: "reset", label: "Reset" },
      {
        type: "open-form",
        label: `New ${definition?.label || "Configuration"}`,
        formId: "configuration-form",
        className: "refresh-btn",
        reset: true,
      },
    ],
  });

  const strip = ensureConfigurationTypeStrip();
  if (strip) {
    strip.innerHTML = group.types
      .map((type) => {
        const label =
          (state.moduleData.configurations?.definitions || []).find(
            (entry) => entry.key === type,
          )?.label || titleCaseWords(type.replace(/-/g, " "));
        return `<button type="button" class="configuration-type-chip${type === activeTab ? " active" : ""}" data-config-type="${escapeHtml(type)}">${escapeHtml(label)}</button>`;
      })
      .join("");
  }

  renderTable(
    "configurations-table",
    getConfigurationColumns(activeTab),
    filteredRows,
    {
      emptyMessage: "No configuration rows match the current filter.",
      pageKey: `configurations-${activeTab}`,
    },
  );

  const summaryTarget = document.getElementById("configurations-summary");
  if (summaryTarget) {
    const activeCount = filteredRows.filter((row) => row.is_active).length;
    summaryTarget.innerHTML =
      `<div class="detail-grid">` +
      `<div class="detail-field"><span>Area</span><strong>${escapeHtml(definition?.label || activeTab)}</strong></div>` +
      `<div class="detail-field"><span>Used For</span><strong>${escapeHtml(definition?.description || "Reusable system setup for this workspace.")}</strong></div>` +
      `<div class="detail-field"><span>Total Rows</span><strong>${escapeHtml(filteredRows.length)}</strong></div>` +
      `<div class="detail-field"><span>Active Rows</span><strong>${escapeHtml(activeCount)}</strong></div>` +
      `<div class="detail-field"><span>Inactive Rows</span><strong>${escapeHtml(filteredRows.length - activeCount)}</strong></div>` +
      `</div>`;
  }

  renderTable(
    "configurations-audit-table",
    [
      {
        key: "created_at",
        label: "When",
        render: (row) => formatDateTime(row.created_at),
      },
      { key: "actor_name", label: "Actor" },
      { key: "action", label: "Action" },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
    ],
    auditRows,
    {
      emptyMessage: "No recent configuration changes for this tab.",
      pageKey: `config-audit-${activeTab}`,
    },
  );

  setExportState(
    "configurations",
    `configurations-${activeTab}.csv`,
    getConfigurationColumns(activeTab).filter(
      (column) => column.key !== "actions",
    ),
    filteredRows,
  );
}

function renderConfigurationsError(message) {
  renderMetricGrid("configurations-metrics", [
    {
      label: "Areas",
      value: "0",
      note: "Configuration service unavailable",
      tone: "red",
      icon: "CF",
    },
    {
      label: "Rows",
      value: "0",
      note: "No data loaded",
      tone: "blue",
      icon: "RW",
    },
    {
      label: "Active",
      value: "0",
      note: "No reusable setup loaded",
      tone: "amber",
      icon: "AC",
    },
    {
      label: "Statuses",
      value: "0",
      note: "Status setup unavailable",
      tone: "violet",
      icon: "ST",
    },
  ]);

  renderTable(
    "configurations-table",
    [{ key: "message", label: "Configurations" }],
    [],
    {
      error: `${message} The live server is not exposing the current configurations API.`,
    },
  );
  renderTable(
    "configurations-audit-table",
    [{ key: "message", label: "Audit" }],
    [],
    {
      error: "Configuration audit history could not be loaded.",
    },
  );

  const summaryTarget = document.getElementById("configurations-summary");
  if (summaryTarget) {
    summaryTarget.innerHTML =
      `<div class="state-card empty-state">` +
      `Configurations are used to manage reusable ERP setup such as units, stores, statuses, approval rules, numbering, payment terms, and alerts. ` +
      `This workspace cannot load until the running server is restarted with the current code.` +
      `</div>`;
  }
}

async function loadConfigurations() {
  try {
    const activeTab = getActiveConfigurationType();
    const [bundleResponse, detailResponse] = await Promise.all([
      api("/api/configurations"),
      api(`/api/configurations/${activeTab}`),
    ]);
    const rowsByType = bundleResponse.data.rowsByType || {};
    rowsByType[activeTab] =
      detailResponse.data.rows || rowsByType[activeTab] || [];

    state.moduleData.configurations = {
      definitions: bundleResponse.data.definitions || [],
      types: bundleResponse.data.types || [],
      rowsByType,
      auditByType: {
        ...(state.moduleData.configurations?.auditByType || {}),
        [activeTab]: detailResponse.data.auditTrail || [],
      },
    };

    const allRows = Object.values(rowsByType).flat();
    renderMetricGrid("configurations-metrics", [
      {
        label: "Areas",
        value: formatNumber((bundleResponse.data.types || []).length),
        note: "Configuration tabs available",
        tone: "green",
        icon: "CF",
      },
      {
        label: "Rows",
        value: formatNumber(allRows.length),
        note: "Reusable system definitions",
        tone: "blue",
        icon: "RW",
      },
      {
        label: "Active",
        value: formatNumber(allRows.filter((row) => row.is_active).length),
        note: "Available to workflows",
        tone: "amber",
        icon: "AC",
      },
      {
        label: "Statuses",
        value: formatNumber((rowsByType.statuses || []).length),
        note: "Central status definitions",
        tone: "violet",
        icon: "ST",
      },
    ]);

    renderConfigurationsWorkspace();
  } catch (error) {
    renderConfigurationsError(error.message);
    throw error;
  }
}

function renderApprovalMatrixWorkspace() {
  const rows = state.moduleData.approvalMatrix?.rows || [];
  const auditRows = state.moduleData.approvalMatrix?.audit || [];
  const search = state.filters["approval-matrix"]?.search || "";
  const filteredRows = rows.filter((row) =>
    Object.values(row || {}).some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
  );

  configureWorkspaceChrome("approval-matrix", {
    eyebrow: "Administration",
    title: "Approval Matrix",
    description:
      "Set who can approve each transaction, at which level, and within which amount band.",
    searchPlaceholder: "Search approval rules...",
    actions: [
      { type: "reset", label: "Reset" },
      {
        type: "open-form",
        label: "New Approval Rule",
        formId: "configuration-form",
        className: "refresh-btn",
        reset: true,
        title: "New Approval Rule",
      },
    ],
  });

  renderTable(
    "approval-matrix-table",
    getConfigurationColumns("approval-workflows"),
    filteredRows,
    {
      emptyMessage: "No approval rules match the current filter.",
      pageKey: "approval-matrix",
    },
  );

  const activeCount = filteredRows.filter((row) => row.is_active).length;
  const creatorBlockedCount = filteredRows.filter(
    (row) => !row.can_creator_approve,
  ).length;
  renderMetricGrid("approval-matrix-metrics", [
    {
      label: "Rules",
      value: formatNumber(filteredRows.length),
      note: "Matching approval rules",
      tone: "blue",
      icon: "AR",
    },
    {
      label: "Active",
      value: formatNumber(activeCount),
      note: "Rules currently enforced",
      tone: "green",
      icon: "ON",
    },
    {
      label: "Creator Blocked",
      value: formatNumber(creatorBlockedCount),
      note: "Requests require another approver",
      tone: "amber",
      icon: "CB",
    },
    {
      label: "Approval Levels",
      value: formatNumber(
        new Set(filteredRows.map((row) => row.approval_level)).size,
      ),
      note: "Levels represented",
      tone: "violet",
      icon: "LV",
    },
  ]);

  const summaryTarget = document.getElementById("approval-matrix-summary");
  if (summaryTarget) {
    summaryTarget.innerHTML =
      `<div class="detail-grid">` +
      `<div class="detail-field"><span>Scope</span><strong>ERP transaction approvals</strong></div>` +
      `<div class="detail-field"><span>Active Rules</span><strong>${escapeHtml(activeCount)}</strong></div>` +
      `<div class="detail-field"><span>Creator Approval</span><strong>${escapeHtml(filteredRows.length - creatorBlockedCount)} allowed</strong></div>` +
      `<div class="detail-field"><span>Review</span><strong>Changes are audited</strong></div>` +
      `</div>`;
  }

  renderTable(
    "approval-matrix-audit-table",
    [
      {
        key: "created_at",
        label: "When",
        render: (row) => formatDateTime(row.created_at),
      },
      { key: "actor_name", label: "Actor" },
      { key: "action", label: "Action" },
      {
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
    ],
    auditRows,
    {
      emptyMessage: "No recent approval matrix changes.",
      pageKey: "approval-matrix-audit",
    },
  );

  setExportState(
    "approval-matrix",
    "approval-matrix.csv",
    getConfigurationColumns("approval-workflows").filter(
      (column) => column.key !== "actions",
    ),
    filteredRows,
  );
}

function renderApprovalMatrixError(message) {
  renderMetricGrid("approval-matrix-metrics", [
    {
      label: "Rules",
      value: "0",
      note: "Approval matrix unavailable",
      tone: "red",
      icon: "AM",
    },
    {
      label: "Active",
      value: "0",
      note: "No rules loaded",
      tone: "blue",
      icon: "ON",
    },
  ]);
  renderTable(
    "approval-matrix-table",
    [{ key: "message", label: "Approval Matrix" }],
    [],
    { error: message },
  );
  renderTable(
    "approval-matrix-audit-table",
    [{ key: "message", label: "Audit" }],
    [],
    { error: "Approval matrix audit history could not be loaded." },
  );
}

async function loadApprovalMatrix() {
  try {
    renderPlaceholder("approval-matrix-table", "Loading approval matrix...");
    const response = await api("/api/configurations/approval-workflows");
    const rows = response.data.rows || [];
    const audit = response.data.auditTrail || [];
    state.moduleData.approvalMatrix = {
      definition: response.data.definition,
      rows,
      audit,
    };
    state.moduleData.configurations = {
      ...(state.moduleData.configurations || {}),
      definitions: [
        ...(state.moduleData.configurations?.definitions || []).filter(
          (entry) => entry.key !== "approval-workflows",
        ),
        response.data.definition,
      ].filter(Boolean),
      rowsByType: {
        ...(state.moduleData.configurations?.rowsByType || {}),
        "approval-workflows": rows,
      },
      auditByType: {
        ...(state.moduleData.configurations?.auditByType || {}),
        "approval-workflows": audit,
      },
    };
    renderApprovalMatrixWorkspace();
  } catch (error) {
    renderApprovalMatrixError(error.message);
    throw error;
  }
}
function renderUserRoleOptions(targetId, selected = []) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const roles = state.moduleData.settings?.roles || [];
  target.innerHTML = roles.map((role) =>
    '<label class="user-role-option"><input type="checkbox" name="roleCodes" value="' + escapeHtml(role.code) + '" ' + (selected.includes(role.code) ? 'checked' : '') + ' /><span>' + escapeHtml(role.name) + '</span></label>'
  ).join("");
}

function userRoleNames(codes) {
  const roles = state.moduleData.settings?.roles || [];
  return (codes || []).map((code) => roles.find((role) => role.code === code)?.name || titleCaseWords(code)).join(", ");
}

function renderSettingsWorkspace() {
  const activeTab = getActiveWorkspace("settings");
  const search = state.filters.settings?.search || "";
  const users = state.moduleData.settings?.users || [];
  const roles = state.moduleData.settings?.roles || [];
  const auditRows = state.moduleData.settings?.audit || [];

  configureWorkspaceChrome("settings", {
    eyebrow: "Settings",
    title: activeTab === "audit" ? "Audit Trail" : titleCaseWords(activeTab),
    description:
      "Administration workspaces keep user management, role review, and audit history separated from transactional screens.",
    searchPlaceholder:
      activeTab === "roles"
        ? "Search roles..."
        : activeTab === "audit"
          ? "Search audit events..."
          : "Search users...",
    actions:
      activeTab === "users"
        ? [
            { type: "reset", label: "Reset" },
            {
              type: "open-form",
              label: "Create User",
              formId: "user-form",
              className: "refresh-btn",
              reset: true,
            },
          ]
        : [
            { type: "reset", label: "Reset" },
            { type: "refresh", label: "Reload" },
          ],
  });

  if (activeTab === "roles") {
    renderTable(
      "audit-table",
      [
        { key: "name", label: "Role" },
        { key: "description", label: "Description" },
        { key: "user_count", label: "Users" },
      ],
      roles.filter((row) =>
        matchesSearch(row, search, ["name", "description"]),
      ),
      {
        emptyMessage: "No roles match the current filter.",
        pageKey: "settings-roles",
      },
    );
    return;
  }

  if (activeTab === "audit") {
    renderTable(
      "audit-table",
      [
        {
          key: "created_at",
          label: "When",
          render: (row) => formatDateTime(row.created_at),
        },
        { key: "actor_name", label: "Actor" },
        { key: "action", label: "Action" },
        { key: "entity_type", label: "Entity" },
        {
          key: "status",
          label: "Status",
          render: (row) => renderStatusBadge(row.status),
        },
      ],
      auditRows.filter((row) =>
        matchesSearch(row, search, [
          "actor_name",
          "action",
          "entity_type",
          "status",
        ]),
      ),
      {
        emptyMessage: "No audit events match the current filter.",
        pageKey: "settings-audit",
      },
    );
    return;
  }

  renderTable(
    "audit-table",
    [
      { key: "full_name", label: "Name" },
      { key: "username", label: "Username" },
      { key: "email", label: "Email" },
      {
        key: "roles",
        label: "Roles",
        render: (row) => escapeHtml(userRoleNames(row.roles)),
      },
      {
        key: "actions", label: "Actions",
        render: (row) => '<button type="button" class="ghost-btn slim-btn" data-edit-user-roles="' + row.id + '">Edit roles</button>',
      },
    ],
    users.filter((row) =>
      matchesSearch(row, search, ["full_name", "username", "email"]),
    ),
    {
      emptyMessage: "No users match the current filter.",
      pageKey: "settings-users",
    },
  );
}


const APP_NAME = "Lefori";

function brandingLogoDataUri(profile = {}) {
  if (profile?.logoData && profile?.logoMimeType) {
    return `data:${profile.logoMimeType};base64,${profile.logoData}`;
  }
  return null;
}

function applyChromeBranding(profile = {}) {
  const uri = brandingLogoDataUri(profile);
  const marks = [document.getElementById("sidebar-brand-mark")].filter(Boolean);
  for (const mark of marks) {
    if (uri) {
      mark.classList.add("has-logo");
      mark.innerHTML = `<img src="${uri}" alt="">`;
    } else {
      mark.classList.remove("has-logo");
      mark.textContent = "L";
    }
  }
}

const BRANDING_LOGO_MAX_BYTES = 2_000_000;
let brandingLogoDraft = {
  logoData: null,
  logoMimeType: null,
  clearLogo: false,
};

function renderBrandingLogoPreview() {
  const preview = document.getElementById("branding-logo-preview");
  if (!preview) return;
  if (brandingLogoDraft.logoData && brandingLogoDraft.logoMimeType) {
    preview.innerHTML =
      '<img src="data:' +
      brandingLogoDraft.logoMimeType +
      ";base64," +
      brandingLogoDraft.logoData +
      '" alt="Business logo">';
    return;
  }
  preview.innerHTML = '<span class="branding-logo-empty">No logo</span>';
}

async function loadBusinessBranding() {
  const form = document.getElementById("business-branding-form");
  if (!form) return;

  const response = await api("/api/settings");
  const bundle = response.data || {};
  state.moduleData.settingsBundle = bundle;
  const profile = bundle.profile || {};

  form.businessName.value = profile.businessName || "";
  form.businessPhone.value = profile.businessPhone || "";
  form.businessLocation.value = profile.businessLocation || "";
  form.ownerEmail.value = profile.ownerEmail || "";
  form.businessType.value =
    profile.businessType === "restaurant" ? "restaurant" : "catering";

  brandingLogoDraft = {
    logoData: profile.logoData || null,
    logoMimeType: profile.logoMimeType || null,
    clearLogo: false,
  };
  renderBrandingLogoPreview();
    applyChromeBranding(profile);
  setFormStatus("branding-status", "");
}

async function saveBusinessBranding(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!hasRole("admin")) {
    setFormStatus("branding-status", "Only admins can update branding.", "error");
    return;
  }

  const profile = {
    businessName: form.businessName.value.trim(),
    businessPhone: form.businessPhone.value.trim(),
    businessLocation: form.businessLocation.value.trim(),
    ownerEmail: form.ownerEmail.value.trim(),
    businessType: form.businessType.value,
  };

  if (brandingLogoDraft.clearLogo) {
    profile.clearLogo = true;
    profile.logoData = null;
    profile.logoMimeType = null;
  } else if (brandingLogoDraft.logoData && brandingLogoDraft.logoMimeType) {
    profile.logoData = brandingLogoDraft.logoData;
    profile.logoMimeType = brandingLogoDraft.logoMimeType;
  }

  setFormStatus("branding-status", "Saving…", "info");
  try {
    const response = await api("/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        profile,
        settings: state.moduleData.settingsBundle?.settings || {},
      }),
    });
    state.moduleData.settingsBundle = response.data;
    const saved = response.data?.profile || {};
    brandingLogoDraft = {
      logoData: saved.logoData || null,
      logoMimeType: saved.logoMimeType || null,
      clearLogo: false,
    };
    renderBrandingLogoPreview();
    applyChromeBranding(saved);
    setFormStatus("branding-status", "Branding saved. Logo appears in the sidebar and on new exports.", "success");
    showToast("Business branding saved");
  } catch (error) {
    setFormStatus("branding-status", error.message, "error");
  }
}

function bindBusinessBrandingControls() {
  const form = document.getElementById("business-branding-form");
  const pick = document.getElementById("branding-logo-pick");
  const clear = document.getElementById("branding-logo-clear");
  const input = document.getElementById("branding-logo-input");
  if (!form || form.dataset.bound === "1") return;
  form.dataset.bound = "1";

  form.addEventListener("submit", saveBusinessBranding);
  pick?.addEventListener("click", () => input?.click());
  clear?.addEventListener("click", () => {
    brandingLogoDraft = { logoData: null, logoMimeType: null, clearLogo: true };
    if (input) input.value = "";
    renderBrandingLogoPreview();
    setFormStatus("branding-status", "Logo will be removed when you save.", "info");
  });
  input?.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) return;
    if (file.size > BRANDING_LOGO_MAX_BYTES) {
      setFormStatus("branding-status", "Logo must be under 2 MB.", "error");
      input.value = "";
      return;
    }
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setFormStatus("branding-status", "Use PNG, JPEG, WebP, or SVG.", "error");
      input.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        setFormStatus("branding-status", "Could not read that image.", "error");
        return;
      }
      brandingLogoDraft = {
        logoData: match[2],
        logoMimeType: match[1],
        clearLogo: false,
      };
      renderBrandingLogoPreview();
      setFormStatus("branding-status", "Logo ready — click Save branding.", "info");
    };
    reader.onerror = () => {
      setFormStatus("branding-status", "Could not read that image.", "error");
    };
    reader.readAsDataURL(file);
  });
}

async function loadSettings() {
  const [usersResponse, rolesResponse, auditResponse] = await Promise.all([
    api("/api/auth/users"),
    api("/api/auth/roles"),
    api("/api/audit").catch(() => ({ data: [] })),
  ]);
  renderMetricGrid("settings-metrics", [
    {
      label: "Users",
      value: formatNumber(usersResponse.data.length),
      note: "Active login accounts",
      tone: "green",
      icon: "US",
    },
    {
      label: "Roles",
      value: formatNumber(rolesResponse.data.length),
      note: "Permission groups",
      tone: "blue",
      icon: "RL",
    },
    {
      label: "Admin Users",
      value: formatNumber(
        usersResponse.data.filter((row) => (row.roles || []).includes("admin"))
          .length,
      ),
      note: "Full-access accounts",
      tone: "amber",
      icon: "AD",
    },
    {
      label: "Audit Events",
      value: formatNumber(auditResponse.data.length),
      note: "Tracked actions",
      tone: "violet",
      icon: "AU",
    },
  ]);

  state.moduleData.settings = {
    users: usersResponse.data,
    roles: rolesResponse.data,
    audit: auditResponse.data || [],
  };

  await loadSecurity();
  await loadAudit();
  bindBusinessBrandingControls();
  await loadBusinessBranding().catch((error) => {
    setFormStatus("branding-status", error.message, "error");
  });
  renderSettingsWorkspace();
}

async function loadAudit() {
  try {
    renderPlaceholder("audit-table", "Loading audit trail...");
    const response = await api("/api/audit");
    renderTable(
      "audit-table",
      [
        {
          key: "created_at",
          label: "When",
          render: (row) => formatDateTime(row.created_at),
        },
        { key: "actor_name", label: "Actor" },
        { key: "action", label: "Action" },
        { key: "entity_type", label: "Entity" },
        {
          key: "status",
          label: "Status",
          render: (row) => renderStatusBadge(row.status),
        },
      ],
      response.data,
    );
    state.moduleData.settings = {
      ...(state.moduleData.settings || {}),
      audit: response.data || [],
    };
  } catch (error) {
    renderTable("audit-table", [{ key: "message", label: "Audit" }], [], {
      error: error.message,
    });
  }
}

function showWorkspaceError(key, error) {
  const section = document.querySelector('.module[data-module="' + key + '"]');
  if (!section) return;
  section.querySelector(":scope > .workspace-error")?.remove();
  const banner = document.createElement("div");
  banner.className = "workspace-error permission-denied-state";
  banner.setAttribute("role", "alert");
  banner.innerHTML =
    "<span>" +
    escapeHtml(error.message) +
    '</span> <button type="button" class="ghost-btn slim-btn" data-load="' +
    key +
    '">Try again</button>';
  section.prepend(banner);
  section.querySelectorAll('[aria-busy="true"]').forEach((target) => {
    target.setAttribute("aria-busy", "false");
    target.innerHTML =
      '<div class="empty-state">This view could not be loaded. Use Try again to reload it.</div>';
  });
}
async function refreshAllData() {
  try {
    await loadReferenceData();
  } catch (error) {
    showToast(
      "Reference data could not be refreshed: " + error.message,
      "error",
    );
  }
  const loaders = [
    loadDashboard,
    ...(canAccessApprovalQueue() ? [loadApprovals] : []),
    loadMasterData,
    loadContracts,
    loadProcurement,
    loadInventory,
    loadKitchen,
    loadProduction,
    loadConsumption,
    loadReports,
    loadSuppliers,
    loadConfigurations,
    loadApprovalMatrix,
    loadSettings,
  ];
  for (const loader of loaders) {
    try {
      await loader();
    } catch (error) {
      const key = loader.name
        .replace(/^load/, "")
        .replace("ApprovalMatrix", "approval-matrix")
        .toLowerCase();
      showWorkspaceError(key, error);
    }
  }
}

function setFormBusy(form, busy) {
  form.dataset.busy = String(busy);
  form.setAttribute("aria-busy", String(busy));
  form.querySelectorAll("button").forEach((button) => {
    if (busy) {
      button.dataset.wasDisabled = String(button.disabled);
      button.disabled = true;
    } else {
      button.disabled =
        button.dataset.wasDisabled === "true" ||
        Boolean(button.dataset.permissionLocked);
      delete button.dataset.wasDisabled;
    }
  });
}

function bindForm(id, handler) {
  const form = document.getElementById(id);
  if (!form) {
    return;
  }

  form.noValidate = true;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (form.dataset.busy === "true") return;
    const invalidControl = form.querySelector(":invalid");
    if (invalidControl) {
      const panel = invalidControl.closest("[data-contract-panel]");
      if (panel) setActiveContractTab(panel.dataset.contractPanel);
      invalidControl.reportValidity();
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    const originalLabel = submitButton?.textContent;
    let completed = false;

    try {
      setFormBusy(form, true);
      if (submitButton) {
        submitButton.textContent = "Saving...";
      }
      setDynamicFormStatus(form, "Working...", "info");
      await handler(new FormData(form), form);
      completed = true;
      setDynamicFormStatus(form, "Saved successfully.", "success");
    } catch (error) {
      showToast(error.message, "error");
      setDynamicFormStatus(form, error.message, "error");
    } finally {
      setFormBusy(form, false);
      if (submitButton && originalLabel) {
        submitButton.textContent = originalLabel;
      }
      applyPermissionState();
      if (completed && state.ui.activeFormId === id) {
        closeFormModal();
      }
    }
  });
}

function populateForm(formId, values) {
  const form = document.getElementById(formId);
  if (!form) {
    return;
  }
  Object.entries(values || {}).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (!field) {
      return;
    }
    field.value = value ?? "";
  });
}

function updateContractFormLabel(isEditing) {
  const button = document.querySelector('#contract-form button[type="submit"]');
  if (button) {
    button.textContent = isEditing ? "Update Contract" : "Save Contract";
  }
}

function resetContractForm() {
  resetForm("contract-form");
  const form = getContractFormElement();
  if (form) {
    setContractDays(form, DEFAULT_DAILY_CONTRACT_DAYS);
    setCollectionData("contract-form", "customDatesJson", []);
  }
  syncContractCyclePanels({ tabKey: "overview" });
  updateContractFormLabel(false);
}

async function handleContractAction(action, id) {
  if (action === "view") {
    const response = await api(`/api/contracts/${id}`);
    renderDetailPayload("Contract Details", response.data);
    return;
  }

  if (action === "edit" || action === "renew") {
    const response = await api(`/api/contracts/${id}`);
    const contract = response.data.contract;
    populateForm("contract-form", {
      id: contract.id,
      clientId: contract.client_id,
      clientLocationId: contract.client_location_id,
      clientName: contract.client_name,
      clientContactPerson: contract.client_contact_person,
      clientPhone: contract.client_phone,
      clientEmail: contract.client_email,
      clientAddress: contract.client_address,
      locationName: contract.location_name,
      locationContactPerson: contract.location_contact_person,
      locationPhone: contract.location_phone,
      locationAddress: contract.location_address,
      locationDeliveryNotes: contract.location_delivery_notes,
      startDate: contract.start_date?.slice(0, 10),
      endDate: contract.end_date?.slice(0, 10),
      paymentTermId: contract.payment_term_id,
      deliveryTypeId: contract.delivery_type_id,
      pricePerUnit: contract.price_per_unit,
      expectedDailyQuantity: contract.expected_daily_quantity,
      notes: contract.notes,
    });
    hydrateContractScheduleWorkspace(contract, response.data.schedules || []);
    setCollectionData(
      "contract-form",
      "itemsJson",
      (response.data.items || []).map((item) => ({
        productId: item.product_id,
        serviceUnit: item.service_unit,
        quantityPerDelivery: Number(item.quantity_per_delivery || 0),
        unitPrice: Number(item.unit_price || 0),
        notes: item.notes,
      })),
    );
    updateContractFormLabel(true);
    openFormModal("contract-form", {
      title: action === "renew" ? "Renew Contract" : "Edit Contract",
    });
    return;
  }

  await api(`/api/contracts/${id}/${action}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  await Promise.all([loadContracts(), loadDashboard()]);
  showToast(`Contract ${action}d`);
}


async function handlePurchaseRequisitionAction(action, id) {
  const response = await api(`/api/procurement/purchase-requisitions/${id}`);

  if (action === "view") {
    renderDetailPayload("Purchase Requisition", response.data);
    return;
  }

  if (action === "submit") {
    await api(`/api/procurement/purchase-requisitions/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await Promise.all([
      loadProcurement(),
      loadDashboard(),
      typeof loadApprovals === "function" ? loadApprovals().catch(() => null) : Promise.resolve(),
    ]);
    showToast("Purchase requisition sent to Approvals");
    return;
  }

  if (action === "load") {
    populateForm("purchase-requisition-approve-form", {
      purchaseRequisitionId: response.data.header.id,
    });
    setCollectionData(
      "purchase-requisition-approve-form",
      "itemsJson",
      response.data.items.map((item) => ({
        id: item.id,
        quantityApproved: Number(
          item.quantity_approved || item.quantity_requested || 0,
        ),
        estimatedUnitCost: Number(item.estimated_unit_cost || 0),
        preferredSupplierId: item.preferred_supplier_id || null,
      })),
    );
    focusForm("purchase-requisition-approve-form");
    return;
  }

  if (action === "approve") {
    await api(`/api/procurement/purchase-requisitions/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({
        items: response.data.items.map((item) => ({
          id: item.id,
          quantityApproved: Number(
            item.quantity_approved || item.quantity_requested || 0,
          ),
          estimatedUnitCost: Number(item.estimated_unit_cost || 0),
          preferredSupplierId: item.preferred_supplier_id || null,
        })),
      }),
    });
    await Promise.all([loadProcurement(), loadDashboard()]);
    showToast("Purchase requisition approved");
    return;
  }

  if (action === "create-po") {
    const firstItem = response.data.items[0];
    populateForm("purchase-order-form", {
      purchaseRequisitionId: response.data.header.id,
      supplierId: firstItem?.preferred_supplier_id || "",
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: new Date().toISOString().slice(0, 10),
    });
    setCollectionData(
      "purchase-order-form",
      "itemsJson",
      response.data.items.map((item) => ({
        productId: item.product_id,
        quantityOrdered: Number(
          item.quantity_approved || item.quantity_requested || 0,
        ),
        unitCost: Number(item.estimated_unit_cost || 0),
      })),
    );
    focusForm("purchase-order-form");
  }
}

async function handlePurchaseOrderAction(action, id) {
  if (action === "send") {
    await api(`/api/procurement/purchase-orders/${id}/send`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await Promise.all([loadProcurement(), loadDashboard()]);
    showToast("Purchase order sent");
    return;
  }

  const response = await api(`/api/procurement/purchase-orders/${id}`);
  if (action === "view") {
    renderDetailPayload("Purchase Order", response.data);
    return;
  }

  if (action === "receive") {
    populateForm("goods-received-form", {
      purchaseOrderId: response.data.header.id,
      receiptDate: new Date().toISOString().slice(0, 10),
    });
    setCollectionData(
      "goods-received-form",
      "itemsJson",
      response.data.items.map((item) => ({
        productId: item.product_id,
        quantityReceived: Number(item.quantity_ordered || 0),
        unitCost: Number(item.unit_cost || 0),
        batchNumber: `${response.data.header.order_number}-${item.product_id}`,
      })),
    );
    focusForm("goods-received-form");
  }
}

async function handleGoodsReceivedAction(id) {
  const response = await api(`/api/procurement/goods-received/${id}`);
  const header = response.data?.header || {};
  const { status_id, status, store_location_id, store_name, ...visibleHeader } = header;
  renderDetailPayload("Goods Received Note", {
    ...response.data,
    header: visibleHeader,
  });
}

async function handleSupplierInvoiceAction(action, id) {
  const response = await api(`/api/procurement/supplier-invoices/${id}`);
  if (action === "view") {
    renderDetailPayload("Supplier Invoice", response.data);
    return;
  }

  if (action === "pay") {
    populateForm("payment-voucher-form", {
      sourceType: "invoice",
      supplierInvoiceId: response.data.invoice.id,
      cashRequisitionId: "",
      supplierId: response.data.invoice.supplier_id,
      paymentDate: new Date().toISOString().slice(0, 10),
      amount:
        Number(response.data.invoice.total_amount || 0) -
        Number(response.data.invoice.amount_paid || 0),
      paymentMethod: "Bank Transfer",
      referenceNumber: "",
    });
    syncPaymentVoucherSourceFields();
    focusForm("payment-voucher-form");
  }
}

async function handlePaymentVoucherAction(action, id) {
  if (action === "view") {
    const response = await api(`/api/procurement-system/payment-vouchers/${id}`);
    renderDetailPayload("Payment Voucher", response.data);
    return;
  }

  if (action === "print") {
    printPaymentVoucher(id);
    return;
  }

  if (!["submit", "approve", "reject", "pay"].includes(action)) {
    return;
  }

  await api(`/api/procurement-system/payment-vouchers/${id}/${action}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  await Promise.all([
    loadProcurement(),
    loadSuppliers(),
    loadDashboard(),
    typeof loadApprovals === "function" ? loadApprovals().catch(() => null) : Promise.resolve(),
  ]);
  const labels = {
    submit: "sent to Approvals",
    approve: "approved",
    reject: "rejected",
    pay: "marked paid",
  };
  showToast(`Payment voucher ${labels[action]}`);
}

async function handleCashRequisitionAction(action, id) {
  const response = await api(`/api/procurement-system/cash-requisitions/${id}`);
  const record = response.data.record || response.data;

  if (action === "view") {
    renderDetailPayload("Cash Requisition", response.data);
    return;
  }

  if (action === "edit") {
    populateForm("cash-requisition-form", {
      id: record.id,
      requestDate: record.request_date?.slice(0, 10),
      requiredDate: record.required_date?.slice(0, 10),
      departmentId: record.department_id || "",
      purpose: record.purpose,
      payeeName: record.payee_name,
      amount: record.amount,
      notes: record.notes,
    });
    openFormModal("cash-requisition-form", { title: "Edit Cash Requisition" });
    return;
  }

  if (["reject", "return"].includes(action)) {
    populateForm("cash-requisition-action-form", {
      id: record.id,
      action,
      reason: "",
    });
    const decisionButton = document.querySelector(
      '#cash-requisition-action-form button[type="submit"]',
    );
    if (decisionButton) {
      decisionButton.textContent =
        action === "return" ? "Return for Revision" : "Reject Requisition";
    }
    openFormModal("cash-requisition-action-form", {
      title: action === "return" ? "Return Cash Requisition" : "Reject Cash Requisition",
    });
    return;
  }

  if (action === "release") {
    populateForm("cash-requisition-release-form", {
      id: record.id,
      paymentMethod: "Cash",
      referenceNumber: "",
      notes: "",
    });
    focusForm("cash-requisition-release-form");
    return;
  }

  if (action === "create-voucher") {
    populateForm("payment-voucher-form", {
      sourceType: "cash_requisition",
      supplierInvoiceId: "",
      cashRequisitionId: record.id,
      supplierId: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      amount: record.amount,
      paymentMethod: record.release_payment_method || "Cash",
      referenceNumber: record.release_reference_number || "",
      notes: `Payment for cash requisition ${record.requisition_number}: ${record.purpose}`,
    });
    syncPaymentVoucherSourceFields();
    focusForm("payment-voucher-form");
    return;
  }

  if (action === "settle") {
    populateForm("cash-requisition-settle-form", {
      id: record.id,
      settlementDate: new Date().toISOString().slice(0, 10),
      actualSpentAmount: record.amount,
      cashReturnedAmount: 0,
      receiptReference: "",
      varianceReason: "",
      notes: "",
    });
    focusForm("cash-requisition-settle-form");
    return;
  }

  if (["submit", "approve"].includes(action)) {
    await api(`/api/procurement-system/cash-requisitions/${id}/${action}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (action === "approve" && state.activeModule === "cash-requisitions") {
      state.filters["cash-requisitions"] = {
        ...(state.filters["cash-requisitions"] || {}),
        tab: "in progress",
      };
    }
    await Promise.all([
      loadProcurement(),
      loadDashboard(),
      canAccessApprovalQueue()
        ? loadApprovals().catch(() => null)
        : Promise.resolve(),
    ]);
    showToast(
      action === "approve"
        ? "Cash requisition approved — moved to Approved / release"
        : "Cash requisition submitted",
    );
  }
}

async function handleClientAction(action, id) {
  const clients = state.moduleData.masterData?.clients || [];
  const client = clients.find((row) => Number(row.id) === Number(id));
  if (action === "edit" && client) {
    populateForm("client-form", {
      id: client.id,
      name: client.name,
      contactPerson: client.contact_person,
      phone: client.phone,
      email: client.email,
      address: client.address,
    });
    focusForm("client-form");
    return;
  }

  const response = await api(`/api/master-data/clients/${id}`);
  renderDetailPayload("Client Profile", response.data);
}

function handleSupplierEdit(id) {
  const supplier = (state.moduleData.masterData?.suppliers || []).find(
    (row) => Number(row.id) === Number(id),
  );
  if (!supplier) {
    return;
  }
  populateForm("supplier-form", {
    id: supplier.id,
    name: supplier.name,
    contactPerson: supplier.contact_person,
    phone: supplier.phone,
    paymentTermId: supplier.payment_term_id,
    address: supplier.address,
  });
  focusForm("supplier-form");
}

function handleProductEdit(id) {
  const product = (state.moduleData.masterData?.products || []).find(
    (row) => Number(row.id) === Number(id),
  );
  if (!product) {
    return;
  }
  populateForm("product-form", {
    id: product.id,
    name: product.name,
    sku: product.sku,
    productType: product.product_type,
    productCategoryId: product.product_category_id,
    unitOfMeasureId: product.unit_of_measure_id,
    defaultSupplierId: product.default_supplier_id || "",
    minimumStockLevel: product.minimum_stock_level,
    reorderLevel: product.reorder_level,
    standardCost: product.standard_cost,
    isPerishable: String(Boolean(product.is_perishable)),
    description: product.description,
  });
  focusForm("product-form");
}

async function handleKitchenRequisitionAction(action, id) {
  const response = await api(`/api/kitchen/requisitions/${id}`);

  if (action === "view") {
    renderDetailPayload("Kitchen Requisition", response.data);
    return;
  }

  if (action === "submit") {
    await api(`/api/kitchen/requisitions/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await Promise.all([loadKitchen(), loadDashboard()]);
    showToast("Kitchen requisition sent to Approvals");
    return;
  }

  if (action === "load-approve") {
    populateForm("kitchen-approve-form", {
      kitchenRequisitionId: response.data.header.id,
    });
    setCollectionData(
      "kitchen-approve-form",
      "itemsJson",
      response.data.items.map((item) => ({
        id: item.id,
        approvedQuantity: Number(
          item.approved_quantity || item.requested_quantity || 0,
        ),
      })),
    );
    focusForm("kitchen-approve-form");
    return;
  }

  if (action === "issue") {
    populateForm("store-issue-form", {
      kitchenRequisitionId: response.data.header.id,
      issueDate: new Date().toISOString().slice(0, 10),
    });
    setCollectionData(
      "store-issue-form",
      "itemsJson",
      response.data.items.map((item) => ({
        kitchenRequisitionItemId: item.id,
        productId: item.product_id,
        issuedQuantity: Number(item.approved_quantity || 0),
        unitCost: Number(
          state.reference.products.find(
            (product) => Number(product.id) === Number(item.product_id),
          )?.standard_cost || 0,
        ),
      })),
    );
    focusForm("store-issue-form");
  }
}

async function handleStoreIssueAction(id) {
  const response = await api(`/api/kitchen/store-issues/${id}`);
  renderDetailPayload("Store Issue", response.data);
}

async function handleProductionBatchAction(action, id) {
  const response = await api(`/api/kitchen/production-batches/${id}`);
  if (action === "view") {
    renderDetailPayload("Production Batch", response.data);
    return;
  }
  if (action === "complete") {
    populateForm("complete-batch-form", {
      productionBatchId: response.data.header.id,
      actualOutput: Number(
        response.data.header.actual_output ||
          response.data.header.planned_output ||
          0,
      ),
      wastageQuantity: Number(response.data.header.wastage_quantity || 0),
    });
    focusForm("complete-batch-form");
  }
}

function handleInventoryBalanceView(id) {
  const balance = (state.moduleData.inventory?.balances || []).find(
    (row) => Number(row.id) === Number(id),
  );
  const movements = (state.moduleData.inventory?.movements || []).filter(
    (row) =>
      Number(row.product_id) === Number(balance?.product_id) &&
      Number(row.store_location_id) === Number(balance?.store_location_id),
  );
  renderDetailPayload("Inventory Balance", {
    balance,
    recentMovements: movements.slice(0, 10),
  });
}

function handleStockAdjustmentApprove(id) {
  populateForm("stock-adjustment-approve-form", {
    adjustmentId: id,
  });
  focusForm("stock-adjustment-approve-form");
}

function handleReportAction(action, key) {
  const report = getReportCards().find((card) => card.key === key);
  if (!report) {
    return;
  }
  if (action === "pdf") {
    downloadFileFromUrl(buildReportExportUrl(key, "pdf"));
    showToast(`${report.title} PDF downloading`);
    return;
  }
  if (action === "excel") {
    downloadFileFromUrl(buildReportExportUrl(key, "xlsx"));
    showToast(`${report.title} Excel downloading`);
    return;
  }
  fetchReportData(key)
    .then((payload) => {
      const columns = (payload.columns || []).map((column) => ({
        label: column.header,
        key: column.key,
      }));
      if (action === "preview") {
        renderDetailPayload(payload.title || report.title, {
          summary: payload.summary,
          period: payload.period,
          rows: payload.rows,
        });
        return;
      }
      if (action === "export") {
        downloadCsv(`${slugify(payload.title || report.title)}.csv`, columns, payload.rows || []);
        showToast(`${report.title} exported`);
      }
    })
    .catch((error) => {
      showToast(error.message || "Failed to load report", "error");
    });
}

function syncReportPeriodControls() {
  const periodSelect = document.getElementById("reports-period");
  const startInput = document.getElementById("reports-start-date");
  const endInput = document.getElementById("reports-end-date");
  const range = getReportRange();
  if (periodSelect) {
    periodSelect.value = state.filters.reports.period || "month";
  }
  const isCustom = state.filters.reports.period === "custom";
  if (startInput) {
    startInput.value = isCustom ? state.filters.reports.startDate : range.startDate;
    startInput.classList.toggle("hidden", !isCustom);
  }
  if (endInput) {
    endInput.value = isCustom ? state.filters.reports.endDate : range.endDate;
    endInput.classList.toggle("hidden", !isCustom);
  }
}

function downloadDocumentExport(entity, id, format) {
  const type = documentExportEntities[entity];
  if (!type) {
    return;
  }
  downloadFileFromUrl(`/api/documents/${type}/${id}/${format}`);
  showToast(`${format === "pdf" ? "PDF" : "Excel"} downloading`);
}

function printPaymentVoucher(id) {
  const printWindow = window.open(`/api/documents/payment-vouchers/${id}/html`, "_blank", "noopener,noreferrer");
  if (!printWindow) {
    showToast("Allow pop-ups to print the payment voucher.", "error");
  }
}

async function handleRowAction(action, entity, id, type = null) {
  if ((action === "pdf" || action === "excel") && entity !== "report") {
    downloadDocumentExport(entity, id, action === "pdf" ? "pdf" : "xlsx");
    return;
  }
  if (action === "print" && entity === "payment-voucher") {
    printPaymentVoucher(id);
    return;
  }
  if (entity === "contract") {
    await handleContractAction(action, id);
    return;
  }
  if (entity === "purchase-requisition") {
    await handlePurchaseRequisitionAction(action, id);
    return;
  }
  if (entity === "purchase-order") {
    await handlePurchaseOrderAction(action, id);
    return;
  }
  if (entity === "goods-received") {
    await handleGoodsReceivedAction(id);
    return;
  }
  if (entity === "supplier-invoice") {
    await handleSupplierInvoiceAction(action, id);
    return;
  }
  if (entity === "payment-voucher") {
    await handlePaymentVoucherAction(action, id);
    return;
  }
  if (entity === "cash-requisition") {
    await handleCashRequisitionAction(action, id);
    return;
  }
  if (entity === "client") {
    await handleClientAction(action, id);
    return;
  }
  if (entity === "supplier") {
    if (action === "edit") {
      handleSupplierEdit(id);
    } else {
      renderDetailPayload(
        "Supplier Profile",
        (state.moduleData.masterData?.suppliers || []).find(
          (row) => Number(row.id) === Number(id),
        ),
      );
    }
    return;
  }
  if (entity === "product") {
    if (action === "edit") {
      handleProductEdit(id);
    } else {
      renderDetailPayload(
        "Product Detail",
        (state.moduleData.masterData?.products || []).find(
          (row) => Number(row.id) === Number(id),
        ),
      );
    }
    return;
  }
  if (entity === "kitchen-requisition") {
    await handleKitchenRequisitionAction(action, id);
    return;
  }
  if (entity === "store-issue") {
    await handleStoreIssueAction(id);
    return;
  }
  if (entity === "production-batch") {
    await handleProductionBatchAction(action, id);
    return;
  }
  if (entity === "inventory-balance") {
    handleInventoryBalanceView(id);
    return;
  }
  if (entity === "stock-adjustment") {
    if (action === "submit") {
      api("/api/inventory/stock-adjustments/" + id + "/submit", {
        method: "POST",
        body: JSON.stringify({}),
      })
        .then(() => Promise.all([loadInventory(), loadApprovals().catch(() => null), loadDashboard()]))
        .then(() => showToast("Stock adjustment submitted"))
        .catch((error) => showToast(error.message || "Submit failed", "error"));
      return;
    }
    if (action === "approve") {
      handleStockAdjustmentApprove(id);
    }
    return;
  }
  if (entity === "report") {
    handleReportAction(action, id);
    return;
  }
  if (entity === "configuration") {
    const rows =
      type === "approval-workflows"
        ? state.moduleData.approvalMatrix?.rows || []
        : state.moduleData.configurations?.rowsByType?.[type] || [];
    const row = rows.find((entry) => Number(entry.id) === Number(id));
    if (!row) {
      return;
    }
    if (action === "edit") {
      openFormModal("configuration-form", {
        title: `Edit ${titleCaseWords(type.replace(/-/g, " "))}`,
        configurationType: type,
        configurationRow: row,
      });
      return;
    }
    if (action === "delete") {
      await api(`/api/configurations/${type}/${id}`, {
        method: "DELETE",
      });
      await Promise.all([
        type === "approval-workflows"
          ? loadApprovalMatrix()
          : loadConfigurations(),
        loadReferenceData(),
      ]);
      showToast("Deleted");
      return;
    }
    if (action === "toggle") {
      await api(`/api/configurations/${type}/${id}/toggle`, {
        method: "POST",
        body: JSON.stringify({ isActive: !row.is_active }),
      });
      await Promise.all([
        type === "approval-workflows"
          ? loadApprovalMatrix()
          : loadConfigurations(),
        loadReferenceData(),
      ]);
      showToast(`${row.is_active ? "Deactivated" : "Activated"} configuration`);
      return;
    }
    renderDetailPayload("Configuration Detail", row);
  }
}

function updateSearch(moduleKey, value) {
  if (!state.filters[moduleKey]) {
    state.filters[moduleKey] = {};
  }
  state.filters[moduleKey].search = value;
  for (const [pageKey, model] of Object.entries(state.ui.tableModels)) {
    if (
      document.getElementById(model.targetId)?.closest(".module")?.dataset
        .module === moduleKey
    )
      state.tablePages[pageKey] = 1;
  }
  rerenderModule(moduleKey);
}

function resetModuleFilter(moduleKey) {
  if (moduleKey === "consumption") {
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 30 * 86400000)
      .toISOString()
      .slice(0, 10);
    state.consumptionRange = { startDate, endDate };
    populateForm("consumption-range-form", state.consumptionRange);
  }
  if (state.filters[moduleKey]) {
    state.filters[moduleKey].search = "";
    if (moduleKey === "procurement") {
      state.filters[moduleKey].purchaseType = "";
    }
    if (moduleKey === "reports") {
      state.filters[moduleKey].period = "month";
      state.filters[moduleKey].startDate = "";
      state.filters[moduleKey].endDate = "";
      syncReportPeriodControls();
    }
  }
  document
    .querySelectorAll(`[data-search-module="${moduleKey}"]`)
    .forEach((input) => {
      input.value = "";
    });
  document
    .querySelectorAll(`[data-purchase-type-filter="${moduleKey}"]`)
    .forEach((input) => {
      input.value = "";
    });
  rerenderModule(moduleKey);
}

function rerenderModule(moduleKey) {
  if (moduleKey === "contracts") {
    renderContracts();
  } else if (moduleKey === "approvals") {
    renderApprovals();

  } else if (moduleKey === "procurement") {
    renderProcurement();
  } else if (moduleKey === "inventory") {
    renderInventory();
  } else if (moduleKey === "kitchen") {
    renderKitchen();
  } else if (moduleKey === "production") {
    renderProduction();
  } else if (moduleKey === "consumption") {
    loadConsumption().catch((error) => showToast(error.message, "error"));
  } else if (moduleKey === "reports") {
    renderReports();
  } else if (moduleKey === "suppliers") {
    renderSuppliers();
  } else if (moduleKey === "configurations") {
    renderConfigurationsWorkspace();
  } else if (moduleKey === "settings") {
    renderSettingsWorkspace();
  } else if (moduleKey === "approval-matrix") {
    renderApprovalMatrixWorkspace();
  }
  syncModuleTabs();
}

function handleModuleTab(moduleKey, value) {
  if (moduleKey === "configurations") {
    const group = getConfigurationGroup(value);
    state.filters[moduleKey] = {
      ...(state.filters[moduleKey] || {}),
      tab: group.key,
      type: group.types[0],
    };
    loadConfigurations().catch((error) => {
      console.error("Failed loading configurations:", error);
      showToast(`Configurations failed: ${error.message}`, "error");
    });
    updateLocationState();
    return;
  }

  state.filters[moduleKey] = {
    ...(state.filters[moduleKey] || {}),
    tab: value,
  };
  const nav = modules.find((entry) => entry.key === moduleKey);
  rerenderModule(nav?.sectionKey || moduleKey);
  updateLocationState();
}

function bindActions() {
  $("#nav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-module]");
    if (!button) {
      return;
    }
    showModule(button.dataset.module);
    const navModule = modules.find((entry) => entry.key === button.dataset.module);
    if (
      (button.dataset.module === "procurement" || navModule?.procurementTab) &&
      !state.moduleData.procurement
    ) {
      loadProcurement().catch((error) =>
        showToast(`Procurement failed: ${error.message}`, "error"),
      );
    }
    if (
      button.dataset.module === "approval-matrix" &&
      !state.moduleData.approvalMatrix
    ) {
      loadApprovalMatrix().catch((error) =>
        showToast(`Approval Matrix failed: ${error.message}`, "error"),
      );
    }
    if (
      button.dataset.module === "approvals" &&
      !state.moduleData.approvals
    ) {
      loadApprovals().catch((error) =>
        showWorkspaceError("approvals", error),
      );
    }
  });

  document.body.addEventListener("input", (event) => {
    const search = event.target.closest("[data-search-module]");
    if (!search) {
      const editorInput = event.target.closest("[data-collection-form]");
      if (editorInput) {
        handleCollectionEditorInput(editorInput);
      }
      return;
    }
    updateSearch(search.dataset.searchModule, search.value);
  });

  document.body.addEventListener("change", (event) => {
    const editorInput = event.target.closest("[data-collection-form]");
    if (editorInput) {
      handleCollectionEditorInput(editorInput);
    }

    if (event.target.matches('#contract-form [name="billingCycle"]')) {
      syncContractCyclePanels({
        openCustomTab: event.target.value === "Custom",
      });
    }
    const purchaseTypeFilter = event.target.closest(
      "[data-purchase-type-filter]",
    );
    if (purchaseTypeFilter) {
      state.filters[
        purchaseTypeFilter.dataset.purchaseTypeFilter
      ].purchaseType = purchaseTypeFilter.value;
      rerenderModule(purchaseTypeFilter.dataset.purchaseTypeFilter);
    }
    if (event.target.id === "reports-period") {
      state.filters.reports.period = event.target.value;
      syncReportPeriodControls();
    }
    if (event.target.id === "reports-start-date") {
      state.filters.reports.startDate = event.target.value;
      state.filters.reports.period = "custom";
    }
    if (event.target.id === "reports-end-date") {
      state.filters.reports.endDate = event.target.value;
      state.filters.reports.period = "custom";
    }
  });

  document.body.addEventListener("click", async (event) => {
    if (event.target.closest("[data-close-form]")) {
      closeFormModal({ confirmDiscard: true });
      return;
    }
    if (event.target.closest("[data-close-detail]")) {
      closeDetailModal();
      return;
    }
    const clear = event.target.closest("[data-clear-search]");
    if (clear) {
      const key = clear.dataset.clearSearch;
      document.querySelector('[data-search-module="' + key + '"]').value = "";
      updateSearch(key, "");
      return;
    }
    const navTargetButton = event.target.closest("[data-nav-target]");
    if (navTargetButton) {
      const targetModule = navTargetButton.dataset.navTarget;
      const targetTab = navTargetButton.dataset.navTab;
      if (targetTab && state.filters[targetModule]) {
        state.filters[targetModule].tab = targetTab;
      }
      showModule(targetModule);
      if (targetTab) {
        rerenderModule(targetModule);
      }
      return;
    }

    const approvalViewButton = event.target.closest("[data-approval-view]");
    if (approvalViewButton) {
      const record = getApprovalRecord(approvalViewButton.dataset.approvalView);
      if (record) {
        openApprovalDetails(record);
      }
      return;
    }

    const approvalActionButton = event.target.closest("[data-approval-action]");
    if (approvalActionButton) {
      if (approvalActionButton.disabled || approvalActionButton.dataset.busy === "true") {
        return;
      }
      const record = getApprovalRecord(approvalActionButton.dataset.approvalKey);
      if (!record) {
        return;
      }
      if (approvalActionButton.dataset.approvalAction === "reject") {
        openApprovalRejectDialog(record);
        return;
      }
      approvalActionButton.dataset.busy = "true";
      approvalActionButton.disabled = true;
      approvalActionButton.textContent = "Approving...";
      try {
        await executeApprovalAction(record, "approve");
      } catch (error) {
        approvalActionButton.disabled = false;
        approvalActionButton.dataset.busy = "false";
        approvalActionButton.textContent = "Approve";
        showToast(error.message, "error");
      }
      return;
    }

    const approvalRejectButton = event.target.closest("[data-approval-reject-confirm]");
    if (approvalRejectButton) {
      if (approvalRejectButton.disabled) {
        return;
      }
      const record = getApprovalRecord(approvalRejectButton.dataset.approvalRejectConfirm);
      const reason = document.getElementById("approval-reject-reason")?.value.trim() || "";
      if (!record) {
        return;
      }
      if (!reason) {
        showToast("Add a reason before rejecting this request.", "error");
        document.getElementById("approval-reject-reason")?.focus();
        return;
      }
      approvalRejectButton.disabled = true;
      approvalRejectButton.textContent = "Rejecting...";
      try {
        await executeApprovalAction(record, "reject", reason);
      } catch (error) {
        approvalRejectButton.disabled = false;
        approvalRejectButton.textContent = "Reject request";
        showToast(error.message, "error");
      }
      return;
    }

    const contractTabButton = event.target.closest("[data-contract-tab]");
    if (contractTabButton) {
      setActiveContractTab(contractTabButton.dataset.contractTab || "overview");
      return;
    }

    const tableSortButton = event.target.closest("[data-table-sort]");
    if (tableSortButton) {
      const [pageKey, columnKey] = tableSortButton.dataset.tableSort.split(":");
      const currentSort = state.tableSort[pageKey] || {};
      state.tableSort[pageKey] = {
        key: columnKey,
        direction:
          currentSort.key === columnKey && currentSort.direction === "asc"
            ? "desc"
            : "asc",
      };
      state.tablePages[pageKey] = 1;
      const model = state.ui.tableModels[pageKey];
      if (model) {
        renderTable(model.targetId, model.columns, model.rows, model.options);
        document
          .querySelector(
            `[data-table-sort="${CSS.escape(pageKey)}:${CSS.escape(columnKey)}"]`,
          )
          ?.focus();
      }
      return;
    }

    const tablePageButton = event.target.closest("[data-table-page]");
    if (tablePageButton) {
      const [pageKey, direction] = tablePageButton.dataset.tablePage.split(":");
      const currentPage = state.tablePages[pageKey] || 1;
      state.tablePages[pageKey] = Math.max(
        1,
        currentPage + (direction === "next" ? 1 : -1),
      );
      const model = state.ui.tableModels[pageKey];
      if (model) {
        renderTable(model.targetId, model.columns, model.rows, model.options);
      }
      return;
    }

    const openFormButton = event.target.closest("[data-open-form]");
    if (openFormButton) {
      const formId = openFormButton.dataset.openForm;
      const reset = openFormButton.dataset.resetForm === "true";
      const configurationType =
        formId === "configuration-form"
          ? state.activeModule === "approval-matrix"
            ? "approval-workflows"
            : getActiveConfigurationType()
          : undefined;
      openFormModal(formId, {
        reset,
        title: openFormButton.dataset.formTitle || undefined,
        configurationType,
      });
      return;
    }

    const detailButton = event.target.closest("[data-detail-message]");
    if (detailButton) {
      openDetailModal(
        detailButton.dataset.detailTitle || "Workspace Detail",
        `<div class="empty-state">${escapeHtml(detailButton.dataset.detailMessage || "")}</div>`,
      );
      return;
    }

    const addCollectionButton = event.target.closest("[data-collection-add]");
    if (addCollectionButton) {
      const [formId, fieldName] =
        addCollectionButton.dataset.collectionAdd.split(":");
      const config = getCollectionConfig(formId, fieldName);
      const rows = normalizeCollectionRows(formId, fieldName);
      rows.push(buildCollectionEmptyRow(config));
      setCollectionData(formId, fieldName, rows);
      return;
    }

    const removeCollectionButton = event.target.closest(
      "[data-collection-remove]",
    );
    if (removeCollectionButton) {
      const [formId, fieldName, rowIndexRaw] =
        removeCollectionButton.dataset.collectionRemove.split(":");
      const rowIndex = Number(rowIndexRaw);
      const rows = normalizeCollectionRows(formId, fieldName).filter(
        (_, index) => index !== rowIndex,
      );
      setCollectionData(formId, fieldName, rows);
      return;
    }

    const loadButton = event.target.closest("[data-load]");
    if (loadButton) {
      const actionMap = {
        dashboard: loadDashboard,
        approvals: loadApprovals,
        contracts: async () => {
          await loadReferenceData();
          await Promise.all([loadMasterData(), loadContracts()]);
        },
        procurement: async () => {
          await Promise.all([loadMasterData(), loadProcurement()]);
        },
        inventory: async () => {
          await loadReferenceData();
          await Promise.all([loadMasterData(), loadInventory()]);
        },
        kitchen: loadKitchen,
        production: loadProduction,
        consumption: loadConsumption,
        reports: loadReports,
        suppliers: async () => Promise.all([loadMasterData(), loadSuppliers()]),
        configurations: loadConfigurations,
        "approval-matrix": loadApprovalMatrix,
        settings: loadSettings,
      };
      const loader = actionMap[loadButton.dataset.load];
      if (loader && !loadButton.disabled) {
        loadButton.disabled = true;
        try {
          await loader();
          document
            .querySelector(
              '.module[data-module="' +
                loadButton.dataset.load +
                '"] > .workspace-error',
            )
            ?.remove();
          showToast("Refreshed");
        } catch (error) {
          showWorkspaceError(loadButton.dataset.load, error);
        } finally {
          loadButton.disabled = false;
        }
      }
      return;
    }

    document.querySelectorAll("details.table-action-menu[open]").forEach((menu) => {
    if (!menu.contains(event.target)) {
      menu.removeAttribute("open");
    }
  });
  const rowActionButton = event.target.closest("[data-row-action]");
    if (rowActionButton) {
      if (rowActionButton.dataset.busy === "true" || rowActionButton.disabled)
        return;
      const action = rowActionButton.dataset.rowAction;
      const deactivating =
        action === "toggle" &&
        rowActionButton.textContent.trim() === "Deactivate";
      if (
        (["suspend", "reject", "cancel", "delete"].includes(action) ||
          deactivating) &&
        !window.confirm(
          rowActionButton.textContent.trim() +
            " this record? This action will be recorded in the audit trail.",
        )
      )
        return;
      rowActionButton.dataset.busy = "true";
      rowActionButton.disabled = true;
      try {
        await handleRowAction(
          rowActionButton.dataset.rowAction,
          rowActionButton.dataset.entity,
          rowActionButton.dataset.id,
          rowActionButton.dataset.type || null,
        );
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        rowActionButton.dataset.busy = "false";
        rowActionButton.disabled = false;
      }
      return;
    }

    const configurationTypeButton = event.target.closest("[data-config-type]");
    if (configurationTypeButton) {
      setActiveConfigurationType(configurationTypeButton.dataset.configType);
      loadConfigurations().catch((error) => {
        console.error("Failed loading configurations:", error);
        showToast(`Configurations failed: ${error.message}`, "error");
      });
      return;
    }

    const resetButton = event.target.closest("[data-reset-module]");
    if (resetButton) {
      resetModuleFilter(resetButton.dataset.resetModule);
      return;
    }

    const exportButton = event.target.closest("[data-export-module]");
    if (exportButton) {
      const exportState = state.exports[exportButton.dataset.exportModule];
      if (!exportState || !exportState.rows?.length) {
        showToast("No rows available to export.", "error");
        return;
      }
      downloadCsv(exportState.filename, exportState.columns, exportState.rows);
      showToast("Export complete");
      return;
    }

    const editUserRoles = event.target.closest("[data-edit-user-roles]");
    if (editUserRoles) {
      const user = (state.moduleData.settings?.users || []).find((row) => String(row.id) === editUserRoles.dataset.editUserRoles);
      if (!user) return;
      const form = document.getElementById("user-roles-form");
      form.elements.id.value = user.id;
      document.getElementById("user-roles-account").textContent = user.full_name + " (" + user.username + ")";
      renderUserRoleOptions("edit-user-role-options", user.roles);
      setFormStatus("user-roles-status", "");
      openFormModal("user-roles-form");
      return;
    }

    const focusButton = event.target.closest("[data-focus-form]");
    if (focusButton) {
      openFormModal(focusButton.dataset.focusForm, {
        reset: focusButton.dataset.resetForm === "true",
      });
      return;
    }

    const quickActionButton = event.target.closest("[data-quick-action]");
    if (quickActionButton) {
      const action = quickActionButton.dataset.quickAction;
      if (action === "show-report-help") {
        openDetailModal(
          "Report exports",
          `<div class="state-card empty-state"><span class="state-icon" aria-hidden="true">i</span><span>Choose a period, preview live data, then download PDF, Excel, or CSV. Purchase orders, requisitions, GRNs, invoices, kitchen requests, and production batches also export as branded PDF and Excel documents.</span></div>`,
        );
      }
      return;
    }

    const tabButton = event.target.closest(".module-tab");
    if (tabButton) {
      const section = tabButton.closest(".module");
      if (!section) {
        return;
      }
      handleModuleTab(
        tabButton.dataset.tabsModule || section.dataset.module,
        tabButton.dataset.workspaceKey ||
          tabButton.textContent.trim().toLowerCase(),
      );
      return;
    }
  });

  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (formElement.dataset.busy === "true") return;
    formElement.dataset.busy = "true";
    const form = new FormData(formElement);
    const submitButton = formElement.querySelector('[type="submit"]');
    const originalLabel = submitButton?.textContent || "Sign In";
    setFormStatus("login-status", "Signing in...", "info");
    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Signing in...";
      }
      const response = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      state.user = response.user;
      updateAuthState();
      await refreshAllData();
      setFormStatus("login-status", "");
    } catch (error) {
      setFormStatus("login-status", error.message, "error");
      showToast(error.message, "error");
    } finally {
      formElement.dataset.busy = "false";
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  });

  const signOut = async () => {
    await api("/api/auth/logout", { method: "POST" });
    state.user = null;
    updateAuthState();
    showToast("Logged out");
  };
  document.getElementById("logout-btn")?.addEventListener("click", signOut);

  $("#refresh-all-btn")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    if (button.disabled) return;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    try {
      await refreshAllData();
      showToast("Workspace refreshed");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
    }
  });

  $("#help-btn")?.addEventListener("click", () => {
    openDetailModal(
      "Workspace Help",
      `<div class="detail-grid">` +
        `<div class="detail-field"><span>Lists</span><strong>All tables are backed by live API data.</strong></div>` +
        `<div class="detail-field"><span>Row Actions</span><strong>Use View, Edit, Approve, Convert, Receive, Issue, and Complete directly from table rows.</strong></div>` +
        `<div class="detail-field"><span>Exports</span><strong>CSV exports are available on module list screens.</strong></div>` +
        `<div class="detail-field"><span>Approvals</span><strong>Only procurement and kitchen requisitions require an assigned approver.</strong></div>` +
        `</div>`,
    );
  });
  document
    .querySelector(".topbar-notify-btn")
    ?.addEventListener("click", async () => {
      await loadAudit();
      handleModuleTab("settings", "audit");
      showModule("settings");
      document
        .getElementById("audit-table")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

  const toggleTheme = () => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    state.ui.darkTheme = nextTheme === "dark";
    const themeButton = document.getElementById("theme-btn");
    themeButton?.setAttribute("aria-pressed", String(nextTheme === "dark"));
    themeButton?.setAttribute(
      "title",
      nextTheme === "dark" ? "Switch to light mode" : "Switch to dark mode",
    );
    themeButton?.setAttribute(
      "aria-label",
      nextTheme === "dark" ? "Switch to light mode" : "Switch to dark mode",
    );
    const themeIcon = themeButton?.querySelector("span");
    if (themeIcon) {
      themeIcon.textContent = nextTheme === "dark" ? "☀" : "☾";
    }
    window.localStorage.setItem("cater-theme", nextTheme);
  };
  $("#theme-btn")?.addEventListener("click", toggleTheme);

  const userMenu = document.getElementById("user-menu");
  const userMenuBtn = document.getElementById("user-menu-btn");
  const closeUserMenu = () => {
    userMenu?.classList.remove("open");
    userMenuBtn?.setAttribute("aria-expanded", "false");
  };
  userMenuBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = userMenu.classList.toggle("open");
    userMenuBtn.setAttribute("aria-expanded", String(open));
    if (open) userMenu.querySelector("[role=menuitem]")?.focus();
  });
  document.getElementById("user-menu-theme")?.addEventListener("click", () => {
    toggleTheme();
    closeUserMenu();
  });
  document
    .getElementById("user-menu-settings")
    ?.addEventListener("click", () => {
      showModule("settings");
      closeUserMenu();
    });
  document.getElementById("user-menu-logout")?.addEventListener("click", () => {
    closeUserMenu();
    signOut();
  });
  userMenu?.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = [...userMenu.querySelectorAll('[role="menuitem"]')],
      index = items.indexOf(document.activeElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) %
            items.length;
    items[next]?.focus();
  });
  document.addEventListener("click", (event) => {
    if (userMenu && !userMenu.contains(event.target)) {
      closeUserMenu();
    }
  });

  document
    .getElementById("global-search")
    ?.addEventListener("input", (event) => {
      const moduleKey = state.activeModule;
      const search = document.querySelector(
        `[data-search-module="${moduleKey}"]`,
      );
      if (!search) {
        return;
      }
      search.value = event.target.value;
      updateSearch(moduleKey, event.target.value);
    });
  document
    .querySelector(".password-toggle")
    ?.addEventListener("click", (event) => {
      const input = document.querySelector(
        '#login-form input[name="password"]',
      );
      if (!input) {
        return;
      }
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      event.currentTarget.textContent = show ? "Hide" : "Show";
      event.currentTarget.setAttribute(
        "aria-label",
        show ? "Hide password" : "Show password",
      );
    });
  document.body.addEventListener("input", (event) => {
    const form = event.target.closest("form");
    if (form?.classList.contains("form-modal-form"))
      form.dataset.dirty = "true";
    event.target.removeAttribute("aria-invalid");
    document.getElementById(event.target.id + "-error")?.remove();
  });
  document.body.addEventListener("change", (event) => {
    const form = event.target.closest(".form-modal-form");
    if (form) form.dataset.dirty = "true";
  });
  document.body.addEventListener(
    "invalid",
    (event) => {
      const control = event.target,
        panel = control.closest("[data-contract-panel]");
      if (panel) setActiveContractTab(panel.dataset.contractPanel);
      control.setAttribute("aria-invalid", "true");
      if (!document.getElementById(control.id + "-error")) {
        const error = document.createElement("span");
        error.id = control.id + "-error";
        error.className = "field-error";
        error.textContent = control.validationMessage;
        control.insertAdjacentElement("afterend", error);
        control.setAttribute("aria-describedby", error.id);
      }
    },
    true,
  );
  $("#detail-modal-close")?.addEventListener("click", closeDetailModal);
  $("#detail-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "detail-modal") {
      closeDetailModal();
    }
  });
  $("#form-modal-close")?.addEventListener("click", () =>
    closeFormModal({ confirmDiscard: true }),
  );
  $("#form-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "form-modal") {
      closeFormModal({ confirmDiscard: true });
    }
  });
  $("#sidebar-menu-btn")?.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 960px)").matches) {
      const open = document.body.classList.toggle("sidebar-open");
      $("#sidebar-menu-btn").setAttribute("aria-expanded", String(open));
      syncOverlayAccessibility();
      if (open) document.querySelector("#nav button.active")?.focus();
      return;
    }
    const collapsed = document.body.classList.toggle("sidebar-collapsed");
    document
      .querySelector(".sidebar-collapse-btn")
      ?.setAttribute("aria-expanded", String(!collapsed));
  });
  document
    .querySelector(".sidebar-collapse-btn")
    ?.addEventListener("click", () => {
      const collapsed = document.body.classList.toggle("sidebar-collapsed");
      document
        .querySelector(".sidebar-collapse-btn")
        ?.setAttribute("aria-expanded", String(!collapsed));
    });
  $("#sidebar-scrim")?.addEventListener("click", closeMobileNavigation);

  document.addEventListener("keydown", (event) => {
    const contractTab = event.target.closest("[data-contract-tab]");
    if (
      contractTab &&
      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
    ) {
      event.preventDefault();
      const tabs = [...document.querySelectorAll("[data-contract-tab]")].filter(
        (tab) => !tab.classList.contains("hidden"),
      );
      const index = tabs.indexOf(contractTab);
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
              tabs.length;
      setActiveContractTab(tabs[next].dataset.contractTab);
      tabs[next].focus();
      return;
    }
    const formModal = $("#form-modal");
    const detailModal = $("#detail-modal");
    const activeModal = !formModal?.classList.contains("hidden")
      ? formModal
      : !detailModal?.classList.contains("hidden")
        ? detailModal
        : null;

    if (event.key === "Escape") {
      if (userMenu?.classList.contains("open")) {
        closeUserMenu();
        userMenuBtn.focus();
        return;
      }
      if (activeModal === formModal) {
        closeFormModal({ confirmDiscard: true });
      } else if (activeModal === detailModal) {
        closeDetailModal();
      } else if (document.body.classList.contains("sidebar-open")) {
        closeMobileNavigation();
      }
      return;
    }

    if (activeModal) {
      trapModalFocus(event, activeModal);
    } else if (document.body.classList.contains("sidebar-open")) {
      trapModalFocus(event, document.querySelector(".sidebar"));
    }
  });

  bindForm("user-form", async (form) => {
    if (!form.getAll("roleCodes").length) throw new Error("Select at least one role.");
    await api("/api/auth/users", {
      method: "POST",
      body: JSON.stringify({
        fullName: form.get("fullName"),
        username: form.get("username"),
        email: form.get("email"),
        password: form.get("password"),
        roleCodes: form.getAll("roleCodes"),
      }),
    });
    resetForm("user-form");
    await loadSettings();
    setFormStatus("user-status", "User created.", "success");
    showToast("User created");
  });

  bindForm("user-roles-form", async (form) => {
    const roleCodes = form.getAll("roleCodes");
    if (!roleCodes.length) throw new Error("Select at least one role.");
    const response = await api("/api/auth/users/" + form.get("id") + "/roles", {
      method: "PUT",
      body: JSON.stringify({ roleCodes }),
    });
    if (String(state.user.id) === String(form.get("id"))) {
      state.user = response.data;
      updateAuthState();
    }
    await loadSettings();
    setFormStatus("user-roles-status", "Roles updated.", "success");
    showToast("Roles updated");
  });

  bindForm("configuration-form", async (form, formElement) => {
    const type = form.get("type") || getActiveConfigurationType();
    const payload = {};
    for (const field of configurationFormFieldMap[type] || []) {
      const input = formElement.querySelector(`[name="${field.key}"]`);
      if (!input) {
        continue;
      }
      if (field.type === "checkbox") {
        payload[field.key] = input.checked;
      } else if (field.type === "number") {
        payload[field.key] = input.value === "" ? 0 : Number(input.value);
      } else {
        payload[field.key] = input.value;
      }
    }

    if (form.get("id")) {
      await api(`/api/configurations/${type}/${Number(form.get("id"))}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Configuration updated");
    } else {
      await api(`/api/configurations/${type}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Configuration created");
    }

    closeFormModal();
    await Promise.all([
      type === "approval-workflows"
        ? loadApprovalMatrix()
        : loadConfigurations(),
      loadReferenceData(),
    ]);
  });

  bindForm("client-form", async (form) => {
    const payload = {
      name: form.get("name"),
      contactPerson: form.get("contactPerson"),
      phone: form.get("phone"),
      email: form.get("email"),
      address: form.get("address"),
    };
    if (form.get("id")) {
      await api(`/api/master-data/clients/${Number(form.get("id"))}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Client updated");
    } else {
      await api("/api/master-data/clients", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Client saved");
    }
    resetForm("client-form");
    await Promise.all([loadReferenceData(), loadMasterData(), loadContracts()]);
  });

  bindForm("client-location-form", async (form) => {
    await api("/api/master-data/client-locations", {
      method: "POST",
      body: JSON.stringify({
        clientId: Number(form.get("clientId")),
        name: form.get("name"),
        address: form.get("address"),
        contactPerson: form.get("contactPerson"),
        phone: form.get("phone"),
        deliveryNotes: form.get("deliveryNotes"),
      }),
    });
    resetForm("client-location-form");
    await Promise.all([loadReferenceData(), loadMasterData(), loadContracts()]);
    showToast("Client location saved");
  });

  bindForm("supplier-form", async (form) => {
    const payload = {
      name: form.get("name"),
      contactPerson: form.get("contactPerson"),
      phone: form.get("phone"),
      address: form.get("address"),
      paymentTermId: form.get("paymentTermId")
        ? Number(form.get("paymentTermId"))
        : null,
    };
    if (form.get("id")) {
      await api(`/api/master-data/suppliers/${Number(form.get("id"))}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Supplier updated");
    } else {
      await api("/api/master-data/suppliers", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Supplier saved");
    }
    resetForm("supplier-form");
    await Promise.all([loadReferenceData(), loadMasterData(), loadSuppliers()]);
  });

  bindForm("product-form", async (form) => {
    const payload = {
      name: form.get("name"),
      sku: form.get("sku"),
      productType: form.get("productType"),
      productCategoryId: Number(form.get("productCategoryId")),
      unitOfMeasureId: Number(form.get("unitOfMeasureId")),
      defaultSupplierId: form.get("defaultSupplierId")
        ? Number(form.get("defaultSupplierId"))
        : null,
      minimumStockLevel: Number(form.get("minimumStockLevel")),
      reorderLevel: Number(form.get("reorderLevel")),
      standardCost: Number(form.get("standardCost")),
      isPerishable: form.get("isPerishable") === "true",
      description: form.get("description"),
    };
    if (form.get("id")) {
      await api(`/api/master-data/products/${Number(form.get("id"))}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Product updated");
    } else {
      await api("/api/master-data/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Product saved");
    }
    resetForm("product-form");
    await Promise.all([loadReferenceData(), loadMasterData(), loadInventory()]);
  });

  bindForm("contract-form", async (form, formElement) => {
    const schedulePayload = buildContractSchedulePayload(form, formElement);
    const payload = {
      clientId: form.get("clientId") ? Number(form.get("clientId")) : null,
      clientLocationId: form.get("clientLocationId")
        ? Number(form.get("clientLocationId"))
        : null,
      clientName: form.get("clientName"),
      clientContactPerson: form.get("clientContactPerson"),
      clientPhone: form.get("clientPhone"),
      clientEmail: form.get("clientEmail"),
      clientAddress: form.get("clientAddress"),
      locationName: form.get("locationName"),
      locationContactPerson: form.get("locationContactPerson"),
      locationPhone: form.get("locationPhone"),
      locationAddress: form.get("locationAddress"),
      locationDeliveryNotes: form.get("locationDeliveryNotes"),
      startDate: form.get("startDate"),
      endDate: form.get("endDate"),
      billingCycle: form.get("billingCycle"),
      paymentTermId: form.get("paymentTermId")
        ? Number(form.get("paymentTermId"))
        : null,
      deliveryTypeId: form.get("deliveryTypeId")
        ? Number(form.get("deliveryTypeId"))
        : null,
      pricePerUnit: Number(form.get("pricePerUnit")),
      expectedDailyQuantity: Number(form.get("expectedDailyQuantity")),
      deliveryDays: schedulePayload.deliveryDays,
      schedules: schedulePayload.schedules,
      items: parseJsonArray(form.get("itemsJson"), "Contract items"),
      notes: form.get("notes"),
    };

    if (form.get("id")) {
      await api(`/api/contracts/${Number(form.get("id"))}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Contract updated");
    } else {
      await api("/api/contracts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Contract saved");
    }
    resetContractForm();
    await Promise.all([loadContracts(), loadDashboard()]);
  });

  bindForm("contract-status-form", async (form) => {
    const action = form.get("action");
    await api(`/api/contracts/${Number(form.get("contractId"))}/${action}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await Promise.all([loadContracts(), loadDashboard()]);
    showToast(`Contract ${action}d`);
  });

  bindForm("purchase-requisition-form", async (form) => {
    await api("/api/procurement/purchase-requisitions", {
      method: "POST",
      body: JSON.stringify({
        purchaseType: form.get("purchaseType"),
        requestDate: form.get("requestDate"),
        notes: form.get("notes"),
        items: parseJsonArray(
          form.get("itemsJson"),
          "Purchase requisition items",
        ),
      }),
    });
    resetForm("purchase-requisition-form");
    await Promise.all([loadProcurement(), loadDashboard()]);
    showToast("Purchase requisition saved");
  });

  bindForm("purchase-requisition-approve-form", async (form) => {
    await api(
      `/api/procurement/purchase-requisitions/${Number(form.get("purchaseRequisitionId"))}/approve`,
      {
        method: "POST",
        body: JSON.stringify({
          items: parseJsonArray(
            form.get("itemsJson"),
            "Approved requisition items",
          ),
        }),
      },
    );
    await Promise.all([loadProcurement(), loadDashboard()]);
    showToast("Purchase requisition approved");
  });

  bindForm("purchase-requisition-reject-form", async (form) => {
    await api(
      `/api/procurement/purchase-requisitions/${Number(form.get("purchaseRequisitionId"))}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ reason: form.get("reason") }),
      },
    );
    await loadProcurement();
    showToast("Purchase requisition rejected");
  });

  bindForm("purchase-order-form", async (form) => {
    await api("/api/procurement/purchase-orders", {
      method: "POST",
      body: JSON.stringify({
        purchaseRequisitionId: form.get("purchaseRequisitionId")
          ? Number(form.get("purchaseRequisitionId"))
          : null,
        purchaseType: form.get("purchaseType"),
        supplierId: Number(form.get("supplierId")),
        orderDate: form.get("orderDate"),
        expectedDeliveryDate: form.get("expectedDeliveryDate"),
        paymentTermId: form.get("paymentTermId")
          ? Number(form.get("paymentTermId"))
          : null,
        items: parseJsonArray(form.get("itemsJson"), "Purchase order items"),
      }),
    });
    resetForm("purchase-order-form");
    await Promise.all([loadProcurement(), loadDashboard()]);
    showToast("Purchase order created");
  });

  bindForm("goods-received-form", async (form) => {
    await api("/api/procurement/goods-received", {
      method: "POST",
      body: JSON.stringify({
        purchaseOrderId: Number(form.get("purchaseOrderId")),
        receiptDate: form.get("receiptDate"),
        items: parseJsonArray(form.get("itemsJson"), "Received items"),
      }),
    });
    resetForm("goods-received-form");
    await Promise.all([
      loadProcurement(),
      loadInventory(),
      loadDashboard(),
      loadSuppliers(),
      loadConsumption(),
    ]);
    showToast("Goods received");
  });

  bindForm("supplier-invoice-form", async (form) => {
    await api("/api/procurement/supplier-invoices", {
      method: "POST",
      body: JSON.stringify({
        invoiceNumber: form.get("invoiceNumber"),
        supplierId: Number(form.get("supplierId")),
        purchaseOrderId: form.get("purchaseOrderId")
          ? Number(form.get("purchaseOrderId"))
          : null,
        goodsReceivedNoteId: form.get("goodsReceivedNoteId")
          ? Number(form.get("goodsReceivedNoteId"))
          : null,
        invoiceDate: form.get("invoiceDate"),
        paymentMethod: form.get("paymentMethod"),
        dueDate: form.get("dueDate"),
        paymentTermId: form.get("paymentTermId")
          ? Number(form.get("paymentTermId"))
          : null,
        totalAmount: Number(form.get("totalAmount")),
      }),
    });
    resetForm("supplier-invoice-form");
    await Promise.all([loadProcurement(), loadSuppliers(), loadDashboard()]);
    showToast("Supplier invoice recorded");
  });

  bindForm("goods-requisition-form", async (form) => {
    await api("/api/procurement-system/goods-requisitions", {
      method: "POST",
      body: JSON.stringify({
        requestDate: form.get("requestDate"),
        requiredDate: form.get("requiredDate"),
        purpose: form.get("purpose"),
        items: parseJsonArray(form.get("itemsJson"), "Goods requisition items"),
      }),
    });
    resetForm("goods-requisition-form");
    await loadProcurement();
    showToast("Goods requisition saved");
  });

  bindForm("goods-requisition-action-form", async (form) => {
    const action = form.get("action");
    if (["approve", "reject", "return"].includes(action) && !hasPermission(PROCUREMENT_REQUISITION_APPROVAL_PERMISSION)) {
      throw new Error("A procurement approver must review this requisition.");
    }
    await api(`/api/procurement-system/goods-requisitions/${Number(form.get("id"))}/${action}`, {
      method: "POST",
      body: JSON.stringify({ reason: form.get("reason") }),
    });
    resetForm("goods-requisition-action-form");
    await loadProcurement();
    showToast(`Goods requisition ${action}d`);
  });

  bindForm("cash-requisition-form", async (form) => {
    const id = form.get("id");
    await api(
      id
        ? `/api/procurement-system/cash-requisitions/${Number(id)}`
        : "/api/procurement-system/cash-requisitions",
      {
        method: id ? "PUT" : "POST",
      body: JSON.stringify({
        requestDate: form.get("requestDate"),
        requiredDate: form.get("requiredDate"),
        departmentId: form.get("departmentId") ? Number(form.get("departmentId")) : null,
        purpose: form.get("purpose"),
        payeeName: form.get("payeeName"),
        amount: Number(form.get("amount")),
        notes: form.get("notes"),
      }),
      },
    );
    resetForm("cash-requisition-form");
    await loadProcurement();
    showToast(id ? "Cash requisition updated" : "Cash requisition saved");
  });

  bindForm("cash-requisition-action-form", async (form) => {
    const action = form.get("action");
    if (["approve", "reject", "return"].includes(action) && !hasPermission(PROCUREMENT_REQUISITION_APPROVAL_PERMISSION)) {
      throw new Error("A procurement approver must review this requisition.");
    }
    await api(`/api/procurement-system/cash-requisitions/${Number(form.get("id"))}/${action}`, {
      method: "POST",
      body: JSON.stringify({ reason: form.get("reason") }),
    });
    resetForm("cash-requisition-action-form");
    closeFormModal({ restoreParent: false });
    await Promise.all([
      loadProcurement(),
      canAccessApprovalQueue() ? loadApprovals().catch(() => null) : Promise.resolve(),
      loadDashboard(),
    ]);
    showToast(`Cash requisition ${action}d`);
  });

  bindForm("cash-requisition-release-form", async (form) => {
    await api(`/api/procurement-system/cash-requisitions/${Number(form.get("id"))}/release`, {
      method: "POST",
      body: JSON.stringify({
        paymentMethod: form.get("paymentMethod"),
        referenceNumber: form.get("referenceNumber"),
        notes: form.get("notes"),
      }),
    });
    resetForm("cash-requisition-release-form");
    await Promise.all([loadProcurement(), loadDashboard()]);
    showToast("Cash released");
  });

  bindForm("cash-requisition-settle-form", async (form) => {
    await api(`/api/procurement-system/cash-requisitions/${Number(form.get("id"))}/settle`, {
      method: "POST",
      body: JSON.stringify({
        settlementDate: form.get("settlementDate"),
        actualSpentAmount: Number(form.get("actualSpentAmount")),
        cashReturnedAmount: Number(form.get("cashReturnedAmount") || 0),
        receiptReference: form.get("receiptReference"),
        varianceReason: form.get("varianceReason"),
        notes: form.get("notes"),
      }),
    });
    resetForm("cash-requisition-settle-form");
    await Promise.all([loadProcurement(), loadDashboard()]);
    showToast("Cash requisition settled");
  });

  bindForm("lpo-form", async (form) => {
    await api("/api/procurement-system/lpos", {
      method: "POST",
      body: JSON.stringify({
        goodsRequisitionId: Number(form.get("goodsRequisitionId")),
        supplierId: Number(form.get("supplierId")),
        orderDate: form.get("orderDate"),
        expectedDeliveryDate: form.get("expectedDeliveryDate"),
        items: parseJsonArray(form.get("itemsJson"), "LPO items"),
      }),
    });
    resetForm("lpo-form");
    await loadProcurement();
    showToast("LPO created");
  });

  bindForm("lpo-action-form", async (form) => {
    await api(`/api/procurement-system/lpos/${Number(form.get("id"))}/${form.get("action")}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    resetForm("lpo-action-form");
    await loadProcurement();
    showToast("LPO issued");
  });

  bindForm("delivery-form", async (form) => {
    await api("/api/procurement-system/deliveries", {
      method: "POST",
      body: JSON.stringify({
        lpoId: Number(form.get("lpoId")),
        deliveryNoteNumber: form.get("deliveryNoteNumber"),
        deliveryDate: form.get("deliveryDate"),
        items: parseJsonArray(form.get("itemsJson"), "Delivery items"),
      }),
    });
    resetForm("delivery-form");
    await Promise.all([loadProcurement(), loadInventory(), loadDashboard()]);
    showToast("Delivery posted to stock");
  });

  bindForm("payment-voucher-form", async (form) => {
    const sourceType = form.get("sourceType");
    await api("/api/procurement-system/payment-vouchers", {
      method: "POST",
      body: JSON.stringify({
        supplierId: form.get("supplierId") ? Number(form.get("supplierId")) : null,
        supplierInvoiceId:
          sourceType === "invoice" && form.get("supplierInvoiceId")
            ? Number(form.get("supplierInvoiceId"))
            : null,
        cashRequisitionId:
          sourceType === "cash_requisition" && form.get("cashRequisitionId")
            ? Number(form.get("cashRequisitionId"))
            : null,
        payeeName: form.get("payeeName"),
        purpose: form.get("purpose"),
        amount: Number(form.get("amount")),
        paymentDate: form.get("paymentDate"),
        paymentMethod: form.get("paymentMethod"),
        referenceNumber: form.get("referenceNumber"),
        notes: form.get("notes"),
      }),
    });
    resetForm("payment-voucher-form");
    syncPaymentVoucherSourceFields();
    await loadProcurement();
    showToast("Payment voucher prepared");
  });

  bindForm("supplier-receipt-form", async (form) => {
    await api("/api/procurement-system/supplier-receipts", {
      method: "POST",
      body: JSON.stringify({
        paymentVoucherId: Number(form.get("paymentVoucherId")),
        supplierId: Number(form.get("supplierId")),
        receiptDate: form.get("receiptDate"),
        amount: Number(form.get("amount")),
      }),
    });
    resetForm("supplier-receipt-form");
    await loadProcurement();
    showToast("Supplier receipt registered");
  });

  bindForm("store-transfer-form", async (form) => {
    await api("/api/procurement-system/store-issues", {
      method: "POST",
      body: JSON.stringify({
        sourceStoreLocationId: Number(form.get("sourceStoreLocationId")),
        destinationStoreLocationId: Number(form.get("destinationStoreLocationId")),
        issueDate: form.get("issueDate"),
        items: parseJsonArray(form.get("itemsJson"), "Store transfer items"),
      }),
    });
    resetForm("store-transfer-form");
    await Promise.all([loadProcurement(), loadInventory(), loadDashboard()]);
    showToast("Store transfer posted");
  });

  bindForm("procurement-trace-form", async (form) => {
    const type = form.get("type");
    const response = await api(`/api/procurement-system/traceability/${type === "lpo" ? "lpos" : "goods-requisitions"}/${Number(form.get("id"))}`);
    renderDetailPayload("Procurement Traceability", response.data);
  });

  bindForm("stock-adjustment-form", async (form) => {
    await api("/api/inventory/stock-adjustments", {
      method: "POST",
      body: JSON.stringify({
        storeLocationId: Number(form.get("storeLocationId")),
        adjustmentDate: form.get("adjustmentDate"),
        reason: form.get("reason"),
        notes: form.get("notes"),
        items: parseJsonArray(form.get("itemsJson"), "Adjustment items"),
      }),
    });
    resetForm("stock-adjustment-form");
    await Promise.all([loadInventory(), loadDashboard()]);
    showToast("Stock adjustment created");
  });

  bindForm("stock-adjustment-approve-form", async (form) => {
    await api(
      `/api/inventory/stock-adjustments/${Number(form.get("adjustmentId"))}/approve`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );
    await Promise.all([loadInventory(), loadDashboard()]);
    showToast("Stock adjustment approved");
  });

  bindForm("physical-count-form", async (form) => {
    await api("/api/inventory/physical-stock-counts", {
      method: "POST",
      body: JSON.stringify({
        storeLocationId: Number(form.get("storeLocationId")),
        countDate: form.get("countDate"),
        items: parseJsonArray(form.get("itemsJson"), "Physical count items"),
      }),
    });
    resetForm("physical-count-form");
    await Promise.all([loadInventory(), loadDashboard()]);
    showToast("Physical stock count completed");
  });

  bindForm("kitchen-requisition-form", async (form) => {
    await api("/api/kitchen/requisitions", {
      method: "POST",
      body: JSON.stringify({
        requestDate: form.get("requestDate"),
        productionDate: form.get("productionDate"),
        departmentId: form.get("departmentId")
          ? Number(form.get("departmentId"))
          : null,
        sourceStoreLocationId: Number(form.get("sourceStoreLocationId")),
        items: parseJsonArray(
          form.get("itemsJson"),
          "Kitchen requisition items",
        ),
      }),
    });
    resetForm("kitchen-requisition-form");
    await Promise.all([loadKitchen(), loadDashboard()]);
    showToast("Kitchen requisition created");
  });

  bindForm("kitchen-submit-form", async (form) => {
    await api(
      `/api/kitchen/requisitions/${Number(form.get("kitchenRequisitionId"))}/submit`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );
    await Promise.all([loadKitchen(), loadDashboard()]);
    showToast("Kitchen requisition sent to Approvals");
  });

  bindForm("kitchen-approve-form", async (form) => {
    await api(
      `/api/kitchen/requisitions/${Number(form.get("kitchenRequisitionId"))}/approve`,
      {
        method: "POST",
        body: JSON.stringify({
          items: parseJsonArray(
            form.get("itemsJson"),
            "Approved kitchen items",
          ),
        }),
      },
    );
    await Promise.all([loadKitchen(), loadDashboard()]);
    showToast("Kitchen requisition approved");
  });

  bindForm("kitchen-reject-form", async (form) => {
    await api(
      `/api/kitchen/requisitions/${Number(form.get("kitchenRequisitionId"))}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ reason: form.get("reason") }),
      },
    );
    await Promise.all([loadKitchen(), loadDashboard()]);
    showToast("Kitchen requisition rejected");
  });

  bindForm("store-issue-form", async (form) => {
    await api("/api/kitchen/store-issues", {
      method: "POST",
      body: JSON.stringify({
        kitchenRequisitionId: Number(form.get("kitchenRequisitionId")),
        issueDate: form.get("issueDate"),
        items: parseJsonArray(form.get("itemsJson"), "Store issue items"),
      }),
    });
    resetForm("store-issue-form");
    await Promise.all([
      loadKitchen(),
      loadProduction(),
      loadInventory(),
      loadDashboard(),
      loadConsumption(),
    ]);
    showToast("Store issue posted");
  });

  bindForm("production-batch-form", async (form) => {
    await api("/api/kitchen/production-batches", {
      method: "POST",
      body: JSON.stringify({
        productionDate: form.get("productionDate"),
        shift: form.get("shift"),
        departmentId: form.get("departmentId")
          ? Number(form.get("departmentId"))
          : null,
        deliveryTypeId: form.get("deliveryTypeId")
          ? Number(form.get("deliveryTypeId"))
          : null,
        kitchenRequisitionId: Number(form.get("kitchenRequisitionId")),
        storeIssueId: form.get("storeIssueId")
          ? Number(form.get("storeIssueId"))
          : null,
        plannedOutput: Number(form.get("plannedOutput")),
        items: parseJsonArray(form.get("itemsJson"), "Production batch items"),
      }),
    });
    resetForm("production-batch-form");
    await Promise.all([loadKitchen(), loadProduction(), loadDashboard()]);
    showToast("Production batch created");
  });

  bindForm("complete-batch-form", async (form) => {
    await api(
      `/api/kitchen/production-batches/${Number(form.get("productionBatchId"))}/complete`,
      {
        method: "POST",
        body: JSON.stringify({
          actualOutput: Number(form.get("actualOutput")),
          wastageQuantity: Number(form.get("wastageQuantity")),
        }),
      },
    );
    await Promise.all([
      loadKitchen(),
      loadProduction(),
      loadConsumption(),
      loadDashboard(),
    ]);
    showToast("Production batch completed");
  });

  bindForm("wastage-form", async (form) => {
    await api("/api/kitchen/wastage", {
      method: "POST",
      body: JSON.stringify({
        productionBatchId: form.get("productionBatchId")
          ? Number(form.get("productionBatchId"))
          : null,
        storeIssueId: form.get("storeIssueId")
          ? Number(form.get("storeIssueId"))
          : null,
        productId: Number(form.get("productId")),
        quantity: Number(form.get("quantity")),
        recordDate: form.get("recordDate"),
        wastageType: form.get("wastageType"),
      }),
    });
    resetForm("wastage-form");
    await Promise.all([
      loadKitchen(),
      loadProduction(),
      loadConsumption(),
      loadDashboard(),
    ]);
    showToast("Wastage recorded");
  });

  bindForm("return-form", async (form) => {
    await api("/api/kitchen/returns", {
      method: "POST",
      body: JSON.stringify({
        kitchenRequisitionId: Number(form.get("kitchenRequisitionId")),
        storeIssueId: Number(form.get("storeIssueId")),
        storeLocationId: Number(form.get("storeLocationId")),
        returnDate: form.get("returnDate"),
        items: parseJsonArray(form.get("itemsJson"), "Return items"),
      }),
    });
    resetForm("return-form");
    await Promise.all([
      loadKitchen(),
      loadProduction(),
      loadInventory(),
      loadConsumption(),
      loadDashboard(),
    ]);
    showToast("Unused stock returned");
  });

  bindForm("consumption-range-form", async (form) => {
    state.consumptionRange = {
      startDate: form.get("startDate"),
      endDate: form.get("endDate"),
    };
    await loadConsumption();
    await loadReports();
    showToast("Consumption reports refreshed");
  });
}

function registerLeforiServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Ignore registration failures on unsupported hosts. */
    });
  });
}

async function bootstrap() {
  registerLeforiServiceWorker();
  readLocationState();
  window.matchMedia("(max-width:960px)").addEventListener("change", () => {
    closeMobileNavigation();
    syncOverlayAccessibility();
  });
  window.addEventListener("popstate", () => {
    readLocationState();
    showModule(state.activeModule);
    rerenderModule(state.activeModule);
  });
  const savedTheme = window.localStorage.getItem("cater-theme");
  const initialTheme = savedTheme === "dark" ? "dark" : "light";
  state.ui.darkTheme = initialTheme === "dark";
  document.documentElement.setAttribute("data-theme", initialTheme);
  document
    .getElementById("theme-btn")
    ?.setAttribute("aria-pressed", String(initialTheme === "dark"));
  document
    .getElementById("theme-btn")
    ?.setAttribute(
      "title",
      initialTheme === "dark" ? "Switch to light mode" : "Switch to dark mode",
    );
  document
    .getElementById("theme-btn")
    ?.setAttribute(
      "aria-label",
      initialTheme === "dark" ? "Switch to light mode" : "Switch to dark mode",
    );
  const initialThemeIcon = document
    .getElementById("theme-btn")
    ?.querySelector("span");
  if (initialThemeIcon) {
    initialThemeIcon.textContent = initialTheme === "dark" ? "☀" : "☾";
  }
  renderNav();
  setTodayDefaults();
  enhanceForms();
  document.querySelectorAll(".search-box-icon").forEach((icon) => {
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML =
      '<svg class="ui-icon" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
  });
  const toolbarIcons = {
    "refresh-all-btn": "M20 7v5h-5 M19 12a7 7 0 1 0-2 5 M20 12l-3-5",
    "sidebar-menu-btn": "M4 6h16 M4 12h16 M4 18h16",
  };
  for (const [id, path] of Object.entries(toolbarIcons))
    document.querySelector("#" + id + " span").innerHTML = navIcon(path);
  document.querySelector(".topbar-notify-btn > span").innerHTML = navIcon(
    "M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  );
  bindActions();
  refreshCollectionEditors();
  resetContractForm();
  await loadHealth();

  try {
    await loadSession();
    if (state.user) {
      await refreshAllData();
    }
  } catch (error) {
    showToast(error.message, "error");
  }
}

bootstrap();


/* dashboard work-source filter */
document.addEventListener("click", (event) => {
  const chip = event.target.closest("#dashboard-metrics .stat-item[data-work-source]");
  if (!chip) return;
  const dash = state.moduleData.dashboard;
  if (!dash) return;
  const source = chip.dataset.workSource;
  const matching = (dash.attentionItems || []).filter((item) => item.source === source);
  if (!matching.length) {
    // Let the existing data-nav-target handler navigate to the module.
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const next = dash.workFilter === source ? null : source;
  dash.workFilter = next;
  document.querySelectorAll("#dashboard-metrics .stat-item").forEach((el) => {
    el.classList.toggle("is-active-filter", Boolean(next) && el.dataset.workSource === next);
  });
  renderWorkQueue(dash.attentionItems || [], dash.deliveries || [], next);
}, true);
