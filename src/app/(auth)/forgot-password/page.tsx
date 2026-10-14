import { AuthScreen } from "@/components/auth/auth-screen";
import { authCopy } from "@/components/auth/auth-copy";
import { getContent } from "@/lib/content";

export const metadata = { title: "שכחתי סיסמה" };

export default async function ForgotPasswordPage() {
  const content = await getContent();
  return <AuthScreen initialMode="forgot" copy={authCopy(content)} />;
}
