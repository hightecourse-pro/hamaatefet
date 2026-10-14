// node tools/set-env.mjs <staging|prod|both> KEY VALUE [--secret]
// Sets a Vercel env var on the project(s) (replace if present). --secret = encrypted, never shown again.
import { vercel, vercelProjectFor } from "./deploy-helpers.mjs";

const args = process.argv.slice(2);
const secret = args.includes("--secret");
const [where, key, value] = args.filter((a) => a !== "--secret");
if (!where || !key || value === undefined) {
  console.log("usage: node tools/set-env.mjs <staging|prod|both> KEY VALUE [--secret]");
  process.exit(1);
}
const targets = where === "both" ? ["staging", "prod"] : [where];
for (const env of targets) {
  const id = vercelProjectFor(env);
  const list = await vercel(`/v9/projects/${id}/env`);
  for (const e of (list.json?.envs ?? []).filter((e) => e.key === key)) await vercel(`/v9/projects/${id}/env/${e.id}`, { method: "DELETE" });
  const r = await vercel(`/v10/projects/${id}/env`, {
    method: "POST",
    body: JSON.stringify({ key, value, type: secret ? "encrypted" : "plain", target: ["production", "preview", "development"] }),
  });
  console.log(env, key, r.ok ? "set" : `FAILED ${r.status} ${r.text.slice(0, 200)}`);
}
