import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = { title: "סיסמה חדשה" };

export default async function ResetPasswordPage() {
  // The recovery link signs her in first (auth/confirm); without a session there is nothing to reset.
  const session = await getSession();
  if (!session) redirect("/login?error=expired");
  return (
    <AuthShell>
      <ResetPasswordForm />
    </AuthShell>
  );
}
