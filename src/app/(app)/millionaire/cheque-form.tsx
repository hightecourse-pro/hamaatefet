"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { createProposal, type ProposalState } from "./actions";
import { tx, type Copy } from "@/lib/copy";

const KIND_KEYS = ["talent", "insight", "story", "other"] as const;

const LINE_LABEL = { display: "flex", flexDirection: "column", gap: 2, fontSize: 15, color: "#7A5566" } as const;

export function ChequeForm({ defaultName, months, copy }: { defaultName: string; months: string[]; copy: Copy }) {
  const t = (k: string) => tx(copy, k);
  const [state, action, pending] = useActionState<ProposalState, FormData>(createProposal, { error: null });
  const [kind, setKind] = useState("talent");
  const [reset, setReset] = useState(0);
  const sent = state.sent && reset === 0;

  if (sent) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", padding: "12px 0" }}>
        <Image src="/brand/seal.png" alt="" width={90} height={90} style={{ width: 90, height: 90, transform: "rotate(-10deg)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <strong style={{ fontSize: 26 }}>{t("mill.sent.title")}</strong>
          <span style={{ fontSize: 18, color: "#5A3348" }}>{t("mill.sent.text")}</span>
          <button type="button" className="btn-link" style={{ alignSelf: "flex-start" }} onClick={() => setReset((n) => n + 1)}>
            {t("mill.sent.again")}
          </button>
        </div>
      </div>
    );
  }

  const flexible = t("mill.form.flexible");

  return (
    <form key={reset} action={action} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <input type="hidden" name="kind" value={kind} />
      {state.error && (
        <p role="alert" className="flash flash-err" style={{ margin: 0 }}>
          {state.error}
        </p>
      )}
      <fieldset style={{ border: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <legend style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>{t("mill.propose.question")}</legend>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {KIND_KEYS.map((k) => {
            const on = k === kind;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => setKind(k)}
                style={{ minHeight: 48, padding: "0 20px", borderRadius: 999, fontSize: 17, cursor: "pointer", background: on ? "#B5532F" : "#FFFFFF", color: on ? "#FFF6EE" : "#6E0F1A", border: on ? "2px solid #B5532F" : "2px dashed #D9B79E", fontWeight: on ? 600 : 500, boxShadow: on ? "3px 3px 0 #6E0F1A" : "none" }}
              >
                {t(`mill.kind.${k}`)}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 32px" }}>
        <label style={{ ...LINE_LABEL, flex: "1 1 260px" }}>
          {t("mill.form.name")}
          <input className="line" name="display_name" type="text" placeholder={t("mill.form.name_placeholder")} defaultValue={defaultName} />
        </label>
        <label style={{ ...LINE_LABEL, flex: "1 1 260px" }}>
          {t("mill.form.title")}
          <input className="line" name="title" type="text" placeholder={t("mill.form.title_placeholder")} required />
        </label>
      </div>
      <label style={LINE_LABEL}>
        {t("mill.form.desc")}
        <textarea className="line" name="description" rows={3} placeholder={t("mill.form.desc_placeholder")} required />
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 32px", alignItems: "flex-end" }}>
        <label style={{ ...LINE_LABEL, flex: "1 1 220px" }}>
          {t("mill.form.month")}
          <select className="line" name="preferred_month" defaultValue={months[0]}>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value={flexible}>{flexible}</option>
          </select>
        </label>
        <label style={{ ...LINE_LABEL, flex: "1 1 220px" }}>
          {t("mill.form.needs")}
          <input className="line" name="needs" type="text" placeholder={t("mill.form.needs_placeholder")} />
        </label>
        <button type="submit" disabled={pending} style={{ flex: "0 0 auto", height: 56, padding: "0 30px", borderRadius: 18, border: "none", background: "#B5532F", color: "#FFF6EE", fontSize: 20, fontWeight: 700, cursor: "pointer", boxShadow: "4px 4px 0 #6E0F1A", opacity: pending ? 0.7 : 1 }}>
          {pending ? t("mill.propose.busy") : t("mill.propose.button")}
        </button>
      </div>
    </form>
  );
}
