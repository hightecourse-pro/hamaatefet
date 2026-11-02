import Link from "next/link";
import { requireActive } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MemberFrame } from "@/components/member-frame";
import { getContent } from "@/lib/content";
import { lines as splitLines } from "@/lib/copy";
import { ThreadRow, type ThreadSummary } from "./thread-row";
import { NewThreadBar } from "./new-thread-bar";
import { asAction } from "@/lib/sections";

/** The one-line explanation under a section's description, by what members do there. */
const MODE_TEXT: Record<string, string> = { thread: "forum.mode.members", help_ask: "forum.mode.members", question: "forum.mode.question", request: "forum.mode.team", none: "forum.mode.none" };

export const metadata = { title: "הפורום" };

/**
 * The forum as a thread list (the owner, 2/11: "כמו הפורום בקוד פתוח"): section
 * chips are entrances, «הכל» mixes every section; a row opens the whole
 * conversation on its own page. Compact rows – many per screen.
 */
export default async function ForumPage({ searchParams }: { searchParams: Promise<{ section?: string; q?: string }> }) {
  const { userId, profile } = await requireActive();
  const isAdmin = profile.role === "admin";
  const { section: sectionParam, q } = await searchParams;
  const supabase = await createClient();
  const c = await getContent();
  const ALL = { key: "all", name: c.get("forum.all"), description: c.get("forum.all.desc"), color: "#3A1530", tint: "#F3E6EE", icon: "M4 6h16M4 12h16M4 18h10", is_new: false };

  const { data: sectionsRaw } = await supabase.from("forum_sections").select("*").eq("visible", true).order("sort_order");
  const sections = sectionsRaw ?? [];
  const current = sections.find((s) => s.key === sectionParam)?.key ?? "all";
  const currentSection = sections.find((s) => s.key === current) ?? null;

  let query = supabase.from("post_feed").select("*").order("pinned", { ascending: false }).order("last_activity_at", { ascending: false }).limit(80);
  if (current !== "all") query = query.eq("section_key", current);
  if (q && q.trim()) {
    const term = q.trim().replace(/[%_,()]/g, " ");
    query = query.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
  }
  const { data: postsRaw } = await query;
  const posts = (postsRaw ?? []) as ThreadSummary[];

  const feedTitle = q ? c.get("forum.search.results", { חיפוש: q }) : current === "all" ? c.get("forum.feed.title") : (currentSection?.name ?? "");
  const tiles = [ALL, ...sections];
  const copy = c.copy("forum.", "general.", "editor.", "widget.sending");
  // House rules: the section's own text when the team wrote one, else the general rules from «תוכן האתר».
  const sectionRules = currentSection?.rules ? splitLines(currentSection.rules) : [];
  const rulesTitle = sectionRules.length && currentSection ? c.get("forum.rules.section_toggle", { מדור: currentSection.name }) : c.get("forum.rules.toggle");
  const ruleLines = sectionRules.length ? sectionRules : c.lines("forum.rules");

  return (
    <MemberFrame profile={profile} current="forum">
      <section style={{ background: "#4A1942", color: "#FBE3D6", position: "relative", overflow: "hidden" }}>
        <div aria-hidden="true" style={{ position: "absolute", top: 18, left: "8%", width: 18, height: 18, borderRadius: "50%", background: "#F0A35E" }} />
        <div aria-hidden="true" style={{ position: "absolute", bottom: 18, left: "30%", width: 12, height: 12, borderRadius: 4, background: "#E07A8F", transform: "rotate(30deg)" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 36px", display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16, position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="hand" style={{ fontSize: 18, color: "#F6C9A6" }}>
              {c.get("forum.tagline")}
            </span>
            <h1 style={{ margin: 0, fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 700, lineHeight: 1, color: "#FFFFFF" }}>{c.get("forum.title")}</h1>
            <p style={{ margin: "4px 0 0", fontSize: 16, maxWidth: 560, lineHeight: 1.5, whiteSpace: "pre-line" }}>{c.get("forum.intro")}</p>
          </div>
          <form action="/forum" method="get" style={{ position: "relative", display: "block" }}>
            {current !== "all" && <input type="hidden" name="section" value={current} />}
            <label>
              <span className="sr-only">{c.get("forum.search")}</span>
              <input type="search" name="q" defaultValue={q ?? ""} placeholder={c.get("forum.search")} style={{ width: 250, height: 46, boxSizing: "border-box", borderRadius: 999, border: "none", padding: "0 44px 0 16px", fontSize: 16, background: "#FFF3EA", color: "#3A1530" }} />
            </label>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A5566" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" style={{ position: "absolute", right: 16, top: 14 }}>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </form>
        </div>
      </section>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 56px", display: "flex", flexDirection: "column", gap: 16 }}>
        <nav aria-label={c.get("forum.title")} style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: -22, position: "relative" }}>
          {tiles.map((s) => {
            const on = s.key === current;
            const href = s.key === "all" ? "/forum" : `/forum?section=${s.key}`;
            return (
              <Link
                key={s.key}
                href={href}
                className="chip"
                aria-current={on ? "page" : undefined}
                title={s.description}
                style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 16px 0 14px", borderRadius: 999, textDecoration: "none", fontSize: 15, fontWeight: 600, background: on ? s.color : "#FFFFFF", color: on ? "#FFF3EA" : "#3A1530", border: on ? `2px solid ${s.color}` : "2px solid #F0E2D8", boxShadow: on ? `3px 3px 0 ${s.tint}` : "3px 3px 0 #F3E6DD" }}
              >
                <span style={{ width: 26, height: 26, borderRadius: 9, background: on ? "rgba(255,255,255,0.18)" : s.tint, display: "flex", alignItems: "center", justifyContent: "center", color: on ? "#FFF3EA" : s.color }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={s.icon} />
                  </svg>
                </span>
                {s.name}
                {s.is_new && (
                  <span className="hand" style={{ position: "absolute", top: -11, left: 10, background: "#F0A35E", color: "#3A1530", fontSize: 12, fontWeight: 600, padding: "1px 8px", borderRadius: 999, transform: "rotate(-8deg)" }}>
                    {c.get("forum.new_badge")}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {currentSection && (
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "#5A3348" }}>
            <b>{currentSection.description}</b> {c.get(MODE_TEXT[currentSection.member_action] ?? "forum.mode.team")}
          </p>
        )}

        <NewThreadBar
          sections={sections.map((s) => ({ id: s.id, key: s.key, name: s.name, description: s.description, member_action: asAction(s.member_action), action_label: s.action_label, action_field1: s.action_field1, action_field2: s.action_field2 }))}
          current={current}
          rules={{ title: rulesTitle, lines: ruleLines }}
          isAdmin={isAdmin}
          userId={userId}
          copy={copy}
        />

        <section aria-labelledby="feed" style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 22, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, padding: "14px 16px 10px" }}>
            <h2 id="feed" style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
              <span className="grad">{feedTitle}</span>
            </h2>
            <span className="hand" style={{ fontSize: 15, color: "#7A5566" }}>
              {c.get("forum.feed.note")}
            </span>
          </div>
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 16px 32px", color: "#6A4558", fontSize: 16, borderTop: "1px solid #F3E6DD" }}>{q ? c.get("forum.search.empty") : c.get("forum.empty")}</div>
          ) : (
            posts.map((p) => <ThreadRow key={p.id} p={p} c={c} />)
          )}
        </section>

        <details style={{ background: "#FFFFFF", border: "2px dashed #E2C8BB", borderRadius: 18, padding: "10px 18px" }}>
          <summary className="hand" style={{ cursor: "pointer", fontSize: 19, color: "#A3304A", listStyle: "none" }}>
            {rulesTitle}
          </summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 0 4px" }}>
            {ruleLines.map((line, i) => (
              <p key={i} style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
                {line}
              </p>
            ))}
          </div>
        </details>
      </main>
    </MemberFrame>
  );
}
