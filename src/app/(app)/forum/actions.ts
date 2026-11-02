"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActive } from "@/lib/auth";
import { sanitizeRich, isRichEmpty, richToText } from "@/lib/rich-text";
import { getContent } from "@/lib/content";

export interface ForumState {
  error: string | null;
  ok?: boolean;
  /** The new thread, so the composer can send her there. */
  postId?: string;
}

/**
 * Opens a thread. The team may post in every section; a member only in a
 * section whose post_mode is "members" (the owner, 2/11). RLS enforces the same.
 */
export async function createPost(_prev: ForumState, fd: FormData): Promise<ForumState> {
  const { userId, profile } = await requireActive();
  const c = await getContent();
  const section = String(fd.get("section") ?? "");
  const title = String(fd.get("title") ?? "").trim();
  const body = sanitizeRich(String(fd.get("body") ?? ""));
  const imagePath = String(fd.get("image_path") ?? "").trim() || null;
  if (!title) return { error: c.get("forum.err.title") };
  if (isRichEmpty(body)) return { error: c.get("forum.err.body") };
  if (title.length > 140) return { error: c.get("forum.err.title_long") };
  if (richToText(body).length > 20000) return { error: c.get("forum.err.body_long") };

  const [key, helpKind] = section.split(":");
  const supabase = await createClient();
  const { data: sec } = await supabase.from("forum_sections").select("id, post_mode").eq("key", key).maybeSingle();
  if (!sec) return { error: c.get("forum.err.section") };
  if (profile.role !== "admin" && sec.post_mode !== "members") return { error: c.get("forum.err.section_closed") };
  if (imagePath && !imagePath.startsWith(`${userId}/`)) return { error: c.get("forum.err.image") };

  const { data: created, error } = await supabase
    .from("posts")
    .insert({
      section_id: sec.id,
      author_id: userId,
      title,
      body,
      image_path: imagePath,
      help_kind: key === "help" && (helpKind === "asking" || helpKind === "offering") ? helpKind : null,
    })
    .select("id")
    .single();
  if (error) return { error: c.get("forum.err.publish") };
  revalidatePath("/forum");
  revalidatePath("/admin/forum");
  return { error: null, ok: true, postId: created.id };
}

export async function toggleLike(postId: string): Promise<{ error: string | null }> {
  const { userId } = await requireActive();
  const supabase = await createClient();
  const { data: existing } = await supabase.from("post_likes").select("post_id").eq("post_id", postId).eq("user_id", userId).maybeSingle();
  const { error } = existing
    ? await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId)
    : await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  if (error) return { error: (await getContent()).get("forum.err.like") };
  revalidatePath("/forum");
  revalidatePath(`/forum/${postId}`);
  return { error: null };
}

/** Everyone active may comment – rich text and emoji welcome. */
export async function addComment(postId: string, bodyHtml: string): Promise<{ error: string | null }> {
  const { userId } = await requireActive();
  const c = await getContent();
  const body = sanitizeRich(bodyHtml);
  if (isRichEmpty(body)) return { error: c.get("forum.err.comment_empty") };
  if (richToText(body).length > 4000) return { error: c.get("forum.err.comment_long") };
  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({ post_id: postId, author_id: userId, body });
  if (error) return { error: c.get("forum.err.comment_save") };
  revalidatePath("/forum");
  revalidatePath(`/forum/${postId}`);
  return { error: null };
}

/** Her own thread – or any thread, for the team (RLS: author or admin). */
export async function deletePost(postId: string): Promise<{ error: string | null }> {
  await requireActive();
  const supabase = await createClient();
  const { error, count } = await supabase.from("posts").delete({ count: "exact" }).eq("id", postId);
  if (error || !count) return { error: (await getContent()).get("forum.err.delete") };
  revalidatePath("/forum");
  revalidatePath("/admin/forum");
  return { error: null };
}

/** Her own comment – or any comment, for the team (RLS: author or admin). */
export async function deleteComment(commentId: string, postId: string): Promise<{ error: string | null }> {
  await requireActive();
  const supabase = await createClient();
  const { error, count } = await supabase.from("comments").delete({ count: "exact" }).eq("id", commentId);
  if (error || !count) return { error: (await getContent()).get("forum.err.delete") };
  revalidatePath("/forum");
  revalidatePath(`/forum/${postId}`);
  return { error: null };
}
