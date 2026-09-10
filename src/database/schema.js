const bcrypt = require("bcrypt");
const { Client } = require("pg");
const { syncConfigurationMirrors, ensureConfigurationGroups } = require("../services/configuration-service");

const TABLES_IN_DROP_ORDER = [
  "role_permissions",
  "user_roles",
  "permissions",
  "roles",
  "configuration_items",
  "supplier_receipts",
  "payment_vouchers",
  "cash_requisition_settlements",
  "attachments",
  "approval_history",
  "cash_requisitions",
  "stock_return_items",
  "stock_returns",
  "wastage_records",
  "production_batch_items",
  "production_batches",
  "store_issue_items",
  "store_issues",
  "kitchen_requisition_items",
  "kitchen_requisitions",
  "physical_stock_count_items",
  "physical_stock_counts",
  "stock_adjustment_items",
  "stock_adjustments",
  "stock_movements",
  "stock_batches",
  "inventory_balances",
  "supplier_invoices",
  "goods_received_note_items",
  "goods_received_notes",
  "purchase_order_items",
  "purchase_orders",
  "purchase_requisition_items",
  "purchase_requisitions",
  "contract_items",
  "contract_schedules",
  "contracts",
  "client_locations",
  "clients",
  "products",
  "notification_rules",
  "tax_settings",
  "expense_categories",
  "delivery_types",
  "payment_terms",
  "approval_workflows",
  "numbering_series",
  "statuses",
  "departments",
  "product_categories",
  "units_of_measure",
  "store_locations",
  "configuration_groups",
  "suppliers",
  "users",
  "consumption_reports",
  "audit_logs",
  "business_profile",
  "app_settings",
];

