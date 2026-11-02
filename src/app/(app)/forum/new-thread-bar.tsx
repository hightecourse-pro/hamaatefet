"use client";

import { useActionState, useState } from "react";
import { usePathname } from "next/navigation";
import { Composer } from "./composer";
import { sendTeamMessage, type MessageState } from "@/app/(app)/messages/actions";
import { tx, type Copy } from "@/lib/copy";

export interface SectionLite {
  id: string;
  key: string;
  name: string;
  description: string;
  post_mode: string;
  ask_label: string;
  /** The section's own wording for the "new thread" button (empty = «דיון חדש»). */
  new_label: string;
}

/**
 * The action bar above the thread list – inside a section only (the owner, 2/11:
 * one general button hid what each section is about). Depending on the section
 * and on who she is: the section's "new thread" button (its own wording, or
 * «דיון חדש»; the team anywhere, a member in a "members" section), «בקשה לנושא»
 * (a member in a team-only section) and the section's own "ask" button (e.g.
 * «שאלה לרוחמה»). On «הכל» there is only a hint to enter a section.
 */
export function NewThreadBar({ sections, current, rules, isAdmin, userId, copy }: { sections: SectionLite[]; current: string; rules: { title: string; lines: string[] }; isAdmin: boolean; userId: string; copy: Copy }) {
  const t = (k: string) => tx(copy, k);
  const [panel, setPanel] = useState<"none" | "new" | "request" | "ask">("none");
  const section = sections.find((s) => s.key === current) ?? null;
  const postable = isAdmin ? sections : sections.filter((s) => s.post_mode === "members");
  const canPost = !!section && postable.some((s) => s.key === section.key);
  const canRequest = !isAdmin && !!section && section.post_mode === "team";
  const askLabel = section?.ask_label?.trim() ?? "";
  if (!section) {
    return postable.length > 0 ? (
      <p style={{ margin: 0, fontSize: 15, color: "#6A4558" }}>{t("forum.composer.pick_section")}</p>
    ) : null;
  }
  if (!canPost && !canRequest && !askLabel) return null;
  const newLabel = section.new_label?.trim() || t("forum.composer.toggle");

  const toggle = (p: typeof panel) => setPanel((v) => (v === p ? "none" : p));
  const BTN = { display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0 18px", borderRadius: 999, fontSize: 16, fontWeight: 700, cursor: "pointer", border: "none" } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        {canPost && (
          <button type="button" onClick={() => toggle("new")} aria-expanded={panel === "new"} style={{ ...BTN, background: "#F0A35E", color: "#3A1530", boxShadow: "3px 3px 0 #2A0C25" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {newLabel}
          </button>
        )}
        {canRequest && (
          <button type="button" onClick={() => toggle("request")} aria-expanded={panel === "request"} style={{ ...BTN, background: "#FFFFFF", color: "#6E0F1A", border: "2px dashed #C9A3B0" }}>
            {t("forum.request.button")}
          </button>
        )}
        {askLabel && section && (
          <button type="button" onClick={() => toggle("ask")} aria-expanded={panel === "ask"} style={{ ...BTN, background: "#6E0F1A", color: "#FFF3EA", boxShadow: "3px 3px 0 #4A1942" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01" />
            </svg>
            {askLabel}
          </button>
        )}
      </div>
      {panel === "new" && canPost && (
        <Composer
          sections={postable.map((s) => ({ key: s.key, name: s.name }))}
          preselect={section.key}
          lock={{ key: section.key, name: section.name, description: section.description, rulesTitle: rules.title, rules: rules.lines }}
          userId={userId}
          copy={copy}
          onCancel={() => setPanel("none")}
        />
      )}
      {panel === "request" && section && <MessagePanel kind="topic" section={section} copy={copy} onClose={() => setPanel("none")} />}
      {panel === "ask" && section && <MessagePanel kind="question" section={section} copy={copy} onClose={() => setPanel("none")} />}
    </div>
  );
}

/** A topic request or a question to the team, bound to the section. */
function MessagePanel({ kind, section, copy, onClose }: { kind: "topic" | "question"; section: SectionLite; copy: Copy; onClose: () => void }) {
  const t = (k: string) => tx(copy, k);
  const pathname = usePathname();
  const p = kind === "topic" ? "forum.request" : "forum.ask";
  const [state, action, pending] = useActionState<MessageState, FormData>(sendTeamMessage.bind(null, kind), { error: null });
  return (
    <section aria-label={kind === "question" ? section.ask_label : t("forum.request.button")} style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 22, padding: 20, display: "flex", flexDirection: "column", gap: 12, boxShadow: "6px 6px 0 #F3DCCB" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700 }}>{kind === "question" ? section.ask_label : t(`${p}.title`)}</h2>
        <button type="button" className="btn-link" onClick={onClose} style={{ fontSize: 14 }}>
          {t("forum.composer.cancel")}
        </button>
      </div>
      {kind === "question" && <p style={{ margin: 0, fontSize: 15, color: "#5A3348" }}>{t("forum.ask.title")}</p>}
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
            {t(`${p}.subject`)}
            <input className="fld fld-sm" name="subject" maxLength={140} required placeholder={t(`${p}.subject_placeholder`)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 15, fontWeight: 600 }}>
            {t(`${p}.body`)}
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
