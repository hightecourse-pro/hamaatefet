"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActive, displayName } from "@/lib/auth";
import { getContent } from "@/lib/content";
import { teamMessageEmail, sendEmailToMany } from "@/lib/email";
import { getSiteUrl } from "@/lib/site";

export type MessageKind = "bug" | "question" | "topic";

export interface MessageState {
  error: string | null;
  sent?: boolean;
}

/**
 * A message to the team: a bug report from the floating widget, a question
 * from a section's "ask" button, or a topic request in a team-only section.
 * Stored in team_messages (the admin inbox) and mailed to the active admins
 * with reply-to = the member, so they can answer straight from the mail.
 */
export async function sendTeamMessage(kind: MessageKind, _prev: MessageState, fd: FormData): Promise<MessageState> {
  const { userId, profile, email } = await requireActive();
  const c = await getContent();
  const subject = String(fd.get("subject") ?? "").trim().slice(0, 140);
  const body = String(fd.get("body") ?? "").trim();
  const page = String(fd.get("page") ?? "").trim().slice(0, 200);
  const sectionId = String(fd.get("section_id") ?? "").trim() || null;
  if (!["bug", "question", "topic"].includes(kind)) return { error: c.get("widget.err.save") };
  if (!body && !subject) return { error: c.get("widget.err.empty") };
  if (body.length > 4000) return { error: c.get("widget.err.long") };

  const supabase = await createClient();
  const { error } = await supabase.from("team_messages").insert({ user_id: userId, kind, section_id: sectionId, subject, body: body || subject, page });
  if (error) return { error: c.get("widget.err.save") };

  // Tell the team (best effort) – the member's address as reply-to.
  try {
    const admin = createAdminClient();
    const [{ data: admins }, section] = await Promise.all([
      admin.from("profiles").select("email").eq("role", "admin").eq("status", "active"),
      sectionId ? admin.from("forum_sections").select("name").eq("id", sectionId).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const emails = (admins ?? []).map((a) => a.email).filter(Boolean);
    if (emails.length) {
      const built = teamMessageEmail(c, { kindLabel: c.get(`widget.kind.${kind}`), name: displayName(profile), subject, body: body || subject, section: section.data?.name ?? "", page }, `${getSiteUrl()}/admin/inbox`);
      await sendEmailToMany(emails, built.subject, built.html, email);
    }
  } catch (e) {
    console.log("[messages] admin alert failed", e);
  }
  revalidatePath("/admin/inbox");
  return { error: null, sent: true };
}
