import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { requireSignedIn, isProfileComplete } from "@/lib/auth";
import { WelcomeForm } from "./welcome-form";

export const metadata = { title: "ברוכה הבאה" };

/**
 * First entry: a member who got in without the sign-up form (invited by the
 * team, or an old account) completes her details here before anything else.
 */
export default async function WelcomePage() {
  const { profile } = await requireSignedIn();
  if (isProfileComplete(profile)) redirect(profile.status === "active" ? "/home" : "/pending");
  return (
    <AuthShell wide>
      <WelcomeForm
        initial={{
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          birth_month: profile.birth_month,
          over_30_confirmed: profile.over_30_confirmed,
        }}
        email={profile.email}
      />
    </AuthShell>
  );
}
