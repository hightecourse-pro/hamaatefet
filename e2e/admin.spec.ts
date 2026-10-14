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

  test("forum: sections toggle, moderation queue", async ({ page }) => {
    await page.goto("/admin/forum");
    await expect(page.getByRole("heading", { name: "מדורים" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "פוסטים לבדיקה" })).toBeVisible();
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
    for (const m of ["תשרי", "חשון", "אלול"]) await expect(page.getByText(m, { exact: true }).first()).toBeVisible();
    await page.getByRole("link", { name: "עריכת מסיבת טבת" }).click();
    await expect(page.getByRole("heading", { name: /מסיבת טבת/ })).toBeVisible();
    await page.fill('[name="topic"]', "QA נושא");
    await page.getByRole("button", { name: /יצירת המסיבה|שמירה/ }).click();
    await expect(page.getByRole("status")).toContainText("נשמר");
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
});
