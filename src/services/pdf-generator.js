"use strict";

const puppeteer = require("puppeteer");

let browserInstance = null;
let browserCloseTimer = null;

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--font-render-hinting=none",
];

const DEFAULT_IDLE_CLOSE_MS = process.env.NODE_ENV === "production" ? 15000 : 0;
const configuredIdleCloseMs = Number.parseInt(process.env.PDF_BROWSER_IDLE_MS || "", 10);
const idleCloseMs = Number.isFinite(configuredIdleCloseMs) && configuredIdleCloseMs >= 0
  ? configuredIdleCloseMs
  : DEFAULT_IDLE_CLOSE_MS;

const configuredMaxConcurrentPdfs = Number.parseInt(process.env.PDF_MAX_CONCURRENT || "", 10);
const maxConcurrentPdfs = Number.isFinite(configuredMaxConcurrentPdfs) && configuredMaxConcurrentPdfs > 0
  ? configuredMaxConcurrentPdfs
  : (process.env.NODE_ENV === "production" ? 2 : 4);

let activePdfRenders = 0;
const pdfQueue = [];

function clearBrowserCloseTimer() {
  if (browserCloseTimer) {
    clearTimeout(browserCloseTimer);
    browserCloseTimer = null;
  }
}

async function closeBrowser() {
  clearBrowserCloseTimer();
  if (!browserInstance) {
    return;
  }

  const currentBrowser = browserInstance;
  browserInstance = null;
  if (currentBrowser.isConnected()) {
    await currentBrowser.close().catch(() => {});
  }
}

function scheduleBrowserClose() {
  clearBrowserCloseTimer();
  if (!idleCloseMs) {
    return;
  }

  browserCloseTimer = setTimeout(() => {
    closeBrowser().catch(() => {});
  }, idleCloseMs);

  if (browserCloseTimer.unref) {
    browserCloseTimer.unref();
  }
}

async function getBrowser() {
  clearBrowserCloseTimer();
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  browserInstance = await puppeteer.launch({ headless: "new", args: LAUNCH_ARGS });
  browserInstance.on("disconnected", () => {
    browserInstance = null;
  });
  return browserInstance;
}

function acquirePdfSlot() {
  if (activePdfRenders < maxConcurrentPdfs) {
    activePdfRenders += 1;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    pdfQueue.push(resolve);
  }).then(() => {
    activePdfRenders += 1;
  });
}

function releasePdfSlot() {
  activePdfRenders = Math.max(0, activePdfRenders - 1);
  const next = pdfQueue.shift();
  if (next) {
    next();
  }
}

async function renderToPDF(html, { landscape = false } = {}) {
  await acquirePdfSlot();
  let page = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    return await page.pdf({
      format: "A4",
      landscape,
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    });
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
    scheduleBrowserClose();
    releasePdfSlot();
  }
}

module.exports = {
  renderToPDF,
  closeBrowser,
};
