import { chromium } from "playwright";

const url = process.env.E2E_URL ?? "http://localhost:3000";
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
for (const viewport of viewports) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("favicon")) consoleErrors.push(msg.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByText("IncidentIQ").first().waitFor({ timeout: 10_000 });
  const metrics = await page.evaluate(() => {
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
  results.push({ viewport: viewport.name, ...metrics, consoleErrors });
  if (metrics.overflowX > 2) errors.push(`${viewport.name}: horizontal overflow ${metrics.overflowX}px`);
  if (consoleErrors.length) errors.push(`${viewport.name}: console errors ${consoleErrors.join(" | ")}`);
  await page.close();
}
await browser.close();
console.log(JSON.stringify({ ok: errors.length === 0, results, errors }, null, 2));
if (errors.length) process.exit(1);
