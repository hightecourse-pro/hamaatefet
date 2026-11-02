import { test, expect } from "@playwright/test";
import { account, login } from "./helpers";

test.describe("public + gating", () => {
  test("login screen renders the design", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "היי, טוב שבאת!" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "כניסה" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "הרשמה" })).toBeVisible();
    await expect(page.getByText("מוזמנת!")).toBeVisible();
    // Sponsor logos, outside too.
    await expect(page.getByAltText("מינהל קהילתי בית וגן")).toBeVisible();
    await expect(page.getByAltText("חד או פאן", { exact: true })).toBeVisible();
  });

  test("the digest cron refuses without the secret; the ad click route sends a stranger to login", async ({ page }) => {
    const cron = await page.request.get("/api/cron/daily-digest");
    expect(cron.status()).toBe(401);
    const click = await page.request.get("/ad/00000000-0000-0000-0000-000000000000", { maxRedirects: 0 });
    expect(click.status()).toBe(302);
    expect(click.headers()["location"]).toContain("/login");
  });

  test("forgot password: an unknown address is told so; a registered one gets the sent screen", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.fill('input[name="email"]', "nobody-qa@example.com");
    await page.getByRole("button", { name: "שלחו לי קישור" }).click();
    await expect(page.locator("p[role=\"alert\"]")).toContainText("לא מצאנו חשבון");
    await page.fill('input[name="email"]', account("member").email);
    await page.getByRole("button", { name: "שלחו לי קישור" }).click();
    await expect(page.getByRole("heading", { name: "בדקי את תיבת המייל" })).toBeVisible();
    await expect(page.getByText("המייל מגיע מ«חד או פאן»")).toBeVisible();
  });

  test("sign-up tab asks for the first-entry details", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "מצטרפת למעטפת" })).toBeVisible();
    for (const name of ["first_name", "last_name", "email", "phone", "password", "birth_month", "over_30", "terms"]) {
      await expect(page.locator(`[name="${name}"]`)).toBeVisible();
    }
  });

  test("sign-up refuses without the 30+ confirmation", async ({ page }) => {
    await page.goto("/signup");
    await page.fill('[name="first_name"]', "בדיקה");
    await page.fill('[name="last_name"]', "אוטומטית");
    await page.fill('[name="email"]', "nobody@example.com");
    await page.fill('[name="phone"]', "050-1234567");
    await page.fill('[name="password"]', "Password-123");
    await page.selectOption('[name="birth_month"]', "2");
    await page.check('[name="terms"]');
    await page.getByRole("button", { name: "שולחת בקשת הצטרפות" }).click();
    await expect(page.locator("p[role=\"alert\"]")).toContainText("30");
  });

  test("terms page renders", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: "תקנון ומדיניות פרטיות" })).toBeVisible();
  });

  test("gated routes redirect to login", async ({ page }) => {
    for (const path of ["/home", "/forum", "/millionaire", "/birthday", "/profile", "/admin"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("wrong password shows a friendly error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', account("member").email);
    await page.fill('input[name="password"]', "wrong-password");
    await page.getByRole("button", { name: "פותחת את המעטפה" }).click();
    await expect(page.locator("p[role=\"alert\"]")).toContainText("לא נכונים");
  });

  test("a pending member lands on the waiting screen", async ({ page }) => {
    await login(page, "pending", /\/pending/);
    await expect(page.getByRole("heading", { name: "המעטפה בדרך!" })).toBeVisible();
    await page.goto("/home");
    await expect(page).toHaveURL(/\/pending/);
  });

  test("a member cannot open the admin area", async ({ page }) => {
    await login(page, "member");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/home/);
  });

  test("health endpoint answers", async ({ request }) => {
    const r = await request.get("/api/health");
    expect(r.status()).toBe(200);
    expect((await r.json()).ok).toBe(true);
  });
});
