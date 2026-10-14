import { createAdminClient } from "@/lib/supabase/admin";
import { monthName } from "@/lib/hebrew";
import { removeRegistration } from "../actions";
import { ActionButton } from "../ui";

/** The registrant list of one event (server component; admin-only pages). */
export async function RegistrantsTable({ eventId }: { eventId: string }) {
  const admin = createAdminClient();
  const [{ data: ev }, { data: regs }] = await Promise.all([
    admin.from("events").select("title, capacity").eq("id", eventId).maybeSingle(),
    admin.from("registrations").select("user_id, created_at, profiles(first_name, last_name, email, phone, birth_month)").eq("event_id", eventId).order("created_at"),
  ]);
  const list = regs ?? [];
  return (
    <div style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          <span className="grad">
            נרשמות ({list.length}
            {ev?.capacity ? ` / ${ev.capacity}` : ""})
          </span>
        </h2>
        <a href={`/admin/export/registrations/${eventId}`} className="btn-sm" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
          ייצוא לאקסל
        </a>
      </div>
      <div style={{ overflowX: "auto", border: "1.5px solid #F3E6DD", borderRadius: 16 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>#</th>
              <th>שם</th>
              <th>מייל</th>
              <th>טלפון</th>
              <th>חודש לידה</th>
              <th>נרשמה</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#6A4558", padding: 22 }}>
                  עוד אין נרשמות.
                </td>
              </tr>
            )}
            {list.map((r, i) => (
              <tr key={r.user_id}>
                <td style={{ color: "#6A4558" }}>{i + 1}</td>
                <td>
                  {r.profiles?.first_name} {r.profiles?.last_name}
                </td>
                <td dir="ltr" style={{ textAlign: "right", color: "#6A4558" }}>
                  {r.profiles?.email}
                </td>
                <td dir="ltr" style={{ textAlign: "right", color: "#6A4558" }}>
                  {r.profiles?.phone}
                </td>
                <td>{monthName(r.profiles?.birth_month)}</td>
                <td style={{ color: "#6A4558" }}>{r.created_at.slice(0, 16).replace("T", " ")}</td>
                <td>
                  <ActionButton className="btn-sm" confirm="להסיר את ההרשמה שלה?" action={removeRegistration.bind(null, eventId, r.user_id)}>
                    הסרה
                  </ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
