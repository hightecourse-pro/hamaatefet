import { expect, type Page } from "@playwright/test";
import fixtures from "./fixtures.json";

export type AccountKey = "admin" | "member" | "guest" | "pending";

export function account(key: AccountKey) {
  const a = fixtures.accounts.find((x) => x.key === key);
  if (!a) throw new Error(`no fixture ${key}`);
  return a;
}

export async function login(page: Page, key: AccountKey, expectPath: RegExp = /\/home/) {
  const a = account(key);
  await page.goto("/login");
  await page.fill('input[name="email"]', a.email);
  await page.fill('input[name="password"]', a.password);
  await page.getByRole("button", { name: "פותחת את המעטפה" }).click();
  await expect(page).toHaveURL(expectPath, { timeout: 20_000 });
}

export const STATE = { admin: "e2e/.auth/admin.json", member: "e2e/.auth/member.json", guest: "e2e/.auth/guest.json" } as const;
