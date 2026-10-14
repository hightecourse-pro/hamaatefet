"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActive } from "@/lib/auth";

export interface ToggleState {
  error: string | null;
}

/** "שמרי לי מקום" / "אני באה" – register, or cancel if already registered. */
export async function toggleRegistration(eventId: string, path: string): Promise<ToggleState> {
  const { userId } = await requireActive();
  const supabase = await createClient();
  const { data: existing } = await supabase.from("registrations").select("event_id").eq("event_id", eventId).eq("user_id", userId).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("registrations").delete().eq("event_id", eventId).eq("user_id", userId);
    if (error) return { error: "לא הצלחנו לבטל. נסי שוב." };
  } else {
    const { error } = await supabase.from("registrations").insert({ event_id: eventId, user_id: userId });
    if (error) return { error: error.message.includes("event_full") ? "אוי, המקומות נגמרו." : "לא הצלחנו לשמור מקום. נסי שוב." };
  }
  revalidatePath(path);
  revalidatePath("/home");
  return { error: null };
}

/** Join / leave the topic team of a birthday meeting (hosts only – checked by the page). */
export async function toggleTopicTeam(eventId: string): Promise<ToggleState> {
  const { userId, profile } = await requireActive();
  const supabase = await createClient();
  const { data: ev } = await supabase.from("events").select("hebrew_month").eq("id", eventId).maybeSingle();
  if (!ev || ev.hebrew_month !== profile.birth_month) return { error: "צוות הנושא פתוח לבעלות השמחה של החודש." };
  const { data: existing } = await supabase.from("topic_team").select("event_id").eq("event_id", eventId).eq("user_id", userId).maybeSingle();
  const { error } = existing
    ? await supabase.from("topic_team").delete().eq("event_id", eventId).eq("user_id", userId)
    : await supabase.from("topic_team").insert({ event_id: eventId, user_id: userId });
  if (error) return { error: "משהו השתבש. נסי שוב." };
  revalidatePath("/birthday");
  return { error: null };
}
