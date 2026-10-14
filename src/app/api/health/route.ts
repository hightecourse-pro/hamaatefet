import { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";

export async function GET() {
  return NextResponse.json({ ok: true, env: appEnv(), time: new Date().toISOString() });
}
