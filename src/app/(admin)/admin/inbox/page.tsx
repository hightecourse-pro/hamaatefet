import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { timeAgo } from "@/lib/hebrew";
import { setMessageStatus, deleteMessage, setLaunchNudge } from "../actions";
import { ActionButton, Toggle } from "../ui";

export const metadata = { title: "פניות" };

const KIND: Record<string, { label: string; cls: React.CSSProperties }> = {
  bug: { label: "דיווח על תקלה", cls: { background: "#FBE1E4", color: "#A3304A" } },
  question: { label: "שאלה לצוות", cls: { background: "#F1E2EE", color: "#4A1942" } },
  topic: { label: "בקשה לנושא", cls: { background: "#FCE7D6", color: "#9A4318" } },
};
const FILTERS = [
  { key: "new", label: "פתוחות" },
  { key: "handled", label: "טופלו" },
  { key: "all", label: "הכל" },
];

/**
 * The team inbox: everything the floating widget and the forum's "ask" /
 * "topic request" buttons send. Reply straight by mail (the member's address
 * is the reply-to of the alert, and here as a mailto), then mark handled.
 */
export default async function AdminInboxPage({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string }> }) {
  await requireAdmin();
  const { status: statusParam, kind: kindParam } = await searchParams;
  const status = FILTERS.some((f) => f.key === statusParam) ? statusParam! : "new";
  const kind = kindParam && KIND[kindParam] ? kindParam : "";
  const admin = createAdminClient();
  let query = admin
    .from("team_messages")
    .select("id, kind, subject, body, page, status, created_at, handled_at, profiles!team_messages_user_id_fkey(id, first_name, last_name, email, phone), forum_sections(name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all") query = query.eq("status", status);
  if (kind) query = query.eq("kind", kind as "bug" | "question" | "topic");
  const [{ data: rows }, { data: nudge }, counts] = await Promise.all([
    query,
    admin.from("settings").select("value").eq("key", "launch_nudge").maybeSingle(),
    (async () => {
      const [n, h] = await Promise.all([admin.from("team_messages").select("id", { count: "exact", head: true }).eq("status", "new"), admin.from("team_messages").select("id", { count: "exact", head: true }).eq("status", "handled")]);
      return { new: n.count ?? 0, handled: h.count ?? 0 };
    })(),
  ]);
  const nudgeOn = (nudge?.value as { enabled?: boolean } | null)?.enabled !== false;
  const href = (s: string, k: string) => `/admin/inbox?status=${s}${k ? `&kind=${k}` : ""}`;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
            <span className="grad">פניות</span>
          </h1>
          <span style={{ fontSize: 15, color: "#6A4558" }}>
            {counts.new} פתוחות · {counts.handled} טופלו
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#5A3348" }}>
          כל מה שמגיע מהכפתור הצף «יש לך משהו לספר לנו?», מכפתורי «שאלה ל…» במדורים ומ«בקשה לנושא». כל פנייה נשלחת גם למייל של הצוות, עם כתובת השולחת כ-reply-to – אפשר לענות ישירות מהמייל ואז לסמן כאן «טופל».
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {FILTERS.map((f) => (
            <Link key={f.key} href={href(f.key, kind)} aria-current={f.key === status ? "page" : undefined} className={f.key === status ? "btn-sm-green" : "btn-sm"} style={{ textDecoration: "none" }}>
              {f.label}
            </Link>
          ))}
          <span style={{ width: 1, height: 24, background: "#F0E2D8", margin: "0 4px" }} aria-hidden="true" />
          <Link href={href(status, "")} className={!kind ? "btn-sm-green" : "btn-sm"} style={{ textDecoration: "none" }}>
            כל הסוגים
          </Link>
          {Object.entries(KIND).map(([k, v]) => (
            <Link key={k} href={href(status, k)} className={kind === k ? "btn-sm-green" : "btn-sm"} style={{ textDecoration: "none" }}>
              {v.label}
            </Link>
          ))}
        </div>
        <div style={{ borderTop: "1.5px dashed #EBD4C8", paddingTop: 10 }}>
          <Toggle checked={nudgeOn} label="להציג לחברות את הבועה «המעטפת בהרצה 🚀 מצאת באג?» ליד הכפתור הצף" action={setLaunchNudge} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(rows ?? []).length === 0 && (
          <div className="surface" style={{ textAlign: "center", color: "#6A4558", fontSize: 16 }}>
            אין פניות {status === "new" ? "פתוחות" : status === "handled" ? "שטופלו" : ""} כרגע.
          </div>
        )}
        {(rows ?? []).map((m) => {
          const p = m.profiles;
          const name = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "חברה";
          const k = KIND[m.kind] ?? KIND.bug;
          const mailSubject = encodeURIComponent(`Re: ${m.subject || k.label} – המעטפת`);
          return (
            <article key={m.id} style={{ background: "#FFFFFF", border: `2px solid ${m.status === "new" ? "#F0A35E" : "#F0E2D8"}`, borderRadius: 20, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8, opacity: m.status === "handled" ? 0.85 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 14, color: "#6A4558" }}>
                <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 13, fontWeight: 700, ...k.cls }}>{k.label}</span>
                {m.forum_sections?.name && <span style={{ padding: "2px 10px", borderRadius: 999, background: "#F6F0EC", fontSize: 13 }}>{m.forum_sections.name}</span>}
                {p?.id ? (
                  <Link href={`/admin/members/${p.id}`} target="_blank" rel="noopener" style={{ fontWeight: 600, color: "#3A1530" }}>
                    {name}
                  </Link>
                ) : (
                  <b>{name}</b>
                )}
                {p?.email && (
                  <a href={`mailto:${p.email}?subject=${mailSubject}`} dir="ltr" style={{ color: "#A3304A" }}>
                    {p.email}
                  </a>
                )}
                {p?.phone && (
                  <span dir="ltr" style={{ color: "#6A4558" }}>
                    {p.phone}
                  </span>
                )}
                <span style={{ marginRight: "auto" }}>{timeAgo(m.created_at)}</span>
              </div>
              {m.subject && <strong style={{ fontSize: 17 }}>{m.subject}</strong>}
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "#3A1530" }}>{m.body}</p>
              {m.page && (
                <span style={{ fontSize: 13, color: "#7A5566" }}>
                  נשלח מהמסך: <span dir="ltr">{m.page}</span>
                </span>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", borderTop: "1px solid #F3E6DD", paddingTop: 8 }}>
                {m.status === "new" ? (
                  <ActionButton className="btn-sm-green" action={setMessageStatus.bind(null, m.id, "handled")}>
                    סימון כטופל
                  </ActionButton>
                ) : (
                  <ActionButton className="btn-sm" action={setMessageStatus.bind(null, m.id, "new")}>
                    להחזיר לפתוח
                  </ActionButton>
                )}
                {p?.email && (
                  <a href={`mailto:${p.email}?subject=${mailSubject}`} className="btn-sm" style={{ textDecoration: "none" }}>
                    מענה במייל
                  </a>
                )}
                <ActionButton className="btn-sm-rust" confirm="למחוק את הפנייה?" action={deleteMessage.bind(null, m.id)}>
                  מחיקה
                </ActionButton>
                {m.handled_at && <span style={{ fontSize: 13, color: "#2F6B3A", marginRight: "auto" }}>טופל {timeAgo(m.handled_at)}</span>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
