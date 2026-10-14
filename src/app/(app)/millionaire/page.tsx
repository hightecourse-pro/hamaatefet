import Image from "next/image";
import { requireActive, displayName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MemberFrame } from "@/components/member-frame";
import { decorateEvents, todayIso, KIND_LABEL, KIND_COLORS } from "@/lib/events";
import { toggleRegistration } from "@/app/(app)/events-actions";
import { ToggleButton } from "@/components/toggle-button";
import { ChequeForm } from "./cheque-form";
import { HEBREW_MONTHS, hebrewToday, hebrewDateLabel } from "@/lib/hebrew";
import { HDate, gematriya } from "@hebcal/core";

export const metadata = { title: "המיליונרית" };

const STEP = { flex: "1 1 240px", background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", gap: 16, alignItems: "flex-start" } as const;
const NUM = { flex: "none", width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700 } as const;

function dayAndMonth(iso: string | null): { day: string; month: string } {
  if (!iso) return { day: "?", month: "מועד ייקבע" };
  const [y, m, d] = iso.split("-").map(Number);
  const hd = new HDate(new Date(Date.UTC(y, m - 1, d, 12)));
  const hm = hd.getMonth();
  const ours = hm === 13 ? 6 : hm >= 7 ? hm - 6 : hm + 6;
  return { day: gematriya(hd.getDate()), month: HEBREW_MONTHS[ours - 1] };
}

export default async function MillionairePage() {
  const { userId, profile } = await requireActive();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("events")
    .select("*")
    .eq("type", "millionaire")
    .eq("published", true)
    .or(`event_date.gte.${todayIso()},event_date.is.null`)
    .order("event_date", { ascending: true, nullsFirst: false })
    .limit(12);
  const hosts = await decorateEvents(supabase, userId, rows ?? []);

  const today = hebrewToday();
  const months: string[] = [];
  for (let i = 1; i <= 8; i++) months.push(HEBREW_MONTHS[(today.month - 1 + i) % 12]);

  const ROT = [-1.5, 1, -0.5];

  return (
    <MemberFrame profile={profile} current="millionaire">
      <section style={{ background: "#FCE3CC", position: "relative", overflow: "hidden" }}>
        <div aria-hidden="true" className="coin" style={{ position: "absolute", top: 40, left: "6%", width: 54, height: 54, borderRadius: "50%", border: "5px dashed #E8894A" }} />
        <div aria-hidden="true" style={{ position: "absolute", bottom: 40, right: "46%", width: 16, height: 16, borderRadius: "50%", background: "#A3304A" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 40, position: "relative" }}>
          <div style={{ flex: "1 1 420px", display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="hand" style={{ fontSize: 20, color: "#9A4318" }}>
              מפגשי אירוח של חברות המעטפת
            </span>
            <h1 style={{ margin: 0, fontSize: "clamp(52px, 8vw, 88px)", fontWeight: 700, lineHeight: 1 }}>
              <span className="grad">המיליונרית</span>
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: 22, lineHeight: 1.6, maxWidth: 520 }}>
              יש לך משהו שאין לאף אחת?
              <br />
              כישרון, תובנה, סיפור בלעדי…?
              <br />
              תני לנו לטעום ממך, קצת, ככה, בקטנה.
            </p>
            <p className="hand" style={{ margin: "4px 0 0", fontSize: 30, fontWeight: 600, color: "#A3304A", transform: "rotate(-3deg)", alignSelf: "flex-start" }}>
              כי את שווה מיליון דולר!
            </p>
          </div>
          <div style={{ flex: "1 1 380px", maxWidth: 460, position: "relative", background: "#FFFDF8", borderRadius: 20, border: "2px solid #E8C7AE", padding: "26px 28px", boxShadow: "10px 10px 0 #B5532F", transform: "rotate(3deg)", display: "flex", flexDirection: "column", gap: 14 }}>
            <Image src="/brand/seal.png" alt="" width={96} height={96} style={{ position: "absolute", bottom: -30, left: -24, width: 96, height: 96, transform: "rotate(-18deg)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 18, color: "#9A4318" }}>בנק המעטפת</span>
              <span style={{ fontSize: 15, color: "#7A5566" }}>מס׳ 000001</span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline", borderBottom: "2px dashed #D9B79E", paddingBottom: 8 }}>
              <span style={{ fontSize: 15, color: "#7A5566" }}>לפקודת</span>
              <span className="hand" style={{ fontSize: 24, color: "#4A1942" }}>
                את
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline", borderBottom: "2px dashed #D9B79E", paddingBottom: 8 }}>
              <span style={{ fontSize: 15, color: "#7A5566" }}>סך של</span>
              <span className="hand" style={{ fontSize: 24, color: "#4A1942" }}>
                מיליון דולר בדיוק
              </span>
            </div>
            <div style={{ alignSelf: "flex-start", padding: "8px 16px", border: "2px solid #B5532F", borderRadius: 10, fontWeight: 700, fontSize: 26, color: "#B5532F" }} dir="ltr">
              $1,000,000
            </div>
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 72px", display: "flex", flexDirection: "column", gap: 64 }}>
        <section aria-labelledby="how" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <h2 id="how" style={{ margin: 0, fontSize: 34, fontWeight: 700 }}>
            <span className="grad">איך זה עובד?</span>
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            <div style={STEP}>
              <span style={{ ...NUM, background: "#FCE3CC", color: "#9A4318" }}>1</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <strong style={{ fontSize: 19 }}>מספרת לנו מה יש לך</strong>
                <span style={{ fontSize: 16, lineHeight: 1.5, color: "#6A4558" }}>ממלאת את הצ׳ק למטה – כמה מילים זה מספיק.</span>
              </div>
            </div>
            <div style={STEP}>
              <span style={{ ...NUM, background: "#FBE1E4", color: "#A3304A" }}>2</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <strong style={{ fontSize: 19 }}>קובעות יחד מועד</strong>
                <span style={{ fontSize: 16, lineHeight: 1.5, color: "#6A4558" }}>צוות המעטפת חוזר אלייך ומתאם תאריך ומקום.</span>
              </div>
            </div>
            <div style={STEP}>
              <span style={{ ...NUM, background: "#F1E2EE", color: "#4A1942" }}>3</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <strong style={{ fontSize: 19 }}>את מארחת, אנחנו טועמות</strong>
                <span style={{ fontSize: 16, lineHeight: 1.5, color: "#6A4558" }}>ערב קטן, אינטימי ובלעדי – בדיוק בגודל שלך.</span>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="next" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <h2 id="next" style={{ margin: 0, fontSize: 34, fontWeight: 700 }}>
              <span className="grad">המארחות הבאות</span>
            </h2>
            <span className="hand" style={{ fontSize: 18, color: "#7A5566" }}>
              מקומות מוגבלים – כדאי להירשם
            </span>
          </div>
          {hosts.length === 0 && (
            <div className="surface" style={{ color: "#6A4558", fontSize: 17, textAlign: "center", padding: 32 }}>
              עוד אין מועדים קבועים. הצ׳ק הראשון יכול להיות שלך – הטופס למטה.
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 28 }}>
            {hosts.map((h, i) => {
              const dm = dayAndMonth(h.event_date);
              const kc = KIND_COLORS[h.kind ?? "other"];
              return (
                <article key={h.id} className="host" style={{ flex: "1 1 300px", background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 26, padding: 22, display: "flex", flexDirection: "column", gap: 14, boxShadow: "6px 6px 0 #F3DCCB", transform: `rotate(${ROT[i % 3]}deg)` }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ flex: "none", width: 74, height: 80, borderRadius: 18, background: "#6E0F1A", color: "#FBE3D6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                      <span style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{dm.day}</span>
                      <span style={{ fontSize: 15 }}>{dm.month}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {h.kind && (
                        <span style={{ alignSelf: "flex-start", padding: "4px 12px", borderRadius: 999, background: kc.tint, color: kc.color, fontSize: 14, fontWeight: 600 }}>{KIND_LABEL[h.kind]}</span>
                      )}
                      <span style={{ fontSize: 15, color: "#7A5566" }}>
                        {[h.timeLabel, h.location].filter(Boolean).join(" · ") || hebrewDateLabel(h.event_date)}
                      </span>
                    </div>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 23, fontWeight: 700 }}>{h.title}</h3>
                  <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "#5A3348", whiteSpace: "pre-wrap" }}>
                    {h.host_name && (
                      <>
                        מארחת: {h.host_name}
                        <br />
                      </>
                    )}
                    {h.description}
                  </p>
                  <ToggleButton
                    on={h.registered}
                    onLabel="נרשמת! (ביטול)"
                    offLabel="שמרי לי מקום"
                    disabled={h.full}
                    disabledLabel="המקומות נגמרו"
                    action={toggleRegistration.bind(null, h.id, "/millionaire")}
                    onStyle={{ marginTop: "auto", minHeight: 50, borderRadius: 16, fontSize: 18, fontWeight: 600, cursor: "pointer", background: "#FFFFFF", color: "#2F6B3A", border: "2px solid #2F6B3A" }}
                    offStyle={{ marginTop: "auto", minHeight: 50, borderRadius: 16, fontSize: 18, fontWeight: 600, cursor: "pointer", background: "#6E0F1A", color: "#FFF3EA", border: "2px solid #6E0F1A", boxShadow: "3px 3px 0 #4A1942" }}
                  />
                </article>
              );
            })}
          </div>
        </section>

        <section id="propose" aria-labelledby="prop" style={{ background: "#FFFDF8", border: "2px solid #E8C7AE", borderRadius: 32, padding: "clamp(24px, 4vw, 48px)", boxShadow: "10px 10px 0 #E8894A", position: "relative", display: "flex", flexDirection: "column", gap: 22 }}>
          <Image src="/brand/envelope.png" alt="" width={140} height={110} style={{ position: "absolute", top: -50, left: 30, width: 140, height: "auto", transform: "rotate(12deg)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h2 id="prop" style={{ margin: 0, fontSize: 38, fontWeight: 700 }}>
              <span className="grad">הצ׳ק שלך</span>
            </h2>
            <p className="hand" style={{ margin: 0, fontSize: 19, color: "#9A4318" }}>
              ממלאות, חותמות, ואנחנו כבר חוזרות אלייך
            </p>
          </div>
          <ChequeForm defaultName={displayName(profile)} months={months} />
        </section>
      </main>
    </MemberFrame>
  );
}
