// App emails (approval notice, team alerts, reminders) through the Resend HTTP
// API. For now they go out through קוד פתוח's Resend account and sending
// domain, with the display name "חד או פאן" (the owner, 14/10). Server-only.
// Every word comes from the content registry ("מיילים מהמערכת" in the admin).
import { isProductionEnv } from "@/lib/env";
import type { Content } from "@/lib/content";

const FROM = process.env.EMAIL_FROM || "חד או פאן <noreply@opencode.org.il>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || "";

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/** Outside production, mail may only reach addresses on EMAIL_ALLOWLIST (comma-separated). */
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
  const body: Record<string, unknown> = { from: FROM, to: [args.to], subject: gate.subjectPrefix + args.subject, html: args.html };
  if (REPLY_TO) body.reply_to = REPLY_TO;
  try {
    const post = () => fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify(body) });
    let res = await post();
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1200));
      res = await post();
    }
    if (!res.ok) return { ok: false, error: `resend_${res.status}: ${(await res.text()).slice(0, 140)}` };
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

const C = { plum: "#4A1942", crimson: "#A3304A", burgundy: "#6E0F1A", ground: "#FFF8F2", text: "#3A1530", muted: "#6A4558", line: "#F0E2D8", cream: "#FFF3EA" };

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface BuiltEmail {
  subject: string;
  html: string;
}

export function layoutEmail(opts: { footer: string; title: string; intro?: string; paragraphs: string[]; cta?: { label: string; url: string }; footnote?: string }): string {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const logo = siteUrl ? `<img src="${siteUrl}/brand/logo.png" alt="המעטפת" width="180" style="display:block;margin:0 auto 18px;height:auto;">` : "";
  const cta = opts.cta ? `<p style="margin:26px 0 8px;text-align:center;"><a href="${opts.cta.url}" style="display:inline-block;background:${C.burgundy};color:${C.cream};text-decoration:none;font-weight:700;font-size:18px;padding:14px 30px;border-radius:16px;">${esc(opts.cta.label)}</a></p>` : "";
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
<p style="margin:18px 0 0;font-size:13px;color:${C.muted};">${esc(opts.footer)}</p>
</td></tr></table></body></html>`;
}

export function approvedEmail(c: Content, firstName: string, siteUrl: string): BuiltEmail {
  const v = { שם: firstName || "" };
  return {
    subject: c.get("email.approved.subject", v),
    html: layoutEmail({ footer: c.get("email.footer"), title: c.get("email.approved.title", v), intro: c.get("email.approved.intro", v), paragraphs: c.lines("email.approved.text", v).map(esc), cta: { label: c.get("email.approved.cta"), url: `${siteUrl}/login` } }),
  };
}

export function pausedEmail(c: Content, firstName: string): BuiltEmail {
  const v = { שם: firstName || "" };
  return {
    subject: c.get("email.paused.subject", v),
    html: layoutEmail({ footer: c.get("email.footer"), title: c.get("email.paused.title", v), paragraphs: c.lines("email.paused.text", v).map(esc) }),
  };
}

export function newMemberAlertEmail(c: Content, member: { name: string; email: string; phone: string; birthMonth: string }, adminUrl: string): BuiltEmail {
  const v = { שם: member.name };
  return {
    subject: c.get("email.newmember.subject", v),
    html: layoutEmail({
      footer: c.get("email.footer"),
      title: c.get("email.newmember.title", v),
      paragraphs: [`<b>${esc(c.get("email.newmember.text", v))}</b>`, `${esc(c.get("field.email"))}: <span dir="ltr">${esc(member.email)}</span><br>${esc(c.get("field.phone"))}: <span dir="ltr">${esc(member.phone)}</span><br>${esc(c.get("field.birth_month"))}: ${esc(member.birthMonth)}`],
      cta: { label: c.get("email.newmember.cta"), url: adminUrl },
    }),
  };
}

export function proposalAlertEmail(c: Content, p: { name: string; kind: string; title: string; month: string }, adminUrl: string): BuiltEmail {
  const v = { שם: p.name, כותרת: p.title, סוג: p.kind, חודש: p.month || c.get("mill.form.flexible") };
  return {
    subject: c.get("email.proposal.subject", v),
    html: layoutEmail({ footer: c.get("email.footer"), title: c.get("email.proposal.title", v), paragraphs: [esc(c.get("email.proposal.text", v)), esc(c.get("email.proposal.month", v))], cta: { label: c.get("email.proposal.cta"), url: adminUrl } }),
  };
}

export function birthdayReminderEmail(c: Content, firstName: string, monthName: string, when: string, where: string, siteUrl: string): BuiltEmail {
  const v = { שם: firstName || "", חודש: monthName, מתי: when, איפה: where ? `, ${where}` : "" };
  return {
    subject: c.get("email.reminder.subject", v),
    html: layoutEmail({
      footer: c.get("email.footer"),
      title: c.get("email.reminder.title", v),
      intro: c.get("email.reminder.intro", v),
      paragraphs: [esc(c.get("email.reminder.text1", v)), esc(c.get("email.reminder.text2", v))],
      cta: { label: c.get("email.reminder.cta"), url: `${siteUrl}/birthday` },
      footnote: `${esc(c.get("email.reminder.footnote", v))} <a href="${siteUrl}/profile" style="color:${C.crimson};">${esc(c.get("profile.title"))}</a>`,
    }),
  };
}
