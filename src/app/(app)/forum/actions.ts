"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActive } from "@/lib/auth";

export interface ForumState {
  error: string | null;
  ok?: boolean;
  pending?: boolean;
}

export async function createPost(_prev: ForumState, fd: FormData): Promise<ForumState> {
  const { userId } = await requireActive();
  const section = String(fd.get("section") ?? "");
  const title = String(fd.get("title") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  const imagePath = String(fd.get("image_path") ?? "").trim() || null;
  if (!title) return { error: "תני לפוסט כותרת – משפט אחד שמסקרן." };
  if (!body) return { error: "מה בלב? כתבי כמה מילים." };
  if (title.length > 140) return { error: "הכותרת ארוכה מדי (עד 140 תווים)." };

  // "help:asking" / "help:offering" / "<section key>"
  const [key, helpKind] = section.split(":");
  const supabase = await createClient();
  const { data: sec } = await supabase.from("forum_sections").select("id").eq("key", key).eq("visible", true).maybeSingle();
  if (!sec) return { error: "בחרי מדור." };
  if (imagePath && !imagePath.startsWith(`${userId}/`)) return { error: "התמונה לא תקינה." };

  const { data, error } = await supabase
    .from("posts")
    .insert({
      section_id: sec.id,
      author_id: userId,
      title,
      body,
      image_path: imagePath,
      help_kind: key === "help" && (helpKind === "asking" || helpKind === "offering") ? helpKind : null,
    })
    .select("status")
    .single();
  if (error) return { error: "לא הצלחנו לפרסם. נסי שוב בעוד רגע." };
  revalidatePath("/forum");
  return { error: null, ok: true, pending: data.status === "pending" };
}

export async function toggleLike(postId: string): Promise<{ error: string | null }> {
  const { userId } = await requireActive();
  const supabase = await createClient();
  const { data: existing } = await supabase.from("post_likes").select("post_id").eq("post_id", postId).eq("user_id", userId).maybeSingle();
  const { error } = existing
    ? await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId)
    : await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  if (error) return { error: "משהו השתבש." };
  revalidatePath("/forum");
  return { error: null };
}

export async function addComment(postId: string, body: string): Promise<{ error: string | null }> {
  const { userId } = await requireActive();
  const text = body.trim();
  if (!text) return { error: "כתבי משהו." };
  if (text.length > 2000) return { error: "התגובה ארוכה מדי." };
  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({ post_id: postId, author_id: userId, body: text });
  if (error) return { error: "לא הצלחנו לשמור את התגובה." };
  revalidatePath("/forum");
  return { error: null };
}

export async function deleteOwnPost(postId: string): Promise<{ error: string | null }> {
  const { userId } = await requireActive();
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId).eq("author_id", userId);
  if (error) return { error: "לא הצלחנו למחוק." };
  revalidatePath("/forum");
  return { error: null };
}

export async function deleteOwnComment(commentId: string): Promise<{ error: string | null }> {
  const { userId } = await requireActive();
  const supabase = await createClient();
  const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("author_id", userId);
  if (error) return { error: "לא הצלחנו למחוק." };
  revalidatePath("/forum");
  return { error: null };
}
