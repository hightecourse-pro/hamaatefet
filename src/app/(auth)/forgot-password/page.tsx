import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata = { title: "שכחתי סיסמה" };

export default function ForgotPasswordPage() {
  return <AuthScreen initialMode="forgot" />;
}
