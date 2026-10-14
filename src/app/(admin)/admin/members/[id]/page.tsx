import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { civilDateLabel } from "@/lib/hebrew";
import { MemberForm } from "./member-form";
import { ActionButton } from "../../ui";
import { setMemberStatus, deleteMember } from "../../actions";

export const metadata = { title: "עריכת משתתפת" };

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();
  const { data: m } = await admin.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!m) notFound();
  const [{ data: regs }, { data: posts }] = await Promise.all([
    admin.from("registrations").select("event_id, created_at, events(title, event_date)").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
    admin.from("posts").select("id, title, status, created_at").eq("author_id", id).order("created_at", { ascending: false }).limit(20),
  ]);
  const name = `${m.first_name} ${m.last_name}`.trim();

  return (
    <section style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
          <span className="grad">{name || "משתתפת"}</span>
        </h1>
        <Link href="/admin">חזרה לרשימה</Link>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", fontSize: 15, color: "#6A4558" }}>
        <span className={`pill pill-${m.status}`}>{m.status === "pending" ? "ממתינה לאישור" : m.status === "active" ? "פעילה" : "מושהית"}</span>
        <span>הצטרפה {civilDateLabel(m.created_at.slice(0, 10))}</span>
        {m.approved_at && <span>· אושרה {civilDateLabel(m.approved_at.slice(0, 10))}</span>}
        {m.terms_accepted_at && <span>· אישרה תקנון</span>}
        <span style={{ marginRight: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {m.status !== "active" && (
            <ActionButton className="btn-sm-green" action={setMemberStatus.bind(null, m.id, "active")}>
              {m.status === "pending" ? "אישור הצטרפות" : "הפעלה מחדש"}
            </ActionButton>
          )}
          {m.status === "active" && m.id !== userId && (
            <ActionButton className="btn-sm" confirm={`להשהות את ${name}?`} action={setMemberStatus.bind(null, m.id, "paused")}>
              השהיה
            </ActionButton>
          )}
          {m.id !== userId && (
            <ActionButton className="btn-sm" confirm={`למחוק לצמיתות את ${name}? כל הפוסטים וההרשמות שלה יימחקו.`} action={deleteMember.bind(null, m.id)} style={{ color: "#A3304A" }}>
              מחיקה
            </ActionButton>
          )}
        </span>
      </div>

      <MemberForm member={{ id: m.id, first_name: m.first_name, last_name: m.last_name, email: m.email, phone: m.phone, birth_month: m.birth_month, role: m.role, over_30_confirmed: m.over_30_confirmed, remind_birthday: m.remind_birthday }} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <div style={{ flex: "1 1 280px", background: "#FBF1EA", borderRadius: 16, padding: 16 }}>
          <strong style={{ fontSize: 17 }}>הרשמות למפגשים</strong>
          <ul style={{ margin: "8px 0 0", paddingRight: 18, fontSize: 15, color: "#5A3348", lineHeight: 1.7 }}>
            {(regs ?? []).length === 0 && <li>אין הרשמות.</li>}
            {(regs ?? []).map((r) => (
              <li key={r.event_id}>
                <Link href={`/admin/events/${r.event_id}`}>{r.events?.title ?? "מפגש"}</Link> · {civilDateLabel(r.events?.event_date)}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: "1 1 280px", background: "#FBF1EA", borderRadius: 16, padding: 16 }}>
          <strong style={{ fontSize: 17 }}>פוסטים בפורום</strong>
          <ul style={{ margin: "8px 0 0", paddingRight: 18, fontSize: 15, color: "#5A3348", lineHeight: 1.7 }}>
            {(posts ?? []).length === 0 && <li>אין פוסטים.</li>}
            {(posts ?? []).map((p) => (
              <li key={p.id}>
                {p.title} <span style={{ color: "#7A5566" }}>({p.status === "published" ? "פורסם" : p.status === "pending" ? "ממתין" : "מוסתר"})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
