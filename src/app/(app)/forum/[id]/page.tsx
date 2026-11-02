import Link from "next/link";
import { requireActive } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MemberFrame } from "@/components/member-frame";
import { getContent } from "@/lib/content";
import { Thread, type ThreadPost, type ThreadComment } from "./thread";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("post_feed").select("title").eq("id", id).maybeSingle();
  return { title: data?.title ?? "הפורום" };
}

/** One conversation: the opening post, then the replies as a chat, the reply box at the bottom. */
export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, profile } = await requireActive();
  const isAdmin = profile.role === "admin";
  const supabase = await createClient();
  const c = await getContent();

  const { data: post } = await supabase.from("post_feed").select("*").eq("id", id).maybeSingle();
  if (!post) {
    return (
      <MemberFrame profile={profile} current="forum">
        <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
          <div className="surface" style={{ textAlign: "center", fontSize: 18, color: "#5A3348", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            {c.get("forum.thread.not_found")}
            <Link href="/forum" style={{ fontWeight: 600 }}>
              {c.get("forum.thread.back")}
            </Link>
          </div>
        </main>
      </MemberFrame>
    );
  }

  const [{ data: commentsRaw }, signed] = await Promise.all([
    supabase.from("comments").select("id, author_id, body, created_at").eq("post_id", id).order("created_at").limit(200),
    (async () => {
      if (!post.image_path) return null;
      const { data } = await supabase.storage.from("forum-images").createSignedUrl(post.image_path, 3600);
      return data?.signedUrl ?? null;
    })(),
  ]);
  const comments = commentsRaw ?? [];
  const authorIds = Array.from(new Set(comments.map((x) => x.author_id)));
  const { data: authors } = authorIds.length ? await supabase.from("member_directory").select("id, first_name, last_name, role").in("id", authorIds) : { data: [] };
  const byId = new Map((authors ?? []).map((a) => [a.id, a]));
  const fallback = c.get("general.member_fallback");
  const threadComments: ThreadComment[] = comments.map((x) => {
    const a = byId.get(x.author_id);
    return { id: x.id, author_id: x.author_id, author_name: `${a?.first_name ?? ""} ${a?.last_name ?? ""}`.trim() || fallback, author_is_team: a?.role === "admin", body: x.body, created_at: x.created_at };
  });

  const threadPost: ThreadPost = {
    id: post.id!,
    title: post.title ?? "",
    body: post.body ?? "",
    help_kind: post.help_kind,
    status: post.status ?? "published",
    pinned: !!post.pinned,
    created_at: post.created_at ?? new Date().toISOString(),
    author_id: post.author_id ?? "",
    section_key: post.section_key ?? "",
    section_name: post.section_name ?? "",
    section_color: post.section_color ?? "#4A1942",
    section_tint: post.section_tint ?? "#F1E2EE",
    author_name: `${post.author_first_name ?? ""} ${post.author_last_name ?? ""}`.trim() || fallback,
    like_count: post.like_count ?? 0,
    liked_by_me: !!post.liked_by_me,
  };

  return (
    <MemberFrame profile={profile} current="forum">
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "22px 24px 56px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", fontSize: 15 }}>
          <Link href="/forum" style={{ fontWeight: 600 }}>
            ← {c.get("forum.thread.back")}
          </Link>
          <span style={{ color: "#C9A3B0" }}>·</span>
          <Link href={`/forum?section=${threadPost.section_key}`} style={{ color: threadPost.section_color, fontWeight: 600 }}>
            {c.get("forum.thread.back_section", { מדור: threadPost.section_name })}
          </Link>
        </div>
        <Thread post={threadPost} comments={threadComments} imageUrl={signed} userId={userId} isAdmin={isAdmin} copy={c.copy("forum.", "general.", "editor.")} />
      </main>
    </MemberFrame>
  );
}
