/* Live UI checks. Run against an isolated database: PORT=3002 NODE_ENV=test
   POSTGRES_DB_TEST=cater_enterprise_ui_verify node server.js */
const puppeteer = require("puppeteer");
const fs = require("fs");
const assert = require("assert/strict");
const output = "ui-artifacts/enterprise";
const base = process.env.UI_TEST_URL || "http://localhost:3002";
if (!/^http:\/\/localhost:3002$/.test(base))
  throw Error("UI writes require the isolated port 3002 server.");
const report = { checks: [], errors: [], overflows: [], screenshots: [] };
const mark = (name) => {
  report.checks.push(name);
  console.log("PASS", name);
};
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.on("pageerror", (error) => report.errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 500)
        report.errors.push(response.status() + " " + response.url());
    });
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(base, { waitUntil: "networkidle0" });
    await page.type("#login-form [name=username]", "admin");
    await page.type("#login-form [name=password]", "admin123");
    await page.click("#login-form button[type=submit]");
    await page.waitForFunction(
      () =>
        !document.querySelector("#workspace").classList.contains("hidden") &&
        !document.querySelector("#login-form button[type=submit]").disabled,
      { timeout: 60000 },
    );
    mark("Authentication and all initial loaders");
    async function nav(key) {
      if (await page.evaluate(() => innerWidth <= 960)) {
        await page.click("#sidebar-menu-btn");
        await page.waitForFunction(
          () =>
            document.querySelector("#app-sidebar").getBoundingClientRect()
              .left >= -1,
        );
      }
      await page.click('#nav [data-module="' + key + '"]');
      await page.waitForFunction(
        (key) =>
          !document
            .querySelector('.module[data-module="' + key + '"]')
            .classList.contains("hidden"),
        {},
        key,
      );
    }
    async function screenshot(name) {
      const path = output + "/" + name + ".png";
      await page.screenshot({ path });
      report.screenshots.push(path);
    }
    if (!process.env.AXE_PATH)
      throw Error(
        "Set AXE_PATH to an installed axe-core/axe.min.js before running accessibility verification.",
      );
    await page.addScriptTag({ path: process.env.AXE_PATH });
    report.accessibility = [];
    const keys = await page.$$eval("#nav [data-module]", (nodes) =>
      nodes.map((node) => node.dataset.module),
    );
    for (const key of keys) {
      await nav(key);
      await screenshot("desktop-" + key);
      const violations = await page.evaluate(async () =>
        (
          await axe.run(document.querySelector("#workspace"), {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          })
        ).violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.target),
        })),
      );
      if (violations.length) report.accessibility.push({ key, violations });
      const tabs = await page.$$eval(
        ".module:not(.hidden) .module-primary-panel > .module-tabs [data-workspace-key]",
        (nodes) => nodes.map((n) => n.dataset.workspaceKey),
      );
      for (const tab of tabs) {
        await page.click(
          '.module:not(.hidden) .module-primary-panel > .module-tabs [data-workspace-key="' +
            tab +
            '"]',
        );
        await page.waitForNetworkIdle({ idleTime: 80, timeout: 10000 });
        const blank = await page.$eval(
          ".module:not(.hidden)",
          (node) => node.innerText.trim().length < 10,
        );
        assert(!blank, key + "/" + tab + " is blank");
      }
      mark(key + ": " + tabs.length + " views navigated");
    }
    // Search and empty-result recovery through the visible module field.
    await nav("suppliers");
    await page.type(
      "[data-search-module=suppliers]",
      "no-match-enterprise-test",
    );
    await page.waitForSelector("[data-clear-search=suppliers]");
    await page.click("[data-clear-search=suppliers]");
    assert.equal(
      await page.$eval("[data-search-module=suppliers]", (el) => el.value),
      "",
    );
    mark("Search, no-results state and clear search");
    // Real create / edit / detail flow in the isolated database.
    await page.click(".module:not(.hidden) [data-open-form=supplier-form]");
    await page.click("#supplier-form button[type=submit]");
    assert(await page.$("#supplier-form [aria-invalid=true]"));
    mark("Required field inline validation");
    const name = "Enterprise UI supplier " + Date.now();
    await page.type("#supplier-form [name=name]", name);
    let writes = 0;
    const requestListener = (req) => {
      if (
        req.method() === "POST" &&
        req.url().endsWith("/api/master-data/suppliers")
      )
        writes++;
    };
    page.on("request", requestListener);
    await page.$eval("#supplier-form", (form) => {
      form.requestSubmit();
      form.requestSubmit();
    });
    await page.waitForFunction(() =>
      document.querySelector("#form-modal").classList.contains("hidden"),
    );
    assert.equal(writes, 1, "duplicate supplier requests");
    page.off("request", requestListener);
    mark("Create supplier and repeated-submit guard");
    await page.type("[data-search-module=suppliers]", name);
    await page.click(".module:not(.hidden) [data-row-action=edit]");
    await page.type("#supplier-form [name=contactPerson]", "UI verification");
    await screenshot("supplier-edit-drawer");
    await page.click("#supplier-form button[type=submit]");
    await page.waitForFunction(() =>
      document.querySelector("#form-modal").classList.contains("hidden"),
    );
    await page.click(".module:not(.hidden) [data-row-action=view]");
    assert(
      (await page.$eval("#detail-modal-body", (el) => el.innerText)).includes(
        "UI verification",
      ),
    );
    await screenshot("supplier-details");
    await page.keyboard.press("Escape");
    mark("Edit and verify saved supplier detail");
    await page.click(".module:not(.hidden) [data-open-form=supplier-form]");
    await page.type("#supplier-form [name=name]", "Unsaved draft");
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.click("#supplier-form [data-close-form]");
    assert(
      !(await page.$eval("#form-modal", (el) =>
        el.classList.contains("hidden"),
      )),
    );
    page.once("dialog", (dialog) => dialog.accept());
    await page.click("#supplier-form [data-close-form]");
    mark("Cancel and discard confirmation");
    // Sort must toggle native aria-sort; pagination must expose page 2.
    await nav("settings");
    await page.click("[data-workspace-key=audit]");
    const sortable = "#audit-table th [data-table-sort]";
    await page.click(sortable);
    assert(await page.$(".module:not(.hidden) th[aria-sort=ascending]"));
    await page.click(sortable);
    assert(await page.$(".module:not(.hidden) th[aria-sort=descending]"));
    mark("Table sorting");
    // Intentional error injection is read-only and scoped to this browser.
    await nav("contracts");
    await page.setRequestInterception(true);
    let failContracts = true;
    const intercept = (req) => {
      if (
        failContracts &&
        req.url().endsWith("/api/contracts") &&
        req.method() === "GET"
      )
        req.respond({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Verification: contracts temporarily unavailable",
          }),
        });
      else req.continue();
    };
    page.on("request", intercept);
    const beforeErrors = report.errors.length;
    await page.click("#refresh-all-btn");
    await page.waitForSelector("[data-module=contracts] .workspace-error");
    await page.waitForFunction(
      () => !document.querySelector("#refresh-all-btn").disabled,
    );
    failContracts = false;
    await page.click("[data-module=contracts] .workspace-error [data-load]");
    await page.waitForFunction(
      () => !document.querySelector("[data-module=contracts] .workspace-error"),
    );
    report.errors.splice(beforeErrors); // Expected injected 503 recorded by the scenario above.
    page.off("request", intercept);
    await page.setRequestInterception(false);
    mark("API error state and retry recovery");
    for (const width of [1280, 900, 390]) {
      await page.setViewport({ width, height: width === 390 ? 844 : 900 });
      for (const key of keys) {
        await nav(key);
        const overflow = await page.evaluate(() => ({
          body: document.documentElement.scrollWidth > innerWidth,
          workspace:
            document.querySelector("#workspace").scrollWidth >
            document.querySelector("#workspace").clientWidth + 1,
        }));
        if (overflow.body || overflow.workspace)
          report.overflows.push({ width, key, ...overflow });
        if (width === 390 || key === "dashboard")
          await screenshot(width + "-" + key);
      }
      mark(width + "px: all workspaces and navigation");
    }
    await page.click("#user-menu-btn");
    await page.click("#user-menu-theme");
    await screenshot("mobile-dark-settings");
    await page.setViewport({ width: 1440, height: 1000 });
    await nav("dashboard");
    await screenshot("desktop-dark-dashboard");
    await page.click("#user-menu-btn");
    await page.click("#user-menu-theme");
    await nav("contracts");
    await page.click(".module:not(.hidden) [data-open-form=contract-form]");
    await screenshot("contract-drawer");
    await page.setViewport({ width: 390, height: 844 });
    await screenshot("mobile-contract-drawer");
    await page.keyboard.press("Escape");
    mark("Light/dark themes and desktop/mobile complex forms");
    assert.deepEqual(report.errors, [], "runtime errors");
    assert.deepEqual(report.overflows, [], "page overflow");
  } finally {
    fs.writeFileSync(
      output + "/verification.json",
      JSON.stringify(report, null, 2),
    );
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
