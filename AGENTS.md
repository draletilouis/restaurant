# Agent Operating Instructions

You are a senior software architect and full-stack engineer building this ERP.

Do not simply generate code. Design, build, test, verify, refactor, and continue improving until the result matches this specification.

After implementing every feature or module:
- Run the project.
- Check for TypeScript, lint, build, database, and runtime errors.
- Test the workflow manually where possible.
- Fix all issues found.
- Refactor poor code.
- Do not move to the next module until the current module works correctly.

If implementation fails, diagnose the cause, fix it, and retry.

Never remove existing functionality unless explicitly instructed.

Design the system to be extensible for later Finance, HR, Asset Management, Fleet, Payroll, and Reporting modules.


Build a Phase 1 ERP system for a contract-based office catering company.

The company purchases supplies weekly and monthly in bulk, stores them in a central store, and later issues stock to the kitchen through requisitions. The system should focus on contracts, procurement, stores, kitchen requisitions, production, and consumption analysis.

Core business flow:

Client Contract
→ Weekly/Monthly Purchases
→ Goods Received into Central Store
→ Kitchen Requisition
→ Store Issue
→ Production Batch
→ Consumption Analysis

Build the system as a clean, modular web application with the following modules.

---

## 1. Contract Management

Purpose:
Manage corporate office catering contracts that determine future production and procurement needs.

Entities:

* Client
* Client Branch / Delivery Location
* Contract
* Contract Schedule
* Contract Item

Contract fields:

* Client name
* Contract start date
* Contract end date
* Billing cycle
* Payment terms
* Price per meal or service unit
* Delivery location
* Delivery days
* Expected daily quantity
* Contract status: Draft, Active, Suspended, Expired

Screens:

* Clients list
* Client profile
* Create/Edit Contract
* Active Contracts dashboard
* Contract detail page

Required features:

* Add corporate clients
* Add multiple delivery locations per client
* Create recurring contracts
* Define expected quantities per day/week/month
* Mark contracts as active or inactive
* View all active contracts and expected demand

---

## 3. Procurement Management

Purpose:
Manage actual purchasing from suppliers.

Entities:

* Supplier
* Purchase Requisition
* Purchase Requisition Item
* Purchase Order
* Purchase Order Item
* Goods Received Note
* Supplier Invoice
* Supplier Payment

Workflow:
Purchase Requisition
→ Approval
→ Purchase Order
→ Goods Received Note
→ Supplier Invoice
→ Payment Tracking

Screens:

* Suppliers list
* Supplier profile
* Purchase Requisitions
* Create Purchase Requisition
* Approve Purchase Requisition
* Purchase Orders
* Goods Received
* Supplier Invoices
* Supplier Balances

Required features:

* Add suppliers
* Create purchase requisitions manually
* Approve/reject purchase requisitions
* Generate purchase orders
* Receive goods into central store
* Record supplier invoice
* Track supplier payment status
* Keep supplier price history

Statuses:
Purchase Requisition:

* Draft
* Submitted
* Approved
* Rejected
* Converted to PO

Purchase Order:

* Draft
* Sent
* Partially Received
* Fully Received
* Cancelled

Goods Received Note:

* Draft
* Confirmed

---

## 4. Central Stores & Inventory Management

Purpose:
Control all stock received, stored, adjusted, transferred, and issued.

Entities:

* Product
* Product Category
* Unit of Measure
* Store Location
* Inventory Balance
* Stock Movement
* Stock Batch
* Stock Adjustment
* Physical Stock Count

Product fields:

* Name
* Category
* Unit of measure
* Minimum stock level
* Reorder level
* Is perishable: yes/no
* Default supplier
* Status: Active/Inactive

Stock batch fields:

* Product
* Quantity received
* Quantity remaining
* Batch number
* Expiry date
* Supplier
* Goods received note
* Unit cost

Stock movement types:

* Goods Received
* Store Issue
* Return to Store
* Stock Adjustment
* Damage/Spoilage
* Transfer
* Physical Count Correction

Screens:

* Products list
* Product detail
* Inventory dashboard
* Current stock balances
* Stock movement history
* Expiring stock report
* Low stock report
* Stock adjustment screen
* Physical stock count screen

