// node tools/apply-migrations.mjs <staging|prod> [file.sql ...]
// Applies every file in supabase/migrations/ that this environment has not run
// yet (tracked in public._migrations), in name order. Pass files to force those only.
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { sql, refFor, ROOT } from "./deploy-helpers.mjs";

const [env, ...files] = process.argv.slice(2);
if (!env) {
  console.log("usage: node tools/apply-migrations.mjs <staging|prod> [files...]");
  process.exit(1);
}
const ref = refFor(env);

const ledger = await sql(ref, "create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now()); select name from public._migrations order by name");
if (!ledger.ok) {
  console.log("FAILED reading ledger", ledger.error.slice(0, 300));
  process.exit(1);
}
const applied = new Set(ledger.rows.map((r) => r.name));

const dir = join(ROOT, "supabase", "migrations");
const list = files.length ? files : readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => join(dir, f));

let ran = 0;
for (const f of list) {
  const name = basename(f);
  if (!files.length && applied.has(name)) {
    console.log(env, name, "already applied");
    continue;
  }
  const body = readFileSync(f, "utf8");
  const r = await sql(ref, body);
  if (!r.ok) {
    console.log(env, name, "FAILED", r.error.slice(0, 600));
    process.exit(1);
  }
  await sql(ref, `insert into public._migrations (name) values ('${name.replace(/'/g, "''")}') on conflict do nothing`);
  console.log(env, name, "OK");
  ran++;
}
console.log(`${env}: ${ran} migration(s) applied`);
