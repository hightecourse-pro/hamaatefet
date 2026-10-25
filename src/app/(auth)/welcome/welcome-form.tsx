"use client";

import { useActionState } from "react";
import { completeProfile, type WelcomeState } from "./actions";
import { monthOptions } from "@/lib/hebrew";
import { tx, type Copy } from "@/lib/copy";

const LABEL = { display: "flex", flexDirection: "column", gap: 8, fontSize: 16, fontWeight: 500 } as const;

export function WelcomeForm({
  initial,
  email,
  copy,
}: {
  initial: { first_name: string; last_name: string; phone: string; birth_month: number | null; over_30_confirmed: boolean };
  email: string;
  copy: Copy;
}) {
  const t = (k: string) => tx(copy, k);
  const [state, action, pending] = useActionState<WelcomeState, FormData>(completeProfile, { error: null });
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>
        <span className="grad">{t("auth.welcome.title")}</span>
      </h1>
      <p className="hand" style={{ margin: "-6px 0 2px", fontSize: 18, color: "#7A5566" }}>
        {t("auth.welcome.subtitle")}
      </p>
      {state.error && (
        <p role="alert" className="flash flash-err" style={{ margin: 0 }}>
          {state.error}
        </p>
      )}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <label style={{ ...LABEL, flex: "1 1 160px" }}>
          {t("field.first_name")}
          <input className="fld" name="first_name" type="text" defaultValue={initial.first_name} autoComplete="given-name" required />
        </label>
        <label style={{ ...LABEL, flex: "1 1 160px" }}>
          {t("field.last_name")}
          <input className="fld" name="last_name" type="text" defaultValue={initial.last_name} autoComplete="family-name" required />
        </label>
      </div>
      <label style={LABEL}>
        {t("field.email")}
        <input className="fld" type="email" value={email} dir="ltr" readOnly style={{ background: "#FBF1EA", color: "#6A4558" }} />
      </label>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <label style={{ ...LABEL, flex: "1 1 160px" }}>
          {t("field.phone")}
          <input className="fld" name="phone" type="tel" defaultValue={initial.phone} placeholder={t("field.phone_placeholder")} dir="ltr" autoComplete="tel" required />
        </label>
        <label style={{ ...LABEL, flex: "1 1 160px" }}>
          {t("field.birth_month")}
          <select className="fld" name="birth_month" defaultValue={initial.birth_month ?? ""} required>
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
      </div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 15, cursor: "pointer", lineHeight: 1.5 }}>
        <input type="checkbox" name="over_30" defaultChecked={initial.over_30_confirmed} style={{ width: 20, height: 20, marginTop: 2, accentColor: "#A3304A", flex: "none" }} />
        {t("auth.signup.age")}
      </label>
      <button type="submit" className="cta" disabled={pending}>
        {pending ? t("auth.welcome.busy") : t("auth.welcome.button")}
      </button>
    </form>
  );
}
