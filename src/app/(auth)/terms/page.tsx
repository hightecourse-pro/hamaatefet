import Link from "next/link";

export const metadata = { title: "תקנון ומדיניות פרטיות" };

const H2 = { margin: "26px 0 8px", fontSize: 22, fontWeight: 700, color: "#4A1942" } as const;
const P = { margin: "0 0 10px", fontSize: 17, lineHeight: 1.7, color: "#3A1530" } as const;

export default function TermsPage() {
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#FFF8F2" }}>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 72px" }}>
        <section style={{ background: "#fff", border: "2px solid #F0E2D8", borderRadius: 28, padding: "32px 30px", boxShadow: "8px 8px 0 #F3DCCB" }}>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 700 }}>
            <span className="grad">תקנון ומדיניות פרטיות</span>
          </h1>
          <p className="hand" style={{ margin: "6px 0 0", fontSize: 18, color: "#7A5566" }}>
            המעטפת · מבית חד או פאן
          </p>

          <h2 style={H2}>מי אנחנו</h2>
          <p style={P}>המעטפת היא קהילה סגורה לנשים בנות 30 ומעלה, מבית חד או פאן. ההצטרפות מותנית באישור צוות המעטפת.</p>

          <h2 style={H2}>כללי הבית</h2>
          <p style={P}>מה שנאמר במעטפת – נשאר במעטפת. תכנים, פוסטים ופרטים של חברות לא יוצאים החוצה.</p>
          <p style={P}>מדברות בגובה העיניים ומפרגנות בלי חשבון. שאלה טיפשית? אין דבר כזה.</p>
          <p style={P}>צוות המעטפת רשאי להסיר תוכן שפוגע ברוח הקהילה, ולהשהות חשבון של חברה שמפרה את כללי הבית.</p>

          <h2 style={H2}>מה אנחנו שומרות עלייך</h2>
          <p style={P}>שם פרטי ושם משפחה, כתובת מייל, מספר טלפון וחודש הלידה העברי. הפרטים משמשים רק לניהול הקהילה: אישור הצטרפות, הרשמה למפגשים, תזכורות למייל ומסיבות חוגגות חודש טוב.</p>
          <p style={P}>הפרטים שלך לא נמסרים לאף גורם חיצוני. השם שלך מוצג לחברות אחרות בפורום ובמפגשים; הטלפון והמייל נראים רק לצוות המעטפת.</p>
          <p style={P}>אפשר לעדכן את הפרטים בכל רגע ב«החשבון שלי», ולבקש מחיקה של החשבון בפנייה לצוות.</p>

          <h2 style={H2}>מפגשים</h2>
          <p style={P}>ההרשמה למפגש היא שמירת מקום. במפגשים בתשלום התשלום נעשה במקום, אלא אם נכתב אחרת. מקומות מוגבלים – אם לא תגיעי, בטלי את ההרשמה כדי לפנות מקום לחברה אחרת.</p>

          <p style={{ ...P, marginTop: 26, fontSize: 15, color: "#7A5566" }}>
            הנוסח המלא של התקנון יעודכן על ידי צוות המעטפת. עדכון אחרון: אוקטובר 2026.
          </p>
          <p style={{ margin: "18px 0 0" }}>
            <Link href="/login">חזרה לכניסה</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
