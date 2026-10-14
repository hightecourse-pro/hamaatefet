import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { TYPE_LABEL } from "@/lib/events";
import { hebrewDateLabel, timeRange } from "@/lib/hebrew";

export const metadata = { title: "מפגשים והרשמות" };

export default async function AdminEventsPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: events } = await admin.from("events").select("*").order("event_date", { ascending: false, nullsFirst: true }).limit(200);
  const list = events ?? [];
  const counts = new Map<string, number>();
  if (list.length) {
    const { data: regs } = await admin.from("registrations").select("event_id").in("event_id", list.map((e) => e.id));
    for (const r of regs ?? []) counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1);
  }
  return (
    <section style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
          <span className="grad">מפגשים והרשמות</span>
        </h1>
        <Link href="/admin/events/new" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 18px", borderRadius: 14, border: "none", background: "#6E0F1A", color: "#FFF3EA", fontSize: 16, fontWeight: 600, textDecoration: "none", boxShadow: "3px 3px 0 #4A1942" }}>
          + מפגש חדש
        </Link>
      </div>
      <div style={{ overflowX: "auto", border: "1.5px solid #F3E6DD", borderRadius: 16 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>מפגש</th>
              <th>סוג</th>
              <th>מועד</th>
              <th>מקום</th>
              <th>מחיר</th>
              <th>נרשמות</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#6A4558", padding: 28 }}>
                  עוד אין מפגשים.
                </td>
              </tr>
            )}
            {list.map((e) => (
              <tr key={e.id} style={{ opacity: e.published ? 1 : 0.6 }}>
                <td style={{ fontWeight: 600, whiteSpace: "normal", minWidth: 160 }}>
                  <Link href={`/admin/events/${e.id}`} style={{ textDecoration: "none", color: "#3A1530" }}>
                    {e.title}
                  </Link>
                  {!e.published && (
                    <span className="pill pill-paused" style={{ marginRight: 8 }}>
                      לא מפורסם
                    </span>
                  )}
                </td>
                <td>{TYPE_LABEL[e.type]}</td>
                <td>
                  {e.event_date ? hebrewDateLabel(e.event_date) : "[מועד]"}
                  {timeRange(e.start_time, e.end_time) ? ` · ${timeRange(e.start_time, e.end_time)}` : ""}
                </td>
                <td style={{ whiteSpace: "normal", minWidth: 160 }}>{e.location || "[מקום]"}</td>
                <td>{e.price_ils > 0 ? `${e.price_ils} ש״ח` : "חינם"}</td>
                <td>
                  {counts.get(e.id) ?? 0} / {e.capacity ?? "∞"}
                </td>
                <td>
                  <Link href={`/admin/events/${e.id}`} style={{ fontWeight: 600 }}>
                    רשימת נרשמות
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
