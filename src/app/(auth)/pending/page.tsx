import Image from "next/image";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { requireSignedIn, homeFor } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getContent } from "@/lib/content";

export const metadata = { title: "ממתינה לאישור" };

export default async function PendingPage() {
  const { profile } = await requireSignedIn();
  const home = homeFor(profile);
  if (home !== "/pending") redirect(home);
  const paused = profile.status === "paused";
  const c = await getContent();
  return (
    <AuthShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center", padding: "8px 0" }}>
        <Image src="/brand/envelope.png" alt="" width={170} height={134} style={{ width: 170, height: "auto", transform: "rotate(-6deg)" }} />
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
          <span className="grad">{paused ? c.get("auth.paused.title") : c.get("auth.waiting.title")}</span>
        </h1>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "#5A3348", whiteSpace: "pre-line" }}>
          {paused ? c.get("auth.paused.text") : c.get("auth.waiting.text", { שם: profile.first_name })}
        </p>
        <SignOutButton label="יציאה מהחשבון" />
      </div>
    </AuthShell>
  );
}
