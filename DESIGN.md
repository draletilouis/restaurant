# Lefori interface system

Mode: Operate. Users manage recurring catering demand, bulk procurement, stores,
kitchen issues and consumption. Accuracy, scanning and completing work take priority.

## Direction

A quiet operational workspace: light stone navigation, white working surface, dark
ink typography, restrained teal actions. Four navigation groups: Workspace,
Supply chain, Kitchen, Administration. Supply chain includes Procurement,
Cash requisitions, Payment vouchers, Suppliers, and Inventory. Analysis stays beside daily operations.
Page titles identify the module; tabs identify the current queue. Primary actions
live beside the title; search and export sit immediately above the records.

Commit to this enterprise chrome only. Do not ship the alternate dark-green SaaS
sidebar, two-letter badge icons, or emoji greetings as the product UI. Login is an
immersive hospitality gateway (photo stage + glass sign-in card), while the signed-in
app stays quiet enterprise chrome.

## Foundations

Inter with system fallback; tabular numbers for quantities and money. Body 13px,
labels 12px, page titles 24px. Spacing 4/8/12/16/24/32px. Controls 36px; mobile
targets at least 44px. Corners 4-6px. Borders define regions, without nested cards.
Tokens in public/css/app.css; dark token overrides in public/css/theme.css.

## Shared patterns

- Dashboard: one ranked work queue (primary), exception KPI chips, today's delivery
  commitments, recent activity and supplier balances. See Dashboard work queue.
- Lists: search, named views, sortable headers, aligned quantities, record count,
  pagination and consistent row actions. Wide tables scroll within their region.
  Create / approve / receive / issue happen in a drawer - not a strip of mini-forms under the table.
  Procurement and Kitchen keep forms in the DOM for the shared form modal, but the
  under-table work grids stay visually hidden (list + drawer).
- Forms: labeled controls, required markers, grouped line items, fixed action footer,
  inline validation, busy guard and recoverable errors. Complex forms use a wide drawer.
- Details: record identity and status first, then overview and related records.
- Status: neutral draft/cancelled, blue submitted, green approved/completed,
  amber pending/suspended/expired, red rejected/overdue. Custom status colors apply
  to the status dot, preserving readable text in both themes.
- Accessibility: focus rings, native buttons, labeled search/scroll regions,
  focus-trapped dialogs, restoration on close, reduced motion.

## Dashboard work queue

The dashboard is a command surface for *what to do next*, not a report collage.
Module names stay in the sidebar; the queue speaks in verbs.

### Hierarchy

1. Page title + date + scope + refresh freshness.
2. Exception KPI strip (compact business figures).
3. **Work queue** - the primary panel; full width of the priority column.
4. Active delivery commitments (table).
5. Recent activity | Supplier balances (secondary, smaller).

Do not give Top consumed products or Purchase activity by type a home on the
dashboard; those belong in Reports / Consumption.

### Exception KPI strip

Always show these chips, including when the count is 0 (muted, not removed):

1. Needs your approval
2. Open purchase requisitions
3. Purchase orders awaiting receipt
4. Kitchen waiting
5. Stock risks (low + expiring combined)
6. Today's production batches

Each chip is a control: click filters the work queue to that source, or navigates
to the matching module tab when the queue has no rows for it. Tone follows status
rules (danger when overdue/out-of-stock, warning when pending, neutral at zero).

These chips replace vanity heroes (active contract count, stock value, wastage
value) on the dashboard. Money and catalogue totals live under Inventory / Reports.

### Work queue panel

One list. Merge today's production and top stock risks into this list - do not
keep a separate production mini-row or a sibling "stock exceptions" panel once
risks appear as queue rows. Keep a single "All alerts" / "View all open work"
egress for overflow.

**Capacity:** show up to 8 rows, severity-sorted. Footer link opens the full set.

**Row anatomy** (native button, deep-links with `data-nav-target` + tab):

- Tone dot only (danger / warning / info) - never recolor the whole row
- Primary label: human action + record id when known
  e.g. `Issue stock for KR-2026-014`, not `Kitchen requests`
- Secondary: context + age
  e.g. `Main Kitchen - approved - 2h ago`
- Trailing: count or em dash for a single item, plus verb
  `Approve` / `Receive` / `Issue` / `Review` / `Open`

