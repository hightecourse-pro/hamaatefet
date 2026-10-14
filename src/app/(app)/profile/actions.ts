"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActive } from "@/lib/auth";

export interface ProfileState {
  error: string | null;
  ok?: string | null;
}

export async function saveBirthday(_prev: ProfileState, fd: FormData): Promise<ProfileState> {
  const { userId } = await requireActive();
  const birth_month = Number(fd.get("birth_month") ?? 0);
  const remind = fd.get("remind") === "on";
  if (!(birth_month >= 1 && birth_month <= 12)) return { error: "בחרי חודש." };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ birth_month, remind_birthday: remind }).eq("id", userId);
  if (error) return { error: "לא הצלחנו לשמור. נסי שוב." };
  revalidatePath("/profile");
  revalidatePath("/birthday");
  return { error: null, ok: "נשמר! נתראה במסיבה שלך." };
}

export async function saveDetails(_prev: ProfileState, fd: FormData): Promise<ProfileState> {
  const { userId, email: currentEmail } = await requireActive();
  const first_name = String(fd.get("first_name") ?? "").trim();
  const last_name = String(fd.get("last_name") ?? "").trim();
  const phone = String(fd.get("phone") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!first_name || !last_name) return { error: "שם פרטי ושם משפחה – שניהם חשובים לנו." };
  if (!/^0\d{1,2}-?\d{7}$|^\+?\d{9,13}$/.test(phone.replace(/[\s-]/g, ""))) return { error: "מספר הטלפון לא נראה תקין." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "כתובת המייל לא נראית תקינה." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ first_name, last_name, phone }).eq("id", userId);
  if (error) return { error: "לא הצלחנו לשמור. נסי שוב." };

  let note = "הפרטים נשמרו.";
  if (email !== currentEmail.toLowerCase()) {
    const { error: emailError } = await supabase.auth.updateUser({ email });
    if (emailError) return { error: emailError.code === "email_exists" ? "כבר יש חברה עם המייל הזה." : "לא הצלחנו לשנות את המייל. נסי שוב." };
    note = "הפרטים נשמרו. שלחנו מייל אישור לכתובת החדשה (וגם לישנה) – המייל יתעדכן אחרי האישור.";
  }
  revalidatePath("/profile");
  return { error: null, ok: note };
}
