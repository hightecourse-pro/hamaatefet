// App emails (approval notice, team alerts, reminders) through the Resend HTTP
// API. For now they go out through קוד פתוח's Resend account and sending
// domain, with the display name "חד או פאן" (the owner, 14/10). Server-only.
//
// Auth emails (verification, password reset, invite) are sent by Supabase Auth
// through the same Resend account as custom SMTP – see tools/configure-auth.mjs.
import { isProductionEnv } from "@/lib/env";

const FROM = process.env.EMAIL_FROM || "חד או פאן <noreply@opencode.org.il>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || "";

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Outside production, mail may only reach addresses on EMAIL_ALLOWLIST
 * (comma-separated). A staging test must never land in a real inbox.
 */
export function emailGate(to: string): { ok: true; subjectPrefix: string } | { ok: false; error: string } {
  if (isProductionEnv()) return { ok: true, subjectPrefix: "" };
  const allow = (process.env.EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
  const addr = to.trim().toLowerCase();
  const allowed = allow.some((a) => (a.startsWith("@") ? addr.endsWith(a) : addr === a));
  if (!allowed) {
    console.log(`[email] blocked outside production (not on allowlist): ${to}`);
    return { ok: false, error: "blocked_by_allowlist" };
  }
  return { ok: true, subjectPrefix: "[STAGING] " };
}

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendEmail(args: { to: string; subject: string; html: string }): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "email_not_configured" };
  const gate = emailGate(args.to);
  if (!gate.ok) return { ok: false, error: gate.error };
  const body: Record<string, unknown> = {
    from: FROM,
    to: [args.to],
    subject: gate.subjectPrefix + args.subject,
    html: args.html,
  };
  if (REPLY_TO) body.reply_to = REPLY_TO;
  try {
    const post = () =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    let res = await post();
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1200));
      res = await post();
    }
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `resend_${res.status}: ${text.slice(0, 140)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send_failed" };
  }
}

/** Send to several addresses, one request each, paced under Resend's 2 req/s. */
export async function sendEmailToMany(to: string[], subject: string, html: string): Promise<SendResult[]> {
  const out: SendResult[] = [];
  for (const addr of to) {
    out.push(await sendEmail({ to: addr, subject, html }));
    await new Promise((r) => setTimeout(r, 550));
  }
  return out;
}

// ───────────────────────── templates ─────────────────────────

const C = {
  plum: "#4A1942",
  crimson: "#A3304A",
  burgundy: "#6E0F1A",
  orange: "#E8894A",
  ground: "#FFF8F2",
  text: "#3A1530",
  muted: "#6A4558",
  line: "#F0E2D8",
  cream: "#FFF3EA",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface BuiltEmail {
  subject: string;
  html: string;
}

export function layoutEmail(opts: { title: string; intro?: string; paragraphs: string[]; cta?: { label: string; url: string }; footnote?: string }): string {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const logo = siteUrl ? `<img src="${siteUrl}/brand/logo.png" alt="המעטפת" width="180" style="display:block;margin:0 auto 18px;height:auto;">` : "";
  const cta = opts.cta
    ? `<p style="margin:26px 0 8px;text-align:center;"><a href="${opts.cta.url}" style="display:inline-block;background:${C.burgundy};color:${C.cream};text-decoration:none;font-weight:700;font-size:18px;padding:14px 30px;border-radius:16px;">${esc(opts.cta.label)}</a></p>`
    : "";
  const paragraphs = opts.paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:17px;line-height:1.7;color:${C.text};">${p}</p>`).join("");
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:${C.ground};font-family:'Fredoka','Segoe UI',Arial,sans-serif;color:${C.text};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.ground};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:2px solid ${C.line};border-radius:28px;">
<tr><td style="padding:34px 30px;" dir="rtl">
${logo}
<h1 style="margin:0 0 10px;font-size:26px;line-height:1.3;color:${C.plum};text-align:right;">${esc(opts.title)}</h1>
${opts.intro ? `<p style="margin:0 0 18px;font-size:16px;color:${C.crimson};">${esc(opts.intro)}</p>` : ""}
${paragraphs}
${cta}
${opts.footnote ? `<p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:${C.muted};">${opts.footnote}</p>` : ""}
</td></tr></table>
<p style="margin:18px 0 0;font-size:13px;color:${C.muted};">המעטפת · מבית חד או פאן</p>
</td></tr></table></body></html>`;
}

export function approvedEmail(firstName: string, siteUrl: string): BuiltEmail {
  return {
    subject: "המעטפה נפתחה – ההצטרפות שלך למעטפת אושרה",
    html: layoutEmail({
      title: `היי ${firstName || ""}, את בפנים!`,
      intro: "כל המעטפָאן מחכה לך",
      paragraphs: ["צוות המעטפת אישר את ההצטרפות שלך. מעכשיו הפורום, המיליונרית וחוגגות חודש טוב פתוחים בשבילך."],
      cta: { label: "פותחת את המעטפה", url: `${siteUrl}/login` },
    }),
  };
}

export function pausedEmail(firstName: string): BuiltEmail {
  return {
    subject: "החשבון שלך במעטפת הושהה",
    html: layoutEmail({
      title: `היי ${firstName || ""},`,
      paragraphs: ["החשבון שלך במעטפת הושהה על ידי הצוות. אם זו טעות או שיש שאלה, פשוט השיבי למייל הזה ונחזור אלייך."],
    }),
  };
}

export function newMemberAlertEmail(member: { name: string; email: string; phone: string; birthMonth: string }, adminUrl: string): BuiltEmail {
  return {
    subject: `בקשת הצטרפות חדשה למעטפת – ${member.name}`,
    html: layoutEmail({
      title: "מישהי דופקת על המעטפה",
      paragraphs: [
        `<b>${esc(member.name)}</b> ביקשה להצטרף למעטפת.`,
        `מייל: <span dir="ltr">${esc(member.email)}</span><br>טלפון: <span dir="ltr">${esc(member.phone)}</span><br>חודש לידה: ${esc(member.birthMonth)}`,
      ],
      cta: { label: "לאישור בממשק הניהול", url: adminUrl },
    }),
  };
}

export function proposalAlertEmail(p: { name: string; kind: string; title: string; month: string }, adminUrl: string): BuiltEmail {
  return {
    subject: `צ׳ק חדש במיליונרית – ${p.title}`,
    html: layoutEmail({
      title: "צ׳ק חדש ממתין לחתימה",
      paragraphs: [`<b>${esc(p.name)}</b> הציעה לארח: <b>${esc(p.title)}</b> (${esc(p.kind)}).`, `מועד מועדף: ${esc(p.month || "גמיש")}.`],
      cta: { label: "לצפייה בהצעות", url: adminUrl },
    }),
  };
}

export function birthdayReminderEmail(firstName: string, monthName: string, when: string, where: string, siteUrl: string): BuiltEmail {
  return {
    subject: `המסיבה שלך מתקרבת – חוגגות ${monthName}`,
    html: layoutEmail({
      title: `היי ${firstName || ""}, את מבעלות השמחה!`,
      intro: "חוגגות חודש טוב",
      paragraphs: [`מסיבת ${esc(monthName)} מתקרבת: ${esc(when)}${where ? `, ${esc(where)}` : ""}.`, "בעלות השמחה בוחרות יחד את נושא הערב – נשמח שתהיי בצוות הנושא."],
      cta: { label: "לפרטי המפגש", url: `${siteUrl}/birthday` },
      footnote: `לא רוצה תזכורות? אפשר לכבות אותן ב<a href="${siteUrl}/profile" style="color:${C.crimson};">החשבון שלי</a>.`,
    }),
  };
}
