# Cater ERP User Guide

## 1. What Cater ERP is for

Cater ERP controls the operational chain for a contract catering business:

```text
Client contract
  -> Purchase requisition
  -> Purchase order
  -> Goods received into store
  -> Kitchen requisition
  -> Store issue
  -> Production batch
  -> Wastage / unused-stock return
  -> Consumption analysis and reports
```

The system is designed so that stock is never changed silently. Every receipt, issue, return, adjustment, or count correction creates an auditable stock movement.

## 2. Signing in

1. Open the Cater ERP address supplied by your administrator. For a local installation, this is normally `http://localhost:3000`.
2. Enter your username and password.
3. Select **Sign in**.

When the demo database is initialized, the following demo accounts are available. They all use the demo password `admin123`:

| Username | Role | Main responsibility |
| --- | --- | --- |
| `admin` | Admin | Full access, users, configuration, approvals, and audit |
| `grace.namutebi` | Procurement Officer | Suppliers and purchasing |
| `moses.okello` | Store Manager | Stock, receiving, counts, issues, and kitchen approvals |
| `aisha.nakanjako` | Kitchen Supervisor | Kitchen requests, production, wastage, and returns |
| `peter.ssemakula` | Finance Officer | Supplier invoices, payments, cash release, and settlement |
| `diana.mukasa` | Manager | Procurement approvals, cash controls, and management review |

Use these credentials only for the seeded demo environment. Change or replace them before production use.

## 3. Common screen controls

- **Left navigation:** opens each work area. The available navigation can differ by role.
- **Search:** searches the current tab only. It does not search the whole database.
- **Reset:** clears the current tab's search and filters.
- **Refresh / Reload:** fetches the latest records from the server.
- **Refresh icon in the top bar:** refreshes the live workspace data.
- **Recent activity icon:** shows recent activity when available.
- **Help icon:** opens workspace guidance.
- **Moon / sun icon:** switches between light and dark themes.
- **User menu:** opens Settings for administrators or signs out.
- **View:** opens the record detail window, including linked data and audit history where available.
- **Export CSV:** downloads the rows currently represented by the active tab.
- **PDF / Excel / CSV report buttons:** appear in the Reports tab.

Status badges are color coded. Grey normally means Draft, blue means Submitted or Sent, green means Approved or Completed, orange means Pending or partially complete, red means Rejected or Expired, and dark grey means Cancelled or Closed.

## 4. Recommended first-time setup

An administrator should complete setup in this order:

1. Open **Configurations** and confirm the units, categories, stores, departments, statuses, numbering series, payment terms, delivery types, tax settings, and notification rules.
2. Open **Approval Matrix** and confirm who approves purchase requisitions, kitchen requisitions, cash requisitions, and any configured amount limits.
3. Open **Settings** and create named user accounts with the correct roles.
4. Open **Suppliers** and create supplier records with payment terms.
5. Open **Inventory & stores > Products** and create every item that can be purchased, stored, issued, or consumed.
6. Open **Contracts** and create clients, delivery locations, and active contracts.
7. Confirm the Dashboard shows the expected contracts, stock, and operational queues.

Do not start transactions until the products, units, supplier links, store locations, and approval responsibilities are correct.

---

## 5. Dashboard

The Dashboard is the daily control centre. It shows:

- **Active contracts:** current client agreements.
- **Contract demand:** configured demand from active contracts.
- **Stock value:** value of stock held across stores.
- **Recorded wastage:** value of wastage already recorded.
- **Work requiring attention:** approvals, open purchase requisitions, open purchase orders, kitchen requests, and expiring stock.
- **Stock to review:** items below their stock thresholds.
- **Today's production:** production batches scheduled for the current day.
- **Active delivery commitments:** active client locations, quantities, delivery days, and contract status.
- **Recent activity:** recent non-login audit events.
- **Supplier balances:** suppliers with outstanding balances.

Use the links and attention cards on the Dashboard to jump directly to the relevant tab. Start each day here, then clear the queues that require action.

## 6. Approvals

The Approvals tab is a consolidated queue for users who have approval permissions. It prevents approvers from having to search every module separately.

### How to use it

