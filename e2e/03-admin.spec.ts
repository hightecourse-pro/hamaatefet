import { test, expect } from "@playwright/test";
import { STATE, account } from "./helpers";

test.use({ storageState: STATE.admin });

test.describe("admin", () => {
  test("members: list, filters, approve a pending member, export", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "משתתפות" })).toBeVisible();
    await expect(page.getByText("ממתינות לאישור").first()).toBeVisible();
    await page.goto("/admin?status=pending");
    const row = page.locator("tr", { hasText: account("pending").email });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "אישור" }).click();
    await expect(row.getByText("אושרה")).toBeVisible();
    await page.goto(`/admin?q=${encodeURIComponent(account("pending").email)}`);
    await expect(page.locator("tr", { hasText: account("pending").email }).getByText("פעילה")).toBeVisible();

    const r = await page.request.get("/admin/export/members");
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toContain("text/csv");
    expect((await r.text()).startsWith("﻿")).toBe(true);
  });

  test("member page: edit details", async ({ page }) => {
    await page.goto(`/admin?q=${encodeURIComponent(account("guest").email)}`);
    await page.locator("tr", { hasText: account("guest").email }).getByRole("link", { name: "עריכה" }).click();
    await expect(page).toHaveURL(/\/admin\/members\//);
    await page.fill('[name="phone"]', "050-9999999");
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByRole("status")).toContainText("נשמר");
  });

  test("forum: the team opens a rich discussion, edits a section, deletes any thread", async ({ page }) => {
    await page.goto("/forum?section=content");
    await page.getByRole("button", { name: "דיון חדש" }).click();
    const composer = page.locator("#composer");
    await expect(composer).toBeVisible();
    await composer.locator('input[name="title"]').fill("QA דיון של הצוות");
    const editor = composer.locator('[data-rich-editor="body"]');
    await editor.click();
    await composer.getByRole("button", { name: "מודגש" }).click();
    await page.keyboard.type("טקסט מודגש");
    await composer.getByRole("button", { name: "מודגש" }).click();
    await page.keyboard.type(" ורגיל ");
    await composer.getByRole("button", { name: "אימוג׳י" }).click();
    await composer.getByRole("dialog", { name: "בחירת אימוג׳י" }).getByRole("button", { name: "💜" }).click();
    await composer.getByRole("button", { name: "שולחת לפורום" }).click();
    await expect(page).toHaveURL(/\/forum\/[0-9a-f-]+/);
    await expect(page.getByRole("heading", { name: "QA דיון של הצוות", level: 1 })).toBeVisible();
    await expect(page.locator("article b, article strong", { hasText: "טקסט מודגש" })).toBeVisible();
    await expect(page.getByText(/💜/)).toBeVisible();
    await expect(page.getByRole("button", { name: "הצמדה" })).toBeVisible();

    await page.goto("/admin/forum");
    await expect(page.getByRole("heading", { name: "מדורים" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "הדיונים" })).toBeVisible();
    await expect(page.getByText("QA דיון של הצוות")).toBeVisible();

    // Section editing: rename + the ask button, seen in the forum, then restored.
    const talk = page.locator('[data-testid="section-row"]', { hasText: "דיונים קבוצתיים" });
    await talk.getByRole("button", { name: "עריכה" }).click();
    await talk.locator('input[name="ask_label"]').fill("QA שאלה לרוחמה");
    await talk.locator('input[name="description"]').fill("QA פירוט חדש");
    await talk.locator('textarea[name="rules"]').fill("QA כלל ראשון של המדור\nQA כלל שני");
    await talk.getByRole("button", { name: "שמירה" }).click();
    await expect(talk.getByRole("status")).toContainText("נשמר");
    await page.goto("/forum?section=talk");
    await expect(page.getByText("QA פירוט חדש")).toBeVisible();
    // The section's own house rules replace the general ones in the fold.
    await page.getByText("כללי הבית בדיונים קבוצתיים").click();
    await expect(page.getByText("QA כלל שני")).toBeVisible();
    await page.getByRole("button", { name: "QA שאלה לרוחמה" }).click();
    await page.fill('input[name="subject"]', "QA שאלה");
    await page.fill('textarea[name="body"]', "מתי המפגש הבא?");
    await page.getByRole("button", { name: "שולחת", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("השאלה נשלחה");

    await page.goto("/admin/forum");
    await page.getByRole("button", { name: "+ מדור חדש" }).click();
    await page.locator('form [name="name"]').last().fill("QA מדור");
    await page.getByRole("button", { name: "הוספה" }).click();
    await expect(page.getByText("המדור נוסף.")).toBeVisible();

    // The team deletes any thread – here a member's (seeded) one.
    const row = page.locator('[data-testid="thread-row"]', { hasText: "QA דיון פתוח" });
    await expect(row).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await row.getByRole("button", { name: "מחיקה" }).click();
    await expect(page.locator('[data-testid="thread-row"]', { hasText: "QA דיון פתוח" })).toHaveCount(0);
  });

  test("forum: a section's own wording for its «דיון חדש» button", async ({ page }) => {
    await page.goto("/admin/forum");
    const help = page.locator('[data-testid="section-row"]', { hasText: "עזרה הדדית" });
    await help.getByRole("button", { name: "עריכה" }).click();
    await help.locator('input[name="new_label"]').fill("QA אני רוצה לשאול…");
    await help.getByRole("button", { name: "שמירה" }).click();
    await expect(help.getByRole("status")).toContainText("נשמר");
    await expect(help.getByText("דיון חדש: «QA אני רוצה לשאול…»")).toBeVisible();

    await page.goto("/forum?section=help");
    await expect(page.getByRole("button", { name: "דיון חדש" })).toHaveCount(0);
    await page.getByRole("button", { name: "QA אני רוצה לשאול…" }).click();
    await expect(page.locator("#composer").getByRole("heading", { name: "דיון חדש בעזרה הדדית" })).toBeVisible();
    await page.goto("/forum");
    await expect(page.getByRole("button", { name: "QA אני רוצה לשאול…" })).toHaveCount(0);

    await page.goto("/admin/forum");
    const again = page.locator('[data-testid="section-row"]', { hasText: "עזרה הדדית" });
    await again.getByRole("button", { name: "עריכה" }).click();
    await again.locator('input[name="new_label"]').fill("");
    await again.getByRole("button", { name: "שמירה" }).click();
    await expect(again.getByRole("status")).toContainText("נשמר");
  });

  test("forum: the daily digest card – switch, last run, a sample to me", async ({ page }) => {
    await page.goto("/admin/forum");
    const card = page.getByTestId("digest-card");
    await expect(card.getByRole("heading", { name: "הסיכום היומי במייל" })).toBeVisible();
    await expect(card.getByText("12:30")).toBeVisible();
    const sw = card.getByRole("checkbox", { name: "הסיכום היומי פעיל" });
    await expect(sw).toBeChecked();
    await Promise.all([page.waitForResponse((r) => r.request().method() === "POST" && r.ok()), sw.uncheck()]);
    await page.reload();
    await expect(card.getByRole("checkbox", { name: "הסיכום היומי פעיל" })).not.toBeChecked();
    await Promise.all([page.waitForResponse((r) => r.request().method() === "POST" && r.ok()), card.getByRole("checkbox", { name: "הסיכום היומי פעיל" }).check()]);
    await page.reload();
    await expect(card.getByRole("checkbox", { name: "הסיכום היומי פעיל" })).toBeChecked();
    // On staging the admin address is outside the allowlist, so the sample is blocked; the button still reports honestly.
    await card.getByRole("button", { name: /שליחת דוגמה אליי/ }).click();
    await expect(card.getByText(/^(נשלחה דוגמה|לא נשלח)/)).toBeVisible({ timeout: 20_000 });
  });

  test("ads: upload one, see it in the list, hide it, delete it", async ({ page }) => {
    await page.goto("/admin/ads");
    await expect(page.getByRole("heading", { name: "פרסומות", exact: true })).toBeVisible();
    await expect(page.getByText("300 פיקסלים").first()).toBeVisible();
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
    await page.locator('input[name="name"]').fill("QA פרסומת 2");
    await page.locator('input[name="image"]').setInputFiles({ name: "qa2.png", mimeType: "image/png", buffer: png });
    await page.locator('input[name="link_url"]').fill("https://example.com/qa2");
    await page.getByRole("button", { name: "העלאה" }).click();
    await expect(page.getByRole("status")).toContainText("הפרסומת הועלתה");
    const row = page.locator('[data-testid="ad-row"]', { hasText: "QA פרסומת 2" });
    await expect(row).toBeVisible();
    await expect(row.getByRole("img", { name: "QA פרסומת 2" })).toBeVisible();
    await expect(row.getByText("0 לחיצות")).toBeVisible();
    await Promise.all([page.waitForResponse((r) => r.request().method() === "POST" && r.ok()), row.getByRole("checkbox", { name: "מוצגת לחברות" }).uncheck()]);
    await page.reload();
    await expect(page.locator('[data-testid="ad-row"]', { hasText: "QA פרסומת 2" }).getByRole("checkbox", { name: "מוצגת לחברות" })).not.toBeChecked();
    page.once("dialog", (d) => d.accept());
    await page.locator('[data-testid="ad-row"]', { hasText: "QA פרסומת 2" }).getByRole("button", { name: "מחיקה" }).click();
    await expect(page.locator('[data-testid="ad-row"]', { hasText: "QA פרסומת 2" })).toHaveCount(0);
    // The seed's own ad is still there, still active.
    await expect(page.locator('[data-testid="ad-row"]', { hasText: "QA פרסומת" }).first()).toBeVisible();
  });

  test("inbox: the team sees the requests, marks one handled, filters", async ({ page }) => {
    await page.goto("/admin/inbox");
    await expect(page.getByRole("heading", { name: "פניות" })).toBeVisible();
    // "QA תקלה" comes from the member spec's floating-button test; "QA שאלה" from the forum test above.
    const card = page.locator("article", { hasText: "QA תקלה" }).first();
    await expect(card).toBeVisible();
    await expect(card.getByText("דיווח על תקלה")).toBeVisible();
    await expect(page.locator("article", { hasText: "QA שאלה" }).first()).toContainText("שאלה לצוות");
    await card.getByRole("button", { name: "סימון כטופל" }).click();
    await expect(card.getByText(/טופל/)).toBeVisible();
    await page.goto("/admin/inbox?status=handled");
    await expect(page.locator("article", { hasText: "QA תקלה" })).toBeVisible();
    await page.goto("/admin/inbox?status=new&kind=topic");
    await expect(page.locator("article").first()).toContainText("בקשה לנושא");
  });

  test("millionaire: proposals table", async ({ page }) => {
    await page.goto("/admin/millionaire");
    await expect(page.getByRole("heading", { name: /המיליונרית/ })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "מציעה" })).toBeVisible();
  });

  test("birthday: calendar of 12 months + edit", async ({ page }) => {
    await page.goto("/admin/birthday");
    await expect(page.getByRole("heading", { name: /לוח השנה/ })).toBeVisible();
    for (const m of ["תשרי", "חשון", "אלול"]) await expect(page.getByText(new RegExp(`^${m}`)).first()).toBeVisible();
    await page.getByRole("link", { name: "עריכת מסיבת טבת" }).click();
    await expect(page.getByRole("heading", { name: /מסיבת טבת/ })).toBeVisible();
    await page.fill('[name="topic"]', "QA נושא");
    const creating = await page.getByRole("button", { name: "יצירת המסיבה" }).isVisible();
    await page.getByRole("button", { name: creating ? "יצירת המסיבה" : "שמירה" }).click();
    if (creating) {
      await expect(page).toHaveURL(/\/admin\/birthday$/);
      await expect(page.getByText("נושא: QA נושא")).toBeVisible();
    } else {
      await expect(page.getByRole("status")).toContainText("נשמר");
    }
  });

  test("events: create a general event and see its registrants page", async ({ page }) => {
    await page.goto("/admin/events");
    await expect(page.getByRole("heading", { name: "מפגשים והרשמות" })).toBeVisible();
    await page.getByRole("link", { name: "+ מפגש חדש" }).click();
    await page.fill('[name="title"]', "QA מפגש בדיקה");
    await page.fill('[name="event_date"]', "2027-01-20");
    await page.fill('[name="location"]', "QA מקום");
    await page.getByRole("button", { name: "יצירת המפגש" }).click();
    await expect(page).toHaveURL(/\/admin\/events\/[0-9a-f-]+/);
    await expect(page.getByRole("heading", { name: /נרשמות/ })).toBeVisible();
    const r = await page.request.get(page.url().replace("/admin/events/", "/admin/export/registrations/"));
    expect(r.status()).toBe(200);
  });

  test("site content: edit the home title, see it live, reset it", async ({ page }) => {
    await page.goto("/admin/content");
    await expect(page.getByRole("heading", { name: "תוכן האתר" })).toBeVisible();
    await page.getByRole("button", { name: /^תפריט ראשי/ }).click();
    const field = page.locator('[name="v:home.title"]');
    await field.fill("QA כותרת חדשה לבית");
    await page.locator("form").filter({ has: field }).getByRole("button", { name: "שמירת הקבוצה" }).click();
    await expect(page.getByRole("status")).toContainText("נשמר");
    await page.goto("/home");
    await expect(page.getByRole("heading", { name: "QA כותרת חדשה לבית" })).toBeVisible();

    await page.goto("/admin/content");
    await page.getByRole("button", { name: /^תפריט ראשי/ }).click();
    await page.locator('[name="reset:home.title"]').check();
    await page.locator("form").filter({ has: page.locator('[name="v:home.title"]') }).getByRole("button", { name: "שמירת הקבוצה" }).click();
    await expect(page.getByRole("status")).toContainText("נשמר");
    await page.goto("/home");
    await expect(page.getByRole("heading", { name: "איזו המעטפָאן את פותחת היום?" })).toBeVisible();
  });

  test("site content: form labels are editable too – search, edit, see it on the login screen, reset", async ({ page, browser }) => {
    await page.goto("/admin/content");
    await page.getByLabel("חיפוש טקסט").fill("field.email");
    await expect(page.getByText(/1 מתוך \d+ טקסטים/)).toBeVisible();
    const field = page.locator('[name="v:field.email"]');
    await expect(field).toBeVisible();
    await field.fill("QA כתובת מייל");
    await page.locator("form").filter({ has: field }).getByRole("button", { name: "שמירת השדות שמוצגים" }).click();
    await expect(page.getByRole("status")).toContainText("נשמר");

    // browser.newContext() inherits the admin storageState from test.use – start signed out explicitly.
    const anon = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const login = await anon.newPage();
    await login.goto("/login");
    await expect(login.getByText("QA כתובת מייל")).toBeVisible();
    await anon.close();
    await page.goto("/profile");
    await expect(page.getByText("QA כתובת מייל")).toBeVisible();

    await page.goto("/admin/content");
    await page.getByLabel("חיפוש טקסט").fill("field.email");
    await page.locator('[name="reset:field.email"]').check();
    await page.locator("form").filter({ has: page.locator('[name="v:field.email"]') }).getByRole("button", { name: "שמירת השדות שמוצגים" }).click();
    await expect(page.getByRole("status")).toContainText("נשמר");
    await page.goto("/profile");
    await expect(page.getByText("QA כתובת מייל")).toHaveCount(0);
  });

  test("site content: the auth e-mail group saves and reports the push to the auth provider", async ({ page }) => {
    await page.goto("/admin/content");
    await page.getByRole("button", { name: /^מיילי אימות וסיסמה/ }).click();
    const field = page.locator('[name="v:authmail.confirm.intro"]');
    await expect(field).toBeVisible();
    await field.fill("QA עוד צעד אחד קטן");
    await page.locator("form").filter({ has: field }).getByRole("button", { name: "שמירת הקבוצה" }).click();
    // With SUPABASE_ACCESS_TOKEN on the project: "מיילי האימות עודכנו". Without it the text is saved and the push failure is reported.
    const note = page.locator('p[role="status"], p[role="alert"]').first();
    await expect(note).toContainText("נשמר");
    const pushed = (await note.textContent())?.includes("מיילי האימות עודכנו") ?? false;
    test.info().annotations.push({ type: "auth-templates-pushed", description: String(pushed) });

    await page.goto("/admin/content");
    await page.getByRole("button", { name: /^מיילי אימות וסיסמה/ }).click();
    await page.locator('[name="reset:authmail.confirm.intro"]').check();
    await page.locator("form").filter({ has: page.locator('[name="v:authmail.confirm.intro"]') }).getByRole("button", { name: "שמירת הקבוצה" }).click();
    await expect(page.locator('p[role="status"], p[role="alert"]').first()).toContainText("נשמר");
  });
});