function getSchemaSql() {
  return `
  CREATE TABLE IF NOT EXISTS business_profile (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(180) NOT NULL,
    business_phone VARCHAR(50),
    business_location VARCHAR(180),
    owner_email VARCHAR(180),
    business_type VARCHAR(40) NOT NULL DEFAULT 'catering',
    logo_data TEXT,
    logo_mime_type VARCHAR(120),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS configuration_groups (
    id SERIAL PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(140) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS configuration_items (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES configuration_groups(id) ON DELETE CASCADE,
    source_table VARCHAR(80) NOT NULL,
    source_id INTEGER NOT NULL,
    item_code VARCHAR(120) NOT NULL,
    item_name VARCHAR(180) NOT NULL,
    color VARCHAR(20),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(source_table, source_id)
  );

  CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    module_name VARCHAR(80) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(180),
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role_id)
  );

  CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
  );

  CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(180),
    address TEXT,
    status_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS client_locations (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(180) NOT NULL,
    address TEXT,
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    delivery_notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    client_location_id INTEGER NOT NULL REFERENCES client_locations(id) ON DELETE RESTRICT,
    contract_number VARCHAR(60) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    billing_cycle VARCHAR(40) NOT NULL,
    payment_terms VARCHAR(120),
    payment_term_id INTEGER,
    delivery_type_id INTEGER,
    status_id INTEGER,
    price_per_unit NUMERIC(14, 2) NOT NULL DEFAULT 0,
    expected_daily_quantity NUMERIC(14, 2) NOT NULL DEFAULT 0,
    delivery_days TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS contract_schedules (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    schedule_type VARCHAR(20) NOT NULL,
    day_of_week INTEGER,
    day_of_month INTEGER,
    specific_date DATE,
    quantity NUMERIC(14, 2) NOT NULL DEFAULT 0,
    delivery_time VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(180),
    address TEXT,
    payment_terms VARCHAR(120),
    payment_term_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS units_of_measure (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS store_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    location_type VARCHAR(40) NOT NULL DEFAULT 'Central Store',
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS statuses (
    id SERIAL PRIMARY KEY,
    status_name VARCHAR(80) NOT NULL,
    status_code VARCHAR(80) NOT NULL,
    module_key VARCHAR(80) NOT NULL DEFAULT 'global',
    color VARCHAR(20) NOT NULL DEFAULT '#98A2B3',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_terminal BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(status_code, module_key)
  );

  CREATE TABLE IF NOT EXISTS numbering_series (
    id SERIAL PRIMARY KEY,
    document_type VARCHAR(120) NOT NULL UNIQUE,
    document_key VARCHAR(80) NOT NULL UNIQUE,
    prefix VARCHAR(20) NOT NULL,
    current_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    current_month INTEGER NOT NULL DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
    current_number INTEGER NOT NULL DEFAULT 0,
    padding_length INTEGER NOT NULL DEFAULT 4,
    reset_frequency VARCHAR(20) NOT NULL DEFAULT 'Yearly',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS approval_workflows (
    id SERIAL PRIMARY KEY,
    workflow_name VARCHAR(160) NOT NULL,
    document_type VARCHAR(120) NOT NULL,
    required_role VARCHAR(80) NOT NULL,
    approval_level INTEGER NOT NULL DEFAULT 1,
    min_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    max_amount NUMERIC(14, 2) NOT NULL DEFAULT 999999999999,
    can_creator_approve BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(document_type, approval_level, required_role)
  );

  CREATE TABLE IF NOT EXISTS payment_terms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    days_due INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS delivery_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS expense_categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS tax_settings (
    id SERIAL PRIMARY KEY,
    tax_name VARCHAR(120) NOT NULL UNIQUE,
    tax_rate NUMERIC(8, 4) NOT NULL DEFAULT 0,
    applies_to_purchases BOOLEAN NOT NULL DEFAULT TRUE,
    applies_to_sales BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS notification_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(160) NOT NULL UNIQUE,
    trigger_type VARCHAR(80) NOT NULL,
    threshold_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    recipient_role VARCHAR(80) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    sku VARCHAR(80) UNIQUE,
    product_type VARCHAR(40) NOT NULL DEFAULT 'Raw Material',
    product_category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
    unit_of_measure_id INTEGER REFERENCES units_of_measure(id) ON DELETE SET NULL,
    minimum_stock_level NUMERIC(14, 2) NOT NULL DEFAULT 0,
    reorder_level NUMERIC(14, 2) NOT NULL DEFAULT 0,
    standard_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    is_perishable BOOLEAN NOT NULL DEFAULT FALSE,
    default_supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS contract_items (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    service_unit VARCHAR(60) NOT NULL DEFAULT 'Meal',
    quantity_per_delivery NUMERIC(14, 2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id SERIAL PRIMARY KEY,
    requisition_number VARCHAR(60) NOT NULL UNIQUE,
    request_date DATE NOT NULL,
    purchase_type VARCHAR(20) NOT NULL DEFAULT 'Weekly' CHECK (purchase_type IN ('Daily', 'Weekly')),
    status_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rejected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS purchase_requisition_items (
    id SERIAL PRIMARY KEY,
    purchase_requisition_id INTEGER NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_requested NUMERIC(14, 2) NOT NULL DEFAULT 0,
    quantity_approved NUMERIC(14, 2) NOT NULL DEFAULT 0,
    estimated_unit_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    preferred_supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(60) NOT NULL UNIQUE,
    purchase_requisition_id INTEGER REFERENCES purchase_requisitions(id) ON DELETE SET NULL,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL,
    purchase_type VARCHAR(20) NOT NULL DEFAULT 'Weekly' CHECK (purchase_type IN ('Daily', 'Weekly')),
    expected_delivery_date DATE,
    payment_term_id INTEGER,
    status_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_ordered NUMERIC(14, 2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    line_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS goods_received_notes (
    id SERIAL PRIMARY KEY,
    grn_number VARCHAR(60) NOT NULL UNIQUE,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    store_location_id INTEGER NOT NULL REFERENCES store_locations(id) ON DELETE RESTRICT,
    receipt_date DATE NOT NULL,
    status_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    received_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    confirmed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS goods_received_note_items (
    id SERIAL PRIMARY KEY,
    goods_received_note_id INTEGER NOT NULL REFERENCES goods_received_notes(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_received NUMERIC(14, 2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    line_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    batch_number VARCHAR(80),
    expiry_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS supplier_invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(80) NOT NULL UNIQUE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL,
    goods_received_note_id INTEGER REFERENCES goods_received_notes(id) ON DELETE SET NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'Credit',
    payment_term_id INTEGER,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0,
    payment_status_id INTEGER,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    status_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'Open',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS inventory_balances (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_location_id INTEGER NOT NULL REFERENCES store_locations(id) ON DELETE CASCADE,
    quantity_on_hand NUMERIC(14, 2) NOT NULL DEFAULT 0,
    stock_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, store_location_id)
  );

  CREATE TABLE IF NOT EXISTS stock_batches (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    store_location_id INTEGER NOT NULL REFERENCES store_locations(id) ON DELETE RESTRICT,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    goods_received_note_id INTEGER REFERENCES goods_received_notes(id) ON DELETE SET NULL,
    batch_number VARCHAR(80) NOT NULL,
    expiry_date DATE,
    quantity_received NUMERIC(14, 2) NOT NULL DEFAULT 0,
    quantity_remaining NUMERIC(14, 2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    received_at DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    store_location_id INTEGER NOT NULL REFERENCES store_locations(id) ON DELETE RESTRICT,
    stock_batch_id INTEGER REFERENCES stock_batches(id) ON DELETE SET NULL,
    movement_type VARCHAR(40) NOT NULL,
    reference_type VARCHAR(60) NOT NULL,
    reference_id INTEGER,
    quantity_in NUMERIC(14, 2) NOT NULL DEFAULT 0,
    quantity_out NUMERIC(14, 2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    balance_after NUMERIC(14, 2) NOT NULL DEFAULT 0,
    movement_date DATE NOT NULL,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS stock_adjustments (
    id SERIAL PRIMARY KEY,
    adjustment_number VARCHAR(60) NOT NULL UNIQUE,
    store_location_id INTEGER NOT NULL REFERENCES store_locations(id) ON DELETE RESTRICT,
    adjustment_date DATE NOT NULL,
    reason VARCHAR(120) NOT NULL,
    status_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS stock_adjustment_items (
    id SERIAL PRIMARY KEY,
    stock_adjustment_id INTEGER NOT NULL REFERENCES stock_adjustments(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_delta NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS physical_stock_counts (
    id SERIAL PRIMARY KEY,
    count_number VARCHAR(60) NOT NULL UNIQUE,
    store_location_id INTEGER NOT NULL REFERENCES store_locations(id) ON DELETE RESTRICT,
    count_date DATE NOT NULL,
    status_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    counted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS physical_stock_count_items (
    id SERIAL PRIMARY KEY,
    physical_stock_count_id INTEGER NOT NULL REFERENCES physical_stock_counts(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    system_quantity NUMERIC(14, 2) NOT NULL DEFAULT 0,
    counted_quantity NUMERIC(14, 2) NOT NULL DEFAULT 0,
    variance_quantity NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS kitchen_requisitions (
    id SERIAL PRIMARY KEY,
    requisition_number VARCHAR(60) NOT NULL UNIQUE,
    request_date DATE NOT NULL,
    production_date DATE NOT NULL,
    department_id INTEGER,
    department_name VARCHAR(120) NOT NULL,
    source_store_location_id INTEGER NOT NULL REFERENCES store_locations(id) ON DELETE RESTRICT,
    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rejected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS kitchen_requisition_items (
    id SERIAL PRIMARY KEY,
    kitchen_requisition_id INTEGER NOT NULL REFERENCES kitchen_requisitions(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    requested_quantity NUMERIC(14, 2) NOT NULL DEFAULT 0,
    approved_quantity NUMERIC(14, 2) NOT NULL DEFAULT 0,
    issued_quantity NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS store_issues (
    id SERIAL PRIMARY KEY,
    issue_number VARCHAR(60) NOT NULL UNIQUE,
    kitchen_requisition_id INTEGER NOT NULL REFERENCES kitchen_requisitions(id) ON DELETE RESTRICT,
    source_store_location_id INTEGER NOT NULL REFERENCES store_locations(id) ON DELETE RESTRICT,
    department_id INTEGER,
    department_name VARCHAR(120) NOT NULL,
    issue_date DATE NOT NULL,
    status_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS store_issue_items (
    id SERIAL PRIMARY KEY,
    store_issue_id INTEGER NOT NULL REFERENCES store_issues(id) ON DELETE CASCADE,
    kitchen_requisition_item_id INTEGER REFERENCES kitchen_requisition_items(id) ON DELETE SET NULL,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    approved_quantity NUMERIC(14, 2) NOT NULL DEFAULT 0,
    issued_quantity NUMERIC(14, 2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS production_batches (
    id SERIAL PRIMARY KEY,
    batch_number VARCHAR(60) NOT NULL UNIQUE,
    production_date DATE NOT NULL,
    shift VARCHAR(60) NOT NULL,
    department_id INTEGER,
    delivery_type_id INTEGER,
    supervisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    kitchen_requisition_id INTEGER NOT NULL REFERENCES kitchen_requisitions(id) ON DELETE RESTRICT,
    store_issue_id INTEGER REFERENCES store_issues(id) ON DELETE SET NULL,
    planned_output NUMERIC(14, 2) NOT NULL DEFAULT 0,
    actual_output NUMERIC(14, 2) NOT NULL DEFAULT 0,
    wastage_quantity NUMERIC(14, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    status_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS production_batch_items (
    id SERIAL PRIMARY KEY,
    production_batch_id INTEGER NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_consumed NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS wastage_records (
    id SERIAL PRIMARY KEY,
    production_batch_id INTEGER REFERENCES production_batches(id) ON DELETE SET NULL,
    store_issue_id INTEGER REFERENCES store_issues(id) ON DELETE SET NULL,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(14, 2) NOT NULL DEFAULT 0,
    wastage_type VARCHAR(60) NOT NULL DEFAULT 'Production',
    wastage_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    record_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS stock_returns (
    id SERIAL PRIMARY KEY,
    return_number VARCHAR(60) NOT NULL UNIQUE,
    kitchen_requisition_id INTEGER NOT NULL REFERENCES kitchen_requisitions(id) ON DELETE RESTRICT,
    store_issue_id INTEGER NOT NULL REFERENCES store_issues(id) ON DELETE RESTRICT,
    store_location_id INTEGER NOT NULL REFERENCES store_locations(id) ON DELETE RESTRICT,
    return_date DATE NOT NULL,
    status_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'Confirmed',
    received_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS stock_return_items (
    id SERIAL PRIMARY KEY,
    stock_return_id INTEGER NOT NULL REFERENCES stock_returns(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_returned NUMERIC(14, 2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS consumption_reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(40) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    report_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'Success',
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS approval_history (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(80) NOT NULL,
    entity_id INTEGER NOT NULL,
    action VARCHAR(40) NOT NULL,
    from_status VARCHAR(60),
    to_status VARCHAR(60),
    comment TEXT,
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(80) NOT NULL,
    entity_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120),
    file_size INTEGER,
    storage_key VARCHAR(255),
    file_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS cash_requisitions (
    id SERIAL PRIMARY KEY,
    requisition_number VARCHAR(60) NOT NULL UNIQUE,
    request_date DATE NOT NULL,
    required_date DATE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    purpose TEXT NOT NULL,
    payee_name VARCHAR(180),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency_code VARCHAR(10) NOT NULL DEFAULT 'UGX',
    status_id INTEGER,
    status VARCHAR(40) NOT NULL DEFAULT 'Draft',
    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rejected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    returned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    released_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    release_payment_method VARCHAR(60),
    release_reference_number VARCHAR(120),
    release_notes TEXT,
    submitted_at TIMESTAMP,
    rejection_reason TEXT,
    return_reason TEXT,
    approved_at TIMESTAMP,
    cash_released_at TIMESTAMP,
    completed_at TIMESTAMP,
    idempotency_key VARCHAR(120),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS cash_requisition_settlements (
    id SERIAL PRIMARY KEY,
    cash_requisition_id INTEGER NOT NULL UNIQUE REFERENCES cash_requisitions(id) ON DELETE CASCADE,
    settlement_date DATE NOT NULL,
    actual_spent_amount NUMERIC(14, 2) NOT NULL CHECK (actual_spent_amount >= 0),
    cash_returned_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (cash_returned_amount >= 0),
    variance_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    variance_reason TEXT,
    receipt_reference VARCHAR(120),
    receipt_attachment_id INTEGER REFERENCES attachments(id) ON DELETE SET NULL,
    settled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    settled_at TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  ALTER TABLE cash_requisition_settlements
    ADD COLUMN IF NOT EXISTS variance_reason TEXT,
    ADD COLUMN IF NOT EXISTS receipt_reference VARCHAR(120),
    ADD COLUMN IF NOT EXISTS receipt_attachment_id INTEGER,
    ADD COLUMN IF NOT EXISTS settled_by INTEGER,
    ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

  CREATE UNIQUE INDEX IF NOT EXISTS cash_requisition_settlements_requisition_uq
    ON cash_requisition_settlements (cash_requisition_id);

  CREATE TABLE IF NOT EXISTS payment_vouchers (
    id SERIAL PRIMARY KEY,
    voucher_number VARCHAR(60) NOT NULL UNIQUE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE RESTRICT,
    supplier_invoice_id INTEGER REFERENCES supplier_invoices(id) ON DELETE SET NULL,
    cash_requisition_id INTEGER,
    purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_method VARCHAR(60) NOT NULL,
    reference_number VARCHAR(120),
    status_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    prepared_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    paid_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    supporting_attachment_id INTEGER REFERENCES attachments(id) ON DELETE SET NULL,
    idempotency_key VARCHAR(120),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS supplier_receipts (
    id SERIAL PRIMARY KEY,
    receipt_number VARCHAR(80) NOT NULL UNIQUE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    supplier_invoice_id INTEGER REFERENCES supplier_invoices(id) ON DELETE SET NULL,
    payment_voucher_id INTEGER REFERENCES payment_vouchers(id) ON DELETE SET NULL,
    receipt_date DATE NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    attachment_id INTEGER REFERENCES attachments(id) ON DELETE SET NULL,
    registered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Registered',
    idempotency_key VARCHAR(120),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  ALTER TABLE purchase_requisitions
    ADD COLUMN IF NOT EXISTS requisition_type VARCHAR(20) NOT NULL DEFAULT 'LEGACY',
    ADD COLUMN IF NOT EXISTS purpose TEXT,
    ADD COLUMN IF NOT EXISTS required_date DATE,
    ADD COLUMN IF NOT EXISTS department_id INTEGER,
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS returned_by INTEGER,
    ADD COLUMN IF NOT EXISTS return_reason TEXT,
    ADD COLUMN IF NOT EXISTS cancelled_by INTEGER,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120);

  ALTER TABLE purchase_requisitions ALTER COLUMN requisition_type SET DEFAULT 'LEGACY';
  UPDATE purchase_requisitions
  SET requisition_type = 'LEGACY'
  WHERE purpose IS NULL;

  ALTER TABLE cash_requisitions
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS release_payment_method VARCHAR(60),
    ADD COLUMN IF NOT EXISTS release_reference_number VARCHAR(120),
    ADD COLUMN IF NOT EXISTS release_notes TEXT;

  ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS lpo_number VARCHAR(60),
    ADD COLUMN IF NOT EXISTS issued_by INTEGER,
    ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120);

  ALTER TABLE goods_received_notes
    ADD COLUMN IF NOT EXISTS delivery_note_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS supplier_invoice_id INTEGER,
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120),
    ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP;

  ALTER TABLE supplier_invoices
    ADD COLUMN IF NOT EXISTS attachment_id INTEGER,
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120),
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'Credit';

  UPDATE supplier_invoices
  SET payment_method = 'Credit'
  WHERE payment_method IS NULL OR BTRIM(payment_method) = '';

  ALTER TABLE supplier_invoices
    ALTER COLUMN payment_method SET DEFAULT 'Credit',
    ALTER COLUMN payment_method SET NOT NULL;

  ALTER TABLE payment_vouchers
    ALTER COLUMN supplier_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS reference_number VARCHAR(120),
    ADD COLUMN IF NOT EXISTS cash_requisition_id INTEGER;

  ALTER TABLE store_issues
    ALTER COLUMN kitchen_requisition_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS destination_store_location_id INTEGER,
    ADD COLUMN IF NOT EXISTS issue_type VARCHAR(40) NOT NULL DEFAULT 'KITCHEN',
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120);

  CREATE UNIQUE INDEX IF NOT EXISTS purchase_requisitions_idempotency_key_uq
    ON purchase_requisitions (idempotency_key) WHERE idempotency_key IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS cash_requisitions_idempotency_key_uq
    ON cash_requisitions (idempotency_key) WHERE idempotency_key IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS purchase_orders_lpo_number_uq
    ON purchase_orders (lpo_number) WHERE lpo_number IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS purchase_orders_idempotency_key_uq
    ON purchase_orders (idempotency_key) WHERE idempotency_key IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS goods_received_notes_delivery_note_uq
    ON goods_received_notes (purchase_order_id, delivery_note_number)
    WHERE delivery_note_number IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS goods_received_notes_idempotency_key_uq
    ON goods_received_notes (idempotency_key) WHERE idempotency_key IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS supplier_invoices_supplier_number_uq
    ON supplier_invoices (supplier_id, LOWER(invoice_number));
  CREATE UNIQUE INDEX IF NOT EXISTS supplier_invoices_idempotency_key_uq
    ON supplier_invoices (idempotency_key) WHERE idempotency_key IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS payment_vouchers_idempotency_key_uq
    ON payment_vouchers (idempotency_key) WHERE idempotency_key IS NOT NULL;
  CREATE INDEX IF NOT EXISTS payment_vouchers_cash_requisition_idx
    ON payment_vouchers (cash_requisition_id);
  CREATE UNIQUE INDEX IF NOT EXISTS supplier_receipts_idempotency_key_uq
    ON supplier_receipts (idempotency_key) WHERE idempotency_key IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS supplier_receipts_payment_voucher_uq
    ON supplier_receipts (payment_voucher_id) WHERE payment_voucher_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS approval_history_entity_idx
    ON approval_history (entity_type, entity_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS attachments_entity_idx
    ON attachments (entity_type, entity_id, created_at DESC);

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'status_id'
    ) THEN
      ALTER TABLE clients ADD COLUMN status_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'payment_term_id'
    ) THEN
      ALTER TABLE suppliers ADD COLUMN payment_term_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'product_categories' AND column_name = 'sort_order'
    ) THEN
      ALTER TABLE product_categories ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'product_categories' AND column_name = 'is_active'
    ) THEN
      ALTER TABLE product_categories ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'units_of_measure' AND column_name = 'description'
    ) THEN
      ALTER TABLE units_of_measure ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'units_of_measure' AND column_name = 'sort_order'
    ) THEN
      ALTER TABLE units_of_measure ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'units_of_measure' AND column_name = 'is_active'
    ) THEN
      ALTER TABLE units_of_measure ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'store_locations' AND column_name = 'sort_order'
    ) THEN
      ALTER TABLE store_locations ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'payment_term_id'
    ) THEN
      ALTER TABLE contracts ADD COLUMN payment_term_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'delivery_type_id'
    ) THEN
      ALTER TABLE contracts ADD COLUMN delivery_type_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'status_id'
    ) THEN
      ALTER TABLE contracts ADD COLUMN status_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_requisitions' AND column_name = 'status_id'
    ) THEN
      ALTER TABLE purchase_requisitions ADD COLUMN status_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_requisitions' AND column_name = 'purchase_type'
    ) THEN
      ALTER TABLE purchase_requisitions ADD COLUMN purchase_type VARCHAR(20) NOT NULL DEFAULT 'Weekly';
    END IF;

    UPDATE purchase_requisitions
    SET purchase_type = CASE
      WHEN LOWER(TRIM(purchase_type)) = 'daily' THEN 'Daily'
      ELSE 'Weekly'
    END
    WHERE purchase_type IS NULL OR purchase_type NOT IN ('Daily', 'Weekly');

    ALTER TABLE purchase_requisitions ALTER COLUMN purchase_type SET DEFAULT 'Weekly';
    ALTER TABLE purchase_requisitions ALTER COLUMN purchase_type SET NOT NULL;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'payment_term_id'
    ) THEN
      ALTER TABLE purchase_orders ADD COLUMN payment_term_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'purchase_type'
    ) THEN
      ALTER TABLE purchase_orders ADD COLUMN purchase_type VARCHAR(20) NOT NULL DEFAULT 'Weekly';
    END IF;

    UPDATE purchase_orders
    SET purchase_type = CASE
      WHEN LOWER(TRIM(purchase_type)) = 'daily' THEN 'Daily'
      ELSE 'Weekly'
    END
    WHERE purchase_type IS NULL OR purchase_type NOT IN ('Daily', 'Weekly');

    ALTER TABLE purchase_orders ALTER COLUMN purchase_type SET DEFAULT 'Weekly';
    ALTER TABLE purchase_orders ALTER COLUMN purchase_type SET NOT NULL;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'status_id'
    ) THEN
      ALTER TABLE purchase_orders ADD COLUMN status_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'goods_received_notes' AND column_name = 'status_id'
    ) THEN
      ALTER TABLE goods_received_notes ADD COLUMN status_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'supplier_invoices' AND column_name = 'payment_term_id'
    ) THEN
      ALTER TABLE supplier_invoices ADD COLUMN payment_term_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'supplier_invoices' AND column_name = 'payment_status_id'
    ) THEN
      ALTER TABLE supplier_invoices ADD COLUMN payment_status_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'supplier_invoices' AND column_name = 'status_id'
    ) THEN
      ALTER TABLE supplier_invoices ADD COLUMN status_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_adjustments' AND column_name = 'status_id'
    ) THEN
      ALTER TABLE stock_adjustments ADD COLUMN status_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'physical_stock_counts' AND column_name = 'status_id'
    ) THEN
      ALTER TABLE physical_stock_counts ADD COLUMN status_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'kitchen_requisitions' AND column_name = 'department_id'
    ) THEN
      ALTER TABLE kitchen_requisitions ADD COLUMN department_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'kitchen_requisitions' AND column_name = 'status_id'
    ) THEN
      ALTER TABLE kitchen_requisitions ADD COLUMN status_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'store_issues' AND column_name = 'department_id'
    ) THEN
      ALTER TABLE store_issues ADD COLUMN department_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'store_issues' AND column_name = 'status_id'
    ) THEN
      ALTER TABLE store_issues ADD COLUMN status_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'production_batches' AND column_name = 'department_id'
    ) THEN
      ALTER TABLE production_batches ADD COLUMN department_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'production_batches' AND column_name = 'delivery_type_id'
    ) THEN
      ALTER TABLE production_batches ADD COLUMN delivery_type_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'production_batches' AND column_name = 'status_id'
    ) THEN
      ALTER TABLE production_batches ADD COLUMN status_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_returns' AND column_name = 'status_id'
    ) THEN
      ALTER TABLE stock_returns ADD COLUMN status_id INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'contract_schedules'
        AND column_name = 'specific_date'
    ) THEN
      ALTER TABLE contract_schedules
        ADD COLUMN specific_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'suppliers_payment_term_fk') THEN
      ALTER TABLE suppliers
        ADD CONSTRAINT suppliers_payment_term_fk
        FOREIGN KEY (payment_term_id) REFERENCES payment_terms(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_payment_term_fk') THEN
      ALTER TABLE contracts
        ADD CONSTRAINT contracts_payment_term_fk
        FOREIGN KEY (payment_term_id) REFERENCES payment_terms(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_delivery_type_fk') THEN
      ALTER TABLE contracts
        ADD CONSTRAINT contracts_delivery_type_fk
        FOREIGN KEY (delivery_type_id) REFERENCES delivery_types(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_status_fk') THEN
      ALTER TABLE contracts
        ADD CONSTRAINT contracts_status_fk
        FOREIGN KEY (status_id) REFERENCES statuses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_requisitions_status_fk') THEN
      ALTER TABLE purchase_requisitions
        ADD CONSTRAINT purchase_requisitions_status_fk
        FOREIGN KEY (status_id) REFERENCES statuses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_requisitions_purchase_type_check') THEN
      ALTER TABLE purchase_requisitions
        ADD CONSTRAINT purchase_requisitions_purchase_type_check
        CHECK (purchase_type IN ('Daily', 'Weekly'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_status_fk') THEN
      ALTER TABLE purchase_orders
        ADD CONSTRAINT purchase_orders_status_fk
        FOREIGN KEY (status_id) REFERENCES statuses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_payment_term_fk') THEN
      ALTER TABLE purchase_orders
        ADD CONSTRAINT purchase_orders_payment_term_fk
        FOREIGN KEY (payment_term_id) REFERENCES payment_terms(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_purchase_type_check') THEN
      ALTER TABLE purchase_orders
        ADD CONSTRAINT purchase_orders_purchase_type_check
        CHECK (purchase_type IN ('Daily', 'Weekly'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'goods_received_notes_status_fk') THEN
      ALTER TABLE goods_received_notes
        ADD CONSTRAINT goods_received_notes_status_fk
        FOREIGN KEY (status_id) REFERENCES statuses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_invoices_payment_term_fk') THEN
      ALTER TABLE supplier_invoices
        ADD CONSTRAINT supplier_invoices_payment_term_fk
        FOREIGN KEY (payment_term_id) REFERENCES payment_terms(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_invoices_status_fk') THEN
      ALTER TABLE supplier_invoices
        ADD CONSTRAINT supplier_invoices_status_fk
        FOREIGN KEY (status_id) REFERENCES statuses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_invoices_payment_status_fk') THEN
      ALTER TABLE supplier_invoices
        ADD CONSTRAINT supplier_invoices_payment_status_fk
        FOREIGN KEY (payment_status_id) REFERENCES statuses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_adjustments_status_fk') THEN
      ALTER TABLE stock_adjustments
        ADD CONSTRAINT stock_adjustments_status_fk
        FOREIGN KEY (status_id) REFERENCES statuses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'physical_stock_counts_status_fk') THEN
      ALTER TABLE physical_stock_counts
        ADD CONSTRAINT physical_stock_counts_status_fk
        FOREIGN KEY (status_id) REFERENCES statuses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kitchen_requisitions_department_fk') THEN
      ALTER TABLE kitchen_requisitions
        ADD CONSTRAINT kitchen_requisitions_department_fk
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kitchen_requisitions_status_fk') THEN
      ALTER TABLE kitchen_requisitions
        ADD CONSTRAINT kitchen_requisitions_status_fk
        FOREIGN KEY (status_id) REFERENCES statuses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_issues_department_fk') THEN
      ALTER TABLE store_issues
        ADD CONSTRAINT store_issues_department_fk
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_issues_status_fk') THEN
      ALTER TABLE store_issues
        ADD CONSTRAINT store_issues_status_fk
        FOREIGN KEY (status_id) REFERENCES statuses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_batches_department_fk') THEN
      ALTER TABLE production_batches
        ADD CONSTRAINT production_batches_department_fk
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_batches_delivery_type_fk') THEN
      ALTER TABLE production_batches
        ADD CONSTRAINT production_batches_delivery_type_fk
        FOREIGN KEY (delivery_type_id) REFERENCES delivery_types(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_batches_status_fk') THEN
      ALTER TABLE production_batches
        ADD CONSTRAINT production_batches_status_fk
        FOREIGN KEY (status_id) REFERENCES statuses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_returns_status_fk') THEN
      ALTER TABLE stock_returns
        ADD CONSTRAINT stock_returns_status_fk
        FOREIGN KEY (status_id) REFERENCES statuses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approval_workflows_unique_rule') THEN
      ALTER TABLE approval_workflows
        ADD CONSTRAINT approval_workflows_unique_rule
        UNIQUE (document_type, approval_level, required_role);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_requisitions_department_fk') THEN
      ALTER TABLE purchase_requisitions
        ADD CONSTRAINT purchase_requisitions_department_fk
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_requisitions_requisition_type_check') THEN
      ALTER TABLE purchase_requisitions
        ADD CONSTRAINT purchase_requisitions_requisition_type_check
        CHECK (requisition_type IN ('GOODS', 'LEGACY'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_issued_by_fk') THEN
      ALTER TABLE purchase_orders
        ADD CONSTRAINT purchase_orders_issued_by_fk
        FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'goods_received_notes_supplier_invoice_fk') THEN
      ALTER TABLE goods_received_notes
        ADD CONSTRAINT goods_received_notes_supplier_invoice_fk
        FOREIGN KEY (supplier_invoice_id) REFERENCES supplier_invoices(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_invoices_attachment_fk') THEN
      ALTER TABLE supplier_invoices
        ADD CONSTRAINT supplier_invoices_attachment_fk
        FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_vouchers_cash_requisition_fk') THEN
      ALTER TABLE payment_vouchers
        ADD CONSTRAINT payment_vouchers_cash_requisition_fk
        FOREIGN KEY (cash_requisition_id) REFERENCES cash_requisitions(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_issues_destination_store_fk') THEN
      ALTER TABLE store_issues
        ADD CONSTRAINT store_issues_destination_store_fk
        FOREIGN KEY (destination_store_location_id) REFERENCES store_locations(id) ON DELETE RESTRICT;
    END IF;
  END
  $$;
  `;
}

