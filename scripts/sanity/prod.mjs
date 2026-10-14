// Production sanity – runs after EVERY production deploy. No logins, no writes:
// public pages render, gated routes redirect, nothing 500s.
const BASE = process.env.SANITY_BASE ?? "https://hamaatefet-prod.vercel.app";
const out = [];
const ok = (name, cond, extra = "") => out.push(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " - " + extra : ""}`);

for (const [path, needle] of [["/login", "היי, טוב שבאת!"], ["/signup", "מצטרפת למעטפת"], ["/forgot-password", "קורה לטובות ביותר"], ["/terms", "תקנון"], ["/api/health", '"env":"production"']]) {
  try {
    const r = await fetch(`${BASE}${path}`);
    ok(`public ${path}`, r.status === 200 && (await r.text()).includes(needle), `status=${r.status}`);
  } catch (e) {
    ok(`public ${path}`, false, String(e).slice(0, 100));
  }
}
for (const path of ["/", "/home", "/forum", "/millionaire", "/birthday", "/profile", "/admin", "/admin/events", "/pending", "/welcome"]) {
  const r = await fetch(`${BASE}${path}`, { redirect: "manual" });
  ok(`gated ${path} redirects`, r.status >= 300 && r.status < 400 && (r.headers.get("location") ?? "").includes("/login"), `status=${r.status}`);
}
const bad = await fetch(`${BASE}/auth/confirm?token_hash=x&type=signup`, { redirect: "manual" });
ok("bad auth link bounces to login", bad.status >= 300 && bad.status < 400 && (bad.headers.get("location") ?? "").includes("error="));
const cron = await fetch(`${BASE}/api/cron/birthday-reminders`);
ok("cron refuses without secret", cron.status === 401);

console.log("===== PROD SANITY =====");
for (const r of out) console.log(r);
const fails = out.filter((r) => r.startsWith("FAIL")).length;
console.log(`${out.length - fails}/${out.length} passed`);
process.exit(fails ? 1 : 0);
