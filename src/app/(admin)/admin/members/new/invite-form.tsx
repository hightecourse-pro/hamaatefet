"use client";

import { useActionState } from "react";
import { inviteMember, type AdminState } from "../../actions";
import { monthOptions } from "@/lib/hebrew";

const LABEL = { display: "flex", flexDirection: "column", gap: 6, fontSize: 15, fontWeight: 500, flex: "1 1 220px" } as const;

export function InviteForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(inviteMember, { error: null });
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {state.error && (
        <p role="alert" className="flash flash-err" style={{ margin: 0 }}>
          {state.error}
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <label style={LABEL}>
          שם פרטי
          <input className="fld fld-sm" name="first_name" required />
        </label>
        <label style={LABEL}>
          שם משפחה
          <input className="fld fld-sm" name="last_name" required />
        </label>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <label style={LABEL}>
          מייל
          <input className="fld fld-sm" name="email" type="email" dir="ltr" required />
        </label>
        <label style={LABEL}>
          טלפון
          <input className="fld fld-sm" name="phone" type="tel" dir="ltr" />
        </label>
        <label style={LABEL}>
          חודש לידה עברי
          <select className="fld fld-sm" name="birth_month" defaultValue="">
            <option value="">לא ידוע</option>
            {monthOptions().map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button type="submit" className="btn-primary" disabled={pending} style={{ alignSelf: "flex-start" }}>
        {pending ? "שולחת הזמנה…" : "שליחת הזמנה"}
      </button>
    </form>
  );
}
