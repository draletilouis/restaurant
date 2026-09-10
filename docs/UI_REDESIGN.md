# Enterprise frontend redesign

The redesign covers the complete Cater SPA: dashboard, contracts, procurement,
suppliers, inventory, kitchen requests, production, consumption,
reports, configurations, approval matrix and settings.

## Audit and direction

The original UI had duplicated dashboard queues, hidden list headings and search,
large mobile record cards, inconsistent dark surfaces and hard-coded dates. Long
contract forms combined client information,
commercial terms and schedules. Dialogs needed better cancellation, validation
and repeated-submit protection.

The replacement uses a grouped light sidebar, white working surface, compact
page headers and one teal action color. Shared lists retain search, filters,
sorting, record totals, pagination, exports and row actions. Wide tables scroll
inside labeled regions on mobile. Forms use side drawers with a consistent
action footer, inline validation, focus management and unsaved-change protection.
Contract forms separate client/location, terms, schedules and items.

The dashboard shows each pending queue once, current stock value, recorded waste,
stock exceptions, delivery commitments, recent activity and supplier balances.
The existing demand API returns configured active-contract quantities; the UI
labels this value **Contract demand**, without claiming it is a seven-day forecast.

## Preserved behavior

Existing workflow forms and actions remain connected to their REST endpoints.
Operational report exports retain the live delivery dataset.

## Verification

- Existing Jest suite: 4 suites, 15 tests. Includes contract-to-consumption,
  procurement receiving, kitchen issues, production, wastage, returns and approval
  controls, plus configuration and purchase-type coverage.
- Browser sweep: all 13 modules and 50 views; desktop 1440px, laptop 1280px,
  tablet 900px and mobile 390px. No uncaught JavaScript errors or page overflow.
- Browser workflows: create/edit/view supplier, create a contract with recurring
  schedule and line items, report preview and real CSV download, sorting,
  pagination and search recovery.
- Interaction states: inline required validation, rapid repeated submission,
  discard confirmation, injected API failure and retry, restricted kitchen role,
  light/dark themes and mobile forms.
- Axe WCAG A/AA checks: no reported violations in the scanned workspaces and
  tested forms. This is focused automated coverage, not an accessibility certification.
- Vanilla JavaScript syntax checked with `node --check public/js/app.js`.
  This project has no separate TypeScript, lint or build script.

Test writes were confined to `cater_enterprise_ui_verify` on port 3002. The regular
workspace runs on port 3001. No working application records were modified by the
create/edit verification scenarios.

Evidence is stored under `ui-artifacts/enterprise/`:

- `verification.json`: module, responsive and interaction sweep.
- `workflow-verification.json`: contract, export and permission checks.
- `jest-results-final.log`: final regression results.
- PNGs: before/after, mobile, dark theme and form screenshots.

## Re-running browser checks

Use a separate server process with `PORT=3002`, `NODE_ENV=test`,
`POSTGRES_DB_TEST=cater_enterprise_ui_verify` and an empty `DATABASE_URL`, so the
test database name is honored. Supply `AXE_PATH` pointing to an installed
`axe-core/axe.min.js`, then run:

```powershell
node scripts/verify-enterprise-ui.cjs
node scripts/verify-enterprise-workflows.cjs
```

These scripts create explicitly named fixture records in the isolated database.
They do not reset or delete existing records. The main regression suite uses its
own resettable `cater_phase_one_test` database.

Design tokens and component rules are documented in [DESIGN.md](../DESIGN.md).
