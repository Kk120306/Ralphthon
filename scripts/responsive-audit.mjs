import { chromium } from "playwright";

const baseUrl = process.env.E2E_URL ?? "http://localhost:3000";
const landingUrl = baseUrl.replace(/\/$/, "");
const dashboardUrl = `${landingUrl}/dashboard`;
const executablePath = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const viewports = [
  { width: 360, height: 800, name: "mobile-narrow" },
  { width: 390, height: 844, name: "mobile" },
  { width: 768, height: 1024, name: "tablet" },
  { width: 1024, height: 768, name: "small-laptop" },
  { width: 1366, height: 900, name: "laptop" },
  { width: 1920, height: 1080, name: "desktop" },
];
const errors = [];
const results = [];
const browser = await chromium.launch({ executablePath, headless: true });

async function collectMetrics(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const offenders = Array.from(document.querySelectorAll("body *"))
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          className: typeof el.className === "string" ? el.className.slice(0, 120) : "",
          text: (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 100),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((item) => item.right > window.innerWidth + 2 && item.width > 0)
      .slice(0, 8);
    return {
      innerWidth: window.innerWidth,
      docScrollWidth: root.scrollWidth,
      bodyScrollWidth: body.scrollWidth,
      overflowX: Math.max(root.scrollWidth, body.scrollWidth) - window.innerWidth,
      offenders,
    };
  });
}

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  const apiRequests = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("favicon")) consoleErrors.push(msg.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("/api/investigate")) apiRequests.push(request.url());
  });

  await page.goto(landingUrl, { waitUntil: "networkidle" });
  await page.getByText("AI agents that connect weak security alerts").waitFor({ timeout: 10_000 });
  await page.getByRole("link", { name: /Run Live Scenario/i }).first().waitFor();
  await page.getByText("Live SOC preview").waitFor();
  await page.getByText("Six product agents").waitFor();
  const landingMetrics = await collectMetrics(page);
  const ctaHref = await page.getByRole("link", { name: /Run Live Scenario/i }).first().getAttribute("href");
  if (ctaHref !== "/dashboard") errors.push(`${viewport.name}: landing CTA href was ${ctaHref}`);
  if (apiRequests.length) errors.push(`${viewport.name}: landing triggered API requests ${apiRequests.join(" | ")}`);

  await page.goto(dashboardUrl, { waitUntil: "networkidle" });
  await page.getByText("Risk score").waitFor({ timeout: 10_000 });
  const dashboardMetrics = await collectMetrics(page);
  let interactiveMetrics = null;
  if (["mobile-narrow", "desktop"].includes(viewport.name)) {
    await page.getByRole("button", { name: /Run Supply-Chain Attack Scenario/i }).click();
    await page.getByText("Login from Moscow").waitFor({ timeout: 6_000 });
    await page.getByText("Correlation graph").waitFor({ timeout: 2_000 });
    await page.getByTestId("raw-event").first().click();
    await page.getByTestId("evidence-drawer").waitFor({ timeout: 2_000 });
    interactiveMetrics = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      return {
        drawerVisible: Boolean(document.querySelector('[data-testid="evidence-drawer"]')),
        overflowX: Math.max(root.scrollWidth, body.scrollWidth) - window.innerWidth,
      };
    });
  }

  results.push({ viewport: viewport.name, landingMetrics, dashboardMetrics, interactiveMetrics, consoleErrors });
  if (landingMetrics.overflowX > 2) errors.push(`${viewport.name}: landing horizontal overflow ${landingMetrics.overflowX}px`);
  if (dashboardMetrics.overflowX > 2) errors.push(`${viewport.name}: dashboard horizontal overflow ${dashboardMetrics.overflowX}px`);
  if (interactiveMetrics?.overflowX > 2) errors.push(`${viewport.name}: drawer/graph horizontal overflow ${interactiveMetrics.overflowX}px`);
  if (interactiveMetrics && !interactiveMetrics.drawerVisible) errors.push(`${viewport.name}: evidence drawer did not render during responsive audit`);
  if (consoleErrors.length) errors.push(`${viewport.name}: console errors ${consoleErrors.join(" | ")}`);
  await page.close();
}
await browser.close();
console.log(JSON.stringify({ ok: errors.length === 0, results, errors }, null, 2));
if (errors.length) process.exit(1);
