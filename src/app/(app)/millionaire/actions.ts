"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActive, displayName } from "@/lib/auth";
import { proposalAlertEmail, sendEmailToMany } from "@/lib/email";
import { getSiteUrl } from "@/lib/site";
import { KIND_LABEL } from "@/lib/events";

export interface ProposalState {
  error: string | null;
  sent?: boolean;
}

export async function createProposal(_prev: ProposalState, fd: FormData): Promise<ProposalState> {
  const { userId, profile } = await requireActive();
  const kind = String(fd.get("kind") ?? "");
  const display_name = String(fd.get("display_name") ?? "").trim() || displayName(profile);
  const title = String(fd.get("title") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const preferred_month = String(fd.get("preferred_month") ?? "").trim();
  const needs = String(fd.get("needs") ?? "").trim();
  if (!["talent", "insight", "story", "other"].includes(kind)) return { error: "בחרי מה יש לך שאין לאף אחת." };
  if (!title) return { error: "תני למפגש שם – כותרת קצרה ומסקרנת." };
  if (!description) return { error: "ספרי לנו קצת על מה נטעם." };

  const supabase = await createClient();
  const { error } = await supabase.from("hosting_proposals").insert({
    user_id: userId,
    kind: kind as "talent" | "insight" | "story" | "other",
    display_name,
    title,
    description,
    preferred_month,
    needs,
  });
  if (error) return { error: "לא הצלחנו לשמור את הצ׳ק. נסי שוב בעוד רגע." };

  // Tell the team (best effort).
  try {
    const admin = createAdminClient();
    const { data: admins } = await admin.from("profiles").select("email").eq("role", "admin").eq("status", "active");
    const emails = (admins ?? []).map((a) => a.email).filter(Boolean);
    if (emails.length) {
      const built = proposalAlertEmail({ name: display_name, kind: KIND_LABEL[kind] ?? kind, title, month: preferred_month }, `${getSiteUrl()}/admin/millionaire`);
      await sendEmailToMany(emails, built.subject, built.html);
    }
  } catch (e) {
    console.log("[millionaire] admin alert failed", e);
  }
  revalidatePath("/millionaire");
  return { error: null, sent: true };
}
