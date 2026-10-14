// node scripts/dev/screenshots.mjs [outDir] – full-page screenshots of every staging screen (member + admin + phone).
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const BASE = "https://hamaatefet-staging.vercel.app";
const OUT = process.argv[2] ?? "screenshots";
const FIX = JSON.parse(readFileSync("e2e/fixtures.json", "utf8")).accounts;
const browser = await chromium.launch();
async function login(page, who) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', who.email);
  await page.fill('input[name="password"]', who.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.href.includes("/login"), { timeout: 45000 });
}
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/01-login.png`, fullPage: true });
await page.getByRole("tab", { name: "הרשמה" }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/02-signup.png`, fullPage: true });
await login(page, FIX.find((a) => a.key === "member"));
for (const [p, n] of [["/home", "03-home"], ["/forum", "04-forum"], ["/millionaire", "05-millionaire"], ["/birthday", "06-birthday"], ["/profile", "07-profile"]]) {
  await page.goto(`${BASE}${p}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
}
const actx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const a = await actx.newPage();
await login(a, FIX.find((x) => x.key === "admin"));
for (const [p, n] of [["/admin", "08-admin-members"], ["/admin/forum", "09-admin-forum"], ["/admin/birthday", "10-admin-birthday"], ["/admin/events", "11-admin-events"]]) {
  await a.goto(`${BASE}${p}`, { waitUntil: "networkidle" });
  await a.waitForTimeout(500);
  await a.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
}
// phone width
const m = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })).newPage();
await m.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await m.screenshot({ path: `${OUT}/12-mobile-login.png`, fullPage: true });
await browser.close();
console.log("shots done");
