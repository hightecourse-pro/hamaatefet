"use client";

import { useActionState, useState } from "react";
import { saveBirthday, saveDetails, saveMail, type ProfileState } from "./actions";
import { monthOptions } from "@/lib/hebrew";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { tx, type Copy } from "@/lib/copy";

const LABEL = { display: "flex", flexDirection: "column", gap: 8, fontSize: 16, fontWeight: 500 } as const;

export function BirthdayForm({ birthMonth, remind, copy }: { birthMonth: number | null; remind: boolean; copy: Copy }) {
  const t = (k: string) => tx(copy, k);
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveBirthday, { error: null });
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label style={{ ...LABEL, maxWidth: 320 }}>
        {t("field.birth_month")}
        <select className="fld" name="birth_month" defaultValue={birthMonth ?? ""} required>
          <option value="" disabled>
            {t("field.birth_month_placeholder")}
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
        {t("profile.remind")}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? t("profile.saving") : t("profile.save")}
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

export function DetailsForm({ firstName, lastName, email, phone, copy }: { firstName: string; lastName: string; email: string; phone: string; copy: Copy }) {
  const t = (k: string) => tx(copy, k);
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveDetails, { error: null });
  const [pw, setPw] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <label style={{ ...LABEL, flex: "1 1 240px" }}>
            {t("field.first_name")}
            <input className="fld" name="first_name" type="text" defaultValue={firstName} autoComplete="given-name" required />
          </label>
          <label style={{ ...LABEL, flex: "1 1 240px" }}>
            {t("field.last_name")}
            <input className="fld" name="last_name" type="text" defaultValue={lastName} autoComplete="family-name" required />
          </label>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <label style={{ ...LABEL, flex: "1 1 240px" }}>
            {t("field.email")}
            <input className="fld" name="email" type="email" defaultValue={email} dir="ltr" autoComplete="email" required />
          </label>
          <label style={{ ...LABEL, flex: "1 1 240px" }}>
            {t("field.phone")}
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
            {pending ? t("profile.saving") : t("profile.save")}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setPw((v) => !v)} aria-expanded={pw}>
            {t("profile.password")}
          </button>
          <SignOutButton label={t("auth.signout")} style={{ marginRight: "auto" }} />
        </div>
      </form>
      {pw && (
        <div style={{ background: "#FBF1EA", borderRadius: 20, padding: 20 }}>
          <ResetPasswordForm next="/profile" title={t("pw.title_profile")} copy={copy} />
        </div>
      )}
    </div>
  );
}

export function MailForm({ digest, copy }: { digest: boolean; copy: Copy }) {
  const t = (k: string) => tx(copy, k);
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveMail, { error: null });
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, cursor: "pointer" }}>
        <input type="checkbox" name="digest" defaultChecked={digest} style={{ width: 20, height: 20, accentColor: "#A3304A" }} />
        {t("profile.digest")}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? t("profile.saving") : t("profile.save")}
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
