# Procurement System Assessment and Implementation Map

## Recommendation

**Continue with the existing repository.** It is a modular Express/PostgreSQL monolith with a static SPA, shared database transactions, role-based permissions, approval workflows, document numbering, inventory services, export helpers, and audit logging. Those are the high-risk foundations of this system and are already usable.

## Reuse map

| New requirement | Existing foundation | Action |
| --- | --- | --- |
| Users and permissions | `users`, `roles`, `permissions`, session middleware | Reuse and extend permissions |
| Suppliers | `suppliers`, supplier routes and UI | Reuse |
| Items | `products`, categories, units | Reuse as procurement items |
| Stores | `store_locations` | Reuse |
| Approvals | `approval_workflows`, approval service, audit logs | Reuse and add approval history |
| Document numbers | numbering series and sequence service | Reuse; add LPO/PV/receipt series |
| Stock | balances, batches, movements, transactional inventory service | Reuse and add concurrency locks |
| LPO | `purchase_orders` and line items | Reuse as LPO-compatible records with aliases/statuses |
| Deliveries | `goods_received_notes` and line items | Reuse; add delivery note, idempotency, invoice link, and aggregate receipt checks |
| Supplier invoices | `supplier_invoices` | Reuse; add attachments and stronger duplicate protection |
| Documents | branded HTML/PDF/XLSX services | Reuse for LPO and registers |
| Attachments | No shared entity yet | Add metadata-backed attachment registry |
| Audit | `audit_logs` and audit service | Reuse and add transaction trace records |

## Conflicts to isolate or retire

- Contracts and contract demand data are outside the agreed procurement workflow. Do not make them prerequisites for goods requisitions.
- Kitchen requisitions, production, consumption, wastage, and staff-meal concepts conflict with the new scope. Keep legacy routes isolated while the new generic store-issue and register flows are introduced; do not extend them into the new procurement model.
- Existing Daily/Weekly purchase typing is not the new Goods/Cash distinction. Keep the column for backward compatibility, but new requisitions use an explicit requisition type.
- Existing store issues are kitchen-specific. Make the relationship optional and add a generic source/destination store issue path so issuance follows receiving without confusing it with requisitioning.

## Implementation checklist

- [x] Repository and architecture assessment
- [x] Reuse-versus-rebuild decision
- [x] Working PostgreSQL development setup and running server
- [x] Foundation extensions: attachments, approval history, idempotency, procurement permissions
- [x] Goods and cash requisition workflows
- [x] LPO creation, totals, status transitions, and operational UI
- [x] Supplier invoice registration and duplicate protection
- [x] Multi-delivery receiving with ordered/received/outstanding quantities
- [x] Generic stock issuance to destination stores with locking
- [x] Payment vouchers and supplier receipts
- [x] End-to-end traceability endpoint and detail views
- [x] Operational registers
- [x] Focused integration tests for authorization, duplicates, partial delivery, over-receiving, over-issuing, and traceability

## Delivered procurement operations surface

The new routes are mounted below `/api/procurement-system` so legacy catering flows remain available without becoming prerequisites. The SPA procurement workspace now includes forms and live registers for goods requisitions, cash requisitions, LPOs, supplier deliveries, payment vouchers, supplier receipts, store transfers, and linked traceability.

The implementation intentionally does not add petty-cash retirement/accountability, sales/POS, customer orders, selling prices, kitchen consumption, recipes, production wastage, staff meals, or extra cost-centre workflows to the new procurement model.
