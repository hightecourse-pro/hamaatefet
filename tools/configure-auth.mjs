// node tools/configure-auth.mjs <staging|prod> <site-url>
// Sets the Supabase Auth config of one environment: site URL + redirect allow-list,
// custom SMTP through Resend (sender "חד או פאן"), Hebrew email templates that
// link to OUR /auth/confirm (works from any device), password rules.
import { supa, refFor, ENV } from "./deploy-helpers.mjs";

const [env, siteUrlArg] = process.argv.slice(2);
if (!env || !siteUrlArg) {
  console.log("usage: node tools/configure-auth.mjs <staging|prod> <https://site-url>");
  process.exit(1);
}
const ref = refFor(env);
const SITE = siteUrlArg.replace(/\/$/, "");
const FROM_EMAIL = ENV.EMAIL_FROM_ADDRESS || "noreply@opencode.org.il";
const SENDER_NAME = ENV.EMAIL_SENDER_NAME || "חד או פאן";

const C = { plum: "#4A1942", crimson: "#A3304A", burgundy: "#6E0F1A", ground: "#FFF8F2", text: "#3A1530", muted: "#6A4558", line: "#F0E2D8", cream: "#FFF3EA" };

function layout(title, intro, paragraphs, ctaLabel, ctaUrl, footnote) {
  const ps = paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:17px;line-height:1.7;color:${C.text};">${p}</p>`).join("");
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:${C.ground};font-family:'Fredoka','Segoe UI',Arial,sans-serif;color:${C.text};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.ground};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:2px solid ${C.line};border-radius:28px;">
<tr><td style="padding:34px 30px;" dir="rtl">
<img src="${SITE}/brand/logo.png" alt="המעטפת" width="180" style="display:block;margin:0 auto 18px;height:auto;">
<h1 style="margin:0 0 10px;font-size:26px;line-height:1.3;color:${C.plum};text-align:right;">${title}</h1>
${intro ? `<p style="margin:0 0 18px;font-size:16px;color:${C.crimson};">${intro}</p>` : ""}
${ps}
<p style="margin:26px 0 8px;text-align:center;"><a href="${ctaUrl}" style="display:inline-block;background:${C.burgundy};color:${C.cream};text-decoration:none;font-weight:700;font-size:18px;padding:14px 30px;border-radius:16px;">${ctaLabel}</a></p>
<p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${C.muted};word-break:break-all;">אם הכפתור לא עובד, אפשר להעתיק את הקישור: <span dir="ltr">${ctaUrl}</span></p>
${footnote ? `<p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:${C.muted};">${footnote}</p>` : ""}
</td></tr></table>
<p style="margin:18px 0 0;font-size:13px;color:${C.muted};">המעטפת · מבית חד או פאן</p>
</td></tr></table></body></html>`;
}

const link = (type, next) => `${SITE}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}&next=${encodeURIComponent(next)}`;

const confirmation = layout(
  "היי {{ .Data.first_name }}, המעטפה בדרך!",
  "עוד צעד אחד קטן",
  ["כדי לאמת את כתובת המייל שלך, לחצי על הכפתור. אחרי האימות צוות המעטפת יאשר את ההצטרפות ותקבלי הודעה."],
  "מאמתת את המייל",
  link("signup", "/pending"),
  "לא נרשמת למעטפת? אפשר פשוט להתעלם מהמייל הזה."
);
const recovery = layout(
  "קורה לטובות ביותר",
  "בחירת סיסמה חדשה",
  ["לחצי על הכפתור כדי לבחור סיסמה חדשה. הקישור תקף לשעה."],
  "לבחירת סיסמה חדשה",
  link("recovery", "/reset-password"),
  "לא ביקשת לאפס סיסמה? אפשר להתעלם מהמייל הזה – הסיסמה שלך לא השתנתה."
);
const invite = layout(
  "מוזמנת למעטפת!",
  "צוות המעטפת פתח לך את הדלת",
  ["צוות המעטפת הוסיף אותך לקהילה. לחצי על הכפתור כדי לבחור סיסמה ולהשלים כמה פרטים קטנים."],
  "פותחת את המעטפה",
  link("invite", "/welcome"),
  ""
);
const emailChange = layout(
  "אישור כתובת מייל חדשה",
  "",
  ["ביקשת לשנות את כתובת המייל שלך במעטפת ל-<span dir=\"ltr\">{{ .NewEmail }}</span>. לחצי על הכפתור לאישור."],
  "מאשרת את השינוי",
  link("email_change", "/profile"),
  "לא ביקשת לשנות את המייל? השיבי למייל הזה ונבדוק."
);
const magic = layout(
  "קישור כניסה למעטפת",
  "",
  ["לחצי על הכפתור כדי להיכנס. הקישור תקף לשעה."],
  "פותחת את המעטפה",
  link("magiclink", "/home"),
  ""
);

const body = {
  site_url: SITE,
  uri_allow_list: [`${SITE}/**`, "http://localhost:3000/**"].join(","),
  external_email_enabled: true,
  mailer_autoconfirm: false,
  mailer_secure_email_change_enabled: true,
  mailer_otp_exp: 3600,
  password_min_length: 8,
  security_update_password_require_reauthentication: false,
  smtp_admin_email: FROM_EMAIL,
  smtp_host: "smtp.resend.com",
  smtp_port: "465",
  smtp_user: "resend",
  smtp_pass: ENV.RESEND_API_KEY,
  smtp_sender_name: SENDER_NAME,
  smtp_max_frequency: 60,
  rate_limit_email_sent: 60,
  mailer_subjects_confirmation: "המעטפה בדרך – אימות המייל שלך",
  mailer_templates_confirmation_content: confirmation,
  mailer_subjects_recovery: "בחירת סיסמה חדשה למעטפת",
  mailer_templates_recovery_content: recovery,
  mailer_subjects_invite: "מוזמנת למעטפת!",
  mailer_templates_invite_content: invite,
  mailer_subjects_email_change: "אישור כתובת המייל החדשה שלך",
  mailer_templates_email_change_content: emailChange,
  mailer_subjects_magic_link: "קישור כניסה למעטפת",
  mailer_templates_magic_link_content: magic,
};

const r = await supa(`/v1/projects/${ref}/config/auth`, { method: "PATCH", body: JSON.stringify(body) });
if (!r.ok) {
  console.log("FAILED", r.status, r.text.replace(ENV.RESEND_API_KEY, "***").slice(0, 600));
  process.exit(1);
}
const j = r.json;
console.log(env, "auth configured:", { site_url: j.site_url, smtp_host: j.smtp_host, smtp_sender_name: j.smtp_sender_name, autoconfirm: j.mailer_autoconfirm, otp_exp: j.mailer_otp_exp });
