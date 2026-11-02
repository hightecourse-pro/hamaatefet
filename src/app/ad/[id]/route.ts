import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** A click on the advertisement slot: counted, then on to the advertiser. Members only (the slot lives inside the member area). */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), 302);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(new URL("/home", request.url), 302);
  const { data: link } = await createAdminClient().rpc("ad_click", { aid: id });
  const target = typeof link === "string" && /^https?:\/\//i.test(link) ? link : null;
  return NextResponse.redirect(target ?? new URL("/home", request.url).toString(), 302);
}
