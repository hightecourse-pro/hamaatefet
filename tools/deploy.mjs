// node tools/deploy.mjs <staging|prod>
// Deploys the working tree to the Vercel project of that environment with the
// Vercel CLI (source upload; Vercel builds with the project's own env). Prints
// the deployment URL and waits until it is READY.
//
// Production is deployed ONLY after the owner's explicit approval – see
// .claude/skills/deploy/SKILL.md.
import { spawnSync } from "node:child_process";
import { ENV, ROOT, TEAM, vercel, vercelProjectFor } from "./deploy-helpers.mjs";

const env = process.argv[2];
if (env !== "staging" && env !== "prod") {
  console.log("usage: node tools/deploy.mjs <staging|prod>");
  process.exit(1);
}
const project = vercelProjectFor(env);

const r = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["vercel", "deploy", "--prod", "--yes", `--token=${ENV.VERCEL_TOKEN}`],
  {
    cwd: ROOT,
    env: { ...process.env, VERCEL_ORG_ID: TEAM, VERCEL_PROJECT_ID: project },
    encoding: "utf8",
    shell: process.platform === "win32",
    maxBuffer: 20 * 1024 * 1024,
  }
);
const out = (r.stdout ?? "") + (r.stderr ?? "");
const urlMatch = out.match(/https:\/\/[a-z0-9-]+\.vercel\.app/g);
const deployUrl = urlMatch ? urlMatch[urlMatch.length - 1] : null;
if (r.status !== 0 || !deployUrl) {
  console.log(out.replace(ENV.VERCEL_TOKEN, "***").slice(-3000));
  console.log("DEPLOY FAILED");
  process.exit(1);
}
console.log("deployment:", deployUrl);

// Wait until READY.
const started = Date.now();
let last = "";
while (Date.now() - started < 12 * 60 * 1000) {
  const d = await vercel(`/v13/deployments/${deployUrl.replace("https://", "")}`);
  const state = d.json?.readyState ?? d.json?.state ?? "UNKNOWN";
  if (state !== last) {
    console.log(new Date().toISOString().slice(11, 19), state);
    last = state;
  }
  if (state === "READY") {
    const aliases = d.json?.alias ?? [];
    console.log("LIVE", aliases.length ? aliases.map((a) => `https://${a}`).join(" ") : deployUrl);
    process.exit(0);
  }
  if (state === "ERROR" || state === "CANCELED") {
    console.log("FAILED");
    process.exit(1);
  }
  await new Promise((res) => setTimeout(res, 8000));
}
console.log("TIMEOUT");
process.exit(1);