Required features:

* Receive stock from goods received notes
* Maintain real-time stock balances
* Track stock by batch and expiry date
* Deduct stock only through approved issues
* Record damaged or expired stock
* Support physical stock counts
* Show low stock alerts
* Show expiring stock alerts
* Maintain full audit trail of stock movement

Important rule:
Inventory must never be edited directly. Every stock change must create a Stock Movement record.

---

## 5. Kitchen Requisitions & Production

Purpose:
Control how stock leaves the store and enters production.

Entities:

* Kitchen Requisition
* Kitchen Requisition Item
* Store Issue
* Store Issue Item
* Production Batch
* Production Batch Item
* Wastage Record

Workflow:
Kitchen creates requisition
→ Store reviews
→ Store approves or rejects
→ Store issues stock
→ Inventory reduces
→ Kitchen records production batch
→ Wastage/returns are recorded

Kitchen Requisition fields:

* Request date
* Requested by
* Production date
* Department/kitchen
* Status
* Product items
* Requested quantity
* Approved quantity
* Issued quantity

Statuses:

* Draft
* Submitted
* Approved
* Rejected
* Issued
* Closed

Production Batch fields:

* Production date
* Shift
* Supervisor
* Linked requisition
* Planned output
* Actual output
* Wastage quantity
* Notes
* Status: Draft, Completed, Closed

Screens:

* Kitchen requisitions list
* Create requisition
* Approve requisition
* Store issue screen
* Production batches
* Create production batch
* Production history

Required features:

* Kitchen requests stock from store
* Store approves quantities
* Store issues approved stock
* Inventory is deducted only after issue
* Production records actual output
* Record wastage
* Record unused stock returned to store
* Link production batches to requisitions

Important rule:
The kitchen cannot remove stock directly from inventory. Stock must move through approved requisitions and store issues.

---

## 6. Consumption Analysis

Purpose:
Show how purchased and issued stock is actually consumed, and identify wastage, inefficiencies, or unusual usage.

Entities:

* Consumption Report
* Consumption Variance
* Product Usage Summary

Reports:

* Purchased vs Issued vs Remaining
* Issued vs Produced
* Expected Usage vs Actual Usage
* Consumption per Meal/Unit
* Wastage Report
* Product Usage Trend
* High Consumption Alert
* Stock Loss Report

Required calculations:
Purchased Quantity:
Total quantity received from suppliers.

Issued Quantity:
Total quantity issued from store to kitchen.

Remaining Quantity:
Current stock balance.

Consumed Quantity:
Issued Quantity - Returned Quantity - Recorded Wastage.

Wastage Rate:
Wastage Quantity / Issued Quantity × 100

Consumption per Unit:
Consumed Quantity / Actual Production Output

Screens:

* Consumption dashboard
* Product consumption report
* Daily consumption report
* Weekly consumption report
* Monthly consumption report
* Variance report

Required features:

* Compare expected consumption with actual usage
* Show unusual consumption
* Show wastage by product
* Show consumption trends over time
* Show which products are moving fastest
* Help management identify theft, waste, poor estimation, or overuse

---

## Recommended Database Tables

Create these tables:

users
roles
permissions

clients
client_locations
contracts
contract_schedules
contract_items

suppliers
products
product_categories
units_of_measure
store_locations

purchase_requisitions
purchase_requisition_items
purchase_orders
purchase_order_items
goods_received_notes
goods_received_note_items
supplier_invoices
supplier_payments

inventory_balances
stock_batches
stock_movements
stock_adjustments
physical_stock_counts
physical_stock_count_items

kitchen_requisitions
kitchen_requisition_items
store_issues
store_issue_items
production_batches
production_batch_items
wastage_records
stock_returns

consumption_reports
audit_logs

---

## Roles and Permissions

Create these user roles:

Admin:
Full system access.

Procurement Officer:
Can manage suppliers, requisitions, purchase orders, and supplier invoices.

Store Manager:
Can receive goods, manage stock, approve store issues, perform stock counts, and view inventory reports.

