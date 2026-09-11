process.env.NODE_ENV = "test";
process.env.POSTGRES_DB_TEST = "cater_procurement_system_test";
process.env.SKIP_DEMO_SEED = "true";

const request = require("supertest");
const { resetTestDatabase } = require("./helpers/test-db");

jest.setTimeout(30000);

describe("procurement operations workflow", () => {
  let app;
  let db;
  let agent;
  let supplierId;
  let productId;
  let centralStoreId;
  let kitchenStoreId;

  beforeAll(async () => {
    await resetTestDatabase({ seedDemo: false });
    ({ app, db } = require("../server"));
    agent = request.agent(app);
    expect((await agent.post("/api/auth/login").send({ username: "admin", password: "admin123" })).status).toBe(200);

    const reference = (await agent.get("/api/master-data/reference-data")).body.data;
    const categoryId = reference.categories.find((row) => row.name === "Raw Materials").id;
    const unitId = reference.units.find((row) => row.code === "kg").id;
    centralStoreId = reference.stores.find((row) => row.name === "Central Store").id;
    kitchenStoreId = reference.stores.find((row) => row.name === "Kitchen Store").id;
    supplierId = (await agent.post("/api/master-data/suppliers").send({ name: "Operations Supplier", contactPerson: "Buyer", phone: "0700000000", paymentTerms: "30 days" })).body.data.id;
    productId = (await agent.post("/api/master-data/products").send({ name: "Operations Rice", sku: "OPS-RICE-001", productType: "Raw Material", productCategoryId: categoryId, unitOfMeasureId: unitId, minimumStockLevel: 0, reorderLevel: 0, standardCost: 100, defaultSupplierId: supplierId, isPerishable: false })).body.data.id;
  });

  afterAll(async () => {
    delete process.env.SKIP_DEMO_SEED;
    if (db?.pool) await db.pool.end();
  });

  test("runs goods requisition through LPO, partial deliveries, stock, invoice, payment voucher, and receipt", async () => {
    const requisitionPayload = {
      requestDate: "2026-09-08",
      requiredDate: "2026-09-12",
      purpose: "Bulk rice replenishment",
      items: [{ productId, quantityRequested: 500, estimatedUnitCost: 100 }],
    };
    const created = await agent.post("/api/procurement-system/goods-requisitions").set("Idempotency-Key", "goods-workflow-1").send(requisitionPayload);
    expect(created.status).toBe(201);
    const duplicate = await agent.post("/api/procurement-system/goods-requisitions").set("Idempotency-Key", "goods-workflow-1").send(requisitionPayload);
    expect(duplicate.status).toBe(200);
    expect(duplicate.body.idempotent).toBe(true);

    const requisitionId = created.body.data.id;
    expect((await agent.post(`/api/procurement-system/goods-requisitions/${requisitionId}/approve`)).status).toBe(400);
    expect((await agent.post(`/api/procurement-system/goods-requisitions/${requisitionId}/submit`)).status).toBe(200);
    const details = (await agent.get(`/api/procurement-system/goods-requisitions/${requisitionId}`)).body.data;
    const approved = await agent.post(`/api/procurement-system/goods-requisitions/${requisitionId}/approve`).send({ items: [{ id: details.items[0].id, quantityApproved: 500, estimatedUnitCost: 100 }] });
    expect(approved.status).toBe(200);

    const lpo = await agent.post("/api/procurement-system/lpos").send({ goodsRequisitionId: requisitionId, supplierId, orderDate: "2026-09-08", expectedDeliveryDate: "2026-09-12", items: [{ productId, quantityOrdered: 500, unitCost: 100 }] });
    expect(lpo.status).toBe(201);
    const lpoId = lpo.body.data.id;
    expect((await agent.post(`/api/procurement-system/lpos/${lpoId}/issue`)).status).toBe(200);

    const firstDelivery = await agent.post("/api/procurement-system/deliveries").send({ lpoId, deliveryNoteNumber: "DN-OPS-001", deliveryDate: "2026-09-09", items: [{ productId, quantityReceived: 300, unitCost: 100, batchNumber: "OPS-BATCH-1" }] });
    expect(firstDelivery.status).toBe(201);
    expect(firstDelivery.body.data.status).toBeUndefined();
    expect(firstDelivery.body.data.store_location_id).toBeUndefined();
    expect(Number(firstDelivery.body.summary[0].received_quantity)).toBe(300);
    expect(Number(firstDelivery.body.summary[0].outstanding_quantity)).toBe(200);
    expect((await agent.get(`/api/procurement-system/lpos/${lpoId}`)).body.data.header.status).toBe("Partially Received");

    const secondDelivery = await agent.post("/api/procurement-system/deliveries").send({ lpoId, deliveryNoteNumber: "DN-OPS-002", deliveryDate: "2026-09-10", items: [{ productId, quantityReceived: 150, unitCost: 100, batchNumber: "OPS-BATCH-2" }] });
    expect(secondDelivery.status).toBe(201);
    const concurrentDeliveries = await Promise.all([
      agent.post("/api/procurement-system/deliveries").send({ lpoId, deliveryNoteNumber: "DN-OPS-003", deliveryDate: "2026-09-11", items: [{ productId, quantityReceived: 40, unitCost: 100 }] }),
      agent.post("/api/procurement-system/deliveries").send({ lpoId, deliveryNoteNumber: "DN-OPS-004", deliveryDate: "2026-09-11", items: [{ productId, quantityReceived: 40, unitCost: 100 }] }),
    ]);
    expect(concurrentDeliveries.map((response) => response.status).sort()).toEqual([201, 400]);
    const overReceive = await agent.post("/api/procurement-system/deliveries").send({ lpoId, deliveryNoteNumber: "DN-OPS-005", deliveryDate: "2026-09-11", items: [{ productId, quantityReceived: 20, unitCost: 100 }] });
    expect(overReceive.status).toBe(400);
    const finalDelivery = await agent.post("/api/procurement-system/deliveries").send({ lpoId, deliveryNoteNumber: "DN-OPS-006", deliveryDate: "2026-09-12", items: [{ productId, quantityReceived: 10, unitCost: 100, batchNumber: "OPS-BATCH-3" }] });
    expect(finalDelivery.status).toBe(201);
    expect(finalDelivery.body.summary.every((row) => Number(row.outstanding_quantity) <= 0.0001)).toBe(true);
    expect((await agent.get(`/api/procurement-system/lpos/${lpoId}`)).body.data.header.status).toBe("Fully Received");

    const balances = (await agent.get("/api/inventory/balances")).body.data;
    const centralBalance = balances.find((row) => Number(row.product_id) === productId && Number(row.store_location_id) === centralStoreId);
    expect(Number(centralBalance.quantity_on_hand)).toBe(500);

    const invoice = await agent.post("/api/procurement-system/supplier-invoices").send({ invoiceNumber: "OPS-INV-001", supplierId, lpoId, invoiceDate: "2026-09-12", paymentMethod: "Credit", dueDate: "2026-09-26", totalAmount: 50000 });
    expect(invoice.status).toBe(201);
    expect(invoice.body.data.payment_method).toBe("Credit");
    const storedInvoiceDate = await db.get("SELECT TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date FROM supplier_invoices WHERE id = ?", [invoice.body.data.id]);
    expect(storedInvoiceDate.due_date).toBe("2026-09-26");
    const missingInvoiceDueDate = await agent.post("/api/procurement-system/supplier-invoices").send({ invoiceNumber: "OPS-INV-CREDIT-MISSING-DUE", supplierId, lpoId, invoiceDate: "2026-09-12", paymentMethod: "Credit", totalAmount: 50000 });
    expect(missingInvoiceDueDate.status).toBe(400);
    expect((await agent.post("/api/procurement-system/supplier-invoices").send({ invoiceNumber: "OPS-INV-001", supplierId, lpoId, invoiceDate: "2026-09-12", totalAmount: 50000 })).status).toBe(409);

    const voucher = await agent.post("/api/procurement-system/payment-vouchers").send({ supplierId, supplierInvoiceId: invoice.body.data.id, lpoId, amount: 50000, paymentDate: "2026-09-13", paymentMethod: "Bank Transfer" });
    expect(voucher.status).toBe(201);
    const voucherId = voucher.body.data.id;
    expect((await agent.post(`/api/procurement-system/payment-vouchers/${voucherId}/submit`)).status).toBe(200);
    expect((await agent.post(`/api/procurement-system/payment-vouchers/${voucherId}/approve`)).status).toBe(200);
    expect((await agent.post(`/api/procurement-system/payment-vouchers/${voucherId}/pay`).send({ referenceNumber: "BANK-OPS-001" })).status).toBe(200);
    expect((await agent.post(`/api/procurement-system/payment-vouchers/${voucherId}/pay`)).status).toBe(400);
    const receipt = await agent.post("/api/procurement-system/supplier-receipts").send({ supplierId, paymentVoucherId: voucherId, receiptDate: "2026-09-13", amount: 50000 });
    expect(receipt.status).toBe(201);

    const trace = await agent.get(`/api/procurement-system/traceability/goods-requisitions/${requisitionId}`);
    expect(trace.status).toBe(200);
    expect(trace.body.data.lpos).toHaveLength(1);
    expect(trace.body.data.deliveries).toHaveLength(4);
    expect(trace.body.data.stockMovements).toHaveLength(4);
    expect(trace.body.data.paymentVouchers).toHaveLength(1);
    expect(trace.body.data.supplierReceipts).toHaveLength(1);
  });

  test("runs cash requisitions through approval, controlled release, and settlement", async () => {
    const cash = await agent.post("/api/procurement-system/cash-requisitions").set("Idempotency-Key", "cash-workflow-1").send({ requestDate: "2026-09-08", purpose: "Urgent stationery purchase", payeeName: "Office Cashier", amount: 25000 });
    expect(cash.status).toBe(201);
    const cashId = cash.body.data.id;
    expect((await agent.post(`/api/procurement-system/cash-requisitions/${cashId}/submit`)).status).toBe(200);
    expect((await agent.post(`/api/procurement-system/cash-requisitions/${cashId}/approve`)).status).toBe(200);

    const requesterOnly = await agent.post("/api/auth/users").send({
      fullName: "Cash Requester",
      username: "cash_requester",
      password: "cash-password",
      roleCodes: ["procurement_officer"],
    });
    expect(requesterOnly.status).toBe(201);
    const unauthorized = request.agent(app);
    expect((await unauthorized.post("/api/auth/login").send({ username: "cash_requester", password: "cash-password" })).status).toBe(200);
    expect((await unauthorized.post(`/api/procurement-system/cash-requisitions/${cashId}/release`).send({ paymentMethod: "Cash" })).status).toBe(403);

    const finance = await agent.post("/api/auth/users").send({
      fullName: "Cash Finance Officer",
      username: "cash_finance",
      password: "cash-password",
      roleCodes: ["finance_officer"],
    });
    expect(finance.status).toBe(201);
    const financeAgent = request.agent(app);
    expect((await financeAgent.post("/api/auth/login").send({ username: "cash_finance", password: "cash-password" })).status).toBe(200);
    const released = await financeAgent.post(`/api/procurement-system/cash-requisitions/${cashId}/release`).send({
      paymentMethod: "Cash",
      notes: "Released to the office cashier.",
    });
    expect(released.status).toBe(200);
    expect(released.body.data.status).toBe("Cash Released");
    expect(released.body.data.release_payment_method).toBe("Cash");
    expect(released.body.data.release_reference_number == null || released.body.data.release_reference_number === "").toBe(true);

    const overspent = await financeAgent.post(`/api/procurement-system/cash-requisitions/${cashId}/settle`).send({
      settlementDate: "2026-09-09",
      actualSpentAmount: 23000,
      cashReturnedAmount: 3000,
      receiptReference: "RCPT-OVER-001",
    });
    expect(overspent.status).toBe(400);
    const unexplainedVariance = await financeAgent.post(`/api/procurement-system/cash-requisitions/${cashId}/settle`).send({
      settlementDate: "2026-09-09",
      actualSpentAmount: 22000,
      cashReturnedAmount: 0,
      receiptReference: "RCPT-001",
    });
    expect(unexplainedVariance.status).toBe(400);

    const unsettled = await financeAgent.post(`/api/procurement-system/cash-requisitions/${cashId}/settle`).send({
      settlementDate: "2026-09-09",
      actualSpentAmount: 22000,
      cashReturnedAmount: 3000,
      receiptReference: "RCPT-001",
      notes: "Receipt checked and cash returned to the office cashier.",
    });
    expect(unsettled.status).toBe(200);
    expect(unsettled.body.data.record.status).toBe("Closed");
    expect(Number(unsettled.body.data.settlement.actual_spent_amount)).toBe(22000);
    expect(Number(unsettled.body.data.settlement.cash_returned_amount)).toBe(3000);
    expect(Number(unsettled.body.data.settlement.variance_amount)).toBe(0);

    const detail = await financeAgent.get(`/api/procurement-system/cash-requisitions/${cashId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.settlement.receipt_reference).toBe("RCPT-001");
    expect((await financeAgent.post(`/api/procurement-system/cash-requisitions/${cashId}/settle`).send({ actualSpentAmount: 25000 })).status).toBe(400);

    const denied = await agent.post("/api/procurement-system/store-issues").send({ sourceStoreLocationId: centralStoreId, destinationStoreLocationId: kitchenStoreId, issueDate: "2026-09-14", items: [{ productId, quantity: 501 }] });
    expect(denied.status).toBe(400);
    const issued = await agent.post("/api/procurement-system/store-issues").send({ sourceStoreLocationId: centralStoreId, destinationStoreLocationId: kitchenStoreId, issueDate: "2026-09-14", items: [{ productId, quantity: 100 }] });
    expect(issued.status).toBe(201);
    const balances = (await agent.get("/api/inventory/balances")).body.data;
    expect(Number(balances.find((row) => Number(row.product_id) === productId && Number(row.store_location_id) === centralStoreId).quantity_on_hand)).toBe(400);
    expect(Number(balances.find((row) => Number(row.product_id) === productId && Number(row.store_location_id) === kitchenStoreId).quantity_on_hand)).toBe(100);
    expect((await agent.get("/api/procurement-system/registers/outstanding-lpo-deliveries")).status).toBe(200);
    expect((await agent.get("/api/procurement-system/registers/lpos")).status).toBe(200);
  });

  test("links an approved cash requisition to a printable payment voucher", async () => {
    const cash = await agent.post("/api/procurement-system/cash-requisitions").send({
      requestDate: "2026-09-08",
      purpose: "Fresh herbs for the kitchen",
      payeeName: "Market Runner",
      amount: 18000,
    });
    expect(cash.status).toBe(201);
    const cashId = cash.body.data.id;
    expect((await agent.post(`/api/procurement-system/cash-requisitions/${cashId}/submit`)).status).toBe(200);
    expect((await agent.post(`/api/procurement-system/cash-requisitions/${cashId}/approve`)).status).toBe(200);

    const voucher = await agent.post("/api/procurement-system/payment-vouchers").send({
      cashRequisitionId: cashId,
      amount: 18000,
      paymentDate: "2026-09-08",
      paymentMethod: "Cash",
    });
    expect(voucher.status).toBe(201);
    expect(voucher.body.data.supplier_id).toBeNull();
    expect(voucher.body.data.cash_requisition_id).toBe(cashId);
    const voucherId = voucher.body.data.id;

    const list = await agent.get("/api/procurement-system/payment-vouchers");
    expect(list.status).toBe(200);
    const listed = list.body.data.find((row) => row.id === voucherId);
    expect(listed.payee_name).toBe("Market Runner");
    expect(listed.cash_requisition_number).toBeTruthy();

    expect((await agent.post(`/api/procurement-system/payment-vouchers/${voucherId}/submit`)).status).toBe(200);
    expect((await agent.post(`/api/procurement-system/payment-vouchers/${voucherId}/approve`)).status).toBe(200);
    const paid = await agent.post(`/api/procurement-system/payment-vouchers/${voucherId}/pay`).send({ referenceNumber: "CASH-VOUCHER-001" });
    expect(paid.status).toBe(200);

    const cashDetail = await agent.get(`/api/procurement-system/cash-requisitions/${cashId}`);
    expect(cashDetail.body.data.record.status).toBe("Cash Released");
    expect(cashDetail.body.data.record.release_reference_number).toBe("CASH-VOUCHER-001");

    const printable = await agent.get(`/api/documents/payment-vouchers/${voucherId}/html`);
    expect(printable.status).toBe(200);
    expect(printable.text).toContain("Payment Voucher");
    expect(printable.text).toContain("Market Runner");
  });

  test("lists pending approvals with ready-to-use decisions", async () => {
    const requisition = await agent.post("/api/procurement-system/goods-requisitions").set("Idempotency-Key", "approval-queue-1").send({
      requestDate: "2026-09-08",
      requiredDate: "2026-09-15",
      purpose: "Approval queue verification",
      items: [{ productId, quantityRequested: 25, estimatedUnitCost: 100 }],
    });
    expect(requisition.status).toBe(201);
    const requisitionId = requisition.body.data.id;
    expect((await agent.post(`/api/procurement-system/goods-requisitions/${requisitionId}/submit`)).status).toBe(200);

    const queue = await agent.get("/api/approvals/pending");
    expect(queue.status).toBe(200);
    const pending = queue.body.data.find((row) => row.entityType === "goods_requisition" && row.id === requisitionId);
    expect(pending).toBeDefined();
    expect(pending.canAct).toBe(true);
    expect(pending.approveBody.items[0].quantityApproved).toBe(25);
    expect(pending.rejectPath).toBe(`/api/procurement-system/goods-requisitions/${requisitionId}/reject`);

    const rejected = await agent.post(pending.rejectPath).send({ reason: "Please confirm the required date." });
    expect(rejected.status).toBe(200);
    expect(rejected.body.data.status).toBe("Rejected");
  });

  test("keeps procurement and kitchen approval permissions separate", async () => {
    const manager = await agent.post("/api/auth/users").send({
      fullName: "Procurement Approver",
      username: "procurement_approver",
      password: "approval-password",
      roleCodes: ["manager"],
    });
    expect(manager.status).toBe(201);

    const storeManager = await agent.post("/api/auth/users").send({
      fullName: "Kitchen Approver",
      username: "kitchen_approver",
      password: "approval-password",
      roleCodes: ["store_manager"],
    });
    expect(storeManager.status).toBe(201);

    const kitchenUser = request.agent(app);
    expect((await kitchenUser.post("/api/auth/login").send({ username: "kitchen_approver", password: "approval-password" })).status).toBe(200);
    const procurementUser = request.agent(app);
    expect((await procurementUser.post("/api/auth/login").send({ username: "procurement_approver", password: "approval-password" })).status).toBe(200);

    const procurementRequest = await agent.post("/api/procurement-system/goods-requisitions").send({
      requestDate: "2026-09-08",
      requiredDate: "2026-09-15",
      purpose: "Permission separation check",
      items: [{ productId, quantityRequested: 10, estimatedUnitCost: 100 }],
    });
    expect(procurementRequest.status).toBe(201);
    const procurementId = procurementRequest.body.data.id;
    expect((await agent.post(`/api/procurement-system/goods-requisitions/${procurementId}/submit`)).status).toBe(200);
    const procurementDetails = (await agent.get(`/api/procurement-system/goods-requisitions/${procurementId}`)).body.data;
    expect((await kitchenUser.post(`/api/procurement-system/goods-requisitions/${procurementId}/approve`).send({
      items: [{ id: procurementDetails.items[0].id, quantityApproved: 10, estimatedUnitCost: 100 }],
    })).status).toBe(403);
    expect((await procurementUser.post(`/api/procurement-system/goods-requisitions/${procurementId}/approve`).send({
      items: [{ id: procurementDetails.items[0].id, quantityApproved: 10, estimatedUnitCost: 100 }],
    })).status).toBe(200);

    const kitchenRequest = await agent.post("/api/kitchen/requisitions").send({
      requestDate: "2026-09-08",
      productionDate: "2026-09-09",
      sourceStoreLocationId: centralStoreId,
      departmentName: "Kitchen",
      items: [{ productId, requestedQuantity: 5 }],
    });
    expect(kitchenRequest.status).toBe(201);
    const kitchenId = kitchenRequest.body.data.id;
    expect((await agent.post(`/api/kitchen/requisitions/${kitchenId}/submit`)).status).toBe(200);
    const kitchenDetails = (await agent.get(`/api/kitchen/requisitions/${kitchenId}`)).body.data;
    expect((await procurementUser.post(`/api/kitchen/requisitions/${kitchenId}/approve`).send({
      items: [{ id: kitchenDetails.items[0].id, approvedQuantity: 5 }],
    })).status).toBe(403);
    expect((await kitchenUser.post(`/api/kitchen/requisitions/${kitchenId}/approve`).send({
      items: [{ id: kitchenDetails.items[0].id, approvedQuantity: 5 }],
    })).status).toBe(200);
  });
});
