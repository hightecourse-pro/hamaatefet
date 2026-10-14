import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Every piece of copy on the site, with its default (the design's text).
 * The team overrides any of them from /admin/content; a row in site_content wins.
 * kind: text = one line · lines = several lines (rendered with <br>) · rich = sanitized HTML.
 */
export interface ContentField {
  key: string;
  label: string;
  kind: "text" | "lines" | "rich";
  default: string;
  hint?: string;
}
export interface ContentGroup {
  key: string;
  title: string;
  fields: ContentField[];
}

const t = (key: string, label: string, def: string, hint?: string): ContentField => ({ key, label, kind: "text", default: def, hint });
const l = (key: string, label: string, def: string, hint?: string): ContentField => ({ key, label, kind: "lines", default: def, hint });
const r = (key: string, label: string, def: string, hint?: string): ContentField => ({ key, label, kind: "rich", default: def, hint });

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    key: "general",
    title: "כללי",
    fields: [
      t("general.footer", "שורת הפוטר", "המעטפת · מבית חד או פאן"),
      t("general.brand", "שם המותג (כותרות, מיילים)", "המעטפת"),
      t("general.admin_pill", "כפתור הניהול בכותרת", "ניהול"),
    ],
  },
  {
    key: "auth",
    title: "כניסה והרשמה",
    fields: [
      t("auth.login.title", "כותרת כניסה", "היי, טוב שבאת!"),
      t("auth.login.subtitle", "שורת כתב-יד בכניסה", "כל המעטפָאן מחכה לך בפנים…"),
      t("auth.login.button", "כפתור כניסה", "פותחת את המעטפה"),
      t("auth.login.noaccount", "עוד לא חברה?", "עוד לא חברה?"),
      t("auth.signup.title", "כותרת הרשמה", "מצטרפת למעטפת"),
      t("auth.signup.subtitle", "שורת כתב-יד בהרשמה", "כמה פרטים קטנים ואת בפנים"),
      t("auth.signup.age", "אישור גיל", "אני מאשרת שאני בת 30 ומעלה"),
      t("auth.signup.terms", "אישור תקנון", "קראתי ואני מסכימה"),
      t("auth.signup.terms_link", "טקסט הקישור לתקנון", "לתקנון ולמדיניות הפרטיות"),
      t("auth.signup.button", "כפתור הרשמה", "שולחת בקשת הצטרפות"),
      t("auth.pending.title", "כותרת אחרי הרשמה", "המעטפה בדרך!"),
      l("auth.pending.text", "טקסט אחרי הרשמה", "שלחנו לך מייל לאימות הכתובת. אחרי האימות, צוות המעטפת יאשר את ההצטרפות ותקבלי הודעה."),
      t("auth.waiting.title", "כותרת מסך ההמתנה (אחרי אימות)", "המעטפה בדרך!"),
      l("auth.waiting.text", "טקסט מסך ההמתנה", "היי {שם}, המייל שלך אומת. עכשיו צוות המעטפת יאשר את ההצטרפות – ותקבלי הודעה למייל ברגע שזה קורה.", "{שם} מוחלף בשם הפרטי"),
      t("auth.paused.title", "כותרת חשבון מושהה", "המעטפה סגורה כרגע"),
      l("auth.paused.text", "טקסט חשבון מושהה", "החשבון שלך הושהה על ידי צוות המעטפת. אם זו טעות או שיש שאלה – כתבי לנו ונחזור אלייך."),
      t("auth.forgot.title", "כותרת שכחתי סיסמה", "קורה לטובות ביותר"),
      l("auth.forgot.text", "טקסט שכחתי סיסמה", "כתבי את המייל שלך ונשלח קישור לבחירת סיסמה חדשה."),
      t("auth.forgot.button", "כפתור שליחת קישור", "שלחו לי קישור"),
      t("auth.sent.title", "כותרת אחרי שליחת קישור", "בדקי את תיבת המייל"),
      l("auth.sent.text", "טקסט אחרי שליחת קישור", "הקישור תקף לשעה. לא הגיע? כדאי להציץ גם בתיקיית הספאם."),
      t("auth.side.headline", "כתב-יד גדול ליד המעטפה", "מוזמנת!"),
      l("auth.side.lines", "שלוש השורות ליד המעטפה", "להכיר את המעטפת\nלטעום את המפגשים\nלהיות אחת בשביל כולן", "המילה הראשונה בכל שורה נצבעת"),
      t("auth.welcome.title", "כותרת השלמת פרטים", "ברוכה הבאה למעטפת"),
      t("auth.welcome.subtitle", "שורת כתב-יד בהשלמת פרטים", "כמה פרטים קטנים לפני שנכנסות"),
    ],
  },
  {
    key: "home",
    title: "תפריט ראשי",
    fields: [
      t("home.greeting", "ברכה", "היי {שם},", "{שם} מוחלף בשם הפרטי"),
      t("home.title", "כותרת ראשית", "איזו המעטפָאן את פותחת היום?"),
      t("home.forum.title", "כרטיס הפורום – כותרת", "הפורום"),
      t("home.forum.tagline", "כרטיס הפורום – כתב-יד", "תוכן שיתופי חברתי בדיגיטל"),
      t("home.forum.cta", "כרטיס הפורום – כפתור", "היכנסי והכירי את המדורים החדשים"),
      t("home.mill.title", "כרטיס המיליונרית – כותרת", "המיליונרית"),
      t("home.mill.tagline", "כרטיס המיליונרית – כתב-יד", "מפגשי אירוח של חברות המעטפת"),
      l("home.mill.text", "כרטיס המיליונרית – טקסט", "יש לך משהו שאין לאף אחת?\nכישרון, תובנה, סיפור בלעדי…?\nתני לנו לטעום ממך, קצת, ככה, בקטנה."),
      t("home.mill.slogan", "כרטיס המיליונרית – סלוגן", "כי את שווה מיליון דולר!"),
      t("home.mill.cta", "כרטיס המיליונרית – כפתור", "למפגשי האירוח"),
      t("home.bday.title", "כרטיס חוגגות – כותרת", "חוגגות חודש טוב"),
      t("home.bday.tagline", "כרטיס חוגגות – כתב-יד", "מפגשי יומולדת"),
      l("home.bday.text", "כרטיס חוגגות – טקסט", "יומולדת זה דבר שמח? תלוי מתי.\nיומולדת זה דבר עצוב? תלוי עם מי.\nמוזמנת ליומולדת אמיתי, רק שלנו."),
      t("home.bday.cta", "כרטיס חוגגות – כפתור", "למפגש החודשי"),
      t("home.band.label", "פס המפגש – תווית", "המפגש הקרוב"),
      t("home.band.price", "פס המפגש – מחיר", "השתתפות {מחיר} ש״ח", "{מחיר} מוחלף במחיר"),
      t("home.band.free", "פס המפגש – ללא תשלום", "ללא תשלום"),
      t("home.band.limited", "פס המפגש – מקומות", "מקומות מוגבלים!"),
      t("home.band.cta", "פס המפגש – כפתור", "אני באה!"),
      t("home.band.registered", "פס המפגש – אחרי הרשמה", "נרשמת! (ביטול)"),
      t("home.band.full", "פס המפגש – מלא", "המקומות נגמרו"),
    ],
  },
  {
    key: "forum",
    title: "הפורום",
    fields: [
      t("forum.title", "כותרת", "הפורום"),
      t("forum.tagline", "כתב-יד מעל הכותרת", "תוכן שיתופי חברתי בדיגיטל"),
      l("forum.intro", "טקסט פתיחה", "תכנים, מאחורי הקלעים, עזרה הדדית ודיונים קבוצתיים. היכנסי והכירי את המדורים החדשים!"),
      t("forum.search", "חיפוש – טקסט בתיבה", "מחפשת משהו?"),
      t("forum.new", "כפתור דיון חדש (צוות)", "דיון חדש"),
      t("forum.feed.title", "כותרת הפיד", "מה חדש בפורום"),
      t("forum.feed.note", "הערה ליד כותרת הפיד", "הכי חדש למעלה"),
      t("forum.empty", "כשאין פוסטים", "עדיין שקט כאן. הצוות כבר מכין את הדיון הראשון."),
      t("forum.member.title", "תיבת הסבר לחברות – כותרת", "איך זה עובד כאן?"),
      l("forum.member.text", "תיבת הסבר לחברות – טקסט", "צוות המעטפת פותח את הדיונים, ואת מוזמנת להגיב, לשאול, לפרגן ולהוסיף אימוג׳י. הלב למטה שלך."),
      t("forum.composer.title", "טופס פוסט (צוות) – כותרת", "על מה בא לך לדבר?"),
      t("forum.composer.button", "טופס פוסט – כפתור", "שולחת לפורום"),
      t("forum.rules.title", "כללי הבית – כותרת", "כללי הבית"),
      l("forum.rules", "כללי הבית – שורות", "מה שנאמר במעטפת – נשאר במעטפת.\nמדברות בגובה העיניים ומפרגנות בלי חשבון.\nשאלה טיפשית? אין דבר כזה."),
      t("forum.like", "כפתור אהבתי", "אהבתי"),
      t("forum.comment.placeholder", "תיבת תגובה – טקסט", "מה את חושבת?"),
      t("forum.comment.button", "תיבת תגובה – כפתור", "שולחת"),
      t("forum.comment.empty", "כשאין תגובות", "עוד אין תגובות – תהיי הראשונה."),
    ],
  },
  {
    key: "millionaire",
    title: "המיליונרית",
    fields: [
      t("mill.title", "כותרת", "המיליונרית"),
      t("mill.tagline", "כתב-יד מעל הכותרת", "מפגשי אירוח של חברות המעטפת"),
      l("mill.text", "טקסט פתיחה", "יש לך משהו שאין לאף אחת?\nכישרון, תובנה, סיפור בלעדי…?\nתני לנו לטעום ממך, קצת, ככה, בקטנה."),
      t("mill.slogan", "סלוגן", "כי את שווה מיליון דולר!"),
      t("mill.cheque.bank", "צ׳ק – בנק", "בנק המעטפת"),
      t("mill.cheque.number", "צ׳ק – מספר", "מס׳ 000001"),
      t("mill.cheque.payee", "צ׳ק – לפקודת", "את"),
      t("mill.cheque.amount", "צ׳ק – סך של", "מיליון דולר בדיוק"),
      t("mill.how.title", "איך זה עובד – כותרת", "איך זה עובד?"),
      t("mill.step1.title", "שלב 1 – כותרת", "מספרת לנו מה יש לך"),
      t("mill.step1.text", "שלב 1 – טקסט", "ממלאת את הצ׳ק למטה – כמה מילים זה מספיק."),
      t("mill.step2.title", "שלב 2 – כותרת", "קובעות יחד מועד"),
      t("mill.step2.text", "שלב 2 – טקסט", "צוות המעטפת חוזר אלייך ומתאם תאריך ומקום."),
      t("mill.step3.title", "שלב 3 – כותרת", "את מארחת, אנחנו טועמות"),
      t("mill.step3.text", "שלב 3 – טקסט", "ערב קטן, אינטימי ובלעדי – בדיוק בגודל שלך."),
      t("mill.next.title", "המארחות הבאות – כותרת", "המארחות הבאות"),
      t("mill.next.note", "המארחות הבאות – הערה", "מקומות מוגבלים – כדאי להירשם"),
      t("mill.next.empty", "כשאין מועדים", "עוד אין מועדים קבועים. הצ׳ק הראשון יכול להיות שלך – הטופס למטה."),
      t("mill.rsvp", "כפתור הרשמה לערב", "שמרי לי מקום"),
      t("mill.rsvp.done", "אחרי הרשמה", "נרשמת! (ביטול)"),
      t("mill.propose.title", "הצ׳ק שלך – כותרת", "הצ׳ק שלך"),
      t("mill.propose.subtitle", "הצ׳ק שלך – כתב-יד", "ממלאות, חותמות, ואנחנו כבר חוזרות אלייך"),
      t("mill.propose.question", "הצ׳ק שלך – שאלה", "מה יש לך שאין לאף אחת?"),
      t("mill.propose.button", "הצ׳ק שלך – כפתור", "חותמת על הצ׳ק"),
      t("mill.sent.title", "אחרי חתימה – כותרת", "הצ׳ק נחתם!"),
      t("mill.sent.text", "אחרי חתימה – טקסט", "צוות המעטפת יחזור אלייך בקרוב לתיאום מועד."),
      t("mill.sent.again", "אחרי חתימה – עוד רעיון", "יש לי עוד רעיון"),
    ],
  },
  {
    key: "birthday",
    title: "חוגגות חודש טוב",
    fields: [
      t("bday.title", "כותרת", "חוגגות חודש טוב"),
      t("bday.tagline", "כתב-יד מעל הכותרת", "מפגשי יומולדת"),
      t("bday.q1", "שורה 1 – שאלה", "יומולדת זה דבר שמח?"),
      t("bday.a1", "שורה 1 – תשובה (צבעונית)", "תלוי מתי."),
      t("bday.q2", "שורה 2 – שאלה", "יומולדת זה דבר עצוב?"),
      t("bday.a2", "שורה 2 – תשובה (צבעונית)", "תלוי עם מי."),
      l("bday.intro", "טקסט פתיחה", "מוזמנת ליומולדת אמיתי, רק שלנו: עם עוגה וחטיפים, עם בלונים וחיוכים, ועם תוכן הכי הכי מחבר ונוגע, שרק אנחנו מבינות. על הנושא אחראיות – בעלות השמחה :)"),
      t("bday.next.label", "תווית המפגש הקרוב", "המפגש החודשי הקרוב"),
      t("bday.archive.link", "קישור למפגשים קודמים", "מפגשים קודמים"),
      t("bday.host.title", "ילידת החודש – כותרת", "את מבעלות השמחה החודש!"),
      l("bday.host.text", "ילידת החודש – טקסט", "בעלות השמחה בוחרות יחד את נושא הערב. רוצה לקחת חלק בצוות הנושא?"),
      t("bday.team.join", "כפתור צוות הנושא", "אני רוצה להיות בצוות הנושא"),
      t("bday.team.joined", "אחרי הצטרפות לצוות", "את בצוות הנושא!"),
      t("bday.guest.title", "אורחת – כותרת", "חוגגות את ילידות {חודש}", "{חודש} מוחלף בשם החודש"),
      l("bday.guest.text", "אורחת – טקסט", "בואי לשמוח איתן – הערב שלהן הוא גם שלך. המסיבה שלך תגיע בחודש שבו נולדת."),
      t("bday.mymonth", "חודש הלידה שלך", "חודש הלידה שלך:"),
      t("bday.mymonth.link", "קישור לשינוי חודש", "שינוי בחשבון שלי"),
      t("bday.details.title", "פרטי המפגש – כותרת", "פרטי המפגש"),
      t("bday.rsvp", "כפתור הרשמה", "אני באה לחגוג"),
      t("bday.rsvp.done", "אחרי הרשמה", "מגיעה! (ביטול)"),
      t("bday.agenda.title", "סדר יום – כותרת", "מה מחכה לנו במפגש"),
      t("bday.agenda.subtitle", "סדר יום – כתב-יד", "הפירוט המורחב של הדיונים"),
      t("bday.agenda.empty", "כשאין סדר יום", "בעלות השמחה עוד בוחרות את הנושא. הפירוט יתפרסם כאן."),
      t("bday.questions", "שאלות לדיון – תווית", "שאלות לדיון"),
      t("bday.archive.title", "ארכיון – כותרת", "מפגשים קודמים"),
      t("bday.archive.empty", "ארכיון – כשאין", "זה עוד לא קרה – המסיבה הראשונה לפנינו."),
    ],
  },
  {
    key: "profile",
    title: "החשבון שלי",
    fields: [
      t("profile.title", "כותרת", "החשבון שלי"),
      t("profile.birthday.title", "מתי נולדת – כותרת", "מתי נולדת?"),
      l("profile.birthday.text", "מתי נולדת – טקסט", "חודש הלידה העברי קובע באיזו מסיבה של חוגגות חודש טוב תהיי מבעלות השמחה. נבחר בהרשמה, ואפשר לשנות כאן בכל זמן."),
      t("profile.remind", "תזכורת למייל", "להזכיר לי במייל לפני המסיבה שלי"),
      t("profile.details.title", "פרטים אישיים – כותרת", "פרטים אישיים"),
    ],
  },
  {
    key: "terms",
    title: "תקנון ומדיניות פרטיות",
    fields: [
      t("terms.title", "כותרת", "תקנון ומדיניות פרטיות"),
      r(
        "terms.body",
        "גוף התקנון",
        `<h2>מי אנחנו</h2><p>המעטפת היא קהילה סגורה לנשים בנות 30 ומעלה, מבית חד או פאן. ההצטרפות מותנית באישור צוות המעטפת.</p><h2>כללי הבית</h2><p>מה שנאמר במעטפת – נשאר במעטפת. תכנים, פוסטים ופרטים של חברות לא יוצאים החוצה.</p><p>מדברות בגובה העיניים ומפרגנות בלי חשבון. שאלה טיפשית? אין דבר כזה.</p><p>צוות המעטפת רשאי להסיר תוכן שפוגע ברוח הקהילה, ולהשהות חשבון של חברה שמפרה את כללי הבית.</p><h2>מה אנחנו שומרות עלייך</h2><p>שם פרטי ושם משפחה, כתובת מייל, מספר טלפון וחודש הלידה העברי. הפרטים משמשים רק לניהול הקהילה: אישור הצטרפות, הרשמה למפגשים, תזכורות למייל ומסיבות חוגגות חודש טוב.</p><p>הפרטים שלך לא נמסרים לאף גורם חיצוני. השם שלך מוצג לחברות אחרות בפורום ובמפגשים; הטלפון והמייל נראים רק לצוות המעטפת.</p><p>אפשר לעדכן את הפרטים בכל רגע ב«החשבון שלי», ולבקש מחיקה של החשבון בפנייה לצוות.</p><h2>מפגשים</h2><p>ההרשמה למפגש היא שמירת מקום. מקומות מוגבלים – אם לא תגיעי, בטלי את ההרשמה כדי לפנות מקום לחברה אחרת.</p><p><em>הנוסח המלא של התקנון יעודכן על ידי צוות המעטפת. עדכון אחרון: אוקטובר 2026.</em></p>`
      ),
    ],
  },
];

export const CONTENT_FIELDS: Record<string, ContentField> = Object.fromEntries(CONTENT_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f])));

export type Content = {
  /** The text for a key, with {placeholders} filled from vars. */
  get: (key: string, vars?: Record<string, string | number>) => string;
  /** A "lines" field split for rendering. */
  lines: (key: string, vars?: Record<string, string | number>) => string[];
  overrides: Record<string, string>;
};

function fill(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{([^}]+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function contentFrom(overrides: Record<string, string>): Content {
  const get = (key: string, vars?: Record<string, string | number>) => {
    const field = CONTENT_FIELDS[key];
    const raw = overrides[key] !== undefined && overrides[key] !== "" ? overrides[key] : (field?.default ?? key);
    return fill(raw, vars);
  };
  return {
    get,
    lines: (key, vars) => get(key, vars).split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    overrides,
  };
}

/** All overrides from the database, once per request. */
export const getContent = cache(async (): Promise<Content> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_content").select("key, value");
    return contentFrom(Object.fromEntries((data ?? []).map((r) => [r.key, r.value])));
  } catch {
    return contentFrom({});
  }
});