Kitchen Supervisor:
Can create kitchen requisitions, record production batches, record wastage, and return unused stock.

Finance Officer:
Can view supplier invoices, supplier payments, contract billing data, and reports.

Manager:
Can approve purchase requisitions, stock adjustments, and view dashboards.

Rules:

* Only approved users can approve transactions.
* Users cannot approve their own requests unless they are Admin.
* Every create, update, approve, reject, receive, issue, and adjustment action must be logged.

---

## Dashboard Requirements

Build a Phase 1 dashboard showing:

* Active contracts
* Weekly expected demand
* Current stock value
* Low stock items
* Expiring stock items
* Pending purchase requisitions
* Pending purchase orders
* Pending kitchen requisitions
* Today’s production batches
* Top consumed products
* Wastage value
* Supplier balances

---

## API Structure

Use REST or server actions. Create endpoints/actions for:

Contracts:

* createClient
* updateClient
* createContract
* updateContract
* activateContract
* suspendContract
* getActiveContracts

Procurement:

* createSupplier
* createPurchaseRequisition
* approvePurchaseRequisition
* rejectPurchaseRequisition
* createPurchaseOrder
* receiveGoods
* createSupplierInvoice
* recordSupplierPayment

Inventory:

* createProduct
* updateProduct
* getInventoryBalances
* getStockMovements
* createStockAdjustment
* approveStockAdjustment
* performPhysicalStockCount
* getLowStockItems
* getExpiringStockItems

Kitchen:

* createKitchenRequisition
* submitKitchenRequisition
* approveKitchenRequisition
* rejectKitchenRequisition
* issueStockToKitchen
* createProductionBatch
* completeProductionBatch
* recordWastage
* returnUnusedStock

Consumption:

* getProductConsumptionReport
* getDailyConsumptionReport
* getWeeklyConsumptionReport
* getMonthlyConsumptionReport
* getVarianceReport
* getWastageReport

---

## UI Design Instructions

Use a clean business ERP layout.

Layout:

* Left sidebar navigation
* Top bar with user name and notifications
* Main dashboard cards
* Tables for lists
* Forms for creation and editing
* Status badges
* Approval buttons
* Search and filters

Navigation:
Dashboard
Contracts
Procurement
Inventory & Stores
Kitchen Requisitions
Production
Consumption Analysis
Reports
Settings

Use clear status colors:

* Draft: grey
* Submitted: blue
* Approved: green
* Rejected: red
* Pending: orange
* Completed: green
* Cancelled: dark grey

Every module should have:

* List page
* Detail page
* Create form
* Edit form where allowed
* Status actions
* Audit trail

---

## Implementation Order

Build in this order:

1. Authentication, users, roles, permissions
2. Master data: products, units, suppliers, clients, store locations
3. Contract management
4. Inventory foundation: stock balances, stock batches, stock movements
5. Purchase requisitions and purchase orders
6. Goods received notes and stock receiving
7. Kitchen requisitions
8. Store issues
9. Production batches
10. Wastage and stock returns
11. Consumption analysis
12. Dashboards and reports
13. Audit logs and approval controls

---

## Critical Business Rules

1. Stock cannot change without a stock movement.
2. Kitchen cannot consume stock unless it was issued by store.
3. Purchases should be traceable to supplier requirements and approved requisitions.
4. Purchases are weekly or monthly, not order-by-order.
5. Every purchase must be traceable to a supplier.
6. Every received item must enter central stores.
7. Every store issue must be linked to a requisition.
8. Every production batch must be linked to issued stock.
9. Consumption analysis must compare received, issued, consumed, wasted, returned, and remaining quantities.
10. All approvals and stock changes must be auditable.

---

## Expected Phase 1 Output

At the end of Phase 1, the system should allow the company to:

* Manage corporate catering contracts
* Purchase supplies in bulk
* Receive supplies into central store
* Track inventory accurately
* Issue stock to the kitchen only through requisitions
* Record production batches
* Track wastage and unused stock
* Analyze consumption
* Know what was bought, stored, issued, consumed, wasted, and remaining
* Generate management reports for procurement, stores, production, and consumption
