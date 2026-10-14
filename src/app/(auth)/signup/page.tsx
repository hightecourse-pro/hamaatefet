import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/auth-screen";
import { authCopy } from "@/components/auth/auth-copy";
import { getSession, homeFor } from "@/lib/auth";
import { getContent } from "@/lib/content";

export const metadata = { title: "הרשמה" };

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session.profile));
  const content = await getContent();
  return <AuthScreen initialMode="signup" copy={authCopy(content)} />;
}
