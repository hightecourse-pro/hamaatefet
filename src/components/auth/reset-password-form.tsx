"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm({ next = "/home", title = "בוחרת סיסמה חדשה" }: { next?: string; title?: string }) {
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
    if (password.length < 8) return setError("הסיסמה צריכה להיות לפחות 8 תווים.");
    if (password !== again) return setError("שתי הסיסמאות לא זהות.");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.code === "same_password" ? "זו הסיסמה הנוכחית שלך – בחרי סיסמה אחרת." : "לא הצלחנו לשמור את הסיסמה. נסי שוב.");
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
      <p style={{ margin: "-4px 0 4px", fontSize: 17, lineHeight: 1.6, color: "#5A3348" }}>לפחות 8 תווים. משהו שתזכרי, לא משהו שינחשו.</p>
      {error && (
        <p role="alert" className="flash flash-err" style={{ margin: 0 }}>
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="flash flash-ok" style={{ margin: 0 }}>
          הסיסמה נשמרה. פותחות את המעטפה…
        </p>
      )}
      <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 16, fontWeight: 500 }}>
        סיסמה חדשה
        <input className="fld" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 16, fontWeight: 500 }}>
        ועוד פעם, ליתר ביטחון
        <input className="fld" name="again" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <button type="submit" className="cta" disabled={busy || done}>
        {busy ? "שומרת…" : "שומרת את הסיסמה"}
      </button>
    </form>
  );
}
