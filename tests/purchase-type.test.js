const request = require("supertest");
const { resetTestDatabase } = require("./helpers/test-db");
const { initializeDatabase } = require("../src/database/schema");

jest.setTimeout(30000);

describe("Daily and Weekly purchase types", () => {
  let app;
  let db;
  let agent;
  let productId;
  let supplierId;
  let centralStoreId;

  beforeAll(async () => {
    process.env.SKIP_DEMO_SEED = "true";
    await resetTestDatabase({ seedDemo: false });
    ({ app, db } = require("../server"));
    agent = request.agent(app);
    const loginResponse = await agent.post("/api/auth/login").send({ username: "admin", password: "admin123" });
    expect(loginResponse.status).toBe(200);
    const reference = await agent.get("/api/master-data/reference-data");
    supplierId = (
      await agent.post("/api/master-data/suppliers").send({
        name: "Type Test Supplier",
        contactPerson: "Test Buyer",
        phone: "0700000000",
        paymentTerms: "14 days",
      })
    ).body.data.id;
    const categoryId = reference.body.data.categories.find((row) => row.name === "Raw Materials").id;
    const unitId = reference.body.data.units.find((row) => row.code === "kg").id;
    centralStoreId = reference.body.data.stores.find((row) => row.name === "Central Store").id;
    productId = (
      await agent.post("/api/master-data/products").send({
        name: "Type Test Rice",
        sku: "TYPE-RICE-001",
        productType: "Raw Material",
        productCategoryId: categoryId,
        unitOfMeasureId: unitId,
        minimumStockLevel: 0,
        reorderLevel: 0,
        standardCost: 4500,
        defaultSupplierId: supplierId,
        isPerishable: false,
      })
    ).body.data.id;
  });

  afterAll(async () => {
    delete process.env.SKIP_DEMO_SEED;
    if (db?.pool) await db.pool.end();
  });

  async function createRequisition(purchaseType) {
    return agent.post("/api/procurement/purchase-requisitions").send({
      requestDate: "2026-09-04",
      purchaseType,
      items: [{ productId, quantityRequested: 10, quantityApproved: 0, estimatedUnitCost: 4500 }],
    });
  }

  test("requires valid purchase types for manual requisitions and supports filtering", async () => {
    expect((await createRequisition(undefined)).status).toBe(400);
    expect((await createRequisition("Monthly")).status).toBe(400);

    const daily = await createRequisition("daily");
    expect(daily.status).toBe(201);
    expect(daily.body.data.purchase_type).toBe("Daily");

    const filtered = await agent.get("/api/procurement/purchase-requisitions?purchaseType=Daily");
    expect(filtered.status).toBe(200);
    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].purchase_type).toBe("Daily");
  });

  test("requires PO type for standalone orders and matches linked requisitions", async () => {
    const requisition = await createRequisition("Daily");
    const detail = await agent.get(`/api/procurement/purchase-requisitions/${requisition.body.data.id}`);
    const approved = await agent.post(`/api/procurement/purchase-requisitions/${requisition.body.data.id}/approve`).send({
      items: detail.body.data.items.map((item) => ({
        id: item.id,
        quantityApproved: 10,
        estimatedUnitCost: 4500,
        preferredSupplierId: supplierId,
      })),
    });
    expect(approved.status).toBe(200);

    const mismatch = await agent.post("/api/procurement/purchase-orders").send({
      purchaseRequisitionId: requisition.body.data.id,
      purchaseType: "Weekly",
      supplierId,
      orderDate: "2026-09-04",
      items: [{ productId, quantityOrdered: 10, unitCost: 4500 }],
    });
    expect(mismatch.status).toBe(400);
    expect(mismatch.body.message).toMatch(/match the linked purchase requisition/i);

    const matching = await agent.post("/api/procurement/purchase-orders").send({
      purchaseRequisitionId: requisition.body.data.id,
      supplierId,
      orderDate: "2026-09-04",
      items: [{ productId, quantityOrdered: 10, unitCost: 4500 }],
    });
    expect(matching.status).toBe(201);
    expect(matching.body.data.purchase_type).toBe("Daily");

    const standalone = await agent.post("/api/procurement/purchase-orders").send({
      supplierId,
      orderDate: "2026-09-04",
      items: [{ productId, quantityOrdered: 2, unitCost: 4500 }],
    });
    expect(standalone.status).toBe(400);

    const filtered = await agent.get("/api/procurement/purchase-orders?purchaseType=Daily");
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.some((row) => row.purchase_type === "Daily")).toBe(true);
  });

  test("exposes purchase type through goods received", async () => {
    const po = await agent.post("/api/procurement/purchase-orders").send({
      purchaseType: "Daily",
      supplierId,
      orderDate: "2026-09-04",
      items: [{ productId, quantityOrdered: 4, unitCost: 4500 }],
    });
    expect(po.status).toBe(201);

    const received = await agent.post("/api/procurement/goods-received").send({
      purchaseOrderId: po.body.data.id,
      storeLocationId: centralStoreId,
      receiptDate: "2026-09-04",
      items: [{ productId, quantityReceived: 4, unitCost: 4500, batchNumber: "TYPE-TEST-01" }],
    });
    expect(received.status).toBe(201);
    const grnAudit = await db.get(
      "SELECT details FROM audit_logs WHERE entity_type = 'goods_received_note' AND entity_id = ? AND action = 'receive' ORDER BY id DESC LIMIT 1",
      [received.body.data.id]
    );
    expect(grnAudit.details.purchaseType).toBe('Daily');

    const receivedList = await agent.get("/api/procurement/goods-received?purchaseType=Daily");
    expect(receivedList.status).toBe(200);
    expect(receivedList.body.data.some((row) => row.purchase_type === "Daily")).toBe(true);

  });

  test("supports invoice payment methods and requires a due date for credit", async () => {
    const cash = await agent.post("/api/procurement/supplier-invoices").send({
      invoiceNumber: "TYPE-INV-CASH",
      supplierId,
      invoiceDate: "2026-09-05",
      paymentMethod: "Cash",
      totalAmount: 10000,
    });
    expect(cash.status).toBe(201);
    expect(cash.body.data.payment_method).toBe("Cash");
    expect(cash.body.data.due_date).toBeNull();

    const missingDueDate = await agent.post("/api/procurement/supplier-invoices").send({
      invoiceNumber: "TYPE-INV-CREDIT-MISSING-DUE",
      supplierId,
      invoiceDate: "2026-09-05",
      paymentMethod: "Credit",
      totalAmount: 12000,
    });
    expect(missingDueDate.status).toBe(400);
    expect(missingDueDate.body.message).toMatch(/due date is required/i);

    const mobileMoney = await agent.post("/api/procurement/supplier-invoices").send({
      invoiceNumber: "TYPE-INV-MOBILE",
      supplierId,
      invoiceDate: "2026-09-05",
      paymentMethod: "Mobile Money",
      totalAmount: 14000,
    });
    expect(mobileMoney.status).toBe(201);
    expect(mobileMoney.body.data.payment_method).toBe("Mobile Money");

    const bankTransfer = await agent.post("/api/procurement/supplier-invoices").send({
      invoiceNumber: "TYPE-INV-BANK",
      supplierId,
      invoiceDate: "2026-09-05",
      paymentMethod: "Bank Transfer",
      totalAmount: 16000,
    });
    expect(bankTransfer.status).toBe(201);
    expect(bankTransfer.body.data.payment_method).toBe("Bank Transfer");
  });

  test("schema migration is idempotent and installs both constraints", async () => {
    await initializeDatabase(db);
    await initializeDatabase(db);
    const columns = await db.all(
      `SELECT table_name, column_name, column_default, is_nullable
       FROM information_schema.columns
       WHERE table_name IN ('purchase_requisitions', 'purchase_orders') AND column_name = 'purchase_type'
       ORDER BY table_name`
    );
    expect(columns).toEqual([
      expect.objectContaining({ table_name: "purchase_orders", column_name: "purchase_type", is_nullable: "NO" }),
      expect.objectContaining({ table_name: "purchase_requisitions", column_name: "purchase_type", is_nullable: "NO" }),
    ]);
    const constraints = await db.all(
      `SELECT conname FROM pg_constraint
       WHERE conname IN ('purchase_requisitions_purchase_type_check', 'purchase_orders_purchase_type_check')`
    );
    expect(constraints.map((row) => row.conname)).toEqual(
      expect.arrayContaining(["purchase_requisitions_purchase_type_check", "purchase_orders_purchase_type_check"])
    );
  });
});
