import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { newMemberAlertEmail, sendEmailToMany } from "@/lib/email";
import { getSiteUrl } from "@/lib/site";
import { monthName } from "@/lib/hebrew";

const TYPES: EmailOtpType[] = ["signup", "recovery", "invite", "magiclink", "email", "email_change"];

/**
 * Every auth e-mail links here (see tools/configure-auth.mjs). The token is
 * verified server-side, so the link works from any device or browser, and the
 * member lands on `next` with a session cookie.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextRaw = url.searchParams.get("next") ?? "/home";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/home";

  if (!tokenHash || !type || !TYPES.includes(type)) {
    return NextResponse.redirect(new URL("/login?error=link", url.origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    const reason = error.code === "otp_expired" ? "expired" : "link";
    return NextResponse.redirect(new URL(`/login?error=${reason}`, url.origin));
  }

  // A verified sign-up: tell the team there is someone to approve (best effort).
  if (type === "signup" && data.user) {
    try {
      const admin = createAdminClient();
      const { data: p } = await admin.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      if (p && p.status === "pending") {
        const { data: admins } = await admin.from("profiles").select("email").eq("role", "admin").eq("status", "active");
        const emails = (admins ?? []).map((a) => a.email).filter(Boolean);
        if (emails.length) {
          const built = newMemberAlertEmail({ name: `${p.first_name} ${p.last_name}`.trim(), email: p.email, phone: p.phone, birthMonth: monthName(p.birth_month) }, `${getSiteUrl()}/admin?status=pending`);
          await sendEmailToMany(emails, built.subject, built.html);
        }
      }
    } catch (e) {
      console.log("[auth/confirm] admin alert failed", e);
    }
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
