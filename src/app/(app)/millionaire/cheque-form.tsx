"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { createProposal, type ProposalState } from "./actions";

const KINDS = [
  { key: "talent", label: "כישרון" },
  { key: "insight", label: "תובנה" },
  { key: "story", label: "סיפור בלעדי" },
  { key: "other", label: "משהו אחר לגמרי" },
];

const LINE_LABEL = { display: "flex", flexDirection: "column", gap: 2, fontSize: 15, color: "#7A5566" } as const;

export function ChequeForm({ defaultName, months }: { defaultName: string; months: string[] }) {
  const [state, action, pending] = useActionState<ProposalState, FormData>(createProposal, { error: null });
  const [kind, setKind] = useState("talent");
  const [reset, setReset] = useState(0);
  const sent = state.sent && reset === 0;

  if (sent) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", padding: "12px 0" }}>
        <Image src="/brand/seal.png" alt="" width={90} height={90} style={{ width: 90, height: 90, transform: "rotate(-10deg)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <strong style={{ fontSize: 26 }}>הצ׳ק נחתם!</strong>
          <span style={{ fontSize: 18, color: "#5A3348" }}>צוות המעטפת יחזור אלייך בקרוב לתיאום מועד.</span>
          <button type="button" className="btn-link" style={{ alignSelf: "flex-start" }} onClick={() => setReset((n) => n + 1)}>
            יש לי עוד רעיון
          </button>
        </div>
      </div>
    );
  }

  return (
    <form key={reset} action={action} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <input type="hidden" name="kind" value={kind} />
      {state.error && (
        <p role="alert" className="flash flash-err" style={{ margin: 0 }}>
          {state.error}
        </p>
      )}
      <fieldset style={{ border: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <legend style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>מה יש לך שאין לאף אחת?</legend>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {KINDS.map((k) => {
            const on = k.key === kind;
            return (
              <button
                key={k.key}
                type="button"
                aria-pressed={on}
                onClick={() => setKind(k.key)}
                style={{
                  minHeight: 48,
                  padding: "0 20px",
                  borderRadius: 999,
                  fontSize: 17,
                  cursor: "pointer",
                  background: on ? "#B5532F" : "#FFFFFF",
                  color: on ? "#FFF6EE" : "#6E0F1A",
                  border: on ? "2px solid #B5532F" : "2px dashed #D9B79E",
                  fontWeight: on ? 600 : 500,
                  boxShadow: on ? "3px 3px 0 #6E0F1A" : "none",
                }}
              >
                {k.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 32px" }}>
        <label style={{ ...LINE_LABEL, flex: "1 1 260px" }}>
          לפקודת (השם שלך)
          <input className="line" name="display_name" type="text" placeholder="איך נציג אותך?" defaultValue={defaultName} />
        </label>
        <label style={{ ...LINE_LABEL, flex: "1 1 260px" }}>
          שם המפגש
          <input className="line" name="title" type="text" placeholder="כותרת קצרה ומסקרנת" required />
        </label>
      </div>
      <label style={LINE_LABEL}>
        על מה נטעם?
        <textarea className="line" name="description" rows={3} placeholder="ספרי לנו קצת – מה תביאי, מה נחווה, כמה זמן זה לוקח" required />
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 32px", alignItems: "flex-end" }}>
        <label style={{ ...LINE_LABEL, flex: "1 1 220px" }}>
          מתי נוח לך?
          <select className="line" name="preferred_month" defaultValue={months[0]}>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value="גמיש">גמיש</option>
          </select>
        </label>
        <label style={{ ...LINE_LABEL, flex: "1 1 220px" }}>
          צריכה משהו מיוחד?
          <input className="line" name="needs" type="text" placeholder="מקרן, שולחן, חומרים…" />
        </label>
        <button
          type="submit"
          disabled={pending}
          style={{ flex: "0 0 auto", height: 56, padding: "0 30px", borderRadius: 18, border: "none", background: "#B5532F", color: "#FFF6EE", fontSize: 20, fontWeight: 700, cursor: "pointer", boxShadow: "4px 4px 0 #6E0F1A", opacity: pending ? 0.7 : 1 }}
        >
          {pending ? "חותמת…" : "חותמת על הצ׳ק"}
        </button>
      </div>
    </form>
  );
}
