"use client";

import { useActionState } from "react";
import { updateMember, type AdminState } from "../../actions";
import { monthOptions } from "@/lib/hebrew";

const LABEL = { display: "flex", flexDirection: "column", gap: 6, fontSize: 15, fontWeight: 500, flex: "1 1 200px" } as const;

export function MemberForm({
  member,
}: {
  member: { id: string; first_name: string; last_name: string; email: string; phone: string; birth_month: number | null; role: "member" | "admin"; over_30_confirmed: boolean; remind_birthday: boolean };
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updateMember.bind(null, member.id), { error: null });
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14, background: "#FFFCFA", border: "1.5px solid #F3E6DD", borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <label style={LABEL}>
          שם פרטי
          <input className="fld fld-sm" name="first_name" defaultValue={member.first_name} required />
        </label>
        <label style={LABEL}>
          שם משפחה
          <input className="fld fld-sm" name="last_name" defaultValue={member.last_name} />
        </label>
        <label style={LABEL}>
          מייל
          <input className="fld fld-sm" type="email" value={member.email} dir="ltr" readOnly style={{ background: "#FBF1EA" }} />
        </label>
        <label style={LABEL}>
          טלפון
          <input className="fld fld-sm" name="phone" defaultValue={member.phone} dir="ltr" />
        </label>
        <label style={LABEL}>
          חודש לידה עברי
          <select className="fld fld-sm" name="birth_month" defaultValue={member.birth_month ?? ""}>
            <option value="">לא ידוע</option>
            {monthOptions().map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label style={LABEL}>
          תפקיד
          <select className="fld fld-sm" name="role" defaultValue={member.role}>
            <option value="member">משתתפת</option>
            <option value="admin">צוות (ניהול)</option>
          </select>
        </label>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, fontSize: 15 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" name="over_30" defaultChecked={member.over_30_confirmed} style={{ width: 18, height: 18, accentColor: "#6E0F1A" }} />
          אישרה שהיא בת 30+
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" name="remind" defaultChecked={member.remind_birthday} style={{ width: 18, height: 18, accentColor: "#6E0F1A" }} />
          תזכורת למייל לפני המסיבה שלה
        </label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="submit" className="btn-primary" disabled={pending} style={{ height: 46, fontSize: 16 }}>
          {pending ? "שומרת…" : "שמירה"}
        </button>
        {state.ok && (
          <span role="status" style={{ color: "#2F6B3A", fontSize: 15 }}>
            {state.ok}
          </span>
        )}
        {state.error && (
          <span role="alert" style={{ color: "#A3304A", fontSize: 15 }}>
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
