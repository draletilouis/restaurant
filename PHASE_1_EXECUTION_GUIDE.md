# Phase 1 Execution Guide

## Objective

Build Phase 1 of the Food Services ERP in `cater` using the same application stack and project style already used in `C:\Users\Admin\OneDrive - Stabex International Limited\Desktop\StockMaster`.

> Active implementation note: the registered Phase 1 application currently covers contracts, Daily/Weekly purchasing, receiving, inventory, kitchen requisitions, store issues, production, wastage/returns, consumption, dashboards, approvals, and audit logging. The source-PDF items for office catering sales/invoicing, customer payments, standalone transfers, recipe/BOM management, and legacy document/report routes remain deferred until their complete schema, permissions, UI, audit, and integration contracts are registered. See `docs/ARCHITECTURE.md`.

Phase 1 scope from the source PDF:

- Procurement and supplier management
- Daily purchases and weekly bulk purchases
- Inventory and stores management
- Stock transfers and requisitions
- Kitchen production management
- Office catering sales and invoicing
- Customer payment tracking

## Stack Baseline From StockMaster

Observed in `StockMaster`:

- Runtime: Node.js `20.x`
- App style: Express monolith with `server.js`
- Database: PostgreSQL via `pg`
- Sessions: `express-session` with `connect-pg-simple`
- Middleware: `helmet`, `cors`, `compression`, `morgan`, `body-parser`
- Backend structure: `src/routes`, `src/services`, `src/database`, `src/middleware`, `src/config`, `src/utils`
- Frontend style: static app in `public/` with plain HTML, CSS, and vanilla JavaScript
- Testing: Jest plus Supertest
- Deployment style: env-driven app, no frontend build step required

## Decision For Cater

Use the same stack and keep it simple:

- Node.js `20.x`
- Express backend
- PostgreSQL database
- Static frontend in `public/`
- Modular route files in `src/routes`
- Shared DB wrapper in `src/database`
- Jest and Supertest for backend verification

Do not introduce React, Vite, Prisma, Sequelize, or a separate frontend framework for Phase 1. That would diverge from the reference repo and slow delivery.

## Target Project Shape

Create the new app with this structure:

```text
cater/
  server.js
  package.json
  .env
  .env.example
  public/
    index.html
    css/
    js/
      app.js
      modules/
  src/
    config/
    database/
      database.js
      init-postgres.js
    middleware/
    routes/
      index.js
      auth.js
      suppliers.js
      inventory.js
      purchases.js
      requisitions.js
      production.js
      customers.js
      catering-orders.js
      invoices.js
      receivables.js
      reports.js
    services/
    utils/
  tests/
```

## Phase 1 Functional Modules

### 1. Foundation

- User login and session handling
- Roles: admin, procurement, stores, kitchen, sales, finance
- Master data: units, items, categories, suppliers, customers, kitchens, stores, delivery locations

### 2. Procurement

- Supplier register
- Purchase request
- Purchase order
- Goods receipt
- Supplier invoice capture
- Daily purchase flow and weekly bulk purchase flow

### 3. Inventory And Stores

- Stock ledger
- Item balances by store
- Stock adjustments
- Inter-store transfers
- Requisition requests and approvals
- Low-stock alerts

### 4. Kitchen Production

- Recipe and ingredient definitions
- Bill of materials per menu item
- Production batch entry
- Raw material issue to kitchen
- Yield and wastage capture

### 5. Catering Sales And Invoicing

- Customer register
- Catering order entry
- Office contract billing support
- Delivery schedule
- Invoice generation
- Receipt capture

### 6. Customer Payment Tracking

- Receivables ledger
- Partial payments
- Outstanding balances
- Aging summary

## Design Rules For Phase 1

- Every commercial transaction must be traceable.
- Every stock movement must hit a ledger table.
- Every purchase, requisition, production batch, catering order, invoice, and payment must carry a business date and status.
- Keep the data model `job costing` ready from day one.
- Even if full job costing is deferred, keep nullable links such as `job_id`, `order_id`, `cost_center_id`, and `location_id` where they will later matter.

## Core Database Tables

Start with these tables:

