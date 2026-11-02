"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toggleLike, addComment, deletePost, deleteComment } from "../actions";
import { setPost } from "@/app/(admin)/admin/actions";
import { timeAgo } from "@/lib/hebrew";
import { RichHtml } from "@/components/rich-html";
import { RichEditor } from "@/components/rich-editor";
import { tx, type Copy } from "@/lib/copy";

export interface ThreadPost {
  id: string;
  title: string;
  body: string;
  help_kind: "asking" | "offering" | null;
  status: "pending" | "published" | "hidden";
  pinned: boolean;
  created_at: string;
  author_id: string;
  section_key: string;
  section_name: string;
  section_color: string;
  section_tint: string;
  author_name: string;
  like_count: number;
  liked_by_me: boolean;
}

export interface ThreadComment {
  id: string;
  author_id: string;
  author_name: string;
  author_is_team: boolean;
  body: string;
  created_at: string;
}

const SMALL_BTN = { display: "inline-flex", alignItems: "center", gap: 6, minHeight: 40, padding: "0 14px", borderRadius: 999, border: "none", background: "#FBEDE4", color: "#6E0F1A", fontSize: 15, cursor: "pointer", fontFamily: "inherit" } as const;

export function Thread({ post, comments, imageUrl, userId, isAdmin, copy }: { post: ThreadPost; comments: ThreadComment[]; imageUrl: string | null; userId: string; isAdmin: boolean; copy: Copy }) {
  const t = (k: string, vars?: Record<string, string>) => tx(copy, k, vars);
  const editorLabels = { bold: copy["editor.bold"], italic: copy["editor.italic"], underline: copy["editor.underline"], list: copy["editor.list"], link: copy["editor.link"], linkPrompt: copy["editor.link_prompt"], emoji: copy["editor.emoji"], emojiPicker: copy["editor.emoji_picker"] };
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.like_count);
  const [resetKey, setResetKey] = useState(0);
  const mine = post.author_id === userId;
  const prefix = post.section_key === "help" && post.help_kind ? `${t(post.help_kind === "asking" ? "forum.prefix.asking" : "forum.prefix.offering")} ` : "";
  const initial = post.author_name.charAt(0) || "מ";

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
    const body = String(new FormData(e.currentTarget).get("comment") ?? "");
    start(async () => {
      setError(null);
      const r = await addComment(post.id, body);
      if (r.error) setError(r.error);
      else {
        setResetKey((k) => k + 1);
        router.refresh();
      }
    });
  }

  function onDeletePost() {
    if (!window.confirm(t("forum.delete_confirm"))) return;
    start(async () => {
      const r = await deletePost(post.id);
      if (r.error) setError(r.error);
      else router.push("/forum");
    });
  }

  function onDeleteComment(id: string) {
    if (!window.confirm(t("forum.thread.delete_comment_confirm"))) return;
    start(async () => {
      const r = await deleteComment(id, post.id);
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  function onAdmin(patch: { pinned?: boolean; status?: "published" | "hidden" }) {
    start(async () => {
      const r = await setPost(post.id, patch);
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <article style={{ background: "#FFFFFF", border: `2px solid ${post.pinned ? "#F0A35E" : "#F0E2D8"}`, borderRadius: 24, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
        {post.status === "hidden" && (
          <p className="flash flash-err" style={{ margin: 0 }}>
            {t("forum.thread.hidden_note")}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span aria-hidden="true" style={{ width: 42, height: 42, borderRadius: "50%", background: post.section_tint, color: post.section_color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
            {initial}
          </span>
          <span style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{post.author_name}</span>
            <span style={{ fontSize: 13, color: "#7A5566" }}>{timeAgo(post.created_at)}</span>
          </span>
          <span style={{ marginRight: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            {post.pinned && (
              <span className="hand" style={{ fontSize: 14, color: "#9A4318" }}>
                {t("forum.pinned")}
              </span>
            )}
            <span style={{ padding: "4px 12px", borderRadius: 999, background: post.section_tint, color: post.section_color, fontSize: 13, fontWeight: 600 }}>{post.section_name}</span>
          </span>
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, lineHeight: 1.25 }}>
          {prefix}
          {post.title}
        </h1>
        <RichHtml html={post.body} style={{ fontSize: 17, lineHeight: 1.6, color: "#5A3348" }} />
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" style={{ maxWidth: "100%", maxHeight: 460, borderRadius: 16, border: "1.5px solid #F0E2D8", objectFit: "cover" }} />
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", borderTop: "1.5px dashed #EBD4C8", paddingTop: 12 }}>
          <button type="button" onClick={onLike} aria-pressed={liked} style={{ ...SMALL_BTN, background: liked ? "#F6DADC" : "#FBEDE4", fontWeight: liked ? 700 : 400 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            {t("forum.like")}
            {likes > 0 ? ` · ${likes}` : ""}
          </button>
          <span style={{ ...SMALL_BTN, cursor: "default", background: "#F1E2EE", color: "#4A1942" }}>
            {t("forum.thread.comments")} · {comments.length}
          </span>
          {isAdmin && (
            <>
              <button type="button" onClick={() => onAdmin({ pinned: !post.pinned })} disabled={pending} style={{ ...SMALL_BTN, background: "#FFFFFF", border: "1.5px solid #E2C8BB" }}>
                {post.pinned ? t("forum.thread.unpin") : t("forum.thread.pin")}
              </button>
              <button type="button" onClick={() => onAdmin({ status: post.status === "hidden" ? "published" : "hidden" })} disabled={pending} style={{ ...SMALL_BTN, background: "#FFFFFF", border: "1.5px solid #E2C8BB" }}>
                {post.status === "hidden" ? t("forum.thread.unhide") : t("forum.thread.hide")}
              </button>
            </>
          )}
          {(mine || isAdmin) && (
            <button type="button" className="btn-link" onClick={onDeletePost} disabled={pending} style={{ marginRight: "auto", fontSize: 14, color: "#7A5566" }}>
              {t("forum.delete")}
            </button>
          )}
        </div>
        {error && (
          <span role="alert" style={{ fontSize: 14, color: "#A3304A" }}>
            {error}
          </span>
        )}
      </article>

      <section aria-label={t("forum.thread.comments")} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {comments.length === 0 && <span style={{ fontSize: 15, color: "#7A5566", padding: "4px 8px" }}>{t("forum.comment.empty")}</span>}
        {comments.map((x) => {
          const own = x.author_id === userId;
          return (
            <div key={x.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span aria-hidden="true" style={{ flex: "none", width: 34, height: 34, borderRadius: "50%", background: x.author_is_team ? "#F6DADC" : "#F1E2EE", color: x.author_is_team ? "#A3304A" : "#4A1942", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, marginTop: 4 }}>
                {x.author_name.charAt(0) || "מ"}
              </span>
              <div style={{ flex: 1, minWidth: 0, background: own ? "#FBEDE4" : "#FFFFFF", border: "1.5px solid #F0E2D8", borderRadius: "4px 18px 18px 18px", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#7A5566", flexWrap: "wrap" }}>
                  <b style={{ color: "#3A1530", fontSize: 14 }}>{x.author_name}</b>
                  {x.author_is_team && <span style={{ padding: "0 8px", borderRadius: 999, background: "#F6DADC", color: "#A3304A", fontSize: 12, fontWeight: 600 }}>{t("forum.thread.team")}</span>}
                  {own && <span style={{ padding: "0 8px", borderRadius: 999, background: "#F1E2EE", color: "#4A1942", fontSize: 12, fontWeight: 600 }}>{t("forum.thread.you")}</span>}
                  <span>· {timeAgo(x.created_at)}</span>
                  {(own || isAdmin) && (
                    <button type="button" className="btn-link" style={{ fontSize: 13, marginRight: "auto", padding: 0 }} disabled={pending} onClick={() => onDeleteComment(x.id)}>
                      {t("forum.delete")}
                    </button>
                  )}
                </span>
                <RichHtml html={x.body} style={{ fontSize: 16, lineHeight: 1.55 }} />
              </div>
            </div>
          );
        })}
      </section>

      {post.status === "published" && (
        <form onSubmit={onComment} style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 20, padding: 14, display: "flex", flexDirection: "column", gap: 8, position: "sticky", bottom: 12, boxShadow: "0 -6px 18px rgba(74,25,66,0.06)" }}>
          <RichEditor key={resetKey} name="comment" placeholder={t("forum.comment.placeholder")} minHeight={60} compact labels={editorLabels} />
          <button type="submit" className="btn-primary" disabled={pending} style={{ height: 44, padding: "0 20px", fontSize: 16, alignSelf: "flex-start" }}>
            {pending ? "…" : t("forum.comment.button")}
          </button>
        </form>
      )}
    </div>
  );
}
