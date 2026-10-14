import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { csv } from "@/lib/admin-data";
import { monthName } from "@/lib/hebrew";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.profile.role !== "admin" || session.profile.status !== "active") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const { id } = await params;
  const admin = createAdminClient();
  const [{ data: event }, { data: regs }] = await Promise.all([
    admin.from("events").select("title").eq("id", id).maybeSingle(),
    admin.from("registrations").select("created_at, profiles(first_name, last_name, email, phone, birth_month)").eq("event_id", id).order("created_at"),
  ]);
  const rows = [
    ["שם פרטי", "שם משפחה", "מייל", "טלפון", "חודש לידה", "נרשמה ב"],
    ...(regs ?? []).map((r) => [r.profiles?.first_name, r.profiles?.last_name, r.profiles?.email, r.profiles?.phone, monthName(r.profiles?.birth_month), r.created_at.slice(0, 16).replace("T", " ")]),
  ];
  const name = `נרשמות - ${event?.title ?? "מפגש"}.csv`;
  return new NextResponse(csv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="registrations.csv"; filename*=UTF-8''${encodeURIComponent(name)}`,
    },
  });
}