- `users`
- `roles`
- `user_roles`
- `suppliers`
- `customers`
- `stores`
- `kitchens`
- `units`
- `item_categories`
- `items`
- `recipes`
- `recipe_items`
- `purchase_requests`
- `purchase_orders`
- `purchase_order_items`
- `goods_receipts`
- `goods_receipt_items`
- `supplier_invoices`
- `stock_ledger`
- `stock_balances`
- `stock_transfers`
- `stock_transfer_items`
- `requisitions`
- `requisition_items`
- `production_batches`
- `production_batch_items`
- `catering_orders`
- `catering_order_items`
- `invoices`
- `invoice_items`
- `customer_payments`
- `audit_logs`

## Route Plan

Keep routes split by business domain, following the StockMaster pattern:

- `/api/auth`
- `/api/suppliers`
- `/api/customers`
- `/api/inventory`
- `/api/purchases`
- `/api/requisitions`
- `/api/production`
- `/api/catering-orders`
- `/api/invoices`
- `/api/receivables`
- `/api/reports`

Keep `src/routes/index.js` as the single route registration point.

## Frontend Plan

Stay with the StockMaster style:

- `public/index.html` as the main shell
- `public/js/app.js` as the boot file
- module-specific files in `public/js/modules`
- plain CSS in `public/css`

Recommended Phase 1 screens:

- Login
- Dashboard
- Suppliers
- Items and recipes
- Purchases
- Goods receiving
- Stores and stock ledger
- Requisitions and transfers
- Kitchen production
- Catering orders
- Invoices
- Customer payments
- Reports

## Execution Order

### Step 1. Bootstrap the app

- Create `package.json`
- Install the same core dependencies used by StockMaster
- Add `.env.example`
- Add `server.js`
- Add PostgreSQL wrapper and initializer
- Add base middleware

### Step 2. Build the shared foundation

- Auth and session handling
- Role checks
- Standard API response helpers
- Audit logging
- Base layout and navigation

### Step 3. Deliver operational flow in business order

1. Supplier and item master data
2. Purchases and goods receiving
3. Inventory ledger and balances
4. Requisitions and transfers
5. Recipes and production batches
6. Catering orders and invoices
7. Customer payments and receivables

### Step 4. Add reports only after transaction flows work

- Purchase summary
- Stock on hand
- Stock movement history
- Production consumption
- Sales and invoice summary
- Customer balances

## Suggested Initial Scripts

Match the StockMaster approach closely:

```json
{
  "start": "cross-env NODE_ENV=production node server.js",
  "dev": "nodemon server.js",
  "test": "cross-env NODE_ENV=test jest --coverage --verbose --forceExit",
  "init-postgres": "node src/database/init-postgres.js",
  "generate-secret": "node -e \"console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))\""
}
```

## Suggested Dependencies

Start with this package set:

- `express`
- `pg`
- `dotenv`
- `cors`
- `helmet`
- `morgan`
- `compression`
- `body-parser`
- `express-session`
- `connect-pg-simple`
- `bcrypt`
- `express-validator`
- `uuid`
- `multer`

Dev dependencies:

- `jest`
- `supertest`
- `nodemon`
- `cross-env`

## Definition Of Done For Phase 1

Phase 1 is only complete when this full flow works:

1. Create supplier and item
2. Raise purchase
3. Receive stock into store
4. Issue stock to kitchen or another store
5. Produce a batch from recipe inputs
6. Create catering order
7. Generate invoice
8. Record customer payment
9. See stock, receivable, and audit impact in reports

## Practical Delivery Notes

- Build vertical slices, not isolated tables.
- Test each module with at least one API integration test.
- Do not postpone audit logs and status fields.
- Keep money values numeric and consistent in one currency first.
- Keep Phase 1 single-business if necessary, but keep table shapes ready for branch and location growth.
- Do not add advanced HR, full accounting, or expense management in this phase.

## Immediate Next Move

When implementation starts in `cater`, the first build slice should be:

1. App bootstrap
2. Auth
3. Suppliers
4. Items
5. Purchases
6. Goods receiving
7. Stock ledger

That gives a usable base before moving to kitchen production and catering sales.
