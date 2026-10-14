import Image from "next/image";
import { requireActive } from "@/lib/auth";
import { MemberFrame } from "@/components/member-frame";
import { BirthdayForm, DetailsForm } from "./profile-forms";

export const metadata = { title: "החשבון שלי" };

export default async function ProfilePage() {
  const { profile, email } = await requireActive();
  return (
    <MemberFrame profile={profile} current="profile">
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 72px", display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="hand" style={{ fontSize: 20, color: "#A3304A" }}>
            היי {profile.first_name},
          </span>
          <h1 style={{ margin: 0, fontSize: 48, fontWeight: 700 }}>
            <span className="grad">החשבון שלי</span>
          </h1>
        </div>

        <section aria-labelledby="bd" style={{ background: "#FBF1EA", border: "2px solid #EAD3C6", borderRadius: 28, padding: 26, display: "flex", flexDirection: "column", gap: 14, boxShadow: "8px 8px 0 #6E0F1A", position: "relative" }}>
          <Image src="/brand/seal.png" alt="" width={80} height={80} style={{ position: "absolute", top: -28, left: -20, width: 80, height: 80, transform: "rotate(-14deg)" }} />
          <h2 id="bd" style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
            מתי נולדת?
          </h2>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "#5A3348" }}>חודש הלידה העברי קובע באיזו מסיבה של חוגגות חודש טוב תהיי מבעלות השמחה. נבחר בהרשמה, ואפשר לשנות כאן בכל זמן.</p>
          <BirthdayForm birthMonth={profile.birth_month} remind={profile.remind_birthday} />
        </section>

        <section aria-labelledby="det" style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 28, padding: 26, display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 id="det" style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
            פרטים אישיים
          </h2>
          <DetailsForm firstName={profile.first_name} lastName={profile.last_name} email={email} phone={profile.phone} />
        </section>
      </main>
    </MemberFrame>
  );
}
