import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface Ad {
  id: string;
  name: string;
  image_path: string;
  link_url: string;
}

/** The public URL of an uploaded advertisement (bucket "ads" is public). */
export function adImageUrl(path: string): string {
  return `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")}/storage/v1/object/public/ads/${path}`;
}

/** One active advertisement for this page view – drawn at random when the team runs several. Null when there is none. */
export async function pickActiveAd(supabase: SupabaseClient<Database>): Promise<Ad | null> {
  try {
    const { data } = await supabase.from("ads").select("id, name, image_path, link_url").eq("active", true);
    if (!data?.length) return null;
    return data[Math.floor(Math.random() * data.length)];
  } catch {
    return null;
  }
}
