import { test, expect } from "@playwright/test";
import { STATE } from "./helpers";

test.use({ storageState: STATE.member });

test.describe("member flows", () => {
  test("home: greeting, three envelopes, next-event band with RSVP", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByText("היי חברה,")).toBeVisible();
    await expect(page.getByRole("heading", { name: "איזו המעטפָאן את פותחת היום?" })).toBeVisible();
    await expect(page.getByRole("link", { name: /הפורום/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /המיליונרית/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /חוגגות/ }).first()).toBeVisible();
    const band = page.getByLabel("המפגש הקרוב");
    await expect(band).toBeVisible();
    await band.getByRole("button", { name: "אני באה!" }).click();
    await expect(band.getByRole("button", { name: "נרשמת! (ביטול)" })).toBeVisible();
    await band.getByRole("button", { name: "נרשמת! (ביטול)" }).click();
    await expect(band.getByRole("button", { name: "אני באה!" })).toBeVisible();
  });

  test("forum: sections, new post, like, comment, search", async ({ page }) => {
    await page.goto("/forum");
    await expect(page.getByRole("heading", { name: "הפורום", level: 1 })).toBeVisible();
    for (const s of ["תכנים", "מאחורי הקלעים", "עזרה הדדית", "דיונים קבוצתיים"]) await expect(page.getByRole("link", { name: new RegExp(s) }).first()).toBeVisible();

    const title = `QA פוסט ${Date.now()}`;
    await page.selectOption('[name="section"]', { label: "דיונים קבוצתיים" });
    await page.fill('[name="title"]', title);
    await page.fill('[name="body"]', "זה פוסט שנוצר אוטומטית בבדיקה.");
    await page.getByRole("button", { name: "שולחת לפורום" }).click();
    await expect(page.getByRole("status")).toContainText("פורסם");
    const card = page.locator("article", { hasText: title });
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: /אהבתי/ }).click();
    await expect(card.getByRole("button", { name: /אהבתי · 1/ })).toBeVisible();

    await card.getByRole("button", { name: /להצטרף לדיון/ }).click();
    await card.locator('textarea[name="body"]').fill("תגובה אוטומטית");
    await card.getByRole("button", { name: "שולחת" }).click();
    await expect(card.getByText("תגובה אוטומטית")).toBeVisible();

    await page.goto(`/forum?q=${encodeURIComponent(title)}`);
    await expect(page.locator("article", { hasText: title })).toBeVisible();
    await page.goto("/forum?section=content");
    await expect(page.locator("article", { hasText: title })).toHaveCount(0);
  });

  test("millionaire: hero, hosting RSVP, cheque proposal", async ({ page }) => {
    await page.goto("/millionaire");
    await expect(page.getByRole("heading", { name: "המיליונרית", level: 1 })).toBeVisible();
    await expect(page.getByText("$1,000,000")).toBeVisible();
    const host = page.locator("article", { hasText: "ערב סיפורים עם רות" });
    await expect(host).toBeVisible();
    await host.getByRole("button", { name: "שמרי לי מקום" }).click();
    await expect(host.getByRole("button", { name: "נרשמת! (ביטול)" })).toBeVisible();

    await page.getByRole("button", { name: "סיפור בלעדי" }).click();
    await page.fill('[name="title"]', "QA ערב בדיקה");
    await page.fill('[name="description"]', "תיאור אוטומטי של הערב.");
    await page.getByRole("button", { name: "חותמת על הצ׳ק" }).click();
    await expect(page.getByText("הצ׳ק נחתם!")).toBeVisible();
  });

  test("birthday: host view, topic team, RSVP, agenda", async ({ page }) => {
    await page.goto("/birthday");
    await expect(page.getByRole("heading", { name: /חוגגות/, level: 1 })).toBeVisible();
    await expect(page.getByText("את מבעלות השמחה החודש!")).toBeVisible();
    await page.getByRole("button", { name: "אני רוצה להיות בצוות הנושא" }).click();
    await expect(page.getByRole("button", { name: "את בצוות הנושא!" })).toBeVisible();
    await page.getByRole("button", { name: "אני באה לחגוג" }).click();
    await expect(page.getByRole("button", { name: "מגיעה! (ביטול)" })).toBeVisible();
    await expect(page.getByText("מתכנסות: עוגה, חטיפים ובלונים")).toBeVisible();
    await page.getByRole("button", { name: /מתכנסות/ }).click();
    await expect(page.getByText("פינת צילום, ברכה קטנה בכניסה.")).toBeVisible();
  });

  test("profile: edit birth month and details", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "החשבון שלי" })).toBeVisible();
    await page.selectOption('[name="birth_month"]', "4");
    await page.locator("form").filter({ has: page.locator('[name="birth_month"]') }).getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByRole("status").first()).toContainText("נשמר");
    await page.fill('[name="phone"]', "052-7654321");
    await page.locator("form").filter({ has: page.locator('[name="phone"]') }).getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByRole("status").last()).toContainText("נשמרו");
    await page.getByRole("button", { name: "שינוי סיסמה" }).click();
    await expect(page.getByRole("heading", { name: "סיסמה חדשה" })).toBeVisible();
  });
});

test.describe("guest view", () => {
  test.use({ storageState: STATE.guest });
  test("a woman born in another month sees the guest copy", async ({ page }) => {
    await page.goto("/birthday");
    await expect(page.getByText(/חוגגות את ילידות/)).toBeVisible();
    await expect(page.getByText("את מבעלות השמחה החודש!")).toHaveCount(0);
  });
});
