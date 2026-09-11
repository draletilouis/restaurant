const request = require("supertest");
const { resetTestDatabase } = require("./helpers/test-db");

jest.setTimeout(30000);

describe("Cater Phase 1 ERP", () => {
  let app;
  let db;
  let agent;

  beforeAll(async () => {
    await resetTestDatabase();
    ({ app, db } = require("../server"));
    agent = request.agent(app);
  });

  afterAll(async () => {
    if (db?.pool) {
      await db.pool.end();
    }
  });

  async function login() {
    const response = await agent.post("/api/auth/login").send({
      username: "admin",
      password: "admin123",
    });
    expect(response.status).toBe(200);
    return response.body.user;
  }

  test("boots healthy and completes a contract-to-consumption workflow", async () => {
    await login();

    const healthResponse = await agent.get("/health");
    expect(healthResponse.status).toBe(200);
    expect(healthResponse.body.status).toBe("ok");

    const referenceResponse = await agent.get("/api/master-data/reference-data");
    expect(referenceResponse.status).toBe(200);
    const categoryId = referenceResponse.body.data.categories.find((entry) => entry.name === "Raw Materials").id;
    const unitId = referenceResponse.body.data.units.find((entry) => entry.code === "kg").id;
    const centralStoreId = referenceResponse.body.data.stores.find((entry) => entry.name === "Central Store").id;

    const supplierResponse = await agent.post("/api/master-data/suppliers").send({
      name: "Fresh Harvest Suppliers",
      contactPerson: "Paul Supplier",
      phone: "0702002002",
      paymentTerms: "14 days",
    });
    expect(supplierResponse.status).toBe(201);
    const supplierId = supplierResponse.body.data.id;

    const productResponse = await agent.post("/api/master-data/products").send({
      name: "Rice",
      sku: "RAW-RICE-001",
      productType: "Raw Material",
      productCategoryId: categoryId,
      unitOfMeasureId: unitId,
      minimumStockLevel: 40,
      reorderLevel: 60,
      standardCost: 4500,
      defaultSupplierId: supplierId,
      isPerishable: false,
    });
    expect(productResponse.status).toBe(201);
    const productId = productResponse.body.data.id;

    const clientResponse = await agent.post("/api/master-data/clients").send({
      name: "Nile Towers Ltd",
      contactPerson: "Sarah Operations",
      phone: "0703003003",
      email: "ops@niletowers.test",
      address: "Nakasero, Kampala",
    });
    expect(clientResponse.status).toBe(201);
    const clientId = clientResponse.body.data.id;

    const locationResponse = await agent.post("/api/master-data/client-locations").send({
      clientId,
      name: "Nile Towers HQ",
      address: "Nile Avenue",
      contactPerson: "Sarah Operations",
      phone: "0703003003",
      deliveryNotes: "Deliver by 12:00 PM",
    });
    expect(locationResponse.status).toBe(201);
    const clientLocationId = locationResponse.body.data.id;

    const contractResponse = await agent.post("/api/contracts").send({
      clientId,
      clientLocationId,
      startDate: "2026-07-06",
      endDate: "2026-12-31",
      billingCycle: "Monthly",
      paymentTerms: "30 days",
      pricePerUnit: 15000,
      expectedDailyQuantity: 50,
      deliveryDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      schedules: [{ scheduleType: "Daily", quantity: 50 }],
      items: [{ productId, serviceUnit: "kg", quantityPerDelivery: 50, unitPrice: 15000 }],
    });
    expect(contractResponse.status).toBe(201);
    const contractId = contractResponse.body.data.id;

    const activateResponse = await agent.post(`/api/contracts/${contractId}/activate`).send({});
    expect(activateResponse.status).toBe(200);
    expect(activateResponse.body.data.status).toBe("Active");

    const purchaseRequisitionResponse = await agent.post("/api/procurement/purchase-requisitions").send({
      requestDate: "2026-07-07",
      purchaseType: "Weekly",
      items: [{ productId, quantityRequested: 300, quantityApproved: 0, estimatedUnitCost: 4500, preferredSupplierId: supplierId }],
    });
    expect(purchaseRequisitionResponse.status).toBe(201);
    const purchaseRequisitionId = purchaseRequisitionResponse.body.data.id;

    const requisitionDetailResponse = await agent.get(`/api/procurement/purchase-requisitions/${purchaseRequisitionId}`);
    expect(requisitionDetailResponse.status).toBe(200);

    expect((await agent.post(`/api/procurement/purchase-requisitions/${purchaseRequisitionId}/submit`).send({})).status).toBe(200);

    const approveRequisitionResponse = await agent
      .post(`/api/procurement/purchase-requisitions/${purchaseRequisitionId}/approve`)
      .send({
        items: requisitionDetailResponse.body.data.items.map((item) => ({
          id: item.id,
          quantityApproved: item.quantity_requested,
          estimatedUnitCost: 4500,
          preferredSupplierId: supplierId,
        })),
      });
    expect(approveRequisitionResponse.status).toBe(200);
    expect(approveRequisitionResponse.body.data.status).toBe("Approved");

    const purchaseOrderResponse = await agent.post("/api/procurement/purchase-orders").send({
      purchaseRequisitionId,
      supplierId,
      orderDate: "2026-07-07",
      expectedDeliveryDate: "2026-07-08",
      status: "Sent",
      items: [{ productId, quantityOrdered: 300, unitCost: 4500 }],
    });
    expect(purchaseOrderResponse.status).toBe(201);
    const purchaseOrderId = purchaseOrderResponse.body.data.id;

    const goodsReceivedResponse = await agent.post("/api/procurement/goods-received").send({
      purchaseOrderId,
      receiptDate: "2026-07-08",
      items: [{ productId, quantityReceived: 300, unitCost: 4500, batchNumber: "RICE-JULY-01" }],
    });
    expect(goodsReceivedResponse.status).toBe(201);
    expect(goodsReceivedResponse.body.data.status).toBeUndefined();
    expect(goodsReceivedResponse.body.data.store_location_id).toBeUndefined();

    const balancesAfterReceipt = await agent.get("/api/inventory/balances");
    expect(balancesAfterReceipt.status).toBe(200);
    const riceBalanceAfterReceipt = balancesAfterReceipt.body.data.find((row) => row.product_id === productId);
    expect(Number(riceBalanceAfterReceipt.quantity_on_hand)).toBe(300);

    const kitchenRequisitionResponse = await agent.post("/api/kitchen/requisitions").send({
      requestDate: "2026-07-09",
      productionDate: "2026-07-09",
      departmentName: "Main Kitchen",
      sourceStoreLocationId: centralStoreId,
      items: [{ productId, requestedQuantity: 80 }],
    });
    expect(kitchenRequisitionResponse.status).toBe(201);
    const kitchenRequisitionId = kitchenRequisitionResponse.body.data.id;

    await agent.post(`/api/kitchen/requisitions/${kitchenRequisitionId}/submit`).send({});
    const kitchenDetailResponse = await agent.get(`/api/kitchen/requisitions/${kitchenRequisitionId}`);
    const kitchenItemId = kitchenDetailResponse.body.data.items[0].id;

    const approveKitchenResponse = await agent.post(`/api/kitchen/requisitions/${kitchenRequisitionId}/approve`).send({
      items: [{ id: kitchenItemId, approvedQuantity: 60 }],
    });
    expect(approveKitchenResponse.status).toBe(200);
    expect(approveKitchenResponse.body.data.status).toBe("Approved");

    const issueResponse = await agent.post("/api/kitchen/store-issues").send({
      kitchenRequisitionId,
      issueDate: "2026-07-09",
      items: [{ kitchenRequisitionItemId: kitchenItemId, productId, issuedQuantity: 60, unitCost: 4500 }],
    });
    expect(issueResponse.status).toBe(201);
    const storeIssueId = issueResponse.body.data.id;

    const productionResponse = await agent.post("/api/kitchen/production-batches").send({
      productionDate: "2026-07-09",
      shift: "Lunch",
      kitchenRequisitionId,
      storeIssueId,
      plannedOutput: 50,
      items: [{ productId, quantityConsumed: 55 }],
    });
    expect(productionResponse.status).toBe(201);
    const productionBatchId = productionResponse.body.data.id;

    const completeBatchResponse = await agent.post(`/api/kitchen/production-batches/${productionBatchId}/complete`).send({
      actualOutput: 50,
      wastageQuantity: 3,
    });
    expect(completeBatchResponse.status).toBe(200);
    expect(completeBatchResponse.body.data.status).toBe("Completed");

    const wastageResponse = await agent.post("/api/kitchen/wastage").send({
      productionBatchId,
      storeIssueId,
      productId,
      quantity: 3,
      wastageType: "Overproduction",
      recordDate: "2026-07-09",
    });
    expect(wastageResponse.status).toBe(201);

    const returnResponse = await agent.post("/api/kitchen/returns").send({
      kitchenRequisitionId,
      storeIssueId,
      storeLocationId: centralStoreId,
      returnDate: "2026-07-09",
      items: [{ productId, quantityReturned: 5, unitCost: 4500 }],
    });
    expect(returnResponse.status).toBe(201);

    const balancesAfterReturn = await agent.get("/api/inventory/balances");
    const riceBalanceAfterReturn = balancesAfterReturn.body.data.find((row) => row.product_id === productId);
    expect(Number(riceBalanceAfterReturn.quantity_on_hand)).toBe(245);

    const consumptionResponse = await agent.get("/api/consumption/products").query({
      startDate: "2026-07-06",
      endDate: "2026-07-12",
    });
    expect(consumptionResponse.status).toBe(200);
    const riceConsumption = consumptionResponse.body.data.find((row) => row.product_id === productId);
    expect(Number(riceConsumption.purchased_quantity)).toBe(300);
    expect(Number(riceConsumption.issued_quantity)).toBe(60);
    expect(Number(riceConsumption.returned_quantity)).toBe(5);
    expect(Number(riceConsumption.wastage_quantity)).toBe(3);
    expect(Number(riceConsumption.remaining_quantity)).toBe(245);
    expect(Number(riceConsumption.consumed_quantity)).toBe(52);

    const dashboardResponse = await agent.get("/api/dashboard");
    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body.data.activeContracts).toBeGreaterThanOrEqual(1);
    expect(dashboardResponse.body.data.pendingPurchaseOrders).toBeGreaterThanOrEqual(0);
  });


});