1. Search by document number, requester, supplier, or status.
2. Open the record with **View** and confirm the header, line items, quantities, amount, and audit history.
3. Approve when the request is correct.
4. Reject when it should not proceed. Where the form requests a reason, record a clear reason.
5. If the business process supports returning for revision, explain what the requestor must correct.
6. Refresh the queue and confirm the status changed.

The creator cannot approve their own request unless the account is an Admin and the configured workflow permits it. In the seeded workflow, purchase requisitions are approved by a Manager and kitchen requisitions by a Store Manager.

---

## 7. Contracts

Contracts define the client demand that informs production and purchasing.

### Contract list tabs

- **Active:** current contracts and expected service quantities.
- **Expiring:** contracts whose end date needs renewal attention.
- **Suspended:** temporarily inactive agreements.
- **Expired:** agreements that have passed their end date.
- **All Contracts:** complete contract register.

Use the search box for contract number, client, or location. Use **New Contract** to open the contract workspace. Use **View** to inspect a record, **Edit** to update a non-active record, **Renew** for an active or expiring record, **Activate** for inactive records, and **Suspend** for active records.

### Contract workspace tabs

#### Client & Location

Enter or confirm:

- Client name, contact person, phone, email, and address.
- Delivery location name, contact person, phone, address, and delivery notes.

You can also maintain clients and delivery locations in the separate panels on the Contracts screen. Create a client first when the client will have multiple locations.

#### Terms

Enter:

- Contract start and end dates.
- Payment terms.
- Delivery type.
- Price per meal or service unit.
- Expected service units per day.
- Notes.

#### Billing & Schedule

Choose the billing cycle:

- **Daily:** select the repeating weekdays and delivery time.
- **Weekly:** select one weekday and delivery time.
- **Monthly:** select the calendar day and delivery time.
- **Custom:** use the Custom Dates tab for exact dates and quantities.

Choose the cycle that matches the signed agreement. The schedule is used for demand visibility; it does not create a purchase order automatically.

#### Custom Dates

This tab appears when Billing Cycle is **Custom**. Add each exact service date, expected quantity, optional delivery time, and whether the date is active.

#### Contract Items

Add the products or service items covered by the contract. For each item, enter:

- Product.
- Service unit.
- Quantity per delivery.
- Unit price.
- Optional notes.

Use **Define Product** if the required product does not yet exist.

### Saving and activating a contract

1. Complete the five contract workspace tabs.
2. Select **Save Contract**.
3. Open the contract from the list and use **View** to verify all terms, schedules, and items.
4. Activate the contract when it is approved for service.
5. Suspend or expire it only when the business decision has been made and recorded.

## 8. Procurement

Procurement is where the company plans purchases, orders from suppliers, receives goods, records supplier invoices, and tracks payment.

### Purchase Requisitions tab

Use this tab to request supplies. It supports:

- **Weekly Purchase:** bulk weekly replenishment.
- **Daily Purchase:** shorter-cycle or urgent purchasing.

To create a requisition:

1. Select **New Requisition**.
2. Enter the request date.
3. Select Daily or Weekly Purchase.
4. Add each product, requested quantity, approved quantity if already known, estimated unit cost, and optional preferred supplier.
5. Add notes explaining the requirement.
6. Select **Save Requisition**.
7. Review the saved Draft. In the current workspace, an authorized approver can approve a Draft directly; records that are already Submitted follow the same approval path.
8. The approver reviews it in Approvals or from the requisition row.
9. After approval, use **Create PO**.

Do not mark a requisition approved just because the quantity was requested. Approval means the business has agreed to buy it.

### Purchase Orders tab

Use this tab to place the supplier order.

1. Select **New Purchase Order**.
2. Link the approved purchase requisition where possible.
3. Select the purchase type and supplier.
4. Enter the order date, expected delivery date, and payment terms.
5. Add the products, ordered quantities, and agreed unit costs.
6. Save the order. It starts as Draft.
7. Open the row action and select **Send** when the order has been issued to the supplier.
8. Use **Receive** when the supplier delivery arrives.

Keep the purchase type consistent between a linked requisition and purchase order.

### Goods Received tab

Use this tab when goods physically arrive. Receiving goods is what puts stock into the inventory ledger.

