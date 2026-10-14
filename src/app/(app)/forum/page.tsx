import Link from "next/link";
import { requireActive } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MemberFrame } from "@/components/member-frame";
import { PostCard, type FeedPost, type FeedComment } from "./post-card";
import { Composer } from "./composer";

export const metadata = { title: "הפורום" };

const ALL = { key: "all", name: "הכל", description: "כל מה שקורה במעטפת, במקום אחד", color: "#3A1530", tint: "#F3E6EE", icon: "M4 6h16M4 12h16M4 18h10", is_new: false };

export default async function ForumPage({ searchParams }: { searchParams: Promise<{ section?: string; q?: string }> }) {
  const { userId, profile } = await requireActive();
  const { section: sectionParam, q } = await searchParams;
  const supabase = await createClient();

  const [{ data: sectionsRaw }, { data: moderation }] = await Promise.all([
    supabase.from("forum_sections").select("*").eq("visible", true).order("sort_order"),
    supabase.from("settings").select("value").eq("key", "forum_moderation").maybeSingle(),
  ]);
  const sections = sectionsRaw ?? [];
  const current = sections.find((s) => s.key === sectionParam)?.key ?? "all";
  const moderated = !!(moderation?.value as { enabled?: boolean } | null)?.enabled;

  let query = supabase.from("post_feed").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(60);
  if (current !== "all") query = query.eq("section_key", current);
  if (q && q.trim()) {
    const term = q.trim().replace(/[%_,()]/g, " ");
    query = query.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
  }
  const { data: postsRaw } = await query;
  const posts = (postsRaw ?? []) as FeedPost[];

  const ids = posts.map((p) => p.id);
  const [{ data: commentsRaw }, signed] = await Promise.all([
    ids.length ? supabase.from("comments").select("id, post_id, author_id, body, created_at").in("post_id", ids).order("created_at") : Promise.resolve({ data: [] as { id: string; post_id: string; author_id: string; body: string; created_at: string }[] }),
    (async () => {
      const paths = posts.map((p) => p.image_path).filter((p): p is string => !!p);
      if (!paths.length) return new Map<string, string>();
      const { data } = await supabase.storage.from("forum-images").createSignedUrls(paths, 3600);
      return new Map((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl]));
    })(),
  ]);
  const comments = commentsRaw ?? [];
  const authorIds = Array.from(new Set(comments.map((c) => c.author_id)));
  const { data: authors } = authorIds.length ? await supabase.from("member_directory").select("id, first_name, last_name").in("id", authorIds) : { data: [] };
  const nameOf = new Map((authors ?? []).map((a) => [a.id, `${a.first_name} ${a.last_name}`.trim() || "חברת המעטפת"]));
  const commentsByPost = new Map<string, FeedComment[]>();
  for (const c of comments) {
    const list = commentsByPost.get(c.post_id) ?? [];
    list.push({ id: c.id, author_id: c.author_id, author_name: nameOf.get(c.author_id) ?? "חברת המעטפת", body: c.body, created_at: c.created_at });
    commentsByPost.set(c.post_id, list);
  }

  const feedTitle = current === "all" ? "מה חדש בפורום" : (sections.find((s) => s.key === current)?.name ?? "");
  const tiles = [ALL, ...sections];

  return (
    <MemberFrame profile={profile} current="forum">
      <section style={{ background: "#4A1942", color: "#FBE3D6", position: "relative", overflow: "hidden" }}>
        <div aria-hidden="true" style={{ position: "absolute", top: 30, left: "8%", width: 22, height: 22, borderRadius: "50%", background: "#F0A35E" }} />
        <div aria-hidden="true" style={{ position: "absolute", bottom: 30, left: "30%", width: 14, height: 14, borderRadius: 4, background: "#E07A8F", transform: "rotate(30deg)" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 56px", display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24, position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="hand" style={{ fontSize: 20, color: "#F6C9A6" }}>
              תוכן שיתופי חברתי בדיגיטל
            </span>
            <h1 style={{ margin: 0, fontSize: "clamp(48px, 7vw, 76px)", fontWeight: 700, lineHeight: 1, color: "#FFFFFF" }}>הפורום</h1>
            <p style={{ margin: "6px 0 0", fontSize: 19, maxWidth: 520, lineHeight: 1.55 }}>תכנים, מאחורי הקלעים, עזרה הדדית ודיונים קבוצתיים. היכנסי והכירי את המדורים החדשים!</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <form action="/forum" method="get" style={{ position: "relative", display: "block" }}>
              {current !== "all" && <input type="hidden" name="section" value={current} />}
              <label>
                <span className="sr-only">חיפוש בפורום</span>
                <input
                  type="search"
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="מחפשת משהו?"
                  style={{ width: 260, height: 52, boxSizing: "border-box", borderRadius: 999, border: "none", padding: "0 48px 0 18px", fontSize: 17, background: "#FFF3EA", color: "#3A1530" }}
                />
              </label>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A5566" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" style={{ position: "absolute", right: 18, top: 16 }}>
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </form>
            <a href="#composer" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 52, padding: "0 22px", borderRadius: 999, background: "#F0A35E", color: "#3A1530", fontSize: 18, fontWeight: 700, textDecoration: "none", boxShadow: "4px 4px 0 #2A0C25" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              דיון חדש
            </a>
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 72px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: -28, position: "relative" }}>
          {tiles.map((s) => {
            const on = s.key === current;
            const href = s.key === "all" ? "/forum" : `/forum?section=${s.key}`;
            return (
              <Link
                key={s.key}
                href={href}
                className="sec"
                aria-pressed={on}
                style={{
                  flex: "1 1 200px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 8,
                  textAlign: "right",
                  padding: 20,
                  borderRadius: 24,
                  cursor: "pointer",
                  color: "#3A1530",
                  textDecoration: "none",
                  background: "#FFFFFF",
                  border: on ? `3px solid ${s.color}` : "2px solid #F0E2D8",
                  boxShadow: on ? `6px 6px 0 ${s.color}` : "4px 4px 0 #EBD4C8",
                }}
              >
                {s.is_new && (
                  <span className="hand" style={{ position: "absolute", top: -12, left: 14, background: "#F0A35E", color: "#3A1530", fontSize: 14, fontWeight: 600, padding: "3px 12px", borderRadius: 999, transform: "rotate(-8deg)" }}>
                    חדש!
                  </span>
                )}
                <span style={{ width: 48, height: 48, borderRadius: 16, background: s.tint, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={s.icon} />
                  </svg>
                </span>
                <span style={{ fontSize: 20, fontWeight: 700 }}>{s.name}</span>
                <span style={{ fontSize: 15, lineHeight: 1.45, color: "#6A4558" }}>{s.description}</span>
              </Link>
            );
          })}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginTop: 48, alignItems: "flex-start" }}>
          <div style={{ flex: "999 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
                <span className="grad">{q ? `תוצאות עבור "${q}"` : feedTitle}</span>
              </h2>
              <span className="hand" style={{ fontSize: 17, color: "#7A5566" }}>
                הכי חדש למעלה
              </span>
            </div>
            {posts.length === 0 && (
              <div className="surface" style={{ textAlign: "center", padding: 36, color: "#6A4558", fontSize: 17 }}>
                {q ? "לא מצאנו כלום. נסי מילה אחרת?" : "עדיין שקט כאן. את יכולה להיות הראשונה – הטופס מחכה לך בצד."}
              </div>
            )}
            {posts.map((p) => (
              <PostCard key={p.id} post={p} comments={commentsByPost.get(p.id) ?? []} imageUrl={p.image_path ? signed.get(p.image_path) ?? null : null} userId={userId} />
            ))}
          </div>

          <aside style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 24 }}>
            <Composer sections={sections.map((s) => ({ key: s.key, name: s.name }))} moderated={moderated} userId={userId} />
            <section style={{ background: "#FFFFFF", border: "2px dashed #E2C8BB", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
              <h2 className="hand" style={{ margin: 0, fontSize: 22, color: "#A3304A" }}>
                כללי הבית
              </h2>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>מה שנאמר במעטפת – נשאר במעטפת.</p>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>מדברות בגובה העיניים ומפרגנות בלי חשבון.</p>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>שאלה טיפשית? אין דבר כזה.</p>
            </section>
          </aside>
        </div>
      </main>
    </MemberFrame>
  );
}
