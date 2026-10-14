import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { csv } from "@/lib/admin-data";
import { monthName } from "@/lib/hebrew";

const STATUS: Record<string, string> = { pending: "ממתינה לאישור", active: "פעילה", paused: "מושהית" };

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.profile.role !== "admin" || session.profile.status !== "active") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const month = Number(url.searchParams.get("month") ?? 0);
  const q = (url.searchParams.get("q") ?? "").trim().replace(/[%_,()]/g, " ");
  const admin = createAdminClient();
  let query = admin.from("profiles").select("*").order("created_at", { ascending: false });
  if (status && status in STATUS) query = query.eq("status", status as "pending" | "active" | "paused");
  if (month >= 1 && month <= 12) query = query.eq("birth_month", month);
  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data } = await query;
  const rows = [
    ["שם פרטי", "שם משפחה", "מייל", "טלפון", "חודש לידה", "סטטוס", "תפקיד", "בת 30+", "תזכורת יומולדת", "הצטרפה", "אושרה"],
    ...(data ?? []).map((m) => [
      m.first_name,
      m.last_name,
      m.email,
      m.phone,
      monthName(m.birth_month),
      STATUS[m.status],
      m.role === "admin" ? "צוות" : "משתתפת",
      m.over_30_confirmed ? "כן" : "לא",
      m.remind_birthday ? "כן" : "לא",
      m.created_at.slice(0, 10),
      m.approved_at?.slice(0, 10) ?? "",
    ]),
  ];
  return new NextResponse(csv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="members.csv"; filename*=UTF-8''${encodeURIComponent("משתתפות המעטפת.csv")}`,
    },
  });
}
