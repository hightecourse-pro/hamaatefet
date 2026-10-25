import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/auth-screen";
import { getSession, homeFor } from "@/lib/auth";
import { getContent } from "@/lib/content";

export const metadata = { title: "כניסה" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();
  if (session) redirect(homeFor(session.profile));
  const { error } = await searchParams;
  const c = await getContent();
  const banner = error === "expired" ? c.get("auth.link.expired") : error === "link" ? c.get("auth.link.invalid") : null;
  return (
    <>
      {banner && (
        <p role="status" className="flash flash-err" style={{ margin: 0, borderRadius: 0, textAlign: "center" }}>
          {banner}
        </p>
      )}
      <AuthScreen initialMode="login" copy={c.copy("auth.", "field.", "general.")} />
    </>
  );
}
