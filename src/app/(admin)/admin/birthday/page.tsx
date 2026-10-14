import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { HEBREW_MONTHS, hebrewToday, hebrewDateLabel, hebrewYearLabel } from "@/lib/hebrew";
import { PencilIcon } from "../ui";

export const metadata = { title: "חוגגות חודש טוב" };

export default async function AdminBirthdayPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  await requireAdmin();
  const { year: yearParam } = await searchParams;
  const today = hebrewToday();
  const year = Number(yearParam) || today.year;
  const admin = createAdminClient();
  const [{ data: events }, { data: members }] = await Promise.all([
    admin.from("events").select("id, hebrew_month, event_date, topic, title, published, start_time").eq("type", "birthday").eq("hebrew_year", year),
    admin.from("profiles").select("birth_month").eq("status", "active"),
  ]);
  const hosts = new Map<number, number>();
  for (const m of members ?? []) if (m.birth_month) hosts.set(m.birth_month, (hosts.get(m.birth_month) ?? 0) + 1);
  const byMonth = new Map((events ?? []).map((e) => [e.hebrew_month, e]));

  return (
    <section style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
          <span className="grad">חוגגות חודש טוב – לוח השנה {hebrewYearLabel(year)}</span>
        </h1>
        <span style={{ display: "flex", gap: 12, fontSize: 15 }}>
          <Link href={`/admin/birthday?year=${year - 1}`}>שנה קודמת</Link>
          <Link href={`/admin/birthday?year=${year + 1}`}>שנה הבאה</Link>
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {HEBREW_MONTHS.map((name, i) => {
          const month = i + 1;
          const ev = byMonth.get(month);
          const isNow = year === today.year && month === today.month;
          return (
            <div key={month} style={{ border: `2px solid ${isNow ? "#F0A35E" : "#F0E2D8"}`, borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 6, background: "#FFFCFA" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: 22, color: "#6E0F1A" }}>
                  {name}
                  {isNow && (
                    <span className="hand" style={{ fontSize: 13, color: "#9A4318", marginRight: 8 }}>
                      החודש
                    </span>
                  )}
                </strong>
                <Link href={`/admin/birthday/${year}/${month}`} className="ib" aria-label={`עריכת מסיבת ${name}`} style={{ textDecoration: "none" }}>
                  <PencilIcon />
                </Link>
              </div>
              <span style={{ fontSize: 15, color: "#6A4558" }}>תאריך: {ev?.event_date ? hebrewDateLabel(ev.event_date) : "[טרם נקבע]"}</span>
              <span style={{ fontSize: 15, color: "#6A4558" }}>בעלות השמחה: {hosts.get(month) ?? 0}</span>
              <span style={{ fontSize: 15, color: "#6A4558" }}>נושא: {ev?.topic || "[טרם נבחר]"}</span>
              {ev && !ev.published && <span className="pill pill-paused">לא מפורסם</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
