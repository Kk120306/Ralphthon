import { chromium } from "playwright";

const url = process.env.E2E_URL ?? "http://localhost:3000";
const executablePath = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const errors = [];

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1680, height: 1200 } });

page.on("console", (msg) => {
  const text = msg.text();
  if (msg.type() === "error" && !text.includes("favicon")) {
    errors.push(`console.error: ${text}`);
  }
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("requestfailed", (request) => {
  const failure = request.failure()?.errorText ?? "unknown";
  const resource = request.resourceType();
  if (resource !== "image" && !failure.includes("ERR_ABORTED")) {
    errors.push(`requestfailed: ${request.url()} ${failure}`);
  }
});

await page.goto(url, { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "IncidentIQ" }).waitFor({ timeout: 10_000 });
await page.getByRole("button", { name: /Run Supply-Chain Attack Scenario/i }).waitFor();
await page.getByText("Risk score").waitFor();
await page.getByText("0 signals").waitFor();
if (await page.getByText("Login from Moscow").isVisible().catch(() => false)) {
  errors.push("Raw event timeline was not empty before the simulation started");
}

// Reset during a just-started run should not allow stale fetch/timer results to repopulate the UI.
await page.getByRole("button", { name: /Run Supply-Chain Attack Scenario/i }).click();
await page.getByRole("button", { name: "Reset", exact: true }).click();
await page.waitForTimeout(2_000);
const idleText = await page.locator("header").textContent();
if (!idleText?.includes("idle")) errors.push("Reset did not return header status to idle");
if (!(await page.getByText("0/6 done").isVisible())) errors.push("Reset did not clear agent progress");
if (await page.getByText("Login from Moscow").isVisible().catch(() => false)) {
  errors.push("Reset did not clear raw timeline events");
}

// Full happy path.
await page.getByRole("button", { name: /Run Supply-Chain Attack Scenario/i }).click();
await page.getByText("Login from Moscow").waitFor({ timeout: 5_000 });
await page.getByText("10.4GB outbound HTTPS").waitFor({ timeout: 7_000 });
await page.getByText("✓ complete").waitFor({ timeout: 90_000 });
await page.getByText("84").first().waitFor({ timeout: 5_000 });
await page.getByText("Final incident report").waitFor();
await page.getByText("Mock remediation PR").waitFor();
await page.getByText("Remove suspicious dependency (lodash-utilz)").waitFor();
await page.getByText("T1078").waitFor();
await page.getByText("T1552").waitFor();
await page.getByText("T1195").waitFor();
await page.getByText("T1041").waitFor();

// Checklist interaction.
await page.getByRole("button", { name: /Run all/i }).click();
await page.getByText("Disable compromised developer account").waitFor();

// Final reset should clear completed state.
await page.getByRole("button", { name: "Reset", exact: true }).click();
await page.waitForTimeout(500);
const resetHeader = await page.locator("header").textContent();
if (!resetHeader?.includes("idle")) errors.push("Final reset did not return header status to idle");
if (!(await page.getByText("0/6 done").isVisible())) errors.push("Final reset did not clear agent progress");
if (await page.getByText("Login from Moscow").isVisible().catch(() => false)) {
  errors.push("Final reset did not clear raw timeline events");
}

await browser.close();

if (errors.length > 0) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checked: ["hydration console", "initial render", "empty raw timeline", "progressive raw timeline", "reset race", "full run", "risk score", "final report", "MITRE", "mock PR", "checklist", "final reset"] }, null, 2));
