import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { timeAgo } from "@/lib/hebrew";
import { richToText } from "@/lib/rich-text";
import { setPost, adminDeletePost, adminDeleteComment } from "../actions";
import { ActionButton } from "../ui";
import { NewSectionForm } from "./new-section-form";
import { SectionEditor } from "./section-editor";

export const metadata = { title: "הפורום" };

const weekAgoIso = () => new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

export default async function AdminForumPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const since = weekAgoIso();
  const [{ data: sections }, { data: posts }, { data: recentComments }, { data: allPosts }] = await Promise.all([
    admin.from("forum_sections").select("*").order("sort_order"),
    admin.from("posts").select("id, title, created_at, status, pinned, forum_sections(name), profiles!posts_author_id_fkey(first_name, last_name)").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(60),
    admin.from("comments").select("id, body, created_at, post_id, profiles(first_name, last_name), posts(title)").gte("created_at", since).order("created_at", { ascending: false }).limit(30),
    admin.from("posts").select("section_id"),
  ]);
  const perSection = new Map<string, number>();
  for (const p of allPosts ?? []) perSection.set(p.section_id, (perSection.get(p.section_id) ?? 0) + 1);
  const counts = new Map<string, number>();
  if (posts?.length) {
    const { data: cs } = await admin.from("comments").select("post_id").in("post_id", posts.map((p) => p.id));
    for (const x of cs ?? []) counts.set(x.post_id, (counts.get(x.post_id) ?? 0) + 1);
  }

  return (
    <section style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 340px", background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
          <span className="grad">מדורים</span>
        </h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#5A3348" }}>
          כל מדור הוא כניסה לדיונים שלו; «הכל» בפורום מראה את כולם יחד. בעריכה קובעים את השם והפירוט, מי פותחת דיונים (רק הצוות – והחברות שולחות בקשה לנושא – או כולן), וכפתור «שאלה ל…» שמגיע לתיבת הפניות, וכללי הבית של המדור (ריק = הכלליים מ«תוכן האתר»).
        </p>
        {(sections ?? []).map((s) => (
          <SectionEditor key={s.id} s={s} postCount={perSection.get(s.id) ?? 0} />
        ))}
        <NewSectionForm />
      </div>

      <div style={{ flex: "999 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
              <span className="grad">הדיונים</span>
            </h2>
            <Link href="/forum" target="_blank" rel="noopener" style={{ fontSize: 15, fontWeight: 600 }}>
              לפתיחת דיון חדש בפורום ↗
            </Link>
          </div>
          {(posts ?? []).length === 0 && <span style={{ fontSize: 15, color: "#6A4558" }}>עוד אין דיונים. הראשון מחכה לך בפורום.</span>}
          {(posts ?? []).map((q) => (
            <div key={q.id} data-testid="thread-row" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "10px 14px", border: `1.5px solid ${q.pinned ? "#F0A35E" : "#F3E6DD"}`, borderRadius: 16, opacity: q.status === "hidden" ? 0.6 : 1 }}>
              <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <Link href={`/forum/${q.id}`} target="_blank" rel="noopener" style={{ fontSize: 16, fontWeight: 600, color: "#3A1530", textDecoration: "none" }}>
                  {q.title}
                </Link>
                <span style={{ fontSize: 13, color: "#6A4558" }}>
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
                <ActionButton className="btn-sm-rust" confirm={`למחוק את הדיון «${q.title}» על כל התגובות שלו?`} action={adminDeletePost.bind(null, q.id)}>
                  מחיקה
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
            <div key={x.id} style={{ fontSize: 15, lineHeight: 1.5, padding: "8px 0", borderTop: "1px solid #F3E6DD", display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
              <span style={{ flex: "1 1 240px", minWidth: 0 }}>
                <b>{`${x.profiles?.first_name ?? ""} ${x.profiles?.last_name ?? ""}`.trim()}</b> על{" "}
                <Link href={`/forum/${x.post_id}`} target="_blank" rel="noopener">
                  «{x.posts?.title}»
                </Link>{" "}
                · {timeAgo(x.created_at)}
                <br />
                <span style={{ color: "#5A3348" }}>{richToText(x.body).slice(0, 160)}</span>
              </span>
              <ActionButton className="btn-sm" confirm="למחוק את התגובה?" action={adminDeleteComment.bind(null, x.id)}>
                מחיקה
              </ActionButton>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
