"use client";

import { useActionState, useState } from "react";
import { saveEvent, type AdminState } from "./actions";
import { monthOptions } from "@/lib/hebrew";

const LABEL = { display: "flex", flexDirection: "column", gap: 6, fontSize: 15, fontWeight: 500, flex: "1 1 200px" } as const;

export interface EventFormValues {
  type: "general" | "millionaire" | "birthday";
  title: string;
  description: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string;
  price_ils: number;
  capacity: number | null;
  topic: string;
  host_name: string;
  published: boolean;
  hebrew_month: number | null;
  hebrew_year: number | null;
  agenda: string;
}

export function EventForm({ id, initial, lockType, submitLabel = "שמירה" }: { id: string | null; initial: EventFormValues; lockType?: boolean; submitLabel?: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveEvent.bind(null, id), { error: null });
  const [type, setType] = useState(initial.type);
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14, background: "#FFFCFA", border: "1.5px solid #F3E6DD", borderRadius: 16, padding: 16 }}>
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <label style={LABEL}>
          סוג
          {lockType ? (
            <>
              <input type="hidden" name="type" value={type} />
              <input className="fld fld-sm" value={type === "general" ? "כללי" : type === "millionaire" ? "המיליונרית" : "חוגגות חודש טוב"} readOnly style={{ background: "#FBF1EA" }} />
            </>
          ) : (
            <select className="fld fld-sm" name="type" value={type} onChange={(e) => setType(e.target.value as EventFormValues["type"])}>
              <option value="general">כללי</option>
              <option value="millionaire">המיליונרית</option>
              <option value="birthday">חוגגות חודש טוב</option>
            </select>
          )}
        </label>
        <label style={{ ...LABEL, flex: "2 1 280px" }}>
          שם המפגש
          <input className="fld fld-sm" name="title" defaultValue={initial.title} required />
        </label>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <label style={LABEL}>
          תאריך
          <input className="fld fld-sm" name="event_date" type="date" defaultValue={initial.event_date ?? ""} dir="ltr" />
        </label>
        <label style={LABEL}>
          משעה
          <input className="fld fld-sm" name="start_time" type="time" defaultValue={initial.start_time?.slice(0, 5) ?? ""} dir="ltr" />
        </label>
        <label style={LABEL}>
          עד שעה
          <input className="fld fld-sm" name="end_time" type="time" defaultValue={initial.end_time?.slice(0, 5) ?? ""} dir="ltr" />
        </label>
        <label style={{ ...LABEL, flex: "2 1 280px" }}>
          מקום
          <input className="fld fld-sm" name="location" defaultValue={initial.location} />
        </label>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <label style={LABEL}>
          מחיר (₪)
          <input className="fld fld-sm" name="price_ils" type="number" min={0} defaultValue={initial.price_ils} dir="ltr" />
        </label>
        <label style={LABEL}>
          מקומות (ריק = ללא הגבלה)
          <input className="fld fld-sm" name="capacity" type="number" min={1} defaultValue={initial.capacity ?? ""} dir="ltr" />
        </label>
        {type !== "general" && (
          <label style={LABEL}>
            {type === "birthday" ? "נושא הערב" : "סוג האירוח"}
            <input className="fld fld-sm" name="topic" defaultValue={initial.topic} />
          </label>
        )}
        {type === "millionaire" && (
          <label style={LABEL}>
            מארחת
            <input className="fld fld-sm" name="host_name" defaultValue={initial.host_name} />
          </label>
        )}
        {type === "birthday" && (
          <>
            <label style={LABEL}>
              חודש עברי
              <select className="fld fld-sm" name="hebrew_month" defaultValue={initial.hebrew_month ?? ""} required>
                <option value="" disabled>
                  בחרי
                </option>
                {monthOptions().map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={LABEL}>
              שנה עברית (מספר)
              <input className="fld fld-sm" name="hebrew_year" type="number" defaultValue={initial.hebrew_year ?? ""} dir="ltr" />
            </label>
          </>
        )}
      </div>
      <label style={{ ...LABEL, flex: "1 1 100%" }}>
        תיאור (מוצג למשתתפות)
        <textarea className="fld" name="description" rows={3} defaultValue={initial.description} />
      </label>
      {type === "birthday" && (
        <label style={{ ...LABEL, flex: "1 1 100%" }}>
          מה מחכה לנו במפגש (לוח הזמנים)
          <textarea className="fld" name="agenda" rows={10} defaultValue={initial.agenda} placeholder={"20:00 | מתכנסות: עוגה, חטיפים ובלונים\nפינת צילום וברכה בכניסה\n\n20:30 | הנושא המרכזי של הערב\nלמה בחרנו בנושא ואיך זה יתנהל\n? שאלה מנחה ראשונה\n? שאלה מנחה שנייה"} style={{ fontFamily: "inherit" }} />
          <span style={{ fontSize: 13, color: "#7A5566", fontWeight: 400 }}>כל פריט בבלוק נפרד (שורה ריקה ביניהם). שורה ראשונה: «שעה | כותרת». שורות שמתחילות ב-? הן שאלות לדיון.</span>
        </label>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, cursor: "pointer" }}>
          <input type="checkbox" name="published" defaultChecked={initial.published} style={{ width: 18, height: 18, accentColor: "#6E0F1A" }} />
          מפורסם למשתתפות
        </label>
        <button type="submit" className="btn-primary" disabled={pending} style={{ height: 46, fontSize: 16, marginRight: "auto" }}>
          {pending ? "שומרת…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
