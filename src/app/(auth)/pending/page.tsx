import Image from "next/image";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { requireSignedIn, homeFor } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata = { title: "ממתינה לאישור" };

export default async function PendingPage() {
  const { profile } = await requireSignedIn();
  const home = homeFor(profile);
  if (home !== "/pending") redirect(home);
  const paused = profile.status === "paused";
  return (
    <AuthShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center", padding: "8px 0" }}>
        <Image src="/brand/envelope.png" alt="" width={170} height={134} style={{ width: 170, height: "auto", transform: "rotate(-6deg)" }} />
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
          <span className="grad">{paused ? "המעטפה סגורה כרגע" : "המעטפה בדרך!"}</span>
        </h1>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "#5A3348" }}>
          {paused
            ? "החשבון שלך הושהה על ידי צוות המעטפת. אם זו טעות או שיש שאלה – כתבי לנו ונחזור אלייך."
            : `היי ${profile.first_name}, המייל שלך אומת. עכשיו צוות המעטפת יאשר את ההצטרפות – ותקבלי הודעה למייל ברגע שזה קורה.`}
        </p>
        <SignOutButton label="יציאה מהחשבון" />
      </div>
    </AuthShell>
  );
}
