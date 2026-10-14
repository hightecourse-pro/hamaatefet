import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { agendaToText } from "@/lib/agenda";
import { EventForm } from "../../event-form";
import { RegistrantsTable } from "../registrants-table";
import { ActionButton } from "../../ui";
import { deleteEvent } from "../../actions";

export const metadata = { title: "עריכת מפגש" };

export default async function AdminEventPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();
  const { data: ev } = await admin.from("events").select("*").eq("id", id).maybeSingle();
  if (!ev) notFound();
  const { data: agenda } = await admin.from("event_agenda").select("*").eq("event_id", id).order("sort_order");
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
            <span className="grad">{ev.title}</span>
          </h1>
          <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <ActionButton className="btn-sm" confirm="למחוק את המפגש וכל ההרשמות אליו?" action={deleteEvent.bind(null, ev.id)} style={{ color: "#A3304A" }}>
              מחיקת המפגש
            </ActionButton>
            <Link href="/admin/events">חזרה לרשימה</Link>
          </span>
        </div>
        <EventForm
          id={ev.id}
          lockType={ev.type === "birthday"}
          initial={{
            type: ev.type,
            title: ev.title,
            description: ev.description,
            event_date: ev.event_date,
            start_time: ev.start_time,
            end_time: ev.end_time,
            location: ev.location,
            price_ils: ev.price_ils,
            capacity: ev.capacity,
            topic: ev.topic,
            host_name: ev.host_name,
            published: ev.published,
            hebrew_month: ev.hebrew_month,
            hebrew_year: ev.hebrew_year,
            agenda: agendaToText(agenda ?? []),
          }}
        />
      </div>
      <RegistrantsTable eventId={ev.id} />
    </section>
  );
}
