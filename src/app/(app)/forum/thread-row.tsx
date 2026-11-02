import Link from "next/link";
import { timeAgo } from "@/lib/hebrew";
import type { Content } from "@/lib/content";

/** One thread in the list – who opened what, in which section, how alive it is. */
export interface ThreadSummary {
  id: string;
  title: string;
  help_kind: "asking" | "offering" | null;
  status: "pending" | "published" | "hidden";
  pinned: boolean;
  created_at: string;
  last_activity_at: string;
  section_key: string;
  section_name: string;
  section_color: string;
  section_tint: string;
  author_first_name: string;
  author_last_name: string;
  like_count: number;
  comment_count: number;
}

export function ThreadRow({ p, c }: { p: ThreadSummary; c: Content }) {
  const name = `${p.author_first_name} ${p.author_last_name}`.trim() || c.get("general.member_fallback");
  const initial = (p.author_first_name || p.author_last_name || "מ").charAt(0);
  const prefix = p.section_key === "help" && p.help_kind ? `${c.get(p.help_kind === "asking" ? "forum.prefix.asking" : "forum.prefix.offering")} ` : "";
  const hasReplies = p.comment_count > 0 && p.last_activity_at !== p.created_at;
  return (
    <Link href={`/forum/${p.id}`} className="trow" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderTop: "1px solid #F3E6DD", textDecoration: "none", color: "#3A1530", opacity: p.status === "hidden" ? 0.6 : 1 }}>
      <span aria-hidden="true" style={{ flex: "none", width: 38, height: 38, borderRadius: "50%", background: p.section_tint, color: p.section_color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>
        {initial}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          {p.pinned && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A4318" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
              <path d="M12 17v5M9 3h6l-1 7 3 3H7l3-3z" />
            </svg>
          )}
          <span className="trow-title" style={{ fontSize: 16, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {prefix}
            {p.title}
          </span>
          {p.status === "hidden" && <span className="pill pill-paused">{c.get("forum.hidden")}</span>}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#7A5566", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <span style={{ padding: "1px 9px", borderRadius: 999, background: p.section_tint, color: p.section_color, fontWeight: 600, fontSize: 12 }}>{p.section_name}</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
          <span>·</span>
          <span>{timeAgo(p.created_at)}</span>
        </span>
      </span>
      <span style={{ flex: "none", display: "flex", alignItems: "center", gap: 10 }}>
        {p.like_count > 0 && (
          <span className="trow-last" style={{ alignItems: "center", gap: 4, fontSize: 13, color: "#7A5566" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            {p.like_count}
          </span>
        )}
        <span title={c.get("forum.list.comments", { מספר: p.comment_count })} style={{ display: "inline-flex", alignItems: "center", gap: 5, minWidth: 48, justifyContent: "center", padding: "4px 10px", borderRadius: 999, background: p.comment_count > 0 ? "#F1E2EE" : "#F6F0EC", color: p.comment_count > 0 ? "#4A1942" : "#9A8590", fontSize: 13, fontWeight: 700 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {p.comment_count}
        </span>
        <span className="trow-last" style={{ flexDirection: "column", alignItems: "flex-end", width: 96, fontSize: 12, color: "#7A5566", lineHeight: 1.3 }}>
          {hasReplies ? <span style={{ color: "#A3304A" }}>{c.get("forum.list.last", { זמן: timeAgo(p.last_activity_at) })}</span> : <span>&nbsp;</span>}
        </span>
      </span>
    </Link>
  );
}
