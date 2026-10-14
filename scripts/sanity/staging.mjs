// Staging sanity – runs after EVERY staging deploy. Real browser, real pages,
// asserts on what rendered (a 200 with an empty card is a broken page).
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = process.env.SANITY_BASE ?? "https://hamaatefet.vercel.app";
const FIX = JSON.parse(readFileSync(new URL("../../e2e/fixtures.json", import.meta.url), "utf8")).accounts;
const ADMIN = FIX.find((a) => a.key === "admin");
const MEMBER = FIX.find((a) => a.key === "member");

const out = [];
const ok = (name, cond, extra = "") => out.push(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " - " + extra : ""}`);
const browser = await chromium.launch();

async function login(page, who) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', who.email);
  await page.fill('input[name="password"]', who.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.href.includes("/login"), { timeout: 45000 });
}

try {
  for (const [path, needle] of [["/login", "היי, טוב שבאת!"], ["/signup", "מצטרפת למעטפת"], ["/terms", "תקנון"], ["/api/health", '"ok":true']]) {
    const r = await fetch(`${BASE}${path}`);
    ok(`public ${path}`, r.status === 200 && (await r.text()).includes(needle), `status=${r.status}`);
  }
  for (const path of ["/home", "/forum", "/admin"]) {
    const r = await fetch(`${BASE}${path}`, { redirect: "manual" });
    ok(`gated ${path} redirects`, r.status >= 300 && r.status < 400 && (r.headers.get("location") ?? "").includes("/login"), `status=${r.status}`);
  }

  const m = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await login(m, MEMBER);
  const checks = [
    ["/home", ["איזו המעטפָאן", "הפורום", "המיליונרית", "חודש טוב"]],
    ["/forum", ["הפורום", "איך זה עובד כאן?", "כללי הבית"]],
    ["/millionaire", ["המיליונרית", "איך זה עובד?", "הצ׳ק שלך"]],
    ["/birthday", ["חוגגות", "המפגש החודשי הקרוב", "מה מחכה לנו במפגש"]],
    ["/profile", ["החשבון שלי", "מתי נולדת?", "פרטים אישיים"]],
  ];
  for (const [path, needles] of checks) {
    await m.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    const text = (await m.textContent("body")) ?? "";
    ok(`member ${path}`, needles.every((n) => text.includes(n)), needles.filter((n) => !text.includes(n)).join(","));
  }

  const a = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  await login(a, ADMIN);
  const adminChecks = [
    ["/admin", ["משתתפות", "ממתינות לאישור", "ייצוא לאקסל"]],
    ["/admin/forum", ["מדורים", "הדיונים"]],
    ["/admin/content", ["תוכן האתר", "תפריט ראשי"]],
    ["/admin/millionaire", ["הצעות אירוח"]],
    ["/admin/birthday", ["לוח השנה", "תשרי", "אלול"]],
    ["/admin/events", ["מפגשים והרשמות", "מפגש חדש"]],
  ];
  for (const [path, needles] of adminChecks) {
    await a.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    const text = (await a.textContent("body")) ?? "";
    ok(`admin ${path}`, needles.every((n) => text.includes(n)), needles.filter((n) => !text.includes(n)).join(","));
  }
} catch (e) {
  out.push(`FAIL crashed - ${String(e).slice(0, 300)}`);
} finally {
  await browser.close();
}
console.log("===== STAGING SANITY =====");
for (const r of out) console.log(r);
const fails = out.filter((r) => r.startsWith("FAIL")).length;
console.log(`${out.length - fails}/${out.length} passed`);
process.exit(fails ? 1 : 0);
