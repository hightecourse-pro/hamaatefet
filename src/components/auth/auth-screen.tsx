"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { monthOptions } from "@/lib/hebrew";

export type AuthMode = "login" | "signup" | "pending" | "forgot" | "sent";

/** The screen's copy – from the content registry, passed by the server page. */
export interface AuthCopy {
  loginTitle: string;
  loginSubtitle: string;
  loginButton: string;
  noAccount: string;
  signupTitle: string;
  signupSubtitle: string;
  age: string;
  terms: string;
  termsLink: string;
  signupButton: string;
  pendingTitle: string;
  pendingText: string;
  forgotTitle: string;
  forgotText: string;
  forgotButton: string;
  sentTitle: string;
  sentText: string;
  sideHeadline: string;
  sideLines: string[];
}

const TAB_ON: CSSProperties = { flex: 1, height: 48, border: "none", borderRadius: 999, fontSize: 18, fontWeight: 600, cursor: "pointer", background: "#6E0F1A", color: "#FFF3EA", boxShadow: "3px 3px 0 #4A1942" };
const TAB_OFF: CSSProperties = { flex: 1, height: 48, border: "none", borderRadius: 999, fontSize: 18, fontWeight: 500, cursor: "pointer", background: "transparent", color: "#6E0F1A" };
const LABEL: CSSProperties = { display: "flex", flexDirection: "column", gap: 8, fontSize: 16, fontWeight: 500 };
const LINE_COLORS = ["#C26A7E", "#8E4A86", "#E8894A"];

