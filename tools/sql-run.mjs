// node tools/sql-run.mjs <staging|prod> "<sql>"  → runs the statement, prints rows as JSON.
import { sql, refFor } from "./deploy-helpers.mjs";

const [env, query] = process.argv.slice(2);
if (!env || !query) {
  console.log('usage: node tools/sql-run.mjs <staging|prod> "<sql>"');
  process.exit(1);
}
const r = await sql(refFor(env), query);
console.log(r.ok ? JSON.stringify(r.rows, null, 1) : "ERR " + r.error);
process.exit(r.ok ? 0 : 1);