1. Select **Receive Goods**.
2. Choose the purchase order.
3. Enter the actual receipt date.
4. Add each received product and actual quantity.
5. Enter unit cost, supplier batch number, and expiry date where applicable.
6. Compare the physical delivery with the supplier delivery note and the purchase order.
7. Select **Confirm Goods Received**.
8. Check Inventory & stores to confirm the new balance and movement.

Receive the quantity actually delivered, not automatically the quantity ordered. Partial receipt is allowed and keeps the purchase order open until fully received.

### Suppliers tab inside Procurement

This is a procurement shortcut to the supplier register. Use it for quick supplier lookup while purchasing. Use the standalone **Suppliers** navigation item for the full directory and supplier-linked product view.

### Invoices tab

Record a supplier invoice after checking it against the purchase order and goods received note.

1. Select **Record Invoice**.
2. Enter or accept the invoice number.
3. Select the supplier, purchase order, and goods received note.
4. Enter invoice date, payment method, due date when applicable, payment terms, and total amount.
5. Save the invoice.
6. Use the invoice detail and payment status to track what is still outstanding.

For credit invoices, always enter a due date or payment term so supplier balances and aging are meaningful.

### Cash Requisitions tab

Use this workflow for a cash request that is not being captured as a normal stock purchase order.

1. Select **New Cash Requisition**.
2. Enter request date, required date, department, payee, amount, purpose, and notes.
3. Save the Draft.
4. Submit it for approval.
5. An authorized approver can approve, reject, or return it for revision.
6. A user with cash-release permission selects **Release Cash**, records the method and release reference, and confirms the release.
7. After the spend, a user with settlement permission selects **Settle** and enters settlement date, actual amount spent, cash returned, receipt reference, and any variance reason.
8. Confirm the request is Closed and reconciled.

### Payment Vouchers tab

Use this tab to prepare and complete payments against a supplier invoice or an approved cash requisition.

1. Select **New Payment Voucher** or use **Pay** from a supplier invoice.
2. Choose the source: Supplier Invoice or Cash Requisition.
3. Confirm the payment-to party, date, amount, method, reference, and notes.
4. Select **Prepare Payment Voucher**. The voucher starts as Draft.
5. Submit it for approval.
6. An authorized approver approves or rejects it.
7. After approval, select **Mark Paid** and retain the payment reference.
8. Use **Print** or **View** to retain the voucher record.

## 9. Suppliers

The standalone Suppliers tab is the supplier directory.

### Supplier Directory

Use it to:

- Search suppliers by name, payment terms, phone, or status.
- Add a supplier with name, contact person, phone, address, and payment terms.
- Open a supplier profile to review linked information.
- Edit supplier details when the record changes.
- Export the current supplier list to CSV.

The supplier's payment terms affect invoice due dates and the supplier balance report. Link products to their default supplier in Inventory & stores so purchasing has a useful starting point.

## 10. Inventory & stores

Inventory & stores is the authoritative stock record. The normal rule is:

```text
Goods received -> stock increases
Store issue -> stock decreases
Unused-stock return -> stock increases
Approved adjustment or count correction -> stock changes with an audit record
```

### Current Stock tab

View product, category, store, quantity on hand, and stock value. Use **View** for the balance detail and movement context. This is the best tab for checking whether an issue can be fulfilled.

### Alerts tab

Shows a combined view of:

- Products at or below the reorder threshold.
- Perishable batches that are expiring soon or already overdue.

Use this tab to prioritize purchasing and first-expiry-first-out store issuing.

### Products tab

Create and maintain product master data.

Enter:

- Product name and SKU.
- Product type.
- Category.
- Unit of measure.
- Default supplier.
- Minimum stock level.
- Reorder level.
- Standard cost.
- Perishable Yes or No.
- Description.

Create the product before using it in a contract, requisition, receipt, kitchen request, or production record. Do not reuse one product for different units of measure.

### Stock Movements tab

Review the stock ledger by date, product, movement type, quantity in, and quantity out. Use **View** on the related inventory balance or source transaction when investigating a difference.

Movement types include goods received, store issue, return to store, stock adjustment, damage/spoilage, transfer, and physical-count correction.