function EyeButton({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "הסתרת סיסמה" : "הצגת סיסמה"}
      style={{ position: "absolute", left: 4, top: 4, width: 44, height: 44, border: "none", background: "transparent", cursor: "pointer", color: "#7A5566", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {shown ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17.9 17.9A10 10 0 0 1 12 19c-6.5 0-10-7-10-7a18 18 0 0 1 5.1-5.9M9.9 4.2A9.4 9.4 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2M1 1l22 22" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

function friendlyError(code: string | undefined, message: string): string {
  switch (code) {
    case "invalid_credentials":
      return "המייל או הסיסמה לא נכונים.";
    case "email_not_confirmed":
      return "המייל עדיין לא אומת – בדקי את תיבת המייל (גם בספאם) ולחצי על הקישור.";
    case "user_already_exists":
    case "email_exists":
      return "כבר יש חברה עם המייל הזה. נסי להיכנס, או לבחור סיסמה חדשה.";
    case "weak_password":
      return "הסיסמה חלשה מדי – לפחות 8 תווים.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "שלחנו כבר מייל לפני רגע – חכי דקה ונסי שוב.";
    case "validation_failed":
      return "משהו בפרטים לא תקין – בדקי את המייל.";
    default:
      return message.includes("rate limit") ? "יותר מדי ניסיונות – חכי דקה ונסי שוב." : "משהו השתבש. נסי שוב בעוד רגע.";
  }
}

export function AuthScreen({ initialMode = "login", copy }: { initialMode?: AuthMode; copy: AuthCopy }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);

  const go = (m: AuthMode) => {
    setMode(m);
    setError(null);
    setShowPw(false);
  };

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(friendlyError(error.code, error.message));
      setBusy(false);
      return;
    }
    try {
      window.localStorage.setItem("hm_login_at", String(Date.now()));
      if (remember) window.localStorage.removeItem("hm_session_only");
      else window.localStorage.setItem("hm_session_only", "1");
    } catch {}
    router.push("/home");
    router.refresh();
  }

  async function onSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const first_name = String(fd.get("first_name") ?? "").trim();
    const last_name = String(fd.get("last_name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const birth_month = Number(fd.get("birth_month") ?? 0);
    const over_30 = fd.get("over_30") === "on";
    const terms = fd.get("terms") === "on";
    if (!first_name || !last_name) return setError("ספרי לנו איך קוראים לך – שם פרטי ושם משפחה.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("כתובת המייל לא נראית תקינה.");
    if (!/^0\d{1,2}-?\d{7}$|^\+?\d{9,13}$/.test(phone.replace(/[\s-]/g, ""))) return setError("מספר הטלפון לא נראה תקין (למשל 050-1234567).");
    if (password.length < 8) return setError("הסיסמה צריכה להיות לפחות 8 תווים.");
    if (!(birth_month >= 1 && birth_month <= 12)) return setError("בחרי את חודש הלידה העברי שלך.");
    if (!over_30) return setError("המעטפת היא קהילה לנשים בנות 30 ומעלה – צריך לאשר את זה כדי להצטרף.");
    if (!terms) return setError("צריך לאשר את התקנון ומדיניות הפרטיות.");
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { first_name, last_name, phone, birth_month, over_30, terms } } });
    setBusy(false);
    if (error) return setError(friendlyError(error.code, error.message));
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return setError("כבר יש חברה עם המייל הזה. נסי להיכנס, או לבחור סיסמה חדשה.");
    }
    go("pending");
  }

  async function onForgot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("כתובת המייל לא נראית תקינה.");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setBusy(false);
    if (error && error.code !== "user_not_found") return setError(friendlyError(error.code, error.message));
    go("sent");
  }

  const tabsOnSignup = mode === "signup" || mode === "pending";

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#FFF8F2", color: "#3A1530", position: "relative", overflow: "hidden" }}>
      <div aria-hidden="true" style={{ position: "absolute", top: 80, left: "46%", width: 18, height: 18, borderRadius: "50%", background: "#F0A35E" }} />
      <div aria-hidden="true" style={{ position: "absolute", top: 220, left: "8%", width: 12, height: 12, borderRadius: "50%", background: "#A3304A" }} />
      <div aria-hidden="true" style={{ position: "absolute", bottom: 90, left: "40%", width: 26, height: 26, borderRadius: "50%", border: "4px solid #F6C9A6" }} />
      <div aria-hidden="true" style={{ position: "absolute", bottom: 160, right: "4%", width: 14, height: 14, borderRadius: 4, background: "#4A1942", transform: "rotate(20deg)" }} />

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 24px", display: "flex", flexWrap: "wrap", gap: 48, alignItems: "center", justifyContent: "center", minHeight: "100vh", boxSizing: "border-box", position: "relative" }}>
        <section style={{ flex: "1 1 440px", maxWidth: 480, background: "#FFFFFF", borderRadius: 32, padding: "40px 36px", boxShadow: "10px 10px 0 #F3DCCB", border: "2px solid #F0E2D8", position: "relative" }}>
          <Image src="/brand/seal.png" alt="" width={92} height={92} style={{ position: "absolute", top: -34, left: -26, width: 92, height: 92, transform: "rotate(-14deg)" }} />
          <Image src="/brand/logo.png" alt="המעטפת – מבית חד או פאן" width={220} height={93} priority style={{ width: 220, height: "auto", display: "block", margin: "0 auto 24px" }} />

          <div role="tablist" style={{ display: "flex", gap: 6, background: "#FBEDE4", padding: 6, borderRadius: 999, marginBottom: 28 }}>
            <button role="tab" type="button" aria-selected={!tabsOnSignup} onClick={() => go("login")} style={tabsOnSignup ? TAB_OFF : TAB_ON}>
              כניסה
            </button>
            <button role="tab" type="button" aria-selected={tabsOnSignup} onClick={() => go("signup")} style={tabsOnSignup ? TAB_ON : TAB_OFF}>
              הרשמה
            </button>
          </div>

          {error && (
            <p role="alert" className="flash flash-err" style={{ margin: "0 0 16px" }}>
              {error}
            </p>
          )}

          {mode === "login" && (
            <form onSubmit={onLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700 }}>
                <span className="grad">{copy.loginTitle}</span>
              </h1>
              <p className="hand" style={{ margin: "-8px 0 4px", fontSize: 18, color: "#7A5566" }}>
                {copy.loginSubtitle}
              </p>
              <label style={LABEL}>
                מייל
                <input className="fld" name="email" type="email" placeholder="name@example.com" dir="ltr" autoComplete="email" required />
              </label>
              <label style={LABEL}>
                סיסמה
                <div style={{ position: "relative" }}>
                  <input className="fld" name="password" type={showPw ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" style={{ paddingLeft: 52 }} required />
                  <EyeButton shown={showPw} onToggle={() => setShowPw((v) => !v)} />
                </div>
              </label>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, fontSize: 15 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 20, height: 20, accentColor: "#A3304A" }} />
                  זכרי אותי
                </label>
                <button type="button" className="btn-link" onClick={() => go("forgot")}>
                  שכחתי סיסמה
                </button>
              </div>
              <button type="submit" className="cta" disabled={busy} style={{ marginTop: 6 }}>
                {busy ? "פותחת…" : copy.loginButton}
              </button>
              <p style={{ margin: "4px 0 0", textAlign: "center", fontSize: 15, color: "#7A5566" }}>
                {copy.noAccount}{" "}
                <button type="button" className="btn-link" onClick={() => go("signup")} style={{ fontWeight: 600, padding: "6px 2px" }}>
                  להרשמה
                </button>
              </p>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={onSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700 }}>
                <span className="grad">{copy.signupTitle}</span>
              </h1>
              <p className="hand" style={{ margin: "-6px 0 2px", fontSize: 18, color: "#7A5566" }}>
                {copy.signupSubtitle}
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <label style={{ ...LABEL, flex: "1 1 160px" }}>
                  שם פרטי
                  <input className="fld" name="first_name" type="text" placeholder="איך קוראים לך?" autoComplete="given-name" required />
                </label>
                <label style={{ ...LABEL, flex: "1 1 160px" }}>
                  שם משפחה
                  <input className="fld" name="last_name" type="text" placeholder="שם משפחה" autoComplete="family-name" required />
                </label>
              </div>
              <label style={LABEL}>
                מייל
                <input className="fld" name="email" type="email" placeholder="name@example.com" dir="ltr" autoComplete="email" required />
              </label>
              <label style={LABEL}>
                טלפון
                <input className="fld" name="phone" type="tel" placeholder="050-1234567" dir="ltr" autoComplete="tel" required />
              </label>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <label style={{ ...LABEL, flex: "1 1 160px" }}>
                  סיסמה
                  <div style={{ position: "relative" }}>
                    <input className="fld" name="password" type={showPw ? "text" : "password"} placeholder="לפחות 8 תווים" autoComplete="new-password" minLength={8} style={{ paddingLeft: 52 }} required />
                    <EyeButton shown={showPw} onToggle={() => setShowPw((v) => !v)} />
                  </div>
                </label>
                <label style={{ ...LABEL, flex: "1 1 160px" }}>
                  חודש לידה עברי
                  <select className="fld" name="birth_month" defaultValue="" required>
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
              </div>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 15, cursor: "pointer", lineHeight: 1.5 }}>
                <input type="checkbox" name="over_30" style={{ width: 20, height: 20, marginTop: 2, accentColor: "#A3304A", flex: "none" }} />
                {copy.age}
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 15, cursor: "pointer", lineHeight: 1.5 }}>
                <input type="checkbox" name="terms" style={{ width: 20, height: 20, marginTop: 2, accentColor: "#A3304A", flex: "none" }} />
                <span>
                  {copy.terms}{" "}
                  <Link href="/terms" target="_blank">
                    {copy.termsLink}
                  </Link>
                </span>
              </label>
              <button type="submit" className="cta" disabled={busy}>
                {busy ? "שולחת…" : copy.signupButton}
              </button>
            </form>
          )}

          {mode === "pending" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center", padding: "8px 0" }}>
              <Image src="/brand/envelope.png" alt="" width={170} height={134} style={{ width: 170, height: "auto", transform: "rotate(-6deg)" }} />
              <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
                <span className="grad">{copy.pendingTitle}</span>
              </h1>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "#5A3348", whiteSpace: "pre-line" }}>{copy.pendingText}</p>
              <button type="button" className="btn-link" onClick={() => go("login")} style={{ fontWeight: 600, padding: 10 }}>
                חזרה לכניסה
              </button>
            </div>
          )}

          {mode === "forgot" && (
            <form onSubmit={onForgot} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>
                <span className="grad">{copy.forgotTitle}</span>
              </h1>
              <p style={{ margin: "-4px 0 4px", fontSize: 17, lineHeight: 1.6, color: "#5A3348", whiteSpace: "pre-line" }}>{copy.forgotText}</p>
              <label style={LABEL}>
                מייל
                <input className="fld" name="email" type="email" placeholder="name@example.com" dir="ltr" autoComplete="email" required />
              </label>
              <button type="submit" className="cta" disabled={busy}>
                {busy ? "שולחת…" : copy.forgotButton}
              </button>
              <button type="button" className="btn-link" onClick={() => go("login")} style={{ padding: 8 }}>
                נזכרתי, חזרה לכניסה
              </button>
            </form>
          )}

          {mode === "sent" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center", padding: "8px 0" }}>
              <Image src="/brand/envelope.png" alt="" width={150} height={118} style={{ width: 150, height: "auto", transform: "rotate(8deg)" }} />
              <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
                <span className="grad">{copy.sentTitle}</span>
              </h1>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "#5A3348", whiteSpace: "pre-line" }}>{copy.sentText}</p>
              <button type="button" className="btn-link" onClick={() => go("login")} style={{ fontWeight: 600, padding: 10 }}>
                חזרה לכניסה
              </button>
            </div>
          )}
        </section>

        <aside style={{ flex: "1 1 420px", maxWidth: 560, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}>
          <p className="hand" style={{ margin: 0, fontSize: 44, color: "#4A1942", transform: "rotate(-4deg)" }}>
            {copy.sideHeadline}
          </p>
          <Image className="env" src="/brand/envelope.png" alt="מעטפה חתומה בחותם שעווה" width={440} height={346} priority style={{ width: "min(100%, 440px)", height: "auto" }} />
          <div className="hand" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 26, lineHeight: 1.4, color: "#6E0F1A", marginTop: 12 }}>
            {copy.sideLines.map((line, i) => {
              const [first, ...rest] = line.split(" ");
              return (
                <span key={i}>
                  <span style={{ color: LINE_COLORS[i % LINE_COLORS.length] }}>{first}</span> {rest.join(" ")}
                </span>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
