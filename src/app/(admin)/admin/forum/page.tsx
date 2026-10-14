import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { timeAgo } from "@/lib/hebrew";
import { richToText } from "@/lib/rich-text";
import { setSectionVisible, setPost } from "../actions";
import { ActionButton, Toggle } from "../ui";
import { NewSectionForm } from "./new-section-form";

export const metadata = { title: "הפורום" };

const weekAgoIso = () => new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

export default async function AdminForumPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const since = weekAgoIso();
  const [{ data: sections }, { data: posts }, { data: recentComments }] = await Promise.all([
    admin.from("forum_sections").select("*").order("sort_order"),
    admin.from("posts").select("id, title, created_at, status, pinned, forum_sections(name), profiles!posts_author_id_fkey(first_name, last_name)").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(40),
    admin.from("comments").select("id, body, created_at, post_id, profiles(first_name, last_name), posts(title)").gte("created_at", since).order("created_at", { ascending: false }).limit(30),
  ]);
  const counts = new Map<string, number>();
  if (posts?.length) {
    const { data: cs } = await admin.from("comments").select("post_id").in("post_id", posts.map((p) => p.id));
    for (const x of cs ?? []) counts.set(x.post_id, (counts.get(x.post_id) ?? 0) + 1);
  }

  return (
    <section style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 300px", background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
          <span className="grad">מדורים</span>
        </h1>
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
        <div style={{ borderTop: "1.5px dashed #EBD4C8", paddingTop: 12, marginTop: 4, fontSize: 15, color: "#6A4558", lineHeight: 1.6 }}>
          דיונים נפתחים רק על ידי הצוות, מתוך הפורום עצמו:{" "}
          <Link href="/forum#composer" style={{ fontWeight: 600 }}>
            לפתיחת דיון חדש
          </Link>
          . כל המשתתפות מגיבות.
        </div>
      </div>

      <div style={{ flex: "999 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
            <span className="grad">הדיונים</span>
          </h2>
          {(posts ?? []).length === 0 && <span style={{ fontSize: 15, color: "#6A4558" }}>עוד אין דיונים. הראשון מחכה לך בפורום.</span>}
          {(posts ?? []).map((q) => (
            <div key={q.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: 14, border: `1.5px solid ${q.pinned ? "#F0A35E" : "#F3E6DD"}`, borderRadius: 16, opacity: q.status === "hidden" ? 0.6 : 1 }}>
              <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: 2 }}>
                <strong style={{ fontSize: 17 }}>{q.title}</strong>
                <span style={{ fontSize: 14, color: "#6A4558" }}>
                  {q.forum_sections?.name} · {`${q.profiles?.first_name ?? ""} ${q.profiles?.last_name ?? ""}`.trim() || "צוות"} · {timeAgo(q.created_at)} · {counts.get(q.id) ?? 0} תגובות
                  {q.status === "hidden" && " · מוסתר"}
                  {q.pinned && " · מוצמד"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {q.status === "hidden" ? (
                  <ActionButton className="btn-sm-green" action={setPost.bind(null, q.id, { status: "published" as const })}>
                    פרסום מחדש
                  </ActionButton>
                ) : (
                  <ActionButton className="btn-sm" action={setPost.bind(null, q.id, { status: "hidden" as const })}>
                    הסתרה
                  </ActionButton>
                )}
                <ActionButton className="btn-sm" action={setPost.bind(null, q.id, { pinned: !q.pinned })}>
                  {q.pinned ? "ביטול הצמדה" : "הצמדה"}
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            <span className="grad">תגובות מהשבוע האחרון</span>
          </h2>
          {(recentComments ?? []).length === 0 && <span style={{ fontSize: 15, color: "#6A4558" }}>שקט השבוע.</span>}
          {(recentComments ?? []).map((x) => (
            <div key={x.id} style={{ fontSize: 15, lineHeight: 1.5, padding: "8px 0", borderTop: "1px solid #F3E6DD" }}>
              <b>{`${x.profiles?.first_name ?? ""} ${x.profiles?.last_name ?? ""}`.trim()}</b> על «{x.posts?.title}» · {timeAgo(x.created_at)}
              <br />
              <span style={{ color: "#5A3348" }}>{richToText(x.body).slice(0, 160)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
