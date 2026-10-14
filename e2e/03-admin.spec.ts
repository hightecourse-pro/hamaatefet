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

  test("forum: the team opens a rich discussion from the forum, manages sections", async ({ page }) => {
    await page.goto("/forum");
    const composer = page.locator("#composer");
    await expect(composer).toBeVisible();
    await composer.locator('[name="section"]').selectOption({ label: "תכנים" });
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
    await expect(composer.getByRole("status")).toContainText("פורסם");
    const card = page.locator("article", { hasText: "QA דיון של הצוות" });
    await expect(card).toBeVisible();
    await expect(card.locator("b, strong", { hasText: "טקסט מודגש" })).toBeVisible();
    await expect(card.getByText(/💜/)).toBeVisible();

    await page.goto("/admin/forum");
    await expect(page.getByRole("heading", { name: "מדורים" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "הדיונים" })).toBeVisible();
    await expect(page.getByText("QA דיון של הצוות")).toBeVisible();
    await page.getByRole("button", { name: "+ מדור חדש" }).click();
    await page.fill('[name="name"]', "QA מדור");
    await page.getByRole("button", { name: "הוספה" }).click();
    await expect(page.getByText("המדור נוסף.")).toBeVisible();
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
});
