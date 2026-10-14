"use client";

import { useActionState, useState } from "react";
import { saveBirthday, saveDetails, type ProfileState } from "./actions";
import { monthOptions } from "@/lib/hebrew";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SignOutButton } from "@/components/auth/sign-out-button";

const LABEL = { display: "flex", flexDirection: "column", gap: 8, fontSize: 16, fontWeight: 500 } as const;

export function BirthdayForm({ birthMonth, remind }: { birthMonth: number | null; remind: boolean }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveBirthday, { error: null });
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label style={{ ...LABEL, maxWidth: 320 }}>
        חודש לידה עברי
        <select className="fld" name="birth_month" defaultValue={birthMonth ?? ""} required>
          <option value="" disabled>
            בחרי חודש
          </option>
          {monthOptions().map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, cursor: "pointer" }}>
        <input type="checkbox" name="remind" defaultChecked={remind} style={{ width: 20, height: 20, accentColor: "#A3304A" }} />
        להזכיר לי במייל לפני המסיבה שלי
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "שומרת…" : "שמירה"}
        </button>
        {state.ok && (
          <span role="status" style={{ fontSize: 15, color: "#2F6B3A" }}>
            {state.ok}
          </span>
        )}
        {state.error && (
          <span role="alert" style={{ fontSize: 15, color: "#A3304A" }}>
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}

export function DetailsForm({ firstName, lastName, email, phone }: { firstName: string; lastName: string; email: string; phone: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveDetails, { error: null });
  const [pw, setPw] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <label style={{ ...LABEL, flex: "1 1 240px" }}>
            שם פרטי
            <input className="fld" name="first_name" type="text" defaultValue={firstName} autoComplete="given-name" required />
          </label>
          <label style={{ ...LABEL, flex: "1 1 240px" }}>
            שם משפחה
            <input className="fld" name="last_name" type="text" defaultValue={lastName} autoComplete="family-name" required />
          </label>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <label style={{ ...LABEL, flex: "1 1 240px" }}>
            מייל
            <input className="fld" name="email" type="email" defaultValue={email} dir="ltr" autoComplete="email" required />
          </label>
          <label style={{ ...LABEL, flex: "1 1 240px" }}>
            טלפון
            <input className="fld" name="phone" type="tel" defaultValue={phone} dir="ltr" autoComplete="tel" required />
          </label>
        </div>
        {state.ok && (
          <p role="status" className="flash flash-ok" style={{ margin: 0 }}>
            {state.ok}
          </p>
        )}
        {state.error && (
          <p role="alert" className="flash flash-err" style={{ margin: 0 }}>
            {state.error}
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? "שומרת…" : "שמירה"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setPw((v) => !v)} aria-expanded={pw}>
            שינוי סיסמה
          </button>
          <SignOutButton style={{ marginRight: "auto" }} />
        </div>
      </form>
      {pw && (
        <div style={{ background: "#FBF1EA", borderRadius: 20, padding: 20 }}>
          <ResetPasswordForm next="/profile" title="סיסמה חדשה" />
        </div>
      )}
    </div>
  );
}
