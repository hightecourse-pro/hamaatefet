"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * «שכחתי סיסמה»: is there an account with this address? Supabase answers a
 * reset request for an unknown address with silence (anti-enumeration); in a
 * closed community that only confuses, so the screen says so instead.
 * On a database hiccup we answer "yes" and let the reset request go through.
 */
export async function emailRegistered(email: string): Promise<boolean> {
  const e = String(email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false;
  const { data, error } = await createAdminClient().rpc("email_registered", { e });
  if (error) return true;
  return data === true;
}
