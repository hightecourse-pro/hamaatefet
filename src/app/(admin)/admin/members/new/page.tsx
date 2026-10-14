import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { InviteForm } from "./invite-form";

export const metadata = { title: "הוספת משתתפת" };

export default async function NewMemberPage() {
  await requireAdmin();
  return (
    <section style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 18, maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
          <span className="grad">הוספת משתתפת</span>
        </h1>
        <Link href="/admin">חזרה לרשימה</Link>
      </div>
      <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#5A3348" }}>היא תקבל מייל הזמנה, תבחר סיסמה ותיכנס ישר – בלי שלב האישור.</p>
      <InviteForm />
    </section>
  );
}
