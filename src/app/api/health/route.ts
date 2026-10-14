import { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/** Liveness + a real database round-trip (the daily cron also keeps a free Supabase project from pausing). */
export async function GET() {
  let db = "unknown";
  try {
    const { error } = await createAdminClient().from("settings").select("key", { count: "exact", head: true });
    db = error ? "error" : "ok";
  } catch {
    db = "error";
  }
  return NextResponse.json({ ok: db === "ok", env: appEnv(), db, time: new Date().toISOString() }, { status: db === "ok" ? 200 : 500 });
}
