import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";
import { hebrewDateLabel, timeRange } from "@/lib/hebrew";

export type EventRow = Tables<"events">;

export interface EventView extends EventRow {
  registered: boolean;
  registrations: number;
  full: boolean;
  dateLabel: string;
  timeLabel: string;
}

function todayIso(): string {
  const il = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
  return `${il.getFullYear()}-${String(il.getMonth() + 1).padStart(2, "0")}-${String(il.getDate()).padStart(2, "0")}`;
}

export { todayIso };

export async function decorateEvents(supabase: SupabaseClient<Database>, userId: string, rows: EventRow[]): Promise<EventView[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const { data: mine } = await supabase.from("registrations").select("event_id").eq("user_id", userId).in("event_id", ids);
  const mineSet = new Set((mine ?? []).map((m) => m.event_id));
  const counts = await Promise.all(ids.map((id) => supabase.rpc("registration_count", { eid: id }).then((r) => r.data ?? 0)));
  return rows.map((r, i) => {
    const registrations = counts[i];
    return {
      ...r,
      registered: mineSet.has(r.id),
      registrations,
      full: r.capacity !== null && registrations >= r.capacity && !mineSet.has(r.id),
      dateLabel: hebrewDateLabel(r.event_date),
      timeLabel: timeRange(r.start_time, r.end_time),
    };
  });
}

/** The next published event (any type) from today on – for the home band. */
export async function nextEvent(supabase: SupabaseClient<Database>, userId: string): Promise<EventView | null> {
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("published", true)
    .gte("event_date", todayIso())
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(1);
  const [row] = await decorateEvents(supabase, userId, data ?? []);
  return row ?? null;
}

export const KIND_LABEL: Record<string, string> = {
  talent: "כישרון",
  insight: "תובנה",
  story: "סיפור בלעדי",
  other: "משהו אחר לגמרי",
};

export const KIND_COLORS: Record<string, { color: string; tint: string }> = {
  talent: { color: "#9A4318", tint: "#FCE7D6" },
  insight: { color: "#4A1942", tint: "#F1E2EE" },
  story: { color: "#A3304A", tint: "#FBE1E4" },
  other: { color: "#6E0F1A", tint: "#F6DADC" },
};

export const TYPE_LABEL: Record<string, string> = {
  general: "כללי",
  millionaire: "המיליונרית",
  birthday: "חוגגות חודש טוב",
};
