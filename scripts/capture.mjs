import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const runtime = join(process.env.HOME, ".local/share/omgithub-playwright");
const require = createRequire(join(runtime, "package.json"));
const { chromium } = require("playwright");
const config = JSON.parse(readFileSync(join(runtime, process.platform === "darwin" ? "metal.json" : "linux.json"), "utf8"));
if (process.platform === "linux") process.env.DISPLAY ||= ":" + readFileSync(join(runtime, "display"), "utf8").trim();

const url = process.env.CAPTURE_URL;
const output = process.env.CAPTURE_DIR;
if (!url || !output) throw new Error("Set CAPTURE_URL and CAPTURE_DIR.");
mkdirSync(output, { recursive: true });

const transient = (error) => {
  throw Object.assign(error, { exitCode: 75 });
};

async function startGameplay(page) {
  if (process.env.CAPTURE_AUTO_START !== "false") {
    const selector = process.env.CAPTURE_START_SELECTOR || "";
    const candidate = selector
      ? page.locator(selector)
      : page.locator('button, input[type="button"], input[type="submit"], [role="button"]');
    const deadline = Date.now() + 5000;
    let clicked = false;
    while (!clicked && Date.now() < deadline) {
      const matches = [];
      for (const control of await candidate.all()) {
        if (!(await control.isVisible()) || !(await control.isEnabled())) continue;
        const eligible = await control.evaluate((element, explicit) => {
          if (element.closest("a[href], form") || element.getAttribute("aria-disabled") === "true") return false;
          if (explicit) return true;
          const label = element.getAttribute("aria-label") || element.value || element.textContent || "";
          return /^(?:start|play)(?:\s+(?:game|now))?$/i.test(label.trim());
        }, Boolean(selector));
        if (eligible) matches.push(control);
      }
      if (matches.length > 1) return { clicked: false, reason: "ambiguous" };
      if (matches.length === 1) {
        try {
          await matches[0].click({ trial: true, timeout: 2000 });
          await matches[0].click({ timeout: 2000, noWaitAfter: true });
          clicked = true;
        } catch (error) {
          if (error.name !== "TimeoutError") throw error;
        }
      }
      if (!clicked) await page.waitForTimeout(100);
    }
    if (!clicked) return { clicked: false, reason: "not-found" };
  } else {
    return { clicked: false, reason: "disabled" };
  }

  await page.waitForFunction(
    () => Boolean(document.querySelector('[data-action="select-blind"]'))
      || document.querySelectorAll("#hand-row [data-hand-uid]").length > 0,
    null,
    { timeout: 8000 },
  );
  const selectBlind = page.locator('[data-action="select-blind"]');
  if (await selectBlind.isVisible().catch(() => false)) await selectBlind.click();
  await page.waitForFunction(
    () => document.querySelectorAll("#hand-row [data-hand-uid]").length >= 5,
    null,
    { timeout: 8000 },
  );
  await page.locator(".toast").waitFor({ state: "hidden", timeout: 4000 }).catch(() => {});
  for (let i = 0; i < 5; i++) {
    await page.locator("#hand-row [data-hand-uid]").nth(i).click();
    await page.waitForTimeout(60);
  }
  await page.waitForFunction(
    () => document.querySelectorAll("#hand-row .card.selected").length === 5
      && document.querySelector("#play-btn")?.disabled === false,
    null,
    { timeout: 4000 },
  );
  await page.mouse.move(2, 2);
  await page.waitForTimeout(400);
  return { clicked: true, reason: "gameplay" };
}

const transientStatus = (status) => !status || [408, 429, 500, 502, 503, 504].includes(status);

let browser;
let failure;
try {
  browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }).catch(transient);
  for (const [name, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height } }).catch(transient);
    const page = await context.newPage().catch(transient);
    const pageErrors = [];
    page.setDefaultTimeout(30000);
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const response = await page.goto(url, { waitUntil: "load", timeout: 45000 }).catch(transient);
    if (!response?.ok()) {
      throw Object.assign(new Error(`HTTP ${response?.status()} loading preview`), {
        exitCode: transientStatus(response?.status()) ? 75 : 1,
      });
    }
    await page.locator(process.env.CAPTURE_READY_SELECTOR || "body").waitFor({ state: "visible" });
    await page.waitForFunction(() => document.fonts.status === "loaded");
    const start = await startGameplay(page);
    console.log(`Capture ${name}: auto-start ${start.reason}`);
    await page.screenshot({ path: join(output, `final-${name}.png`), timeout: 30000 }).catch((error) => {
      if (error.name === "TimeoutError" || !browser.isConnected()) transient(error);
      throw error;
    });
    if (pageErrors.length) failure ||= new Error(`Page errors (${name}): ${pageErrors.join(" | ")}`);
    await context.close();
  }
} catch (error) {
  console.error(error);
  process.exitCode = error.exitCode || 1;
} finally {
  await browser?.close().catch((error) => {
    console.error(error);
    process.exitCode ||= 75;
  });
}
if (failure) {
  console.error(failure);
  process.exitCode ||= 1;
}
