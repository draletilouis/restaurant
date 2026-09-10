# Cater ERP Phase 1 Architecture

Cater is a modular Express monolith: one deployable Node.js 20 application, a PostgreSQL database accessed through `pg`, and a static SPA served from `public/`. Modules are separated by route, service, database ownership, permissions, and audit events so later Finance, HR, Assets, Fleet, Payroll, and advanced Reporting modules can be added without replacing the operational core.

## Module boundaries

- Authentication and access control: `src/routes/auth.js`, `src/middleware/auth.js`, roles, permissions, and sessions.
- Master data: clients, locations, suppliers, products, categories, units, stores, departments, and reusable configurations.
- Contracts: client commitments, delivery locations, schedules, and contract items.
- Procurement: purchase requisitions, Daily/Weekly purchase orders, goods received, supplier invoices, and payments.
- Inventory and stores: balances, batches, movements, adjustments, and physical counts.
- Kitchen and production: kitchen requisitions, store issues, production batches, wastage, and returns.
- Consumption: purchased, issued, returned, wasted, consumed, remaining, variance, and trend calculations.
- Reports and dashboard: read-only compositions over live module APIs and database data.
- Settings and audit: configuration definitions, approval workflows, and audit history.

## Shared services

- `src/database/database.js`: PostgreSQL access and transaction boundaries.
- `src/services/inventory-service.js`: transactional stock movement and balance updates.
- `src/services/approval-workflow-service.js`: role and self-approval checks.
- `src/services/audit-service.js`: audit event persistence.
- `src/services/status-service.js`: configured status lookup.
- `src/services/system-service.js` and numbering services: document sequences and system configuration.
- `src/services/purchase-type-service.js`: the single Daily/Weekly validation and normalization rule.

## Database ownership and cross-module workflows

Each route owns writes to its module's tables. Cross-module operations call shared services inside the same transaction: purchase requisition creation, goods receiving, store issue, returns, and consumption all preserve their ledger relationships. Inventory balances are never edited as a standalone update; every change is paired with a stock movement.

The operational chain is: Client contract -> purchase requisition -> purchase order -> goods received -> inventory -> kitchen requisition -> store issue -> production -> wastage/return -> consumption.

Purchase requisitions and purchase orders carry `purchase_type` with only Daily or Weekly allowed. Linked purchase orders must match their requisition.

## Permission and audit boundaries

Every protected route begins with authentication and the relevant permission. Approval workflows enforce the configured role and prevent creators from approving their own requests unless the workflow explicitly allows it or the user is an Admin. Create, update, approve, reject, receive, issue, produce, waste, return, adjustment, login, logout, and configuration actions write audit events.

## Adding a future module

Add a focused route factory under `src/routes`, keep writes in that module's tables, add shared business logic only when it is reused, register the route once in `src/routes/index.js`, seed its permissions/statuses/configuration, expose the UI through the module registry, and add an integration test that covers its approval/audit and cross-module boundaries.

## Testing expectations

Run JavaScript syntax checks for changed files, the complete Jest suite with coverage disabled, and focused integration tests for every workflow mutation. Runtime checks must include startup, `/health`, authenticated navigation, API status codes, and the relevant inventory/audit invariants. Browser verification is performed separately when a connected browser is available.

## Deferred or unregistered legacy surfaces

The older customer billing, receivables, recipe/BOM, transfer, and standalone reports route files remain in the repository for compatibility but are not registered by the active application route registry unless their schemas, permissions, UI, audit events, and tests are completed. The active SPA's Reports screen is a read-only composition of currently registered live data endpoints; it does not claim PDF or legacy billing integrations are live.
