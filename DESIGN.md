# Cater interface system

Mode: Operate. Users manage recurring catering demand, bulk procurement, stores,
kitchen issues and consumption. Accuracy, scanning and completing work take priority.

## Direction

A quiet operational workspace: light stone navigation, white working surface, dark
ink typography, restrained teal actions. Four navigation groups: Workspace,
Supply chain, Kitchen, Administration. Analysis stays beside daily operations.
Page titles identify the module; tabs identify the current queue. Primary actions
live beside the title; search and export sit immediately above the records.

## Foundations

Inter with system fallback; tabular numbers for quantities and money. Body 13px,
labels 12px, page titles 24px. Spacing 4/8/12/16/24/32px. Controls 36px; mobile
targets at least 44px. Corners 4–6px. Borders define regions, without nested cards.
Tokens in public/css/app.css; dark token overrides in public/css/theme.css.

## Shared patterns

- Dashboard: one actionable work queue, compact business figures, stock exceptions,
  contract delivery commitments, recent activity and supplier balances.
- Lists: search, named views, sortable headers, aligned quantities, record count,
  pagination and consistent row actions. Wide tables scroll within their region.
- Forms: labeled controls, required markers, grouped line items, fixed action footer,
  inline validation, busy guard and recoverable errors. Complex forms use a wide drawer.
- Details: record identity and status first, then overview and related records.
- Status: neutral draft/cancelled, blue submitted, green approved/completed,
  amber pending/suspended/expired, red rejected/overdue. Custom status colors apply
  to the status dot, preserving readable text in both themes.
- Accessibility: focus rings, native buttons, labeled search/scroll regions,
  focus-trapped dialogs, restoration on close, reduced motion.

## Preserve

Existing REST contracts, role permissions, approval rules and all stock/financial
write paths. No backend or schema changes are part of this redesign.
