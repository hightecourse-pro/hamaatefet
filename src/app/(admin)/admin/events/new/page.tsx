import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { EventForm } from "../../event-form";
import { hebrewToday } from "@/lib/hebrew";

export const metadata = { title: "מפגש חדש" };

export default async function NewEventPage() {
  await requireAdmin();
  const today = hebrewToday();
  return (
    <section style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
          <span className="grad">מפגש חדש</span>
        </h1>
        <Link href="/admin/events">חזרה לרשימה</Link>
      </div>
      <EventForm
        id={null}
        submitLabel="יצירת המפגש"
        initial={{ type: "general", title: "", description: "", event_date: null, start_time: null, end_time: null, location: "", price_ils: 0, capacity: null, topic: "", host_name: "", published: true, hebrew_month: null, hebrew_year: today.year, agenda: "" }}
      />
    </section>
  );
}
