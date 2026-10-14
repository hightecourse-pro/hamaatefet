// Before the suite: fixtures back to their canonical state (tools/seed-fixtures.mjs).
import { spawnSync } from "node:child_process";

export default async function globalSetup() {
  if (process.env.E2E_SKIP_SEED === "1") return;
  const r = spawnSync(process.execPath, ["tools/seed-fixtures.mjs", "staging"], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("seed-fixtures failed");
}
