"use client";

import { useActionState, useState } from "react";
import { usePathname } from "next/navigation";
import { sendTeamMessage, type MessageState } from "@/app/(app)/messages/actions";
import { tx, type Copy } from "@/lib/copy";

const NUDGE_KEY = "hm:nudge-hidden";

/**
 * The floating "יש לך משהו לספר לנו?" button in the corner of every member page
 * (the owner, 2/11: like קוד פתוח's). A launch-period bubble with a drawn arrow
 * points at it ("המעטפת בהרצה 🚀 מצאת באג?"); the team switches the bubble off
 * in the inbox, a member can hide it for her browser. The form sends a "bug"
 * message to the team inbox + the admins' mail.
 */
export function TeamMessageWidget({ copy, nudge }: { copy: Copy; nudge: boolean }) {
  const t = (k: string, vars?: Record<string, string>) => tx(copy, k, vars);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [nudgeHidden, setNudgeHidden] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(NUDGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [state, action, pending] = useActionState<MessageState, FormData>(sendTeamMessage.bind(null, "bug"), { error: null });

  const hideNudge = () => {
    setNudgeHidden(true);
    try {
      window.localStorage.setItem(NUDGE_KEY, "1");
    } catch {}
  };

  return (
    <div dir="rtl" style={{ position: "fixed", bottom: 16, left: 16, zIndex: 40, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, pointerEvents: "none" }}>
      {open && (
        <section aria-label={t("widget.title")} style={{ width: 330, maxWidth: "calc(100vw - 32px)", background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 22, boxShadow: "8px 8px 0 #F3DCCB", padding: 18, display: "flex", flexDirection: "column", gap: 12, pointerEvents: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <strong style={{ fontSize: 17 }}>{t("widget.title")}</strong>
            <button type="button" aria-label={t("widget.close")} onClick={() => setOpen(false)} style={{ width: 36, height: 36, border: "none", background: "#FBEDE4", borderRadius: "50%", color: "#6E0F1A", cursor: "pointer", fontSize: 16 }}>
              ✕
            </button>
          </div>
          {state.sent ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p role="status" className="flash flash-ok" style={{ margin: 0 }}>
                {t("widget.sent")}
              </p>
              <button type="button" className="btn-link" style={{ alignSelf: "flex-start" }} onClick={() => setFormKey((k) => k + 1)}>
                {t("widget.again")}
              </button>
            </div>
          ) : (
            <form key={formKey} action={action} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="hidden" name="page" value={pathname} />
              {state.error && (
                <p role="alert" className="flash flash-err" style={{ margin: 0 }}>
                  {state.error}
                </p>
              )}
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 14, fontWeight: 600 }}>
                {t("widget.subject")}
                <input className="fld fld-sm" name="subject" maxLength={140} placeholder={t("widget.subject_placeholder")} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 14, fontWeight: 600 }}>
                {t("widget.body")}
                <textarea className="fld" name="body" rows={3} required placeholder={t("widget.body_placeholder")} style={{ fontSize: 15 }} />
              </label>
              <button type="submit" className="btn-primary" disabled={pending} style={{ alignSelf: "flex-start", height: 44, fontSize: 15 }}>
                {pending ? t("widget.sending") : t("widget.send")}
              </button>
            </form>
          )}
        </section>
      )}

      {nudge && !open && !nudgeHidden && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0, pointerEvents: "none", userSelect: "none" }}>
          <span className="hand" style={{ background: "#FFFFFF", border: "2px solid #F0A35E", color: "#3A1530", fontSize: 16, lineHeight: 1.3, borderRadius: 999, padding: "6px 10px 6px 14px", boxShadow: "4px 4px 0 #F3DCCB", maxWidth: 280, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <button type="button" aria-label={t("widget.nudge_hide")} onClick={hideNudge} style={{ pointerEvents: "auto", border: "none", background: "transparent", color: "#7A5566", cursor: "pointer", fontSize: 14, padding: "0 2px", fontFamily: "inherit" }}>
              ✕
            </button>
            {t("widget.nudge")}
          </span>
          <svg aria-hidden="true" width="46" height="52" viewBox="0 0 46 52" fill="none" className="bounce-arrow" style={{ marginRight: 22, marginTop: -2 }}>
            <path d="M34 4 C 20 12, 12 24, 13 38" stroke="#A3304A" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M5 32 L13 44 L23 35" stroke="#A3304A" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ pointerEvents: "auto", display: "inline-flex", alignItems: "center", gap: 8, minHeight: 48, padding: "0 18px", borderRadius: 999, border: "none", background: "#6E0F1A", color: "#FFF3EA", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "4px 4px 0 #4A1942", fontFamily: "inherit" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM12 8v6M9 11h6" />
        </svg>
        {t("widget.button")}
      </button>
    </div>
  );
}
