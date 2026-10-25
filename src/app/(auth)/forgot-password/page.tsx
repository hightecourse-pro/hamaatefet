import { AuthScreen } from "@/components/auth/auth-screen";
import { getContent } from "@/lib/content";

export const metadata = { title: "שכחתי סיסמה" };

export default async function ForgotPasswordPage() {
  const c = await getContent();
  return <AuthScreen initialMode="forgot" copy={c.copy("auth.", "field.", "general.")} />;
}
