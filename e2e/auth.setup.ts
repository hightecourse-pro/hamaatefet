import { test as setup } from "@playwright/test";
import fs from "node:fs";
import { login, STATE } from "./helpers";

setup("sign in the fixture accounts", async ({ browser }) => {
  fs.mkdirSync("e2e/.auth", { recursive: true });
  for (const key of ["admin", "member", "guest"] as const) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, key);
    await context.storageState({ path: STATE[key] });
    await context.close();
  }
});
