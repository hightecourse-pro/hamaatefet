"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActive } from "@/lib/auth";
import { sanitizeRich, isRichEmpty, richToText } from "@/lib/rich-text";

export interface ForumState {
  error: string | null;
  ok?: boolean;
}

/** Only the team opens discussions (the owner, 14/10). RLS enforces the same. */
export async function createPost(_prev: ForumState, fd: FormData): Promise<ForumState> {
  const { userId, profile } = await requireActive();
  if (profile.role !== "admin") return { error: "רק צוות המעטפת פותח דיונים." };
  const section = String(fd.get("section") ?? "");
  const title = String(fd.get("title") ?? "").trim();
  const body = sanitizeRich(String(fd.get("body") ?? ""));
  const imagePath = String(fd.get("image_path") ?? "").trim() || null;
  if (!title) return { error: "תני לפוסט כותרת – משפט אחד שמסקרן." };
  if (isRichEmpty(body)) return { error: "מה בלב? כתבי כמה מילים." };
  if (title.length > 140) return { error: "הכותרת ארוכה מדי (עד 140 תווים)." };
  if (richToText(body).length > 20000) return { error: "הפוסט ארוך מדי." };

  const [key, helpKind] = section.split(":");
  const supabase = await createClient();
  const { data: sec } = await supabase.from("forum_sections").select("id").eq("key", key).maybeSingle();
  if (!sec) return { error: "בחרי מדור." };
  if (imagePath && !imagePath.startsWith(`${userId}/`)) return { error: "התמונה לא תקינה." };

  const { error } = await supabase.from("posts").insert({
    section_id: sec.id,
    author_id: userId,
    title,
    body,
    image_path: imagePath,
    help_kind: key === "help" && (helpKind === "asking" || helpKind === "offering") ? helpKind : null,
  });
  if (error) return { error: "לא הצלחנו לפרסם. נסי שוב בעוד רגע." };
  revalidatePath("/forum");
  revalidatePath("/admin/forum");
  return { error: null, ok: true };
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

/** Everyone active may comment – rich text and emoji welcome. */
export async function addComment(postId: string, bodyHtml: string): Promise<{ error: string | null }> {
  const { userId } = await requireActive();
  const body = sanitizeRich(bodyHtml);
  if (isRichEmpty(body)) return { error: "כתבי משהו." };
  if (richToText(body).length > 4000) return { error: "התגובה ארוכה מדי." };
  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({ post_id: postId, author_id: userId, body });
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
