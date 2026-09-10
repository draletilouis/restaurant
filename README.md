# Cater ERP Phase 1

This workspace is now bootstrapped for Phase 1 using the same stack baseline as `StockMaster`:

- Node.js 20
- Express
- PostgreSQL
- `express-session` with `connect-pg-simple`
- Static frontend in `public/`
- Modular route structure in `src/routes`
- Jest test entrypoint

## Implemented Phase 1 MVP Surfaces

- Auth sessions, roles, permission-protected APIs, approval restrictions, and audit logging
- Client contracts, delivery locations, schedules, and active demand
- Daily/Weekly purchase requisitions and purchase orders with type matching
- Goods receiving into batch-tracked central-store inventory and stock movements
- Kitchen requisitions, store issues, production batches, wastage, and stock returns
- Consumption analysis across purchased, issued, returned, wasted, consumed, and remaining quantities
- Live dashboard priorities, supplier balances, operational tables, filters, detail views, and CSV previews
- Reusable PDF/XLSX helpers retained for future registered document routes

The legacy customer billing, receivables, recipe/BOM, transfer, and unregistered report route files are deferred until their complete schema, permissions, UI, audit, and integration-test contracts are delivered. See docs/ARCHITECTURE.md.
## First Run

1. Copy `.env.example` to `.env`
2. Fill PostgreSQL connection values
3. Run `npm install`
4. Run `npm run init-postgres`
5. Run `npm run dev`
6. Open `http://localhost:3000`

Default seeded login after database initialization:

- Username: `admin`
- Password: `admin123`

Local development uses the in-memory session store by default through `USE_PG_SESSION=false`.
Production can switch back to PostgreSQL-backed sessions.

The shared PDF and XLSX helpers are retained in:

- src/services/pdf-generator.js
- src/services/branded-document.js
- src/services/excel-export.js

They are not advertised as live API endpoints until each document route has a complete schema, permission, audit, and integration-test contract.
## Main Files

- [server.js](server.js)
- [src/database/init-postgres.js](src/database/init-postgres.js)
- [src/routes/index.js](src/routes/index.js)
- [PHASE_1_EXECUTION_GUIDE.md](PHASE_1_EXECUTION_GUIDE.md)