function getResetSql() {
  return [
    "DROP TABLE IF EXISTS supplier_payments CASCADE;",
    ...TABLES_IN_DROP_ORDER.map((tableName) => `DROP TABLE IF EXISTS ${tableName} CASCADE;`),
  ].join("\n");
}

function getSequence(prefix, number) {
  return `${prefix}-${String(number).padStart(4, "0")}`;
}

async function ensureDatabaseExists(connectionConfig) {
  // Managed PostgreSQL services provide a connection string for an already
  // provisioned database. There is no separate admin connection to establish
  // in this mode, and attempting to read host/port from the connection-string
  // config would silently fall back to localhost.
  if (connectionConfig.connectionString) {
    return;
  }

  const adminClient = new Client({
    host: connectionConfig.host,
    port: connectionConfig.port,
    user: connectionConfig.user,
    password: connectionConfig.password,
    ssl: connectionConfig.ssl,
    database: "postgres",
  });

  await adminClient.connect();
  try {
    const existing = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [
      connectionConfig.database,
    ]);
    if (!existing.rowCount) {
      await adminClient.query(`CREATE DATABASE "${connectionConfig.database}"`);
    }
  } finally {
    await adminClient.end();
  }
}

async function seedReferenceData(db) {
  await db.exec(
    `INSERT INTO business_profile (business_name, business_phone, business_location, owner_email, business_type)
     SELECT 'Kampala Kitchen Catering', '+256 414 250180', 'Plot 18, 5th Street, Industrial Area, Kampala', 'ops@kampalakitchen.ug', 'catering'
     WHERE NOT EXISTS (SELECT 1 FROM business_profile)`
  );

  await db.exec(
    `INSERT INTO app_settings (id, settings)
     VALUES (1, ?::jsonb)
     ON CONFLICT (id)
     DO UPDATE SET settings = EXCLUDED.settings, updated_at = NOW()`,
    [
      JSON.stringify({
        currencyCode: "UGX",
        timezone: "Africa/Kampala",
        dashboardRefreshMinutes: 15,
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
      }),
    ]
  );

  const roles = [
    ["admin", "Admin", "Full system access."],
    ["procurement_officer", "Procurement Officer", "Manage suppliers and procurement flows."],
    ["store_manager", "Store Manager", "Manage stores, stock, counts, issues, and kitchen requisition approvals."],
    ["kitchen_supervisor", "Kitchen Supervisor", "Manage kitchen requisitions, production, and wastage."],
    ["finance_officer", "Finance Officer", "Release and reconcile cash requisitions, invoices, payments, and billing reports."],
    ["manager", "Manager", "Approve procurement requisitions and control cash release and settlement."],
  ];

  for (const [code, name, description] of roles) {
    await db.exec(
      `INSERT INTO roles (code, name, description)
       VALUES (?, ?, ?)
       ON CONFLICT (code)
       DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
      [code, name, description]
    );
  }

  const permissions = [
    ["procurement_requisitions.approve", "Approve procurement requisitions", "Approvals"],
    ["kitchen_requisitions.approve", "Approve kitchen requisitions", "Approvals"],
    ["cash_requisitions.release", "Release approved cash requisitions", "Cash Requisitions"],
    ["cash_requisitions.settle", "Settle released cash requisitions", "Cash Requisitions"],
  ];

  // Permission grants are intentionally rebuilt, not only appended. This keeps
  // local development databases from retaining stale role assignments.
  await db.exec("DELETE FROM role_permissions");
  await db.exec(
    `DELETE FROM permissions WHERE code NOT IN (?, ?, ?, ?)`,
    permissions.map(([code]) => code)
  );

  for (const [code, name, moduleName] of permissions) {
    await db.exec(
      `INSERT INTO permissions (code, name, module_name)
       VALUES (?, ?, ?)
       ON CONFLICT (code)
       DO UPDATE SET name = EXCLUDED.name, module_name = EXCLUDED.module_name`,
      [code, name, moduleName]
    );
  }

  const rolePermissions = {
    admin: permissions.map(([code]) => code),
    procurement_officer: [],
    store_manager: ["kitchen_requisitions.approve"],
    kitchen_supervisor: [],
    finance_officer: ["cash_requisitions.release", "cash_requisitions.settle"],
    manager: ["procurement_requisitions.approve", "cash_requisitions.release", "cash_requisitions.settle"],
  };

  for (const [roleCode, permissionCodes] of Object.entries(rolePermissions)) {
    const role = await db.get("SELECT id FROM roles WHERE code = ?", [roleCode]);
    for (const permissionCode of permissionCodes) {
      const permission = await db.get("SELECT id FROM permissions WHERE code = ?", [permissionCode]);
      await db.exec(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES (?, ?)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [role.id, permission.id]
      );
    }
  }

  await ensureConfigurationGroups(db);

  const units = [
    ["kg", "Kilogram", "Standard solid weight unit", 10],
    ["g", "Gram", "Small solid weight unit", 20],
    ["ltr", "Litre", "Liquid volume unit", 30],
    ["ml", "Millilitre", "Small liquid volume unit", 40],
    ["pcs", "Pieces", "Discrete unit count", 50],
    ["box", "Box", "Packed carton or box unit", 60],
    ["sack", "Sack", "Bulk sack unit", 70],
    ["crate", "Crate", "Crate-based handling unit", 80],
    ["tray", "Tray", "Tray serving or storage unit", 90],
    ["pack", "Pack", "Packaged grouping unit", 100],
    ["bunch", "Bunch", "Tied produce bunch", 105],
    ["meal", "Meal", "Finished meal service unit", 110],
  ];

  for (const [code, name, description, sortOrder] of units) {
    await db.exec(
      `INSERT INTO units_of_measure (code, name, description, sort_order, is_active)
       VALUES (?, ?, ?, ?, TRUE)
       ON CONFLICT (code)
       DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, is_active = TRUE`,
      [code, name, description, sortOrder]
    );
  }

  const categories = [
    ["Raw Materials", "Food ingredients and primary supplies", 10],
    ["Grains", "Dry grains, cereals, and starches", 20],
    ["Meat", "Fresh and processed meat products", 30],
    ["Vegetables", "Fresh produce and greens", 40],
    ["Cooking Oil", "Oils, fats, and frying media", 50],
    ["Packaging", "Packaging and disposables", 60],
    ["Cleaning Supplies", "Cleaning and hygiene materials", 70],
    ["Beverages", "Drink inputs and beverages", 80],
    ["Prepared Meals", "Finished meal outputs", 90],
  ];

  for (const [name, description, sortOrder] of categories) {
    await db.exec(
      `INSERT INTO product_categories (name, description, sort_order, is_active)
       VALUES (?, ?, ?, TRUE)
       ON CONFLICT (name)
       DO UPDATE SET description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, is_active = TRUE`,
      [name, description, sortOrder]
    );
  }

  const storeLocations = [
    ["Central Store", "Central Store", "Main bulk store for all received stock.", 10],
    ["Kitchen Store", "Kitchen Store", "Short-term kitchen issue staging area.", 20],
    ["Cold Store", "Cold Store", "Chilled and perishable stock holding.", 30],
    ["Dry Store", "Dry Store", "Dry ingredients and pantry stock.", 40],
    ["Packaging Store", "Packaging Store", "Packaging and disposables holding area.", 50],
    ["Main Kitchen", "Kitchen", "Primary production and kitchen issue point.", 60],
  ];

  for (const [name, locationType, description, sortOrder] of storeLocations) {
    await db.exec(
      `INSERT INTO store_locations (name, location_type, description, sort_order, is_active)
       VALUES (?, ?, ?, ?, TRUE)
       ON CONFLICT (name)
       DO UPDATE SET location_type = EXCLUDED.location_type, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, is_active = TRUE`,
      [name, locationType, description, sortOrder]
    );
  }

  const departments = [
    ["procurement", "Procurement", "Purchasing and sourcing team", 10],
    ["stores", "Stores", "Inventory and warehouse operations", 20],
    ["kitchen", "Kitchen", "Kitchen requisitions and meal preparation", 30],
    ["production", "Production", "Production batching and output control", 40],
    ["finance", "Finance", "Supplier invoices and payment control", 50],
    ["management", "Management", "Management approvals and oversight", 60],
  ];

  for (const [code, name, description, sortOrder] of departments) {
    await db.exec(
      `INSERT INTO departments (code, name, description, sort_order, is_active)
       VALUES (?, ?, ?, ?, TRUE)
       ON CONFLICT (code)
       DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, is_active = TRUE`,
      [code, name, description, sortOrder]
    );
  }

  const paymentTerms = [
    ["Cash", 0, "Immediate payment on receipt", 10],
    ["7 days", 7, "Due within seven days", 20],
    ["14 days", 14, "Due within fourteen days", 30],
    ["30 days", 30, "Due within thirty days", 40],
    ["45 days", 45, "Due within forty-five days", 50],
    ["60 days", 60, "Due within sixty days", 60],
  ];

  for (const [name, daysDue, description, sortOrder] of paymentTerms) {
    await db.exec(
      `INSERT INTO payment_terms (name, days_due, description, sort_order, is_active)
       VALUES (?, ?, ?, ?, TRUE)
       ON CONFLICT (name)
       DO UPDATE SET days_due = EXCLUDED.days_due, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, is_active = TRUE`,
      [name, daysDue, description, sortOrder]
    );
  }

  const deliveryTypes = [
    ["breakfast", "Breakfast", "Morning meal service", 10],
    ["lunch", "Lunch", "Midday meal delivery", 20],
    ["dinner", "Dinner", "Evening meal service", 30],
    ["tea_break", "Tea Break", "Light refreshments and snacks", 40],
    ["special_delivery", "Special Delivery", "Ad hoc special event delivery", 50],
    ["office_bulk_supply", "Office Bulk Supply", "Bulk office pantry or snack supply", 60],
  ];

  for (const [code, name, description, sortOrder] of deliveryTypes) {
    await db.exec(
      `INSERT INTO delivery_types (code, name, description, sort_order, is_active)
       VALUES (?, ?, ?, ?, TRUE)
       ON CONFLICT (code)
       DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, is_active = TRUE`,
      [code, name, description, sortOrder]
    );
  }

  const expenseCategories = [
    ["food_supplies", "Food Supplies", "Bulk food and ingredient spend", 10],
    ["packaging", "Packaging", "Disposable and packaging spend", 20],
    ["fuel", "Fuel", "Fuel and transport energy", 30],
    ["utilities", "Utilities", "Power, water, and utilities", 40],
    ["labour", "Labour", "Temporary and direct labour cost", 50],
    ["repairs", "Repairs", "Repairs and maintenance", 60],
    ["cleaning", "Cleaning", "Cleaning materials and services", 70],
    ["security", "Security", "Security and access services", 80],
    ["rent", "Rent", "Premises and space rental cost", 90],
  ];

  for (const [code, name, description, sortOrder] of expenseCategories) {
    await db.exec(
      `INSERT INTO expense_categories (code, name, description, sort_order, is_active)
       VALUES (?, ?, ?, ?, TRUE)
       ON CONFLICT (code)
       DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, is_active = TRUE`,
      [code, name, description, sortOrder]
    );
  }

  const taxSettings = [
    ["VAT", 0.18, true, true],
    ["Withholding Tax", 0.06, true, false],
    ["Zero Rated", 0, true, true],
  ];

  for (const [taxName, taxRate, appliesToPurchases, appliesToSales] of taxSettings) {
    await db.exec(
      `INSERT INTO tax_settings (tax_name, tax_rate, applies_to_purchases, applies_to_sales, is_active)
       VALUES (?, ?, ?, ?, TRUE)
       ON CONFLICT (tax_name)
       DO UPDATE SET tax_rate = EXCLUDED.tax_rate, applies_to_purchases = EXCLUDED.applies_to_purchases, applies_to_sales = EXCLUDED.applies_to_sales, is_active = TRUE`,
      [taxName, taxRate, appliesToPurchases, appliesToSales]
    );
  }

  const notificationRules = [
    ["Low stock alert", "low_stock", 1, "store_manager", "Alert store team when a stocked product falls below threshold."],
    ["Expiry alert", "expiry", 14, "store_manager", "Warn store team when perishable batches near expiry."],
    ["Contract expiry alert", "contract_expiry", 30, "manager", "Warn managers ahead of contract expiry."],
    ["Pending approval alert", "pending_approval", 1, "manager", "Flag documents waiting for approval."],
    ["Supplier invoice due alert", "supplier_invoice_due", 3, "finance_officer", "Notify finance before invoice due dates."],
  ];

  for (const [ruleName, triggerType, thresholdValue, recipientRole, description] of notificationRules) {
    await db.exec(
      `INSERT INTO notification_rules (rule_name, trigger_type, threshold_value, recipient_role, description, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)
       ON CONFLICT (rule_name)
       DO UPDATE SET trigger_type = EXCLUDED.trigger_type, threshold_value = EXCLUDED.threshold_value, recipient_role = EXCLUDED.recipient_role, description = EXCLUDED.description, is_active = TRUE`,
      [ruleName, triggerType, thresholdValue, recipientRole, description]
    );
  }

  const statuses = [
    ["global", "Active", "active", "#027A48", 10, false],
    ["global", "Inactive", "inactive", "#98A2B3", 20, false],
    ["contracts", "Draft", "draft", "#98A2B3", 10, false],
    ["contracts", "Active", "active", "#027A48", 20, false],
    ["contracts", "Suspended", "suspended", "#B54708", 30, false],
    ["contracts", "Expired", "expired", "#B42318", 40, true],
    ["purchase_requisition", "Draft", "draft", "#98A2B3", 10, false],
    ["purchase_requisition", "Submitted", "submitted", "#175CD3", 20, false],
    ["purchase_requisition", "Approved", "approved", "#027A48", 30, false],
    ["purchase_requisition", "Rejected", "rejected", "#B42318", 40, true],
    ["purchase_requisition", "Converted to PO", "converted_to_po", "#7A5AF8", 50, true],
    ["goods_requisition", "Draft", "draft", "#98A2B3", 10, false],
    ["goods_requisition", "Submitted", "submitted", "#175CD3", 20, false],
    ["goods_requisition", "Approved", "approved", "#027A48", 30, false],
    ["goods_requisition", "Rejected", "rejected", "#B42318", 40, true],
    ["goods_requisition", "Returned for Revision", "returned_for_revision", "#B54708", 50, false],
    ["goods_requisition", "LPO Raised", "lpo_raised", "#7A5AF8", 60, false],
    ["goods_requisition", "Cancelled", "cancelled", "#667085", 70, true],
    ["cash_requisition", "Draft", "draft", "#98A2B3", 10, false],
    ["cash_requisition", "Submitted", "submitted", "#175CD3", 20, false],
    ["cash_requisition", "Approved", "approved", "#027A48", 30, false],
    ["cash_requisition", "Rejected", "rejected", "#B42318", 40, true],
    ["cash_requisition", "Returned for Revision", "returned_for_revision", "#B54708", 50, false],
    ["cash_requisition", "Cash Released", "cash_released", "#7A5AF8", 60, false],
    ["cash_requisition", "Closed", "closed", "#027A48", 70, true],
    ["cash_requisition", "Cancelled", "cancelled", "#667085", 80, true],
    ["purchase_order", "Draft", "draft", "#98A2B3", 10, false],
    ["purchase_order", "Sent", "sent", "#175CD3", 20, false],
    ["purchase_order", "Partially Received", "partially_received", "#B54708", 30, false],
    ["purchase_order", "Fully Received", "fully_received", "#027A48", 40, true],
    ["purchase_order", "Cancelled", "cancelled", "#667085", 50, true],
    ["lpo", "Draft", "draft", "#98A2B3", 10, false],
    ["lpo", "Issued", "issued", "#175CD3", 20, false],
    ["lpo", "Partially Received", "partially_received", "#B54708", 30, false],
    ["lpo", "Fully Received", "fully_received", "#027A48", 40, true],
    ["lpo", "Cancelled", "cancelled", "#667085", 50, true],
    ["goods_received_note", "Draft", "draft", "#98A2B3", 10, false],
    ["goods_received_note", "Confirmed", "confirmed", "#027A48", 20, true],
    ["supplier_invoice", "Open", "open", "#175CD3", 10, false],
    ["supplier_invoice", "Closed", "closed", "#027A48", 20, true],
    ["payment_voucher", "Draft", "draft", "#98A2B3", 10, false],
    ["payment_voucher", "Submitted", "submitted", "#175CD3", 20, false],
    ["payment_voucher", "Approved", "approved", "#027A48", 30, false],
    ["payment_voucher", "Paid", "paid", "#7A5AF8", 40, true],
    ["payment_voucher", "Rejected", "rejected", "#B42318", 50, true],
    ["payment_voucher", "Cancelled", "cancelled", "#667085", 60, true],
    ["supplier_receipt", "Registered", "registered", "#027A48", 10, true],
    ["supplier_receipt", "Cancelled", "cancelled", "#667085", 20, true],
    ["stock_adjustment", "Draft", "draft", "#98A2B3", 10, false],
    ["stock_adjustment", "Approved", "approved", "#027A48", 20, true],
    ["stock_adjustment", "Rejected", "rejected", "#B42318", 30, true],
    ["physical_stock_count", "Draft", "draft", "#98A2B3", 10, false],
    ["physical_stock_count", "Approved", "approved", "#027A48", 20, true],
    ["kitchen_requisition", "Draft", "draft", "#98A2B3", 10, false],
    ["kitchen_requisition", "Submitted", "submitted", "#175CD3", 20, false],
    ["kitchen_requisition", "Approved", "approved", "#027A48", 30, false],
    ["kitchen_requisition", "Rejected", "rejected", "#B42318", 40, true],
    ["kitchen_requisition", "Issued", "issued", "#7A5AF8", 50, false],
    ["kitchen_requisition", "Closed", "closed", "#027A48", 60, true],
    ["store_issue", "Draft", "draft", "#98A2B3", 10, false],
    ["store_issue", "Issued", "issued", "#027A48", 20, false],
    ["store_issue", "Closed", "closed", "#667085", 30, true],
    ["production_batch", "Draft", "draft", "#98A2B3", 10, false],
    ["production_batch", "Completed", "completed", "#027A48", 20, false],
    ["production_batch", "Closed", "closed", "#667085", 30, true],
    ["stock_return", "Confirmed", "confirmed", "#027A48", 10, true],
  ];

  for (const [moduleKey, statusName, statusCode, color, sortOrder, isTerminal] of statuses) {
    await db.exec(
      `INSERT INTO statuses (module_key, status_name, status_code, color, sort_order, is_terminal, is_active)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)
       ON CONFLICT (status_code, module_key)
       DO UPDATE SET status_name = EXCLUDED.status_name, color = EXCLUDED.color, sort_order = EXCLUDED.sort_order, is_terminal = EXCLUDED.is_terminal, is_active = TRUE`,
      [moduleKey, statusName, statusCode, color, sortOrder, isTerminal]
    );
  }

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const numberingSeries = [
    ["Contract", "contract", "CTR"],
    ["Purchase Requisition", "purchase_requisition", "PR"],
    ["Purchase Order", "purchase_order", "PO"],
    ["Goods Requisition", "goods_requisition", "GRQ"],
    ["Cash Requisition", "cash_requisition", "CRQ"],
    ["Local Purchase Order", "lpo", "LPO"],
    ["Goods Received Note", "goods_received_note", "GRN"],
    ["Kitchen Requisition", "kitchen_requisition", "KR"],
    ["Store Issue", "store_issue", "SI"],
    ["Production Batch", "production_batch", "PB"],
    ["Supplier Invoice", "supplier_invoice", "INV"],
    ["Stock Adjustment", "stock_adjustment", "SA"],
    ["Stock Return", "stock_return", "SR"],
    ["Physical Stock Count", "physical_stock_count", "PSC"],
    ["Payment Voucher", "payment_voucher", "PV"],
    ["Supplier Receipt", "supplier_receipt", "SREC"],
  ];

  for (const [documentType, documentKey, prefix] of numberingSeries) {
    await db.exec(
      `INSERT INTO numbering_series
         (document_type, document_key, prefix, current_year, current_month, current_number, padding_length, reset_frequency, is_active)
       VALUES (?, ?, ?, ?, ?, 0, 4, 'Yearly', TRUE)
       ON CONFLICT (document_key)
       DO UPDATE SET document_type = EXCLUDED.document_type, prefix = EXCLUDED.prefix, current_year = EXCLUDED.current_year, current_month = EXCLUDED.current_month, padding_length = EXCLUDED.padding_length, reset_frequency = EXCLUDED.reset_frequency, is_active = TRUE`,
      [documentType, documentKey, prefix, currentYear, currentMonth]
    );
  }

  await db.exec(
    `DELETE FROM approval_workflows
     WHERE document_type NOT IN ('purchase_requisition', 'goods_requisition', 'cash_requisition', 'kitchen_requisition')`
  );

  const approvalWorkflows = [
    ["Purchase Requisition Approval", "purchase_requisition", "manager", 1, 0, 999999999999, false],
    ["Goods Requisition Approval", "goods_requisition", "manager", 1, 0, 999999999999, false],
    ["Cash Requisition Approval", "cash_requisition", "manager", 1, 0, 999999999999, false],
    ["Kitchen Requisition Approval", "kitchen_requisition", "store_manager", 1, 0, 999999999999, false],
  ];

  for (const [workflowName, documentType, requiredRole, approvalLevel, minAmount, maxAmount, canCreatorApprove] of approvalWorkflows) {
    await db.exec(
      `INSERT INTO approval_workflows
         (workflow_name, document_type, required_role, approval_level, min_amount, max_amount, can_creator_approve, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
       ON CONFLICT (document_type, approval_level, required_role)
       DO UPDATE SET workflow_name = EXCLUDED.workflow_name, min_amount = EXCLUDED.min_amount, max_amount = EXCLUDED.max_amount, can_creator_approve = EXCLUDED.can_creator_approve, is_active = TRUE`,
      [workflowName, documentType, requiredRole, approvalLevel, minAmount, maxAmount, canCreatorApprove]
    );
  }

  const existingAdmin = await db.get("SELECT id FROM users WHERE username = ?", ["admin"]);
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    const inserted = await db.exec(
      `INSERT INTO users (full_name, username, email, password_hash)
       VALUES (?, ?, ?, ?)
       RETURNING id`,
      ["System Administrator", "admin", "admin@cater.local", passwordHash]
    );
    const adminRole = await db.get("SELECT id FROM roles WHERE code = ?", ["admin"]);
    await db.exec(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES (?, ?)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [inserted.rows[0].id, adminRole.id]
    );
  }

  await syncConfigurationMirrors(db);
}

async function initializeDatabase(db, options = {}) {
  const { reset = false } = options;
  if (reset) {
    await db.exec(getResetSql());
  }
  await db.exec(getSchemaSql());
  await seedReferenceData(db);
}

const { seedDemoData } = require("./seed-demo");

module.exports = {
  ensureDatabaseExists,
  getSchemaSql,
  initializeDatabase,
  seedDemoData,
  getSequence,
};