### Adjustments tab

Use an adjustment for an approved stock correction such as damage, spoilage, loss, or another documented variance.

1. Select the store and adjustment date.
2. Enter a clear reason and notes.
3. Add products and quantity delta. Positive increases stock; negative reduces stock.
4. Save the adjustment as Draft.
5. An authorized approver reviews and approves it.
6. Confirm the movement appears in Stock Movements.

Never correct a balance by editing a number directly. Use an adjustment so the reason, approver, and movement remain traceable.

### Physical Counts tab

Use this tab during a stock count.

1. Select the store and count date.
2. Add each product and the physically counted quantity.
3. Select **Perform Physical Count**.
4. Review system quantity, counted quantity, and variance.
5. Escalate material variances for management review.
6. Confirm the count status and resulting correction movement.

## 11. Kitchen Requests

Kitchen Requests controls the movement from store to kitchen.

### Pending Approval tab

Shows Submitted or Pending kitchen requisitions. Review the request date, production date, department, store, product lines, and requested quantities. Approve with the correct quantities or reject with a clear reason.

### Active Requests tab

Shows open requisitions that are still moving through approval or issue. Use this tab to see what the kitchen still needs.

### Issued tab

Shows requisitions for which stock has already been issued. Use it to confirm that the kitchen received the approved quantity.

### Store Issues tab

Shows the store issue register. Use **Issue Stock** to post an issue against an approved kitchen requisition.

To issue stock:

1. Select an approved kitchen requisition.
2. Enter the issue date.
3. Add each requisition item, product, issued quantity, and unit cost.
4. Confirm the issue.
5. Check Inventory & stores to verify the quantity decreased.

The system prevents a kitchen issue from being treated as a direct kitchen withdrawal. It must be linked to the approved requisition.

### Closed tab

Shows completed or closed kitchen requisitions for history and audit review.

### Creating a kitchen requisition

1. Select **New Requisition** or **Schedule Request**.
2. Enter request date, production date, department, and source store.
3. Add the products and requested quantities.
4. Save the requisition.
5. Select **Submit** from the row action.
6. The Store Manager or another configured approver approves or rejects it.
7. The Store Manager posts the issue.

## 12. Production

Production records what was made from the stock issued to the kitchen.

### Today's Batches tab

Use this as the daily production board. It shows planned output, actual output, status, and the action to complete an open batch.

### Production Plan tab

Use this view to review planned or scheduled production batches before closeout. Confirm each batch is linked to the correct kitchen requisition and store issue.

### Completed tab

Shows completed and closed batches. Use it for production history and output review.

### Wastage tab

Shows wastage by date, product, type, quantity, and value.

To record wastage:

1. Select the production batch and, where applicable, the store issue.
2. Select the product.
3. Enter quantity, record date, and wastage type.
4. Save the wastage record.

Record spoilage, trimming, overcooking, expired stock, or other losses on the day they are identified. Do not hide wastage inside a generic stock adjustment when it is production-related.

### Returns tab

Use this tab when unused stock comes back from the kitchen.

1. Select the kitchen requisition and store issue.
2. Select the receiving store.
3. Enter return date.
4. Add returned products, quantities, and unit costs.
5. Select **Return Unused Stock**.
6. Confirm the stock balance and Return movement increased in the selected store.

### Creating and completing a production batch

1. Select **New Batch**.
2. Enter production date, shift, department, delivery type, kitchen requisition, and store issue.
3. Enter planned output.
4. Add the products consumed by the batch and their quantities.
5. Save the batch as Draft.
6. At closeout, select **Complete**.
7. Enter actual output and wastage quantity.
8. Record detailed wastage in the Wastage workflow and unused stock in Returns.
9. Confirm the batch is Completed and linked to the issue.

## 13. Consumption

Consumption analyzes a selected date range. Set Start Date and End Date, then select **Refresh Reports** before interpreting the numbers.

### Overview tab

Shows purchased, issued, returned, wasted, consumed, remaining, and consumption per unit by product. It also shows the consumption trend and top consumed products.

### Product Consumption tab

Use this for product-level analysis. Compare products to find fast-moving items, slow-moving stock, or products with unexpectedly high usage.

