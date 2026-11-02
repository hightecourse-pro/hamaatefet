"use client";

import { useActionState, useState } from "react";
import { updateSection, deleteSection, type AdminState } from "../actions";
import { ActionButton } from "../ui";

export interface SectionRow {
  id: string;
  key: string;
  name: string;
  description: string;
  post_mode: string;
  ask_label: string;
  rules: string;
  is_new: boolean;
  visible: boolean;
  sort_order: number;
  color: string;
  tint: string;
}

const LABEL = { display: "flex", flexDirection: "column", gap: 4, fontSize: 14, fontWeight: 600 } as const;

/** One section in the admin: a summary line, and an "עריכה" form for everything about it. */
export function SectionEditor({ s, postCount }: { s: SectionRow; postCount: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminState, FormData>(updateSection.bind(null, s.id), { error: null });
  return (
    <div data-testid="section-row" style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 14px", borderRadius: 16, background: s.visible ? "#FBF1EA" : "#F6F0EC", opacity: s.visible ? 1 : 0.8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: s.color, flex: "none" }} aria-hidden="true" />
            <span style={{ fontSize: 17, fontWeight: 600 }}>{s.name}</span>
            <span style={{ fontSize: 12, padding: "1px 8px", borderRadius: 999, background: s.post_mode === "members" ? "#E4F0E7" : "#F1E2EE", color: s.post_mode === "members" ? "#2F6B3A" : "#4A1942", fontWeight: 600 }}>{s.post_mode === "members" ? "כולן פותחות דיונים" : "רק הצוות פותח"}</span>
            {s.ask_label && <span style={{ fontSize: 12, padding: "1px 8px", borderRadius: 999, background: "#F6DADC", color: "#A3304A", fontWeight: 600 }}>כפתור «{s.ask_label}»</span>}
            {!s.visible && <span className="pill pill-hidden">מוסתר</span>}
            {s.is_new && <span style={{ fontSize: 12, color: "#9A4318" }}>חדש!</span>}
          </span>
          <span style={{ fontSize: 13, color: "#6A4558" }}>
            {s.description || "—"} · {postCount} דיונים
          </span>
        </span>
        <button type="button" className="btn-sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? "סגירה" : "עריכה"}
        </button>
      </div>
      {open && (
        <form action={action} style={{ display: "flex", flexDirection: "column", gap: 10, background: "#FFFFFF", borderRadius: 14, padding: 14, border: "1.5px solid #F0E2D8" }}>
          {state.error && (
            <p role="alert" className="flash flash-err" style={{ margin: 0 }}>
              {state.error}
            </p>
          )}
          {state.ok && (
            <p role="status" className="flash flash-ok" style={{ margin: 0 }}>
              {state.ok}
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <label style={{ ...LABEL, flex: "1 1 180px" }}>
              שם המדור
              <input className="fld fld-sm" name="name" defaultValue={s.name} required maxLength={40} />
            </label>
            <label style={{ ...LABEL, flex: "2 1 260px" }}>
              הפירוט (משפט קצר מתחת לשם)
              <input className="fld fld-sm" name="description" defaultValue={s.description} maxLength={120} />
            </label>
          </div>
          <fieldset style={{ border: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>מי פותחת דיונים במדור?</legend>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 15, cursor: "pointer" }}>
              <input type="radio" name="post_mode" value="team" defaultChecked={s.post_mode !== "members"} style={{ accentColor: "#6E0F1A", marginTop: 4 }} />
              <span>
                <b>רק הצוות</b> – החברות מגיבות, ויכולות לשלוח «בקשה לנושא» שמגיעה לתיבת הפניות.
              </span>
            </label>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 15, cursor: "pointer" }}>
              <input type="radio" name="post_mode" value="members" defaultChecked={s.post_mode === "members"} style={{ accentColor: "#6E0F1A", marginTop: 4 }} />
              <span>
                <b>כולן</b> – כל חברה פותחת דיונים כמה שתרצה.
              </span>
            </label>
          </fieldset>
          <label style={LABEL}>
            כפתור «שאלה ל…» במדור (ריק = אין כפתור)
            <input className="fld fld-sm" name="ask_label" defaultValue={s.ask_label} maxLength={60} placeholder="למשל: שאלה לרוחמה" />
            <span style={{ fontSize: 13, fontWeight: 400, color: "#7A5566" }}>השאלה מגיעה לתיבת הפניות ולמייל של הצוות, עם כתובת המייל של השואלת למענה ישיר.</span>
          </label>
          <label style={LABEL}>
            כללי הבית של המדור / על אופי המדור (שורה לכל כלל; ריק = כללי הבית הכלליים מ«תוכן האתר»)
            <textarea className="fld fld-sm" name="rules" defaultValue={s.rules} rows={4} maxLength={2000} style={{ minHeight: 96, lineHeight: 1.5 }} placeholder={"למשל:\nכאן שואלות ומבקשות בלי להתבייש.\nמי שיכולה לעזור – כותבת, מי שלא – מפרגנת."} />
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, cursor: "pointer" }}>
              <input type="checkbox" name="visible" defaultChecked={s.visible} style={{ width: 18, height: 18, accentColor: "#6E0F1A" }} />
              מוצג לחברות
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, cursor: "pointer" }}>
              <input type="checkbox" name="is_new" defaultChecked={s.is_new} style={{ width: 18, height: 18, accentColor: "#6E0F1A" }} />
              תגית «חדש!»
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
              סדר
              <input className="fld fld-sm" name="sort_order" type="number" defaultValue={s.sort_order} style={{ width: 70 }} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button type="submit" className="btn-sm-green" disabled={pending}>
              {pending ? "…" : "שמירה"}
            </button>
            <ActionButton className="btn-sm" confirm={`למחוק את המדור «${s.name}»?`} action={deleteSection.bind(null, s.id)}>
              מחיקת המדור
            </ActionButton>
          </div>
        </form>
      )}
    </div>
  );
}
