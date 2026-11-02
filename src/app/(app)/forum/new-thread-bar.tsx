"use client";

import { useActionState, useState } from "react";
import { usePathname } from "next/navigation";
import { Composer, SectionInfo } from "./composer";
import { sendTeamMessage, type MessageState } from "@/app/(app)/messages/actions";
import { tx, type Copy } from "@/lib/copy";

import type { MemberAction } from "@/lib/sections";

export interface SectionLite {
  id: string;
  key: string;
  name: string;
  description: string;
  member_action: MemberAction;
  /** The button's own wording (empty = the default for the kind). */
  action_label: string;
  /** Field labels for a question / request (empty = the defaults from «תוכן האתר»). */
  action_field1: string;
  action_field2: string;
}

interface Info {
  description: string;
  rulesTitle: string;
  rules: string[];
}

const BTN = { display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0 18px", borderRadius: 999, fontSize: 16, fontWeight: 700, cursor: "pointer", border: "none" } as const;

/**
 * The one action of a section, above its thread list. A member gets the
 * section's own button – open a thread, «מבקשת», a question to the team or a
 * request/proposal – with the section's wording; the team always gets «דיון חדש».
 * «הכל» only hints to enter a section. The panel shows the section's
 * description and house rules, so she sees what the section is for.
 */
export function NewThreadBar({ sections, current, rules, isAdmin, userId, copy }: { sections: SectionLite[]; current: string; rules: { title: string; lines: string[] }; isAdmin: boolean; userId: string; copy: Copy }) {
  const t = (k: string) => tx(copy, k);
  const [open, setOpen] = useState(false);
  const section = sections.find((s) => s.key === current) ?? null;
  if (!section) {
    const anywhere = isAdmin || sections.some((s) => s.member_action !== "none");
    return anywhere ? <p style={{ margin: 0, fontSize: 15, color: "#6A4558" }}>{t("forum.composer.pick_section")}</p> : null;
  }
  const action: MemberAction = isAdmin ? "thread" : section.member_action;
  if (action === "none") return null;
  const defaults: Record<MemberAction, string> = { thread: t("forum.composer.toggle"), help_ask: t("forum.help.button"), question: t("forum.ask.button"), request: t("forum.request.button"), none: "" };
  const label = (isAdmin ? "" : section.action_label.trim()) || defaults[action];
  const info: Info = { description: section.description, rulesTitle: rules.title, rules: rules.lines };
  const look =
    action === "question"
      ? { background: "#6E0F1A", color: "#FFF3EA", boxShadow: "3px 3px 0 #4A1942" }
      : action === "request"
        ? { background: "#FFFFFF", color: "#6E0F1A", border: "2px dashed #C9A3B0" }
        : { background: "#F0A35E", color: "#3A1530", boxShadow: "3px 3px 0 #2A0C25" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={{ ...BTN, ...look }}>
          {(action === "thread" || action === "help_ask") && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
          {action === "question" && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01" />
            </svg>
          )}
          {label}
        </button>
      </div>
      {open && (action === "thread" || action === "help_ask") && (
        <Composer
          sections={[{ key: section.key, name: section.name }]}
          preselect={section.key}
          lock={{ key: section.key, name: section.name, description: info.description, rulesTitle: info.rulesTitle, rules: info.rules, helpKind: action === "help_ask" ? "asking" : "both" }}
          userId={userId}
          copy={copy}
          onCancel={() => setOpen(false)}
        />
      )}
      {open && (action === "question" || action === "request") && <MessagePanel kind={action === "question" ? "question" : "topic"} section={section} title={label} info={info} copy={copy} onClose={() => setOpen(false)} />}
    </div>
  );
}

/** A question or a request/proposal to the team, bound to the section, with the section's own field labels. */
function MessagePanel({ kind, section, title, info, copy, onClose }: { kind: "topic" | "question"; section: SectionLite; title: string; info: Info; copy: Copy; onClose: () => void }) {
  const t = (k: string) => tx(copy, k);
  const pathname = usePathname();
  const p = kind === "topic" ? "forum.request" : "forum.ask";
  const field1 = section.action_field1.trim() || t(`${p}.subject`);
  const field2 = section.action_field2.trim() || t(`${p}.body`);
  const [state, action, pending] = useActionState<MessageState, FormData>(sendTeamMessage.bind(null, kind), { error: null });
  return (
    <section aria-label={title} style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 22, padding: 20, display: "flex", flexDirection: "column", gap: 12, boxShadow: "6px 6px 0 #F3DCCB" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700 }}>{title}</h2>
        <button type="button" className="btn-link" onClick={onClose} style={{ fontSize: 14 }}>
          {t("forum.composer.cancel")}
        </button>
      </div>
      {!section.action_label.trim() && <p style={{ margin: 0, fontSize: 15, color: "#5A3348" }}>{t(`${p}.title`)}</p>}
      <SectionInfo description={info.description} rulesTitle={info.rulesTitle} rules={info.rules} />
      {state.sent ? (
        <p role="status" className="flash flash-ok" style={{ margin: 0 }}>
          {t(`${p}.sent`)}
        </p>
      ) : (
        <form action={action} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input type="hidden" name="section_id" value={section.id} />
          <input type="hidden" name="page" value={pathname} />
          {state.error && (
            <p role="alert" className="flash flash-err" style={{ margin: 0 }}>
              {state.error}
            </p>
          )}
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 15, fontWeight: 600 }}>
            {field1}
            <input className="fld fld-sm" name="subject" maxLength={140} required placeholder={t(`${p}.subject_placeholder`)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 15, fontWeight: 600 }}>
            {field2}
            <textarea className="fld" name="body" rows={3} style={{ fontSize: 16 }} />
          </label>
          <button type="submit" className="btn-primary" disabled={pending} style={{ alignSelf: "flex-start", height: 46 }}>
            {pending ? t("widget.sending") : t(`${p}.send`)}
          </button>
        </form>
      )}
    </section>
  );
}
