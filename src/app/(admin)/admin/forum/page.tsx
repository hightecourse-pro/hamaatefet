import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { timeAgo } from "@/lib/hebrew";
import { setForumModeration, setSectionVisible, setPost } from "../actions";
import { ActionButton, Toggle } from "../ui";
import { NewSectionForm } from "./new-section-form";

export const metadata = { title: "הפורום" };

export default async function AdminForumPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const [{ data: sections }, { data: moderation }, { data: queue }, { data: recent }] = await Promise.all([
    admin.from("forum_sections").select("*").order("sort_order"),
    admin.from("settings").select("value").eq("key", "forum_moderation").maybeSingle(),
    admin.from("posts").select("id, title, created_at, status, pinned, forum_sections(name), profiles(first_name, last_name)").eq("status", "pending").order("created_at"),
    admin.from("posts").select("id, title, created_at, status, pinned, forum_sections(name), profiles(first_name, last_name)").neq("status", "pending").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(30),
  ]);
  const moderated = !!(moderation?.value as { enabled?: boolean } | null)?.enabled;

  const Row = ({ q, pending }: { q: NonNullable<typeof queue>[number]; pending: boolean }) => (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: 14, border: `1.5px solid ${q.pinned ? "#F0A35E" : "#F3E6DD"}`, borderRadius: 16, opacity: q.status === "hidden" ? 0.6 : 1 }}>
      <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: 2 }}>
        <strong style={{ fontSize: 17 }}>{q.title}</strong>
        <span style={{ fontSize: 14, color: "#6A4558" }}>
          {q.forum_sections?.name} · {`${q.profiles?.first_name ?? ""} ${q.profiles?.last_name ?? ""}`.trim() || "חברה"} · {timeAgo(q.created_at)}
          {q.status === "hidden" && " · מוסתר"}
          {q.pinned && " · מוצמד"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(pending || q.status === "hidden") && (
          <ActionButton className="btn-sm-green" action={setPost.bind(null, q.id, { status: "published" as const })}>
            פרסום
          </ActionButton>
        )}
        <ActionButton className="btn-sm" action={setPost.bind(null, q.id, { pinned: !q.pinned, ...(pending ? { status: "published" as const } : {}) })}>
          {q.pinned ? "ביטול הצמדה" : "הצמדה"}
        </ActionButton>
        {q.status !== "hidden" && (
          <ActionButton className="btn-sm" action={setPost.bind(null, q.id, { status: "hidden" as const })}>
            הסתרה
          </ActionButton>
        )}
      </div>
    </div>
  );

  return (
    <section style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 300px", background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
            <span className="grad">מדורים</span>
          </h1>
        </div>
        {(sections ?? []).map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", borderRadius: 16, background: "#FBF1EA" }}>
            <span style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>{s.name}</span>
              <span style={{ fontSize: 13, color: "#6A4558" }}>{s.description}</span>
            </span>
            <Toggle checked={s.visible} label="מוצג" action={setSectionVisible.bind(null, s.id)} />
          </div>
        ))}
        <NewSectionForm />
        <div style={{ borderTop: "1.5px dashed #EBD4C8", paddingTop: 12, marginTop: 4 }}>
          <Toggle checked={moderated} label="פוסטים חדשים מתפרסמים רק אחרי אישור הצוות" action={setForumModeration} />
        </div>
      </div>

      <div style={{ flex: "999 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
            <span className="grad">פוסטים לבדיקה</span>
          </h2>
          {(queue ?? []).length === 0 && <span style={{ fontSize: 15, color: "#6A4558" }}>אין פוסטים שממתינים לאישור.</span>}
          {(queue ?? []).map((q) => (
            <Row key={q.id} q={q} pending />
          ))}
        </div>
        <div style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            <span className="grad">פוסטים אחרונים</span>
          </h2>
          {(recent ?? []).length === 0 && <span style={{ fontSize: 15, color: "#6A4558" }}>עוד אין פוסטים.</span>}
          {(recent ?? []).map((q) => (
            <Row key={q.id} q={q} pending={false} />
          ))}
        </div>
      </div>
    </section>
  );
}
