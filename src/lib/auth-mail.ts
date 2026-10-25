// The e-mails Supabase Auth sends (verification, new password, invite, e-mail
// change). Their wording lives in the content registry; saving the "auth_emails"
// group pushes the rendered templates to the project through the Management API.
import type { Content } from "@/lib/content";

const C = { plum: "#4A1942", crimson: "#A3304A", burgundy: "#6E0F1A", ground: "#FFF8F2", text: "#3A1530", muted: "#6A4558", line: "#F0E2D8", cream: "#FFF3EA" };

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function layout(site: string, footer: string, linkHelp: string, title: string, intro: string, paragraphs: string[], cta: string, url: string, footnote: string): string {
  const ps = paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:17px;line-height:1.7;color:${C.text};">${p}</p>`).join("");
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:${C.ground};font-family:'Fredoka','Segoe UI',Arial,sans-serif;color:${C.text};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.ground};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:2px solid ${C.line};border-radius:28px;">
<tr><td style="padding:34px 30px;" dir="rtl">
<img src="${site}/brand/logo.png" alt="המעטפת" width="180" style="display:block;margin:0 auto 18px;height:auto;">
<h1 style="margin:0 0 10px;font-size:26px;line-height:1.3;color:${C.plum};text-align:right;">${title}</h1>
${intro ? `<p style="margin:0 0 18px;font-size:16px;color:${C.crimson};">${intro}</p>` : ""}
${ps}
<p style="margin:26px 0 8px;text-align:center;"><a href="${url}" style="display:inline-block;background:${C.burgundy};color:${C.cream};text-decoration:none;font-weight:700;font-size:18px;padding:14px 30px;border-radius:16px;">${cta}</a></p>
<p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${C.muted};word-break:break-all;">${linkHelp} <span dir="ltr">${url}</span></p>
${footnote ? `<p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:${C.muted};">${footnote}</p>` : ""}
</td></tr></table>
<p style="margin:18px 0 0;font-size:13px;color:${C.muted};">${footer}</p>
</td></tr></table></body></html>`;
}

/** Supabase template variables are Go templates; the content placeholders map onto them. */
const VARS = { שם: "{{ .Data.first_name }}", מייל: "{{ .NewEmail }}" };

export function buildAuthTemplates(c: Content, siteUrl: string): Record<string, string> {
  const site = siteUrl.replace(/\/$/, "");
  const link = (type: string, next: string) => `${site}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}&next=${encodeURIComponent(next)}`;
  const footer = esc(c.get("email.footer"));
  const help = esc(c.get("authmail.link_help"));
  const mail = (k: string, type: string, next: string) =>
    layout(site, footer, help, esc(c.get(`authmail.${k}.title`, VARS)), esc(c.get(`authmail.${k}.intro`)), c.lines(`authmail.${k}.text`, VARS).map(esc), esc(c.get(`authmail.${k}.cta`)), link(type, next), esc(c.get(`authmail.${k}.footnote`)));
  return {
    mailer_subjects_confirmation: c.get("authmail.confirm.subject"),
    mailer_templates_confirmation_content: mail("confirm", "signup", "/pending"),
    mailer_subjects_recovery: c.get("authmail.recovery.subject"),
    mailer_templates_recovery_content: mail("recovery", "recovery", "/reset-password"),
    mailer_subjects_invite: c.get("authmail.invite.subject"),
    mailer_templates_invite_content: mail("invite", "invite", "/welcome"),
    mailer_subjects_email_change: c.get("authmail.change.subject"),
    mailer_templates_email_change_content: mail("change", "email_change", "/profile"),
  };
}

/**
 * Push the templates to this environment's Supabase project. Needs
 * SUPABASE_ACCESS_TOKEN (an org-scoped management token) in the environment;
 * the project ref comes from NEXT_PUBLIC_SUPABASE_URL.
 */
export async function pushAuthTemplates(c: Content, siteUrl: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").match(/https:\/\/([a-z]{20})\.supabase\.co/)?.[1];
  if (!token || !ref) return { ok: false, error: "management_not_configured" };
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(buildAuthTemplates(c, siteUrl)),
  });
  if (!res.ok) return { ok: false, error: `supabase_${res.status}: ${(await res.text()).slice(0, 120)}` };
  return { ok: true };
}
