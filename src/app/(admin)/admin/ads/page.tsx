import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { adImageUrl } from "@/lib/ads";
import { civilDateLabel } from "@/lib/hebrew";
import { setAdActive, deleteAd } from "../actions";
import { ActionButton, Toggle } from "../ui";
import { AdForm } from "./ad-form";

export const metadata = { title: "פרסומות" };

export default async function AdminAdsPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: ads } = await admin.from("ads").select("*").order("created_at", { ascending: false });
  const rows = ads ?? [];
  const activeCount = rows.filter((a) => a.active).length;

  return (
    <section style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 340px", background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
          <span className="grad">פרסומות</span>
        </h1>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#5A3348" }}>
          המשבצת לפרסומת: מלבן ברוחב 300 פיקסלים בצד שמאל של כל מסך חברות (במחשב), ובתחתית העמוד בטלפון. היא מוצגת רק כשיש פרסומת פעילה – בלי פרסומת, אין משבצת. כמה פרסומות פעילות? כל טעינת עמוד מגרילה אחת מהן. לחיצה על הפרסומת נספרת ופותחת את הקישור בלשונית חדשה.
        </p>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#3A1530", background: "#FFF4E8", border: "2px solid #F5D7BD", borderRadius: 14, padding: "10px 14px" }}>
          <b>מה להעלות:</b> תמונה ברוחב 300 פיקסלים וגובה 250 עד 600 (מומלץ 300×600 – «חצי עמוד», או 300×250). JPG / PNG / WebP / GIF, עד 2MB. תמונה רחבה יותר מוקטנת ל-300.
        </p>
        <AdForm />
      </div>

      <div style={{ flex: "999 1 420px", minWidth: 0, background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
            <span className="grad">הפרסומות שהועלו</span>
          </h2>
          <span style={{ fontSize: 15, color: "#6A4558" }}>{activeCount} פעילות מתוך {rows.length}</span>
        </div>
        {rows.length === 0 && <span style={{ fontSize: 15, color: "#6A4558" }}>עוד לא הועלתה פרסומת. המשבצת לא מוצגת לחברות.</span>}
        {rows.map((ad) => (
          <article key={ad.id} data-testid="ad-row" style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start", padding: 14, border: `2px solid ${ad.active ? "#F0A35E" : "#F0E2D8"}`, borderRadius: 18, opacity: ad.active ? 1 : 0.85 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={adImageUrl(ad.image_path)} alt={ad.name} style={{ width: 120, height: "auto", maxHeight: 240, objectFit: "contain", borderRadius: 10, border: "1.5px solid #F0E2D8", background: "#FFF8F2" }} />
            <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
              <b style={{ fontSize: 17 }}>{ad.name}</b>
              {ad.link_url ? (
                <a href={ad.link_url} target="_blank" rel="noopener" dir="ltr" style={{ fontSize: 14, color: "#A3304A", wordBreak: "break-all", textAlign: "right" }}>
                  {ad.link_url}
                </a>
              ) : (
                <span style={{ fontSize: 14, color: "#6A4558" }}>בלי קישור (תמונה בלבד)</span>
              )}
              <span style={{ fontSize: 14, color: "#6A4558" }}>
                {ad.clicks} לחיצות · הועלתה {civilDateLabel(ad.created_at.slice(0, 10))}
              </span>
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <Toggle checked={ad.active} label="מוצגת לחברות" action={setAdActive.bind(null, ad.id)} />
                <ActionButton className="btn-sm-rust" confirm={`למחוק את הפרסומת «${ad.name}»?`} action={deleteAd.bind(null, ad.id)}>
                  מחיקה
                </ActionButton>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
