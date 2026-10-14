"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSignedIn } from "@/lib/auth";

export interface WelcomeState {
  error: string | null;
}

export async function completeProfile(_prev: WelcomeState, fd: FormData): Promise<WelcomeState> {
  const { userId, profile } = await requireSignedIn();
  const first_name = String(fd.get("first_name") ?? "").trim();
  const last_name = String(fd.get("last_name") ?? "").trim();
  const phone = String(fd.get("phone") ?? "").trim();
  const birth_month = Number(fd.get("birth_month") ?? 0);
  const over_30 = fd.get("over_30") === "on";
  if (!first_name || !last_name) return { error: "ספרי לנו איך קוראים לך – שם פרטי ושם משפחה." };
  if (!/^0\d{1,2}-?\d{7}$|^\+?\d{9,13}$/.test(phone.replace(/[\s-]/g, ""))) return { error: "מספר הטלפון לא נראה תקין (למשל 050-1234567)." };
  if (!(birth_month >= 1 && birth_month <= 12)) return { error: "בחרי את חודש הלידה העברי שלך." };
  if (!over_30) return { error: "המעטפת היא קהילה לנשים בנות 30 ומעלה – צריך לאשר את זה כדי להיכנס." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ first_name, last_name, phone, birth_month, over_30_confirmed: true, terms_accepted_at: profile.terms_accepted_at ?? new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: "לא הצלחנו לשמור. נסי שוב בעוד רגע." };
  redirect(profile.status === "active" ? "/home" : "/pending");
}