### Variance tab

Compares the consumption calculated from stock movements with recorded production usage. Investigate large positive or negative variance by opening the related requisition, issue, batch, return, and wastage records.

### Waste Analysis tab

Shows wastage date, product, quantity, and value for the selected range. Use it to identify recurring waste by product or shift.

### Trends tab

Shows daily production output and wastage, together with weekly and monthly rollups. Use this to spot rising waste, changing output, and seasonal demand.

### Calculation rules

- **Purchased Quantity:** total quantity received from suppliers in the selected period.
- **Issued Quantity:** total quantity issued from stores to the kitchen in the selected period.
- **Remaining Quantity:** current stock balance across stores.
- **Consumed Quantity:** issued quantity minus returned quantity minus recorded wastage.
- **Wastage Rate:** wastage quantity divided by issued quantity, multiplied by 100.
- **Consumption per Unit:** consumed quantity divided by actual production output.

## 14. Reports

Reports are organized into categories. Select a period first where the report requires one. Available periods are Today, This week, This month, This year, or Custom.

Each report card supports **Preview**, **PDF**, **Excel**, and **CSV**. Preview is best for checking the data before exporting.

### Operational tab

- **Operational Snapshot:** active contracts, pending procurement, kitchen requests, and today's production.

### Inventory tab

- **Inventory Health:** current balances, stock value, low stock, and expiring batches.
- **Stock Movement History:** all stock movements in the selected period.
- **Stock Adjustments:** approved and pending adjustments.

### Procurement tab

- **Procurement Pipeline:** purchase requisitions and purchase orders.
- **Purchase Orders:** order values, suppliers, and receipt status.
- **Goods Received:** confirmed receipts into stores.

### Finance tab

- **Supplier Payables:** invoices, payments, outstanding balances, and aging.

### Contracts tab

- **Contract Demand Outlook:** active and upcoming contracts with expected demand.

### Production tab

- **Kitchen Requisitions:** kitchen requests, approvals, and issues.
- **Production Batches:** planned versus actual output and wastage.
- **Product Consumption:** purchased, issued, consumed, wasted, returned, and remaining quantities.
- **Wastage Report:** wastage by product and production batch.

### Management tab

The Management tab provides the management-facing versions of the operational, inventory, procurement, finance, contract, and production reports. Use it for review meetings and export packs.

## 15. Configurations

Configurations control reusable definitions used by the rest of the system. Administrators should make changes carefully because they affect dropdowns, statuses, numbering, approvals, and alerts.

### Master Data

Use the inner selectors for:

- **Units:** kg, litres, pieces, packs, meals, and other measures.
- **Product Categories:** grouping used by products and reports.
- **Stores:** central, cold, dry, kitchen, packaging, or other store locations.
- **Departments:** procurement, stores, kitchen, production, finance, and management.

Create, edit, activate, or deactivate definitions. Deactivate a definition instead of deleting it when it is already used by transaction history.

### Workflow Controls

- **Statuses:** status names, codes, colors, terminal behavior, and the module they apply to.
- **Numbering Series:** document type, prefix, current number, padding, and reset frequency.

Do not change a numbering prefix or reset rule without agreeing how existing documents will remain identifiable.

### Commercial & Finance

- **Payment Terms:** name, days due, and description.
- **Delivery Types:** breakfast, lunch, dinner, tea break, special delivery, or other service types.
- **Expense Categories:** categories used for cash requisitions and future finance expansion.
- **Tax Settings:** tax name, rate, and whether it applies to purchases or sales.

### Alerts

Maintain notification rules for low stock, expiry, contract expiry, pending approval, and supplier invoice due dates. Set the threshold and recipient role so the right team sees the right warning.

Every configuration change is shown in the recent configuration audit area.

## 16. Approval Matrix

Approval Matrix shows the active rules that determine who reviews which document and at what stage.

Review:

- Workflow name.
- Document type.
- Required approver role.
- Approval level.
- Minimum and maximum amount.
- Whether the creator can approve.
- Active or inactive state.

Use this tab when responsibility changes. After a change, test one Draft-to-Submitted-to-Approved transaction and confirm the expected approver sees it in Approvals.

