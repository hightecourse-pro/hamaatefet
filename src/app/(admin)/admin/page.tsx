import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { monthName, monthOptions, civilDateLabel } from "@/lib/hebrew";
import { setMemberStatus } from "./actions";
import { ActionButton, PencilIcon, PauseIcon, PlayIcon } from "./ui";

export const metadata = { title: "משתתפות" };

const STATUS = {
  pending: { label: "ממתינה לאישור", cls: "pill pill-pending" },
  active: { label: "פעילה", cls: "pill pill-active" },
  paused: { label: "מושהית", cls: "pill pill-paused" },
} as const;

const FILTERS = [
  { key: "all", label: "הכל" },
  { key: "pending", label: "ממתינות לאישור" },
  { key: "active", label: "פעילות" },
  { key: "paused", label: "מושהות" },
];

export default async function AdminMembersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; month?: string; invited?: string }> }) {
  await requireAdmin();
  const { q, status, month, invited } = await searchParams;
  const admin = createAdminClient();
  let query = admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
  if (status && status in STATUS) query = query.eq("status", status as keyof typeof STATUS);
  if (month && Number(month) >= 1 && Number(month) <= 12) query = query.eq("birth_month", Number(month));
  if (q && q.trim()) {
    const term = q.trim().replace(/[%_,()]/g, " ");
    query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  const { data: rows } = await query;
  const members = rows ?? [];
  const exportHref = `/admin/export/members?${new URLSearchParams({ ...(status ? { status } : {}), ...(month ? { month } : {}), ...(q ? { q } : {}) }).toString()}`;

  return (
    <section style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
          <span className="grad">משתתפות</span>
        </h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <a href={exportHref} style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 16px", borderRadius: 14, border: "2px solid #EAD3C6", background: "#FFFFFF", color: "#6E0F1A", fontSize: 16, textDecoration: "none" }}>
            ייצוא לאקסל
          </a>
          <Link href="/admin/members/new" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 18px", borderRadius: 14, border: "none", background: "#6E0F1A", color: "#FFF3EA", fontSize: 16, fontWeight: 600, textDecoration: "none", boxShadow: "3px 3px 0 #4A1942" }}>
            + הוספת משתתפת
          </Link>
        </div>
      </div>
      {invited && (
        <p role="status" className="flash flash-ok" style={{ margin: 0 }}>
          ההזמנה נשלחה למייל שלה. היא תבחר סיסמה ותיכנס.
        </p>
      )}

      <form action="/admin" method="get" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <label style={{ flex: "1 1 240px", display: "flex" }}>
          <span className="sr-only">חיפוש משתתפת</span>
          <input className="fld fld-sm" name="q" type="search" defaultValue={q ?? ""} placeholder="חיפוש לפי שם, מייל או טלפון" style={{ width: "100%" }} />
        </label>
        {status && <input type="hidden" name="status" value={status} />}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {FILTERS.map((f) => {
            const on = (status ?? "all") === f.key;
            const params = new URLSearchParams({ ...(q ? { q } : {}), ...(month ? { month } : {}), ...(f.key !== "all" ? { status: f.key } : {}) });
            return (
              <Link
                key={f.key}
                href={`/admin?${params.toString()}`}
                aria-pressed={on}
                style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 16px", borderRadius: 999, fontSize: 15, textDecoration: "none", background: on ? "#4A1942" : "#FFFFFF", color: on ? "#FFF3EA" : "#4A1942", border: on ? "2px solid #4A1942" : "2px solid #EAD3C6", fontWeight: on ? 600 : 400 }}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <select className="fld fld-sm" name="month" aria-label="סינון לפי חודש לידה" defaultValue={month ?? ""} style={{ width: "auto" }}>
          <option value="">כל החודשים</option>
          {monthOptions().map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-sm" style={{ height: 46 }}>
          סינון
        </button>
      </form>

      <div style={{ overflowX: "auto", border: "1.5px solid #F3E6DD", borderRadius: 16 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>שם</th>
              <th>מייל</th>
              <th>טלפון</th>
              <th>חודש לידה</th>
              <th>הצטרפה</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#6A4558", padding: 28 }}>
                  אין משתתפות שמתאימות לסינון.
                </td>
              </tr>
            )}
            {members.map((m) => {
              const st = STATUS[m.status];
              const name = `${m.first_name} ${m.last_name}`.trim() || "(ללא שם)";
              return (
                <tr key={m.id}>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: "50%", background: "#F6D9CB", color: "#6E0F1A", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                        {(m.first_name || m.last_name || "?").charAt(0)}
                      </span>
                      <Link href={`/admin/members/${m.id}`} style={{ textDecoration: "none", color: "#3A1530", fontWeight: 500 }}>
                        {name}
                      </Link>
                      {m.role === "admin" && (
                        <span className="hand" style={{ fontSize: 13, color: "#9A4318" }}>
                          צוות
                        </span>
                      )}
                    </span>
                  </td>
                  <td dir="ltr" style={{ textAlign: "right", color: "#6A4558" }}>
                    {m.email}
                  </td>
                  <td dir="ltr" style={{ textAlign: "right", color: "#6A4558" }}>
                    {m.phone}
                  </td>
                  <td>{monthName(m.birth_month) || "—"}</td>
                  <td style={{ color: "#6A4558" }}>{civilDateLabel(m.created_at.slice(0, 10))}</td>
                  <td>
                    <span className={st.cls}>{st.label}</span>
                  </td>
                  <td>
                    <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {m.status === "pending" && (
                        <ActionButton className="btn-sm-green" action={setMemberStatus.bind(null, m.id, "active")}>
                          אישור
                        </ActionButton>
                      )}
                      <Link href={`/admin/members/${m.id}`} className="ib" aria-label="עריכה" style={{ textDecoration: "none" }}>
                        <PencilIcon />
                      </Link>
                      {m.status === "active" ? (
                        <ActionButton className="ib" ariaLabel="השהיה" confirm={`להשהות את ${name}?`} action={setMemberStatus.bind(null, m.id, "paused")}>
                          <PauseIcon />
                        </ActionButton>
                      ) : m.status === "paused" ? (
                        <ActionButton className="ib" ariaLabel="הפעלה מחדש" action={setMemberStatus.bind(null, m.id, "active")}>
                          <PlayIcon />
                        </ActionButton>
                      ) : null}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
