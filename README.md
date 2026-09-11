# Lefori Phase 1

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

The database initializer always creates the administrator role and login. Demo records are opt-in only; keep them disabled for a client or production database:

- Username: `admin`
- Password: `admin123`

For a throwaway local demo database, set `SEED_DEMO_DATA=true`. Do not enable that flag in production.

To clear the Railway client database while retaining the administrator login, run the guarded script from the production service environment. It requires the four safeguards below and will refuse to run against another environment:

```powershell
$env:NODE_ENV="production"
$env:CLEAR_LIVE_DATA_TARGET="alert-friendship-production"
$env:KEEP_LOGIN_EMAIL="admin@cater.local"
$env:CONFIRM_CLEAR_LIVE_DATA="YES"
npm run clear-live-data
```

The script uses Railway's `DATABASE_URL`, removes operational and demo records, deletes other user accounts, resets document numbering, and preserves system reference configuration plus the specified login. It prints before/after counts and verifies that only the retained administrator remains. Do not run it until the command is attached to the intended Railway production service.

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
- [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
