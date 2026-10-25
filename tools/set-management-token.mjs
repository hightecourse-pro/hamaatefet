// node tools/set-management-token.mjs <staging|prod|both>
// Stores this environment's Supabase MANAGEMENT token (from .env.deploy.local:
// SUPABASE_ACCESS_TOKEN for the free org = staging, SUPABASE_ACCESS_TOKEN_PRO for
// the Pro org = production) as the encrypted Vercel variable SUPABASE_ACCESS_TOKEN.
// The app needs it for one thing: «תוכן האתר» → «מיילי אימות וסיסמה» pushes the
// auth e-mail templates to Supabase when the team saves them (src/lib/auth-mail.ts).
// Without it the texts still save; the screen reports that the push was not configured.
import { vercel, vercelProjectFor, ENV } from "./deploy-helpers.mjs";

const where = process.argv[2];
if (!["staging", "prod", "both"].includes(where ?? "")) {
  console.log("usage: node tools/set-management-token.mjs <staging|prod|both>");
  process.exit(1);
}
const KEY = "SUPABASE_ACCESS_TOKEN";
for (const env of where === "both" ? ["staging", "prod"] : [where]) {
  const value = env === "prod" ? ENV.SUPABASE_ACCESS_TOKEN_PRO : ENV.SUPABASE_ACCESS_TOKEN;
  if (!value) {
    console.log(env, "no token in .env.deploy.local");
    continue;
  }
  const id = vercelProjectFor(env);
  const list = await vercel(`/v9/projects/${id}/env`);
  for (const e of (list.json?.envs ?? []).filter((e) => e.key === KEY)) await vercel(`/v9/projects/${id}/env/${e.id}`, { method: "DELETE" });
  const r = await vercel(`/v10/projects/${id}/env`, {
    method: "POST",
    body: JSON.stringify({ key: KEY, value, type: "encrypted", target: ["production", "preview", "development"] }),
  });
  console.log(env, KEY, r.ok ? "set (encrypted) – redeploy for it to take effect" : `FAILED ${r.status} ${r.text.slice(0, 200)}`);
}
