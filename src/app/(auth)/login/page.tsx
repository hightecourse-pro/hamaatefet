import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/auth-screen";
import { getSession, homeFor } from "@/lib/auth";

export const metadata = { title: "כניסה" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();
  if (session) redirect(homeFor(session.profile));
  const { error } = await searchParams;
  const banner =
    error === "expired"
      ? "הקישור פג תוקף. בקשי קישור חדש דרך «שכחתי סיסמה» או הירשמי שוב."
      : error === "link"
        ? "הקישור לא תקין או שכבר נוצל. אפשר לבקש קישור חדש."
        : null;
  return (
    <>
      {banner && (
        <p role="status" className="flash flash-err" style={{ margin: 0, borderRadius: 0, textAlign: "center" }}>
          {banner}
        </p>
      )}
      <AuthScreen initialMode="login" />
    </>
  );
}
