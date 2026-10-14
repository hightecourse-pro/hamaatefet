import Link from "next/link";
import Image from "next/image";
import { requireActive } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MemberFrame } from "@/components/member-frame";
import { nextEvent } from "@/lib/events";
import { toggleRegistration } from "@/app/(app)/events-actions";
import { ToggleButton } from "@/components/toggle-button";

export const metadata = { title: "תפריט ראשי" };

const CARD_BASE = {
  flex: "1 1 320px",
  maxWidth: 370,
  position: "relative",
  display: "flex",
  flexDirection: "column",
  background: "#FBF1EA",
  borderRadius: 28,
  border: "2px solid #EAD3C6",
  textDecoration: "none",
  color: "#3A1530",
  overflow: "hidden",
} as const;

const PILL = { padding: "6px 12px", borderRadius: 999, background: "#FFFFFF", border: "1.5px solid #E2C8BB", fontSize: 15 } as const;

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export default async function HomePage() {
  const { userId, profile } = await requireActive();
  const supabase = await createClient();
  const [event, { data: sections }] = await Promise.all([
    nextEvent(supabase, userId),
    supabase.from("forum_sections").select("name").eq("visible", true).order("sort_order"),
  ]);

  return (
    <MemberFrame profile={profile} current="home">
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 72px", position: "relative" }}>
        <div aria-hidden="true" style={{ position: "absolute", top: 40, left: "6%", width: 20, height: 20, borderRadius: "50%", background: "#F0A35E" }} />
        <div aria-hidden="true" style={{ position: "absolute", top: 150, left: "22%", width: 12, height: 12, borderRadius: 3, background: "#A3304A", transform: "rotate(25deg)" }} />
        <div aria-hidden="true" style={{ position: "absolute", top: 70, right: "52%", width: 24, height: 24, borderRadius: "50%", border: "4px solid #F6C9A6" }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6, marginBottom: 56 }}>
          <p className="hand" style={{ margin: 0, fontSize: 26, color: "#A3304A", transform: "rotate(-3deg)" }}>
            היי {profile.first_name},
          </p>
          <h1 style={{ margin: 0, fontSize: "clamp(44px, 7vw, 80px)", lineHeight: 1.05, fontWeight: 700 }}>
            <span className="grad">איזו המעטפָאן את פותחת היום?</span>
          </h1>
          <svg width="220" height="16" viewBox="0 0 220 16" aria-hidden="true" style={{ marginTop: 6 }}>
            <path d="M3 9 Q 14 1 25 9 T 47 9 T 69 9 T 91 9 T 113 9 T 135 9 T 157 9 T 179 9 T 201 9 T 217 8" fill="none" stroke="#F0A35E" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 40, justifyContent: "center", alignItems: "stretch" }}>
          <Link href="/forum" className="card" style={{ ...CARD_BASE, boxShadow: "8px 8px 0 #4A1942", transform: "rotate(-2deg)" }}>
            <div aria-hidden="true" style={{ height: 130, background: "#EBD4C8", clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
            <Image className="seal" src="/brand/seal.png" alt="" width={92} height={92} style={{ position: "absolute", top: 78, left: "50%", marginLeft: -46, width: 92, height: 92 }} />
            <div style={{ padding: "52px 30px 30px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 46, fontWeight: 700, lineHeight: 1 }}>
                <span className="grad">הפורום</span>
              </h2>
              <p className="hand" style={{ margin: 0, fontSize: 19, color: "#4A1942" }}>
                תוכן שיתופי חברתי בדיגיטל
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "6px 0" }}>
                {(sections ?? []).map((s) => (
                  <span key={s.name} style={PILL}>
                    {s.name}
                  </span>
                ))}
              </div>
              <span style={{ marginTop: "auto", display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 8, minHeight: 48, padding: "0 20px", borderRadius: 999, background: "#4A1942", color: "#FFF3EA", fontSize: 17, fontWeight: 600 }}>
                היכנסי והכירי את המדורים החדשים
                <Arrow />
              </span>
            </div>
          </Link>

          <Link href="/millionaire" className="card" style={{ ...CARD_BASE, boxShadow: "8px 8px 0 #B5532F", transform: "rotate(1.5deg) translateY(14px)" }}>
            <div aria-hidden="true" style={{ height: 130, background: "#F5D7BD", clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
            <Image className="seal" src="/brand/seal.png" alt="" width={92} height={92} style={{ position: "absolute", top: 78, left: "50%", marginLeft: -46, width: 92, height: 92 }} />
            <div style={{ padding: "52px 30px 30px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 46, fontWeight: 700, lineHeight: 1 }}>
                <span className="grad">המיליונרית</span>
              </h2>
              <p className="hand" style={{ margin: 0, fontSize: 19, color: "#B5532F" }}>
                מפגשי אירוח של חברות המעטפת
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 18, lineHeight: 1.55 }}>
                יש לך משהו שאין לאף אחת?
                <br />
                כישרון, תובנה, סיפור בלעדי…?
                <br />
                תני לנו לטעום ממך, קצת, ככה, בקטנה.
              </p>
              <p className="hand" style={{ margin: "2px 0 6px", fontSize: 22, fontWeight: 600, color: "#A3304A", transform: "rotate(-2deg)" }}>
                כי את שווה מיליון דולר!
              </p>
              <span style={{ marginTop: "auto", display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 8, minHeight: 48, padding: "0 20px", borderRadius: 999, background: "#B5532F", color: "#FFF6EE", fontSize: 17, fontWeight: 600 }}>
                למפגשי האירוח
                <Arrow />
              </span>
            </div>
          </Link>

          <Link href="/birthday" className="card" style={{ ...CARD_BASE, boxShadow: "8px 8px 0 #6E0F1A", transform: "rotate(-1deg)" }}>
            <div aria-hidden="true" style={{ height: 130, background: "#EDCBCF", clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
            <Image className="seal" src="/brand/seal.png" alt="" width={92} height={92} style={{ position: "absolute", top: 78, left: "50%", marginLeft: -46, width: 92, height: 92 }} />
            <div style={{ padding: "52px 30px 30px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 46, fontWeight: 700, lineHeight: 1 }}>
                <span className="grad">
                  חוגגות <span style={{ whiteSpace: "nowrap" }}>חודש טוב</span>
                </span>
              </h2>
              <p className="hand" style={{ margin: 0, fontSize: 19, color: "#6E0F1A" }}>
                מפגשי יומולדת
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 18, lineHeight: 1.55 }}>
                יומולדת זה דבר שמח? תלוי מתי.
                <br />
                יומולדת זה דבר עצוב? תלוי עם מי.
                <br />
                מוזמנת ליומולדת אמיתי, רק שלנו.
              </p>
              <span style={{ marginTop: "auto", display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 8, minHeight: 48, padding: "0 20px", borderRadius: 999, background: "#6E0F1A", color: "#FFF3EA", fontSize: 17, fontWeight: 600 }}>
                למפגש החודשי
                <Arrow />
              </span>
            </div>
          </Link>
        </div>
      </main>

      {event && (
        <section aria-label="המפגש הקרוב" style={{ background: "linear-gradient(90deg, #4E0812 0%, #6E0F1A 60%, #7A1424 100%)", color: "#FBE3D6" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <Image src="/brand/envelope.png" alt="" width={120} height={94} style={{ width: 120, height: "auto", transform: "rotate(-10deg)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="hand" style={{ fontSize: 18, color: "#F6C9A6" }}>
                  המפגש הקרוב
                </span>
                <span style={{ fontSize: 36, fontWeight: 700, color: "#FFFFFF" }}>{event.title}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 19, fontWeight: 500, lineHeight: 1.5 }}>
              <span>
                {event.dateLabel}
                {event.timeLabel ? ` | ${event.timeLabel}` : ""}
              </span>
              {event.location && <span>ב{event.location}</span>}
              <span>
                {event.price_ils > 0 ? `השתתפות ${event.price_ils} ש״ח` : "ללא תשלום"}
                {event.capacity ? " – מקומות מוגבלים!" : ""}
              </span>
            </div>
            <ToggleButton
              on={event.registered}
              onLabel="נרשמת! (ביטול)"
              offLabel="אני באה!"
              disabled={event.full}
              disabledLabel="המקומות נגמרו"
              action={toggleRegistration.bind(null, event.id, "/home")}
              onStyle={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 54, padding: "0 28px", borderRadius: 18, background: "#FFFFFF", color: "#2F6B3A", border: "2px solid #2F6B3A", fontSize: 19, fontWeight: 700, cursor: "pointer" }}
              offStyle={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 54, padding: "0 28px", borderRadius: 18, background: "#FBE3D6", color: "#6E0F1A", border: "none", fontSize: 19, fontWeight: 700, boxShadow: "4px 4px 0 #2E0509", cursor: "pointer" }}
            />
          </div>
        </section>
      )}
    </MemberFrame>
  );
}
