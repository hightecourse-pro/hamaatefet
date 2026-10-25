"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSignedIn } from "@/lib/auth";
import { getContent } from "@/lib/content";

export interface WelcomeState {
  error: string | null;
}

export async function completeProfile(_prev: WelcomeState, fd: FormData): Promise<WelcomeState> {
  const { userId, profile } = await requireSignedIn();
  const c = await getContent();
  const first_name = String(fd.get("first_name") ?? "").trim();
  const last_name = String(fd.get("last_name") ?? "").trim();
  const phone = String(fd.get("phone") ?? "").trim();
  const birth_month = Number(fd.get("birth_month") ?? 0);
  const over_30 = fd.get("over_30") === "on";
  if (!first_name || !last_name) return { error: c.get("auth.err.name") };
  if (!/^0\d{1,2}-?\d{7}$|^\+?\d{9,13}$/.test(phone.replace(/[\s-]/g, ""))) return { error: c.get("auth.err.phone") };
  if (!(birth_month >= 1 && birth_month <= 12)) return { error: c.get("auth.err.month") };
  if (!over_30) return { error: c.get("auth.err.welcome_age") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ first_name, last_name, phone, birth_month, over_30_confirmed: true, terms_accepted_at: profile.terms_accepted_at ?? new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: c.get("auth.err.save") };
  redirect(profile.status === "active" ? "/home" : "/pending");
}
