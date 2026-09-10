const request = require("supertest");
const { resetTestDatabase } = require("./helpers/test-db");
const { buildReportHTML } = require("../src/services/report-html");
const { getBusinessProfileHeader } = require("../src/services/branded-document");

jest.setTimeout(60000);

describe("Reports and document exports", () => {
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
  }

  test("builds branded report HTML without document footers", () => {
    const header = getBusinessProfileHeader({
      business_name: "Kampala Kitchen Catering",
      business_location: "Industrial Area, Kampala",
      business_phone: "0414123456",
      owner_email: "ops@kampala.test",
    });
    expect(header.primaryName).toBe("Kampala Kitchen Catering");
    expect(header.mark).toBe("KK");
    expect(header.lines.length).toBe(3);

    const { html, landscape } = buildReportHTML(
      {
        type: "inventory",
        title: "Inventory Health",
        columns: [
          { key: "product_name", header: "Product" },
          { key: "quantity_on_hand", header: "On Hand", format: "number" },
        ],
        rows: [{ product_name: "Rice", quantity_on_hand: 40 }],
        summary: [{ label: "Tracked balances", value: 1, display: "1" }],
      },
      {
        businessName: "Kampala Kitchen Catering",
        businessLocation: "Industrial Area, Kampala",
        from: "2026-09-01",
        to: "2026-09-30",
        operator: "Admin",
      }
    );
    expect(html).toContain("Inventory Health");
    expect(html).toContain("Rice");
    expect(html).toContain("rpt-letterhead");
    expect(html).toContain("rpt-strip-title");
    expect(html).toContain("rpt-meta-bar");
    expect(html).toContain("Report Period");
    expect(html).toContain("Generated:");
    expect(html).not.toContain("Powered by Cater ERP");
    expect(html).not.toContain("Food Services Operations");
    expect(html).not.toContain("Confidential");
    expect(html).not.toContain("pageNumber");
    expect(html).not.toContain("rpt-document-footer");
    expect(landscape).toBe(false);
  });

  test("serves catalog, JSON, HTML, and Excel reports", async () => {
    await login();

    const catalog = await agent.get("/api/reports/catalog");
    expect(catalog.status).toBe(200);
    expect(catalog.body.data.some((entry) => entry.type === "inventory")).toBe(true);
    expect(catalog.body.data.some((entry) => entry.type === "finance")).toBe(true);

    const inventory = await agent.get("/api/reports/inventory");
    expect(inventory.status).toBe(200);
    expect(inventory.body.data.title).toBe("Inventory Health");
    expect(Array.isArray(inventory.body.data.rows)).toBe(true);
    expect(inventory.body.data.columns.some((column) => column.key === "quantity_on_hand")).toBe(true);

    const consumption = await agent.get("/api/reports/consumption?startDate=2026-01-01&endDate=2026-12-31");
    expect(consumption.status).toBe(200);
    expect(consumption.body.data.title).toBe("Product Consumption");

    const html = await agent.get("/api/reports/export?type=inventory&format=html");
    expect(html.status).toBe(200);
    expect(html.headers["content-type"]).toMatch(/text\/html/);
    expect(html.text).toContain("Inventory Health");
    expect(html.text).not.toContain("Powered by Cater ERP");
    expect(html.text).not.toContain("rpt-document-footer");
    expect(html.text).not.toContain("SKU");

    const excel = await agent.get("/api/reports/export?type=inventory&format=xlsx");
    expect(excel.status).toBe(200);
    expect(excel.headers["content-type"]).toMatch(/spreadsheetml/);
    expect(excel.headers["content-disposition"]).toMatch(/Inventory_Health/);
    expect(Number(excel.headers["content-length"] || 0)).toBeGreaterThan(100);
  });

  test("exports branded purchase order, invoice, and kitchen documents", async () => {
    await login();

    const order = await db.get("SELECT id, order_number FROM purchase_orders ORDER BY id ASC LIMIT 1");
    const invoice = await db.get("SELECT id, invoice_number FROM supplier_invoices ORDER BY id ASC LIMIT 1");
    const kitchen = await db.get("SELECT id, requisition_number FROM kitchen_requisitions ORDER BY id ASC LIMIT 1");

    expect(order).toBeTruthy();
    expect(invoice).toBeTruthy();
    expect(kitchen).toBeTruthy();

    const poHtml = await agent.get(`/api/documents/purchase-orders/${order.id}/html`);
    expect(poHtml.status).toBe(200);
    expect(poHtml.text).toContain("Purchase Order");
    expect(poHtml.text).toContain(order.order_number);
    expect(poHtml.text).toContain(">Unit<");
    expect(poHtml.text).toContain("document-word");
    expect(poHtml.text).toContain("--color-accent");
    expect(poHtml.text).toContain("Authorized Signature");
    expect(poHtml.text).not.toContain("Powered by Cater ERP");
    expect(poHtml.text).not.toContain("Food Services Operations");
    expect(poHtml.text).not.toContain("Confidential");
    expect(poHtml.text).not.toContain("document-footer");
    expect(poHtml.text).toContain("sub-header");
    expect(poHtml.text).not.toContain("SKU");
    expect(poHtml.text).toContain("tf-total-line");

    const poExcel = await agent.get(`/api/documents/purchase-orders/${order.id}/xlsx`);
    expect(poExcel.status).toBe(200);
    expect(poExcel.headers["content-type"]).toMatch(/spreadsheetml/);
    expect(poExcel.headers["content-disposition"]).toMatch(/PurchaseOrder/);

    const invoiceHtml = await agent.get(`/api/documents/supplier-invoices/${invoice.id}/html`);
    expect(invoiceHtml.status).toBe(200);
    expect(invoiceHtml.text).toContain("Supplier Invoice");
    expect(invoiceHtml.text).toContain(invoice.invoice_number);
    expect(invoiceHtml.text).not.toContain("SKU");
    expect(invoiceHtml.text).toContain("tf-total-line");

    const kitchenHtml = await agent.get(`/api/documents/kitchen-requisitions/${kitchen.id}/html`);
    expect(kitchenHtml.status).toBe(200);
    expect(kitchenHtml.text).toContain("Kitchen Requisition");
    expect(kitchenHtml.text).toContain(kitchen.requisition_number);
    expect(kitchenHtml.text).not.toContain("SKU");
  });

  test("rejects unknown report and document types", async () => {
    await login();
    const report = await agent.get("/api/reports/export?type=profitLoss&format=html");
    expect(report.status).toBe(400);

    const document = await agent.get("/api/documents/quotations/1/html");
    expect(document.status).toBe(400);
  });
});
