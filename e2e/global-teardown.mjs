// After the suite: the same reset, so what the specs created never reaches members' eyes.
import { spawnSync } from "node:child_process";

export default async function globalTeardown() {
  if (process.env.E2E_SKIP_SEED === "1") return;
  spawnSync(process.execPath, ["tools/seed-fixtures.mjs", "staging"], { stdio: "inherit" });
}