**Prefer item-level rows over bucket counts.** Approvals already return rows -
render those. For requisitions, orders, kitchen, and stock, surface the top
concrete records (id, title, detail, tone, target, tab, verb). Bucket-only rows
are a fallback when detail is unavailable, not the design target.

### Severity order (fixed)

1. Overdue / expired (PO past expected date, expired stock, breached approval wait)
2. Needs *my* approval
3. Blocked kitchen (approved, not yet issued)
4. Goods to receive today
5. Out of stock, then low stock
6. Expiring within 7 days, then within 30 days
7. Today's production not yet recorded
8. Draft purchase requisitions older than 24h

Within the same severity, older items rank first.

### Empty / clear state

Never collapse the panel into a large empty void. When every source is clear:

- KPI chips remain visible at 0
- Work queue shows one compact calm row, e.g.
  `Queues clear - next delivery Acme Head Office - Mon`
  sourced from active delivery commitments
- Structure of the page stays identical to the busy state

### Data

Enrich the existing `GET /api/dashboard` **read** payload with a ranked
`topActions` array (and keep the current counts for the KPI strip). Derive rows
from existing tables and the pending-approvals endpoint - no schema changes and
no new write paths. Client may compose the list if the API is briefly behind,
but the contract above is the source of truth.

Example action shape:

```json
{
  "id": "KR-2026-014",
  "title": "Issue stock for KR-2026-014",
  "detail": "Main Kitchen - approved - 2h ago",
  "tone": "warning",
  "verb": "Issue",
  "target": "kitchen",
  "tab": "pending",
  "severity": 3,
  "count": 1
}
```

## Preserve

Existing REST write contracts, role permissions, approval rules and all
stock/financial write paths. No database schema changes are part of this
redesign. Enriching dashboard **read** responses with ranked action rows is in
scope.

## Progressive web app

Installable standalone app: `manifest.webmanifest`, teal theme, cloche icon set under
`public/icons/`, and a light service worker that caches the shell while keeping `/api`
network-only. Offline fallback is `offline.html`.

## Quiet login

Immersive full-bleed catering/restaurant photo stage with teal wash, soft glow
motion, and a rising glass sign-in card. Left story copy is short hospitality
positioning with quiet pill tags. Sign in form, status under the button,
administrator help. No circular letter mark, no seed credentials, no fake
forgot-password mailto. Ken Burns / drift animations respect
`prefers-reduced-motion`. Background asset: `public/images/login-bg.png`.

## Contract form sections

On Client & Location, separate **Client** and **Delivery location** fieldsets.
Short fields sit in a 2-column grid; name, address, and notes span full width.
Keep other tabs (Terms, Billing & Schedule, Items) unchanged.

## List row actions

Use a tight action cluster on every operational table:

1. **One primary verb** as a solid button (Submit, Mark Paid, Create PO, Release…).
2. **View** as a quiet text control.
3. **Export** (Print / PDF / Excel) under a single Export menu.
4. Extra verbs under **More** when needed — never a flat row of peer teal links.
5. **Approve / Reject** for Submitted work live on **Approvals**, not on module lists.

## Report print / export chrome (locked)

- Lefori letterhead: teal accent (#0e6b66), Inter, logo or wordmark fallback.
- Summary as **KPI chips** (HTML/PDF), not a Summary table; Excel puts the same metrics on a teal strip under the title.
- Prefer columnsPdf for HTML/PDF/Excel when present (tighter print pack); screen/API may keep richer columns.
- Empty state: **No activity in this range** + period — never a blank table body.
- Purchase / All-purchases (LPO side): **line items** (item, qty, unit cost, line total), not header-level item counts.
- Kitchen: **Requested On** / **Qty Requested**; footer totals skip dates, status, item counts, Waste %.


## LPO unify (locked)

- User-facing voice is **LPO** only (Local Purchase Order). Do not show PO and LPO as two document types.
- One list (Procurement → LPOs), one number (`lpo_number`, mirrored on `order_number` for new rows).
- Path: purchase requisition approved → create LPO → issue/send → goods received.
- Legacy `purchase_order` numbering series is unused for new creates (`purchaseOrderPrefix` maps to `lpo`).
