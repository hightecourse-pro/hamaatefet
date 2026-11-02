import { NextResponse, type NextRequest } from "next/server";
import { runDailyDigest } from "@/lib/digest";

export const maxDuration = 60;

/**
 * The daily digest. vercel.json fires this every hour at :30; the run itself
 * sends only when it is 12:xx in Israel (DST-proof) and at most once a day.
 * ?force=1 skips those guards, ?dry=1 counts without sending or recording.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const q = request.nextUrl.searchParams;
  const r = await runDailyDigest({ force: q.get("force") === "1", dry: q.get("dry") === "1" });
  return NextResponse.json(r);
}
