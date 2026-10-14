import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { birthdayReminderEmail, sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/site";
import { hebrewDateLabel, monthName, timeRange } from "@/lib/hebrew";

/**
 * Daily (vercel.json): seven days before a birthday party, remind the women
 * born that month who opted in ("להזכיר לי במייל לפני המסיבה שלי").
 * Idempotent per event: reminders already sent are recorded in settings.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const target = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const iso = new Date(target.toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
  const dateStr = `${iso.getFullYear()}-${String(iso.getMonth() + 1).padStart(2, "0")}-${String(iso.getDate()).padStart(2, "0")}`;

  const { data: events } = await admin.from("events").select("*").eq("type", "birthday").eq("published", true).eq("event_date", dateStr);
  const report: { event: string; sent: number; blocked: number }[] = [];
  for (const ev of events ?? []) {
    if (!ev.hebrew_month) continue;
    const key = `reminder_sent:${ev.id}`;
    const { data: done } = await admin.from("settings").select("key").eq("key", key).maybeSingle();
    if (done) continue;
    const { data: hosts } = await admin.from("profiles").select("email, first_name").eq("status", "active").eq("birth_month", ev.hebrew_month).eq("remind_birthday", true);
    let sent = 0;
    let blocked = 0;
    for (const h of hosts ?? []) {
      const built = birthdayReminderEmail(h.first_name, monthName(ev.hebrew_month), `${hebrewDateLabel(ev.event_date)} ${timeRange(ev.start_time, ev.end_time)}`.trim(), ev.location, getSiteUrl());
      const r = await sendEmail({ to: h.email, subject: built.subject, html: built.html });
      if (r.ok) sent++;
      else blocked++;
      await new Promise((res) => setTimeout(res, 550));
    }
    await admin.from("settings").upsert({ key, value: { sent, blocked, at: new Date().toISOString() } });
    report.push({ event: ev.title, sent, blocked });
  }
  return NextResponse.json({ ok: true, date: dateStr, report });
}
