const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const html = fs
  .readFileSync(path.join(projectRoot, "public", "index.html"), "utf8")
  .replace(/\s+/g, " ");
const css = fs.readFileSync(
  path.join(projectRoot, "public", "css", "app.css"),
  "utf8",
);
const themeCss = fs.readFileSync(
  path.join(projectRoot, "public", "css", "theme.css"),
  "utf8",
);
const app = fs.readFileSync(
  path.join(projectRoot, "public", "js", "app.js"),
  "utf8",
);

describe("frontend redesign contracts", () => {
  test("uses the shared design system and responsive application shell", () => {
    expect(css).toContain("--color-brand-600");
    expect(css).toContain("--space-8");
    expect(css).toContain("--focus-ring");
    expect(css).toContain("body.sidebar-open .sidebar");
    expect(css).toContain(".topbar .topbar-menu-btn");
    expect(css).toContain(
      ".table-shell:not(.collection-table-shell) td::before",
    );
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("--font-mono");
    expect(css).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });

  test("keeps the shell and overlays accessible", () => {
    expect(html).toContain('class="skip-link"');
    expect(html).toContain('aria-label="Primary navigation"');
    expect(html).toContain('aria-describedby="form-modal-copy"');
    expect(html).toContain('role="status" aria-live="polite"');
    expect(html).not.toContain("SSO Login");
    expect(html).not.toContain("Microsoft sign-in");
    expect(html).not.toContain("Welcome Back");
    expect(html).not.toContain("Grow Your Business");
  });

  test("loads the enterprise visual system instead of a decorative template", () => {
    expect(html).toContain('meta name="theme-color" content="#111318"');
    expect(html).toContain('href="/css/theme.css"');
    expect(html).toContain("Inter");
    expect(html).not.toContain("Montserrat");
    expect(css).toContain("--color-brand-600: #0e6b66");
    expect(css).toContain(".sidebar");
    expect(css).toContain(".nav button.active");
    expect(html).toContain('id="login-section"');
  });

  test("supports light and dark theme", () => {
    expect(html).toContain('id="theme-btn" title="Switch to dark mode"');
    expect(app).toContain(
      'document.documentElement.setAttribute("data-theme", nextTheme)',
    );
    expect(app).toContain(
      'window.localStorage.setItem("cater-theme", nextTheme)',
    );
    expect(themeCss).toContain('[data-theme="dark"]');
    expect(themeCss).toContain("--color-canvas: #101218");
    expect(themeCss).toContain("--color-surface: #181b22");
  });

  test("keeps KPI cards dashboard-only", () => {
    expect(css).toContain(
      '.module:not([data-module="dashboard"]) .module-metric-grid',
    );

    expect(html).toContain('id="dashboard-metrics"');
    expect(html).toContain('id="procurement-metrics"');
    expect(html).toContain('id="dashboard-attention"');
  });

  test("renders operational tables with sorting and mobile labels", () => {
    expect(app).toContain('class="table-sort-btn"');
    expect(app).toContain('data-label="${escapeHtml(column.label)}"');
    expect(app).toContain(
      'aria-label="${escapeHtml(titleCaseWords(tableLabel))}"',
    );
    expect(app).toContain("state.ui.tableModels");
    expect(app).toContain("pageSize || 20");
  });

  test("exposes Approval Matrix as a standalone administration workspace", () => {
    expect(app).toContain('key: "approval-matrix"');
    expect(app).toContain("loadApprovalMatrix");
    expect(html).toContain('data-module="approval-matrix"');
    expect(html).toContain('id="approval-matrix-table"');
    expect(app).not.toContain(
      'types: ["statuses", "numbering-series", "approval-workflows"]',
    );
  });

  test("keeps live dashboard priorities and consumption tabs functional", () => {
    expect(app).toContain("const lowStockRows = lowStockResponse.data || [];");
    expect(app).toContain('moduleKey === "consumption"');
    expect(app).toContain("loadConsumption().catch");
    expect(app).toContain("activities.length === 0");
    expect(app).toContain("attentionItems");
  });
});
