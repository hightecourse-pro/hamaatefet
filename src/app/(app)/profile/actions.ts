"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActive } from "@/lib/auth";
import { getContent } from "@/lib/content";

export interface ProfileState {
  error: string | null;
  ok?: string | null;
}

export async function saveBirthday(_prev: ProfileState, fd: FormData): Promise<ProfileState> {
  const { userId } = await requireActive();
  const c = await getContent();
  const birth_month = Number(fd.get("birth_month") ?? 0);
  const remind = fd.get("remind") === "on";
  if (!(birth_month >= 1 && birth_month <= 12)) return { error: c.get("profile.err.month") };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ birth_month, remind_birthday: remind }).eq("id", userId);
  if (error) return { error: c.get("profile.err.save") };
  revalidatePath("/profile");
  revalidatePath("/birthday");
  return { error: null, ok: c.get("profile.saved_birthday") };
}

export async function saveDetails(_prev: ProfileState, fd: FormData): Promise<ProfileState> {
  const { userId, email: currentEmail } = await requireActive();
  const c = await getContent();
  const first_name = String(fd.get("first_name") ?? "").trim();
  const last_name = String(fd.get("last_name") ?? "").trim();
  const phone = String(fd.get("phone") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!first_name || !last_name) return { error: c.get("profile.err.names") };
  if (!/^0\d{1,2}-?\d{7}$|^\+?\d{9,13}$/.test(phone.replace(/[\s-]/g, ""))) return { error: c.get("profile.err.phone") };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: c.get("profile.err.email") };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ first_name, last_name, phone }).eq("id", userId);
  if (error) return { error: c.get("profile.err.save") };

  let note = c.get("profile.saved");
  if (email !== currentEmail.toLowerCase()) {
    const { error: emailError } = await supabase.auth.updateUser({ email });
    if (emailError) return { error: emailError.code === "email_exists" ? c.get("profile.err.email_exists") : c.get("profile.err.email_change") };
    note = c.get("profile.saved_email");
  }
  revalidatePath("/profile");
  return { error: null, ok: note };
}
