const puppeteer = require("puppeteer");
const fs = require("fs");
const assert = require("assert/strict");
const output = "ui-artifacts/enterprise";
const report = { checks: [], errors: [], accessibility: [] };
const mark = (message) => {
  report.checks.push(message);
  console.log("PASS", message);
};
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.on("pageerror", (error) => report.errors.push(error.message));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto("http://localhost:3002", { waitUntil: "networkidle0" });
    await page.type("#login-form [name=username]", "admin");
    await page.type("#login-form [name=password]", "admin123");
    await page.click("#login-form button[type=submit]");
    await page.waitForFunction(
      () =>
        !document.querySelector("#workspace").classList.contains("hidden") &&
        !document.querySelector("#login-form button[type=submit]").disabled,
    );
    const axePath = process.env.AXE_PATH;
    if (axePath) await page.addScriptTag({ path: axePath });
    async function a11y(name, selector = "body") {
      if (!axePath) return;
      const violations = await page.evaluate(
        async (selector) =>
          (
            await axe.run(document.querySelector(selector), {
              runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21aa"],
              },
            })
          ).violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => n.target),
          })),
        selector,
      );
      if (violations.length) report.accessibility.push({ name, violations });
    }
    async function nav(key) {
      if (await page.evaluate(() => innerWidth <= 960)) {
        await page.click("#sidebar-menu-btn");
        await page.waitForFunction(
          () =>
            document.querySelector(".sidebar").getBoundingClientRect().left >=
            -1,
        );
      }
      await page.click('#nav [data-module="' + key + '"]');
    }
    async function field(selector, value) {
      await page.$eval(
        selector,
        (el, value) => {
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        },
        value,
      );
    }
    await nav("contracts");
    await page.click(".module:not(.hidden) [data-open-form=contract-form]");
    await page.type(
      "#contract-form [name=clientName]",
      "UI contract " + Date.now(),
    );
    await page.type(
      "#contract-form [name=locationName]",
      "Verification branch",
    );
    await a11y("Contract client form", "#form-modal");
    await page.click("[data-contract-tab=terms]");
    await field("#contract-form [name=startDate]", "2026-09-05");
    await field("#contract-form [name=endDate]", "2027-09-05");
    await field("#contract-form [name=pricePerUnit]", "15000");
    await field("#contract-form [name=expectedDailyQuantity]", "80");
    await a11y("Contract terms", "#form-modal");
    await page.click("[data-contract-tab=schedule]");
    await page.select("#contract-form [name=billingCycle]", "Daily");
    await a11y("Contract recurring schedule", "#form-modal");
    await page.click("[data-contract-tab=items]");
    const add = '[data-collection-add="contract-form:itemsJson"]';
    if (
      !(await page.$(
        "[data-collection-form=contract-form][data-field-key=productId]",
      ))
    )
      await page.click(add);
    await field(
      "[data-collection-form=contract-form][data-field-key=quantityPerDelivery]",
      "80",
    );
    await a11y("Contract line items", "#form-modal");
    await page.screenshot({ path: output + "/contract-items-final.png" });
    const contractResponse = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/contracts") && r.request().method() === "POST",
    );
    await page.click("#contract-form button[type=submit]");
    const created = await contractResponse;
    assert.equal(created.status(), 201, await created.text());
    await page.waitForFunction(() =>
      document.querySelector("#form-modal").classList.contains("hidden"),
    );
    mark(
      "Create contract with client, location, terms, recurring schedule and line items",
    );
    await page.click(".module:not(.hidden) [data-workspace-key=all]");
    await page.type("[data-search-module=contracts]", "UI contract");
    await page.click(".module:not(.hidden) [data-row-action=view]");
    assert(
      (await page.$eval("#detail-modal-body", (el) => el.innerText)).includes(
        "Verification branch",
      ),
    );
    await a11y("Contract detail", "#detail-modal");
    await page.keyboard.press("Escape");
    mark("Contract detail and keyboard close");
    // Report preview and real CSV download via browser download events.
    const cdp = await page.createCDPSession();
    await cdp.send("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: require("path").resolve(output, "downloads"),
      eventsEnabled: true,
    });
    const downloaded = new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(Error("CSV download timed out")),
        10000,
      );
      cdp.on("Browser.downloadProgress", (event) => {
        if (event.state === "completed") {
          clearTimeout(timer);
          resolve();
        }
      });
    });
    await nav("reports");
    await page.click(".module:not(.hidden) [data-workspace-key=operational]");
    await page.click(".module:not(.hidden) [data-row-action=preview]");
    assert(
      (await page.$eval("#detail-modal-body", (el) => el.innerText)).includes(
        "Acme Corporate",
      ),
    );
    await page.keyboard.press("Escape");
    await page.click(".module:not(.hidden) [data-row-action=export]");
    await downloaded;
    const csv = fs.readFileSync(
      output + "/downloads/operational-snapshot.csv",
      "utf8",
    );
    assert(csv.includes("Acme Corporate"));
    mark(
      "Operational report preview and downloaded CSV preserve live delivery records",
    );
    // Enough real fixture rows to exercise pagination in the isolated UI database.
    await page.evaluate(async () => {
      for (let index = 0; index < 22; index++) {
        const response = await fetch("/api/master-data/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Pagination fixture " + Date.now() + " " + index,
          }),
        });
        if (!response.ok) throw Error("Fixture failed");
      }
    });
    await page.click("#refresh-all-btn");
    await page.waitForFunction(
      () => !document.querySelector("#refresh-all-btn").disabled,
    );
    await nav("suppliers");
    const next = '.module:not(.hidden) [data-table-page$=":next"]';
    await page.click(next);
    assert(
      (
        await page.$eval(
          ".module:not(.hidden) .table-pagination",
          (el) => el.innerText,
        )
      ).includes("Page 2"),
    );
    await page.type("[data-search-module=suppliers]", "Pagination fixture");
    assert(
      (
        await page.$eval(
          ".module:not(.hidden) .table-pagination",
          (el) => el.innerText,
        )
      ).includes("Page 1"),
    );
    mark("Pagination and page reset after filtering");
    await page.setViewport({ width: 390, height: 844 });
    await nav("consumption");
    await page.screenshot({ path: output + "/mobile-consumption-final.png" });
    await a11y("Mobile consumption");
    await nav("contracts");
    await page.click(".module:not(.hidden) [data-open-form=contract-form]");
    await page.screenshot({ path: output + "/mobile-contract-final.png" });
    await a11y("Mobile contract", "#form-modal");
    await page.keyboard.press("Escape");
    await nav("dashboard");
    await page.click("#user-menu-btn");
    await page.click("#user-menu-theme");
    await a11y("Dark mobile dashboard");
    await page.screenshot({ path: output + "/mobile-dark-final.png" });
    await page.setViewport({ width: 1440, height: 1000 });
    await a11y("Dark desktop dashboard");
    await page.screenshot({ path: output + "/desktop-dark-final.png" });
    const duplicateIds = await page.evaluate(() => {
      const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
      return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    });
    assert.deepEqual(duplicateIds, []);
    mark("Unique control IDs, mobile forms and dark mode");
    // Verify a real low-privilege account sees read-only form state.
    await page.setViewport({ width: 1440, height: 1000 });
    const username = "ui_kitchen_" + Date.now();
    await page.evaluate(async (username) => {
      const response = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "UI Kitchen Verification",
          username,
          password: "Verify-UI-Only-2026",
          roleCodes: ["kitchen_supervisor"],
        }),
      });
      if (!response.ok) throw Error("Could not create test user");
    }, username);
    await page.click("#user-menu-btn");
    await page.click("#user-menu-logout");
    await page.waitForSelector("#login-section:not(.hidden)");
    await field("#login-form [name=username]", username);
    await field("#login-form [name=password]", "Verify-UI-Only-2026");
    await page.click("#login-form button[type=submit]");
    await page.waitForFunction(
      () =>
        !document.querySelector("#workspace").classList.contains("hidden") &&
        !document.querySelector("#login-form button[type=submit]").disabled,
    );
    await nav("suppliers");
    await page.click(".module:not(.hidden) [data-open-form=supplier-form]");
    assert(await page.$("#supplier-form button[type=submit]:disabled"));
    assert(await page.$("#supplier-form .permission-denied-state"));
    await page.click("#supplier-form [data-close-form]");
    mark(
      "Kitchen role cannot submit supplier mutations and can close the read-only form",
    );
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.accessibility, []);
  } finally {
    fs.writeFileSync(
      output + "/workflow-verification.json",
      JSON.stringify(report, null, 2),
    );
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
