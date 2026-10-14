import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/auth-screen";
import { getSession, homeFor } from "@/lib/auth";

export const metadata = { title: "הרשמה" };

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session.profile));
  return <AuthScreen initialMode="signup" />;
}
