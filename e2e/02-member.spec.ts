import { test, expect } from "@playwright/test";
import { STATE } from "./helpers";

test.use({ storageState: STATE.member });

test.describe("member flows", () => {
  test("home: greeting, three envelopes, next-event band with RSVP", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByText("היי חברה,")).toBeVisible();
    await expect(page.getByRole("heading", { name: "איזו המעטפָאן את פותחת היום?" })).toBeVisible();
    await expect(page.getByRole("link", { name: /הפורום/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /המיליונרית/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /חוגגות/ }).first()).toBeVisible();
    const band = page.getByLabel("המפגש הקרוב");
    await expect(band).toBeVisible();
    await band.getByRole("button", { name: "אני באה!" }).click();
    await expect(band.getByRole("button", { name: "נרשמת! (ביטול)" })).toBeVisible();
    await band.getByRole("button", { name: "נרשמת! (ביטול)" }).click();
    await expect(band.getByRole("button", { name: "אני באה!" })).toBeVisible();
  });

  test("forum: thread list, open a thread, like and comment with emoji, search and section filter", async ({ page }) => {
    await page.goto("/forum");
    await expect(page.getByRole("heading", { name: "הפורום", level: 1 })).toBeVisible();
    for (const s of ["תכנים", "מאחורי הקלעים", "עזרה הדדית", "דיונים קבוצתיים"]) await expect(page.getByRole("link", { name: new RegExp(s) }).first()).toBeVisible();
    await expect(page.locator("#composer")).toHaveCount(0);

    const row = page.locator("a.trow", { hasText: "QA דיון פתוח" });
    await expect(row).toBeVisible();
    await row.click();
    await expect(page).toHaveURL(/\/forum\/[0-9a-f-]+/);
    await expect(page.getByRole("heading", { name: "QA דיון פתוח", level: 1 })).toBeVisible();
    await expect(page.locator("article strong", { hasText: "מודגש" })).toBeVisible();

    await page.getByRole("button", { name: /אהבתי/ }).click();
    await expect(page.getByRole("button", { name: /אהבתי · 1/ })).toBeVisible();

    const editor = page.locator('[data-rich-editor="comment"]');
    await editor.click();
    await page.keyboard.type("תגובה אוטומטית ");
    await page.getByRole("button", { name: "אימוג׳י" }).click();
    await page.getByRole("dialog", { name: "בחירת אימוג׳י" }).getByRole("button", { name: "🎉" }).click();
    await page.getByRole("button", { name: "שולחת" }).click();
    await expect(page.getByText("תגובה אוטומטית 🎉")).toBeVisible();
    await expect(page.getByText("את", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: /לכל הדיונים/ }).click();
    await expect(page.locator("a.trow", { hasText: "QA דיון פתוח" })).toContainText("1");
    await page.goto(`/forum?q=${encodeURIComponent("QA דיון פתוח")}`);
    await expect(page.locator("a.trow", { hasText: "QA דיון פתוח" })).toBeVisible();
    await page.goto("/forum?section=content");
    await expect(page.locator("a.trow", { hasText: "QA דיון פתוח" })).toHaveCount(0);
  });

  test("forum: a team-only section offers a topic request; an open section lets her open a thread", async ({ page }) => {
    await page.goto("/forum?section=talk");
    await expect(page.getByRole("button", { name: "דיון חדש" })).toHaveCount(0);
    await page.getByRole("button", { name: "בקשה לנושא" }).click();
    await page.fill('input[name="subject"]', "QA נושא מבוקש");
    await page.fill('textarea[name="body"]', "אשמח לדיון על זה.");
    await page.getByRole("button", { name: "שולחת לצוות" }).click();
    await expect(page.getByRole("status")).toContainText("הבקשה הגיעה לצוות");

    await page.goto("/forum?section=help");
    await page.getByRole("button", { name: "דיון חדש" }).click();
    const composer = page.locator("#composer");
    await expect(composer).toBeVisible();
    await composer.locator('input[name="title"]').fill("QA דיון של חברה");
    await composer.locator('[data-rich-editor="body"]').click();
    await page.keyboard.type("מישהי יכולה לעזור לי עם זה?");
    await composer.getByRole("button", { name: "שולחת לפורום" }).click();
    await expect(page).toHaveURL(/\/forum\/[0-9a-f-]+/);
    await expect(page.getByRole("heading", { name: /QA דיון של חברה/, level: 1 })).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "מחיקה" }).first().click();
    await expect(page).toHaveURL(/\/forum$/);
  });

  test("forum: «הכל» only hints to enter a section; inside a section the form is locked to it and shows what it is about", async ({ page }) => {
    await page.goto("/forum");
    await expect(page.getByRole("button", { name: "דיון חדש" })).toHaveCount(0);
    await expect(page.getByText("כדי לפתוח דיון חדש, היכנסי קודם למדור המתאים.")).toBeVisible();
    await page.goto("/forum?section=help");
    await page.getByRole("button", { name: "דיון חדש" }).click();
    const composer = page.locator("#composer");
    await expect(composer.getByRole("heading", { name: "דיון חדש בעזרה הדדית" })).toBeVisible();
    await expect(composer.getByTestId("composer-section-info")).toContainText("כללי הבית");
    await expect(composer.locator('select[name="section"]')).toHaveCount(0);
    const radios = composer.locator('input[name="section"]');
    await expect(radios).toHaveCount(2);
    await expect(radios.first()).toBeChecked();
    await expect(composer.getByText("עזרה הדדית – מציעה")).toBeVisible();
  });

  test("the floating button sends a bug report to the team", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByText("המעטפת בהרצה")).toBeVisible();
    await page.getByRole("button", { name: "יש לך משהו לספר לנו?" }).click();
    await page.fill('input[name="subject"]', "QA תקלה");
    await page.fill('textarea[name="body"]', "הכפתור לא עובד אצלי.");
    await page.getByRole("button", { name: "שולחת לצוות" }).click();
    await expect(page.getByRole("status")).toContainText("קיבלנו");
  });

  test("millionaire: hero, hosting RSVP, cheque proposal", async ({ page }) => {
    await page.goto("/millionaire");
    await expect(page.getByRole("heading", { name: "המיליונרית", level: 1 })).toBeVisible();
    await expect(page.getByText("$1,000,000")).toBeVisible();
    // The cheque: payable to המעטפת – חד או פאן, signed by the member (the owner, 2/11).
    await expect(page.getByText("המעטפת – חד או פאן")).toBeVisible();
    await expect(page.getByText("חתימה", { exact: true })).toBeVisible();
    const host = page.locator("article", { hasText: "ערב סיפורים עם רות" });
    await expect(host).toBeVisible();
    await host.getByRole("button", { name: "שמרי לי מקום" }).click();
    await expect(host.getByRole("button", { name: "נרשמת! (ביטול)" })).toBeVisible();

    await page.getByRole("button", { name: "סיפור בלעדי" }).click();
    await page.fill('input[name="title"]', "QA ערב בדיקה");
    await page.fill('textarea[name="description"]', "תיאור אוטומטי של הערב.");
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
    await expect(page.getByText(/פינת צילום/)).toBeVisible();
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

  test("profile: the daily digest can be switched off and on", async ({ page }) => {
    await page.goto("/profile");
    const form = page.locator("form").filter({ has: page.locator('[name="digest"]') });
    await expect(form.locator('[name="digest"]')).toBeChecked();
    await form.locator('[name="digest"]').uncheck();
    await form.getByRole("button", { name: "שמירה" }).click();
    await expect(form.getByRole("status")).toContainText("נשמר");
    await page.reload();
    await expect(form.locator('[name="digest"]')).not.toBeChecked();
    await form.locator('[name="digest"]').check();
    await form.getByRole("button", { name: "שמירה" }).click();
    await expect(form.getByRole("status")).toContainText("נשמר");
  });

  test("the advertisement slot: beside the content on a wide screen, under it on a phone, a click is counted", async ({ page }) => {
    await page.goto("/home");
    const side = page.getByTestId("ad-side");
    await expect(side.getByRole("img", { name: "QA פרסומת" })).toBeVisible();
    await expect(page.getByTestId("ad-bottom")).toBeHidden();
    const href = await side.getByRole("link", { name: "QA פרסומת" }).getAttribute("href");
    expect(href).toMatch(/^\/ad\/[0-9a-f-]{36}$/);
    const r = await page.request.get(href!, { maxRedirects: 0 });
    expect(r.status()).toBe(302);
    expect(r.headers()["location"]).toBe("https://example.com/qa");

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("ad-bottom").getByRole("img", { name: "QA פרסומת" })).toBeVisible();
    await expect(side).toBeHidden();
  });

  test("terms page shows the editable body", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: "תקנון ומדיניות פרטיות" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "כללי הבית" })).toBeVisible();
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
