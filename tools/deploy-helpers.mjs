// Shared helpers for the deploy/ops scripts. Reads hamaatefet/.env.deploy.local; never prints secrets.
//
// Two Supabase access tokens, because Supabase tokens are organization-scoped:
//   SUPABASE_ACCESS_TOKEN      → the free org (the staging project)
//   SUPABASE_ACCESS_TOKEN_PRO  → the Pro org (the Micro production project)
// supa() picks the token from the project ref in the path.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const ENV = {};
for (const line of readFileSync(join(ROOT, ".env.deploy.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) ENV[m[1]] = m[2].replace(/^"|"$/g, "");
}

export const TEAM = ENV.VERCEL_TEAM;

/** "staging" | "prod" → Supabase project ref. */
export function refFor(env) {
  const ref = env === "prod" ? ENV.PROD_REF : env === "staging" ? ENV.STAGING_REF : null;
  if (!ref) throw new Error(`no Supabase ref for "${env}" in .env.deploy.local`);
  return ref;
}

/** "staging" | "prod" → Vercel project id. */
export function vercelProjectFor(env) {
  const id = env === "prod" ? ENV.VERCEL_PROD : env === "staging" ? ENV.VERCEL_STAGING : null;
  if (!id) throw new Error(`no Vercel project for "${env}" in .env.deploy.local`);
  return id;
}

/** The access token that can see this project. */
export function tokenFor(ref) {
  if (ref && ref === ENV.PROD_REF && ENV.SUPABASE_ACCESS_TOKEN_PRO) return ENV.SUPABASE_ACCESS_TOKEN_PRO;
  return ENV.SUPABASE_ACCESS_TOKEN;
}

export async function supa(path, init = {}, token) {
  const ref = path.match(/\/v1\/projects\/([a-z]{20})/)?.[1];
  const auth = token ?? tokenFor(ref);
  const r = await fetch(`https://api.supabase.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${auth}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: r.status, ok: r.ok, json, text };
}

/** Run SQL on a project through the management API (no DB password needed). */
export async function sql(ref, query) {
  const r = await supa(`/v1/projects/${ref}/database/query`, { method: "POST", body: JSON.stringify({ query }) });
  if (!r.ok) return { ok: false, rows: [], error: r.text };
  return { ok: true, rows: Array.isArray(r.json) ? r.json : [], error: Array.isArray(r.json) ? undefined : r.text };
}

export async function vercel(path, init = {}) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`https://api.vercel.com${path}${sep}teamId=${TEAM}`, {
    ...init,
    headers: { Authorization: `Bearer ${ENV.VERCEL_TOKEN}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: r.status, ok: r.ok, json, text };
}

/** The project's API keys (anon + service role). */
export async function apiKeys(ref) {
  const r = await supa(`/v1/projects/${ref}/api-keys?reveal=true`);
  if (!r.ok) throw new Error(`api-keys ${r.status}: ${r.text.slice(0, 200)}`);
  const find = (name) => r.json.find((k) => k.name === name)?.api_key;
  return { anon: find("anon"), serviceRole: find("service_role") };
}
