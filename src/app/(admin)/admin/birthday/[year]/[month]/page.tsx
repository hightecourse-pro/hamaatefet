import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { monthName, hebrewYearLabel } from "@/lib/hebrew";
import { agendaToText } from "@/lib/agenda";
import { EventForm } from "../../../event-form";
import { RegistrantsTable } from "../../../events/registrants-table";

export const metadata = { title: "עריכת מסיבה" };

export default async function AdminBirthdayMonthPage({ params }: { params: Promise<{ year: string; month: string }> }) {
  await requireAdmin();
  const { year: y, month: m } = await params;
  const year = Number(y);
  const month = Number(m);
  if (!(month >= 1 && month <= 12) || !(year > 5700 && year < 5900)) notFound();
  const admin = createAdminClient();
  const { data: ev } = await admin.from("events").select("*").eq("type", "birthday").eq("hebrew_year", year).eq("hebrew_month", month).maybeSingle();
  const { data: agenda } = ev ? await admin.from("event_agenda").select("*").eq("event_id", ev.id).order("sort_order") : { data: [] };
  const [{ data: hosts }, { data: team }] = await Promise.all([
    admin.from("profiles").select("first_name, last_name, email, phone").eq("status", "active").eq("birth_month", month).order("first_name"),
    ev ? admin.from("topic_team").select("profiles(first_name, last_name)").eq("event_id", ev.id) : Promise.resolve({ data: [] }),
  ]);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
            <span className="grad">
              מסיבת {monthName(month)} {hebrewYearLabel(year)}
            </span>
          </h1>
          <Link href="/admin/birthday">חזרה ללוח השנה</Link>
        </div>
        <EventForm
          id={ev?.id ?? null}
          lockType
          submitLabel={ev ? "שמירה" : "יצירת המסיבה"}
          initial={{
            type: "birthday",
            title: ev?.title ?? `מסיבת ${monthName(month)}`,
            description: ev?.description ?? "",
            event_date: ev?.event_date ?? null,
            start_time: ev?.start_time ?? null,
            end_time: ev?.end_time ?? null,
            location: ev?.location ?? "",
            price_ils: ev?.price_ils ?? 0,
            capacity: ev?.capacity ?? null,
            topic: ev?.topic ?? "",
            host_name: ev?.host_name ?? "",
            published: ev?.published ?? true,
            hebrew_month: month,
            hebrew_year: year,
            agenda: agendaToText(agenda ?? []),
          }}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 300px", background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            <span className="grad">בעלות השמחה ({(hosts ?? []).length})</span>
          </h2>
          {(hosts ?? []).length === 0 && <span style={{ fontSize: 15, color: "#6A4558" }}>אין עדיין משתתפות פעילות שנולדו ב{monthName(month)}.</span>}
          {(hosts ?? []).map((h, i) => (
            <span key={i} style={{ fontSize: 15 }}>
              {h.first_name} {h.last_name} <span dir="ltr" style={{ color: "#6A4558", fontSize: 13 }}>{h.phone}</span>
            </span>
          ))}
          {ev && (
            <>
              <h3 style={{ margin: "10px 0 0", fontSize: 17 }}>צוות הנושא ({(team ?? []).length})</h3>
              {(team ?? []).map((t, i) => (
                <span key={i} style={{ fontSize: 15 }}>
                  {t.profiles?.first_name} {t.profiles?.last_name}
                </span>
              ))}
            </>
          )}
        </div>
        {ev && (
          <div style={{ flex: "999 1 420px", minWidth: 0 }}>
            <RegistrantsTable eventId={ev.id} />
          </div>
        )}
      </div>
    </section>
  );
}
