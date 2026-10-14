import Link from "next/link";
import Image from "next/image";
import { requireActive } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MemberFrame } from "@/components/member-frame";
import { decorateEvents, todayIso } from "@/lib/events";
import { hebrewToday, monthName, hebrewDateLabel, timeRange } from "@/lib/hebrew";
import { toggleRegistration, toggleTopicTeam } from "@/app/(app)/events-actions";
import { ToggleButton } from "@/components/toggle-button";
import { Agenda } from "./agenda";

export const metadata = { title: "חוגגות חודש טוב" };

function Balloon({ cls, left, top, color, w, h, string }: { cls: string; left: string; top: number; color: string; w: number; h: number; string: number }) {
  return (
    <div aria-hidden="true" className={cls} style={{ position: "absolute", top, left, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: w, height: h, borderRadius: "50% 50% 46% 46% / 58% 58% 42% 42%", background: color }} />
      <div style={{ width: 2, height: string, background: "#F6C9A6" }} />
    </div>
  );
}

const ICON = (d: string, extra?: React.ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A3304A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
    {extra}
  </svg>
);

export default async function BirthdayPage() {
  const { userId, profile } = await requireActive();
  const supabase = await createClient();
  const today = hebrewToday();

  // The current monthly meeting: this Hebrew month's party; else the next one by date.
  let { data: current } = await supabase.from("events").select("*").eq("type", "birthday").eq("published", true).eq("hebrew_year", today.year).eq("hebrew_month", today.month).maybeSingle();
  if (!current) {
    const { data: upcoming } = await supabase.from("events").select("*").eq("type", "birthday").eq("published", true).gte("event_date", todayIso()).order("event_date").limit(1);
    current = upcoming?.[0] ?? null;
  }
  const meetingMonth = current?.hebrew_month ?? today.month;
  const isHost = profile.birth_month === meetingMonth;

  const [view] = current ? await decorateEvents(supabase, userId, [current]) : [null];
  const [{ data: agenda }, { data: team }, teamCount, { data: past }] = await Promise.all([
    current ? supabase.from("event_agenda").select("*").eq("event_id", current.id).order("sort_order") : Promise.resolve({ data: [] }),
    current ? supabase.from("topic_team").select("event_id").eq("event_id", current.id).eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null }),
    current ? supabase.rpc("topic_team_count", { eid: current.id }).then((r) => r.data ?? 0) : Promise.resolve(0),
    supabase.from("events").select("id, title, event_date, topic, hebrew_month").eq("type", "birthday").eq("published", true).lt("event_date", todayIso()).order("event_date", { ascending: false }).limit(12),
  ]);
  const inTeam = !!team;
  const title = current?.title || `מסיבת ${monthName(meetingMonth)}`;

  return (
    <MemberFrame profile={profile} current="birthday">
      <section style={{ background: "linear-gradient(90deg, #4E0812 0%, #6E0F1A 60%, #7A1424 100%)", color: "#FBE3D6", position: "relative", overflow: "hidden" }}>
        <Balloon cls="bal" left="7%" top={40} color="#F0A35E" w={70} h={86} string={90} />
        <Balloon cls="bal2" left="15%" top={90} color="#E07A8F" w={56} h={70} string={80} />
        <Balloon cls="bal3" left="22%" top={20} color="#FCD5B5" w={48} h={60} string={100} />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 64px", display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
          <span className="hand" style={{ fontSize: 20, color: "#F6C9A6" }}>
            מפגשי יומולדת
          </span>
          <h1 style={{ margin: 0, fontSize: "clamp(48px, 7vw, 80px)", fontWeight: 700, lineHeight: 1.05, color: "#FFFFFF" }}>
            חוגגות <span style={{ whiteSpace: "nowrap" }}>חודש טוב</span>
          </h1>
          <div className="hand" style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 24, lineHeight: 1.5, marginTop: 8 }}>
            <span>
              יומולדת זה דבר שמח? <span style={{ color: "#F0A35E" }}>תלוי מתי.</span>
            </span>
            <span>
              יומולדת זה דבר עצוב? <span style={{ color: "#F0A35E" }}>תלוי עם מי.</span>
            </span>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 19, lineHeight: 1.6, maxWidth: 640 }}>
            מוזמנת ליומולדת אמיתי, רק שלנו: עם עוגה וחטיפים, עם בלונים וחיוכים, ועם תוכן הכי הכי מחבר ונוגע, שרק אנחנו מבינות. על הנושא אחראיות – בעלות השמחה :)
          </p>
        </div>
      </section>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 72px", display: "flex", flexDirection: "column", gap: 56 }}>
        <section aria-labelledby="when" style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 32, padding: "clamp(22px, 4vw, 40px)", marginTop: -32, position: "relative", boxShadow: "8px 8px 0 #F3DCCB", display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="hand" style={{ fontSize: 18, color: "#A3304A" }}>
                המפגש החודשי הקרוב
              </span>
              <h2 id="when" style={{ margin: 0, fontSize: 40, fontWeight: 700, lineHeight: 1.1 }}>
                <span className="grad">{title}</span>
              </h2>
            </div>
            <a href="#archive" style={{ fontSize: 16, padding: "10px 0" }}>
              מפגשים קודמים
            </a>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "stretch", background: "#FBF1EA", borderRadius: 24, padding: 24, border: "2px dashed #E2C8BB" }}>
            <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 10 }}>
              {isHost ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Image src="/brand/seal.png" alt="" width={56} height={56} style={{ width: 56, height: 56, transform: "rotate(-12deg)" }} />
                    <span style={{ fontSize: 28, fontWeight: 700, color: "#6E0F1A" }}>את מבעלות השמחה החודש!</span>
                  </span>
                  <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>בעלות השמחה בוחרות יחד את נושא הערב. רוצה לקחת חלק בצוות הנושא?</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4, alignItems: "center" }}>
                    {current ? (
                      <ToggleButton
                        on={inTeam}
                        onLabel="את בצוות הנושא!"
                        offLabel="אני רוצה להיות בצוות הנושא"
                        action={toggleTopicTeam.bind(null, current.id)}
                        onStyle={{ minHeight: 50, padding: "0 22px", borderRadius: 16, fontSize: 17, fontWeight: 600, cursor: "pointer", background: "#FFFFFF", color: "#2F6B3A", border: "2px solid #2F6B3A" }}
                        offStyle={{ minHeight: 50, padding: "0 22px", borderRadius: 16, fontSize: 17, fontWeight: 600, cursor: "pointer", background: "#A3304A", color: "#FFF3EA", border: "2px solid #A3304A", boxShadow: "3px 3px 0 #4A1942" }}
                      />
                    ) : (
                      <span style={{ fontSize: 15, color: "#7A5566" }}>צוות הנושא ייפתח כשהצוות יפרסם את פרטי המפגש.</span>
                    )}
                    {teamCount > 0 && (
                      <span className="hand" style={{ fontSize: 15, color: "#7A5566" }}>
                        כבר בצוות: {teamCount}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <span style={{ fontSize: 26, fontWeight: 700, color: "#6E0F1A" }}>חוגגות את ילידות {monthName(meetingMonth)}</span>
                  <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>בואי לשמוח איתן – הערב שלהן הוא גם שלך. המסיבה שלך תגיע בחודש שבו נולדת.</p>
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: "auto", paddingTop: 12, borderTop: "1.5px dashed #E2C8BB", fontSize: 16, color: "#5A3348" }}>
                <span>
                  חודש הלידה שלך: <strong>{monthName(profile.birth_month) || "לא נבחר"}</strong>
                </span>
                <Link href="/profile" style={{ padding: "8px 4px" }}>
                  שינוי בחשבון שלי
                </Link>
              </div>
            </div>
            <div style={{ flex: "1 1 280px", background: "#FFFFFF", borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 10, boxShadow: "5px 5px 0 #6E0F1A", transform: "rotate(-1.5deg)" }}>
              <strong style={{ fontSize: 20 }}>פרטי המפגש</strong>
              <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 17 }}>
                {ICON("M16 3v4M8 3v4M3 11h18", <rect x="3" y="5" width="18" height="16" rx="3" />)}
                {current?.event_date ? hebrewDateLabel(current.event_date) : "התאריך יפורסם בקרוב"}
              </span>
              <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 17 }}>
                {ICON("M12 7v5l3 2", <circle cx="12" cy="12" r="9" />)}
                {current ? timeRange(current.start_time, current.end_time) || "השעה תפורסם בקרוב" : "—"}
              </span>
              <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 17 }}>
                {ICON("M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z", <circle cx="12" cy="10" r="2.5" />)}
                {current?.location || "המקום יפורסם בקרוב"}
              </span>
              {current?.topic && (
                <span style={{ fontSize: 16, color: "#5A3348" }}>
                  נושא הערב: <strong>{current.topic}</strong>
                </span>
              )}
              {current && view ? (
                <ToggleButton
                  on={view.registered}
                  onLabel="מגיעה! (ביטול)"
                  offLabel="אני באה לחגוג"
                  disabled={view.full || !current.event_date}
                  disabledLabel={!current.event_date ? "ההרשמה תיפתח בקרוב" : "המקומות נגמרו"}
                  action={toggleRegistration.bind(null, current.id, "/birthday")}
                  onStyle={{ marginTop: "auto", minHeight: 50, borderRadius: 16, fontSize: 18, fontWeight: 600, cursor: "pointer", background: "#FFFFFF", color: "#2F6B3A", border: "2px solid #2F6B3A" }}
                  offStyle={{ marginTop: "auto", minHeight: 50, borderRadius: 16, fontSize: 18, fontWeight: 600, cursor: "pointer", background: "#6E0F1A", color: "#FFF3EA", border: "2px solid #6E0F1A" }}
                />
              ) : (
                <span style={{ marginTop: "auto", fontSize: 15, color: "#7A5566" }}>ההרשמה תיפתח כשיפורסמו הפרטים.</span>
              )}
            </div>
          </div>
        </section>

        <section aria-labelledby="agenda" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 id="agenda" style={{ margin: 0, fontSize: 34, fontWeight: 700 }}>
              <span className="grad">מה מחכה לנו במפגש</span>
            </h2>
            <p className="hand" style={{ margin: 0, fontSize: 18, color: "#7A5566" }}>
              הפירוט המורחב של הדיונים
            </p>
          </div>
          {agenda && agenda.length > 0 ? (
            <Agenda items={agenda.map((a) => ({ id: a.id, time_label: a.time_label, title: a.title, body: a.body, questions: a.questions }))} />
          ) : (
            <div className="surface" style={{ color: "#6A4558", fontSize: 17, textAlign: "center", padding: 28 }}>
              בעלות השמחה עוד בוחרות את הנושא. הפירוט יתפרסם כאן.
            </div>
          )}
        </section>

        <section id="archive" aria-labelledby="archive-h" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 id="archive-h" style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
            <span className="grad">מפגשים קודמים</span>
          </h2>
          {(past ?? []).length === 0 ? (
            <span style={{ fontSize: 16, color: "#7A5566" }}>זה עוד לא קרה – המסיבה הראשונה לפנינו.</span>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              {(past ?? []).map((p) => (
                <div key={p.id} className="mo" style={{ flex: "1 1 220px", background: "#FFFCFA", border: "2px solid #F0E2D8", borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                  <strong style={{ fontSize: 20, color: "#6E0F1A" }}>{p.title}</strong>
                  <span style={{ fontSize: 15, color: "#6A4558" }}>{hebrewDateLabel(p.event_date)}</span>
                  {p.topic && <span style={{ fontSize: 15, color: "#6A4558" }}>נושא: {p.topic}</span>}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </MemberFrame>
  );
}
