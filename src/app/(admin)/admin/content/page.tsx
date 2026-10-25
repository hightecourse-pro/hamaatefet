import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONTENT_GROUPS } from "@/lib/content";
import { ContentBrowser } from "./content-browser";

export const metadata = { title: "תוכן האתר" };

export default async function AdminContentPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin.from("site_content").select("key, value");
  const overrides = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
          <span className="grad">תוכן האתר</span>
        </h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#5A3348" }}>
          כל טקסט שהחברות רואות – כותרות, כפתורים, תוויות שדות, הודעות שגיאה והמיילים – לפי מסך. שדה ריק = הטקסט המקורי מהעיצוב. סימון «חזרה למקור» מוחק את השינוי. שינויים נראים מיד. מילים בסוגריים מסולסלים
          ({"{שם}"}, {"{חודש}"}…) מתמלאות אוטומטית – כדאי להשאיר אותן.
        </p>
      </div>
      <ContentBrowser groups={CONTENT_GROUPS} overrides={overrides} />
    </section>
  );
}
