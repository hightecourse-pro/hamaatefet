"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toggleLike, addComment, deleteOwnPost, deleteOwnComment } from "./actions";
import { timeAgo } from "@/lib/hebrew";

export interface FeedPost {
  id: string;
  title: string;
  body: string;
  image_path: string | null;
  help_kind: "asking" | "offering" | null;
  status: "pending" | "published" | "hidden";
  pinned: boolean;
  created_at: string;
  author_id: string;
  section_key: string;
  section_name: string;
  section_color: string;
  section_tint: string;
  author_first_name: string;
  author_last_name: string;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}

export interface FeedComment {
  id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

const CTA: Record<string, string> = { talk: "להצטרף לדיון", bts: "להגיב", content: "להגיב" };

function ctaFor(p: FeedPost): string {
  if (p.section_key === "help") return p.help_kind === "offering" ? "אשמח!" : "אני יכולה לעזור";
  return CTA[p.section_key] ?? "להגיב";
}

const ACTION_BTN = { display: "flex", alignItems: "center", gap: 6, minHeight: 44, padding: "0 14px", borderRadius: 999, border: "none", background: "#FBEDE4", color: "#6E0F1A", fontSize: 16, cursor: "pointer" } as const;

export function PostCard({ post, comments, imageUrl, userId }: { post: FeedPost; comments: FeedComment[]; imageUrl: string | null; userId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.like_count);

  const name = `${post.author_first_name} ${post.author_last_name}`.trim() || "חברת המעטפת";
  const initial = (post.author_first_name || post.author_last_name || "מ").charAt(0);
  const titlePrefix = post.section_key === "help" && post.help_kind ? (post.help_kind === "asking" ? "מבקשת: " : "מציעה: ") : "";
  const mine = post.author_id === userId;

  function onLike() {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    start(async () => {
      const r = await toggleLike(post.id);
      if (r.error) {
        setLiked(!next);
        setLikes((n) => n - (next ? 1 : -1));
        setError(r.error);
      }
    });
  }

  function onComment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = String(new FormData(form).get("body") ?? "");
    start(async () => {
      setError(null);
      const r = await addComment(post.id, body);
      if (r.error) setError(r.error);
      else form.reset();
    });
  }

  return (
    <article className="post" style={{ background: "#FFFFFF", border: `2px solid ${post.pinned ? "#F0A35E" : "#F0E2D8"}`, borderRadius: 24, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: "50%", background: post.section_tint, color: post.section_color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
          {initial}
        </span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 600, fontSize: 17 }}>{name}</span>
          <span style={{ fontSize: 14, color: "#7A5566" }}>{timeAgo(post.created_at)}</span>
        </div>
        <span style={{ marginRight: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          {post.pinned && (
            <span className="hand" style={{ fontSize: 14, color: "#9A4318" }}>
              מוצמד
            </span>
          )}
          {post.status === "pending" && <span className="pill pill-pending">ממתין לאישור הצוות</span>}
          <span style={{ padding: "5px 12px", borderRadius: 999, background: post.section_tint, color: post.section_color, fontSize: 14, fontWeight: 600 }}>{post.section_name}</span>
        </span>
      </div>
      <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
        {titlePrefix}
        {post.title}
      </h3>
      <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "#5A3348", whiteSpace: "pre-wrap" }}>{post.body}</p>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" style={{ maxWidth: "100%", maxHeight: 420, borderRadius: 16, border: "1.5px solid #F0E2D8", objectFit: "cover" }} />
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", borderTop: "1.5px dashed #EBD4C8", paddingTop: 12 }}>
        <button type="button" onClick={onLike} aria-pressed={liked} style={{ ...ACTION_BTN, background: liked ? "#F6DADC" : "#FBEDE4", fontWeight: liked ? 700 : 400 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          אהבתי{likes > 0 ? ` · ${likes}` : ""}
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={ACTION_BTN}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {ctaFor(post)}
          {comments.length > 0 ? ` · ${comments.length}` : ""}
        </button>
        {mine && (
          <button
            type="button"
            className="btn-link"
            style={{ marginRight: "auto", fontSize: 14, color: "#7A5566" }}
            onClick={() => {
              if (window.confirm("למחוק את הפוסט?")) start(async () => void (await deleteOwnPost(post.id)));
            }}
          >
            מחיקה
          </button>
        )}
      </div>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "#FBF1EA", borderRadius: 16, padding: 14 }}>
          {comments.length === 0 && <span style={{ fontSize: 15, color: "#7A5566" }}>עוד אין תגובות – תהיי הראשונה.</span>}
          {comments.map((c) => (
            <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: 2, background: "#fff", borderRadius: 12, padding: "10px 12px" }}>
              <span style={{ fontSize: 14, color: "#7A5566" }}>
                <b style={{ color: "#3A1530" }}>{c.author_name}</b> · {timeAgo(c.created_at)}
                {c.author_id === userId && (
                  <button type="button" className="btn-link" style={{ fontSize: 13, marginRight: 8, padding: 0 }} onClick={() => start(async () => void (await deleteOwnComment(c.id)))}>
                    מחיקה
                  </button>
                )}
              </span>
              <span style={{ fontSize: 16, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{c.body}</span>
            </div>
          ))}
          {post.status === "published" && (
            <form onSubmit={onComment} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <textarea className="fld" name="body" rows={2} placeholder="מה את חושבת?" required style={{ flex: 1 }} />
              <button type="submit" className="btn-primary" disabled={pending} style={{ height: 48, padding: "0 18px", fontSize: 16 }}>
                שולחת
              </button>
            </form>
          )}
          {error && (
            <span role="alert" style={{ fontSize: 14, color: "#A3304A" }}>
              {error}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