## 17. Settings

Settings is available to Admin users.

### Users tab

1. Select **Create User**.
2. Enter full name, username, email, and a temporary password.
3. Select one or more roles.
4. Create the user.
5. Use **Edit roles** when the user's responsibility changes.

Permissions from multiple selected roles are combined. Give users the smallest set of roles that allows them to do their job.

### Roles tab

Review role descriptions and the number of users assigned to each role. Use Approval Matrix for transaction-specific approval rules.

### Audit Trail tab

Search transaction history by actor, action, entity, or status. Use it to answer who created, updated, submitted, approved, rejected, received, issued, adjusted, or exported a record.

## 18. Daily operating routines

### Daily opening

1. Review Dashboard attention items.
2. Check Inventory & stores > Alerts.
3. Review Approvals.
4. Review today's Kitchen Requests and Production batches.
5. Confirm any deliveries expected today.

### Weekly procurement cycle

1. Review active contract demand.
2. Check current stock and reorder levels.
3. Raise a Weekly Purchase Requisition.
4. Submit and obtain approval.
5. Create and send the Purchase Order.
6. Receive goods when delivered, including batch and expiry details.
7. Record the supplier invoice.
8. Prepare, approve, and complete the payment voucher.

### Daily kitchen-to-production cycle

1. Kitchen creates a requisition for the planned production date.
2. Kitchen submits the requisition.
3. Store Manager reviews and approves quantities.
4. Store issues only the approved quantity.
5. Kitchen creates a production batch linked to that issue.
6. Kitchen records actual output and wastage.
7. Kitchen returns unused stock.
8. Management reviews Consumption and Reports.

### Period close

1. Finish all open production batches.
2. Record all wastage and returns.
3. Complete scheduled physical counts.
4. Review low stock, expiring stock, supplier balances, and variance.
5. Export the required management reports.
6. Check the Audit Trail for unusual or missing actions.

## 19. Data-entry rules that prevent errors

- Use the correct unit of measure; do not enter litres as kilograms or packs as pieces.
- Enter actual received quantities on Goods Received, not ordered quantities.
- Record batch number and expiry date for perishable stock.
- Link every Purchase Order to an approved requisition when the purchase came from a request.
- Link every Store Issue to an approved Kitchen Requisition.
- Link every Production Batch to the Store Issue that supplied it.
- Record unused stock as a Return and production loss as Wastage.
- Use Stock Adjustments for documented store corrections only.
- Never edit stock balances directly.
- Never approve your own request unless the Admin/workflow rule explicitly allows it.
- Use clear notes for rejections, returns for revision, damages, spoilage, and variances.
- Refresh after a status action and confirm the new badge before moving to the next step.

## 20. Current Phase 1 boundaries

The current navigation is focused on contracts, procurement, stores, kitchen requisitions, production, consumption, reporting, configuration, approvals, and audit.

The following areas are not part of the normal current workspace navigation and should not be expected as active tabs in this Phase 1 build:

- Office catering sales orders and customer billing.
- Customer invoices and customer receivables.
- Recipe / bill-of-materials management.
- A standalone inter-store transfer workspace.
- Full accounting, payroll, HR, fleet, asset management, or expense management.

Use the active tabs and workflows described in this guide as the system of record for the current release.

## 21. Troubleshooting

- **A list is empty:** confirm the correct nested tab, clear Search with Reset, then select Reload or refresh the top bar.
- **A dropdown is empty:** confirm the relevant master data exists and is active in Configurations or the Products/Suppliers register.
- **Approve is not available:** the signed-in user may not have the required permission, or the record may not be in Submitted/Pending status.
- **Issue is not available:** the kitchen requisition must be Approved first.
- **A product is missing from a form:** create or activate it in Inventory & stores > Products.
- **A supplier balance is wrong:** check supplier invoice total, payment voucher amount, payment status, and due date.
- **Consumption looks wrong:** confirm the date range and ensure all receipts, issues, returns, wastage, and completed batches were recorded before reading the report.
- **A configuration change is not visible:** select Reload. Existing records may retain their historical status or number even after configuration changes.
- **The database badge is unhealthy:** contact the administrator to check the PostgreSQL service and server environment.
