"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { tx, type Copy } from "@/lib/copy";

/** New password – from the recovery link (/reset-password) or from "החשבון שלי". */
export function ResetPasswordForm({ next = "/home", title, copy }: { next?: string; title: string; copy: Copy }) {
  const t = (k: string) => tx(copy, k);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const again = String(fd.get("again") ?? "");
    if (password.length < 8) return setError(t("auth.err.password"));
    if (password !== again) return setError(t("pw.err.mismatch"));
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.code === "same_password" ? t("pw.err.same") : t("pw.err.save"));
    setDone(true);
    setTimeout(() => {
      router.push(next);
      router.refresh();
    }, 900);
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>
        <span className="grad">{title}</span>
      </h1>
      <p style={{ margin: "-4px 0 4px", fontSize: 17, lineHeight: 1.6, color: "#5A3348" }}>{t("pw.text")}</p>
      {error && (
        <p role="alert" className="flash flash-err" style={{ margin: 0 }}>
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="flash flash-ok" style={{ margin: 0 }}>
          {t("pw.done")}
        </p>
      )}
      <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 16, fontWeight: 500 }}>
        {t("pw.field")}
        <input className="fld" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 16, fontWeight: 500 }}>
        {t("pw.again")}
        <input className="fld" name="again" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <button type="submit" className="cta" disabled={busy || done}>
        {busy ? t("pw.busy") : t("pw.button")}
      </button>
    </form>
  );
}
