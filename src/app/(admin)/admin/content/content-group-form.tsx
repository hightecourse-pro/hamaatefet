"use client";

import { useActionState, useState } from "react";
import type { ContentGroup } from "@/lib/content-registry";
import { saveContentGroup, type AdminState } from "../actions";
import { RichEditor } from "@/components/rich-editor";

export function ContentGroupForm({ group, overrides, visibleKeys = null, forceOpen = false }: { group: ContentGroup; overrides: Record<string, string>; visibleKeys?: Set<string> | null; forceOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminState, FormData>(saveContentGroup.bind(null, group.key), { error: null });
  const changed = group.fields.filter((f) => overrides[f.key] !== undefined && overrides[f.key] !== "").length;
  const fields = visibleKeys ? group.fields.filter((f) => visibleKeys.has(f.key)) : group.fields;
  const isOpen = open || forceOpen;
  return (
    <section style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={isOpen} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, border: "none", background: "transparent", cursor: "pointer", textAlign: "right", padding: 0 }}>
        <span style={{ fontSize: 24, fontWeight: 700 }} className="grad">
          {group.title}
        </span>
        <span style={{ fontSize: 14, color: "#6A4558" }}>
          {visibleKeys ? `${fields.length} מתוך ${group.fields.length} שדות` : `${group.fields.length} שדות`}
          {changed ? ` · ${changed} שונו` : ""} {isOpen ? "▲" : "▼"}
        </span>
      </button>
      {isOpen && group.description && <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#5A3348" }}>{group.description}</p>}
      {isOpen && (
        <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {state.error && (
            <p role="alert" className="flash flash-err" style={{ margin: 0 }}>
              {state.error}
            </p>
          )}
          {state.ok && (
            <p role="status" className="flash flash-ok" style={{ margin: 0 }}>
              {state.ok}
            </p>
          )}
          {fields.map((f) => {
            const current = overrides[f.key] ?? "";
            const isChanged = current !== "" && current !== f.default;
            return (
              <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 6, padding: 12, borderRadius: 16, background: isChanged ? "#FFF4E8" : "#FBF1EA" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <label htmlFor={`f-${f.key}`} style={{ fontSize: 15, fontWeight: 600 }}>
                    {f.label}
                  </label>
                  {isChanged && (
                    <label style={{ fontSize: 13, color: "#6A4558", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input type="checkbox" name={`reset:${f.key}`} style={{ accentColor: "#6E0F1A" }} />
                      חזרה למקור
                    </label>
                  )}
                </div>
                {f.kind === "text" && <input id={`f-${f.key}`} className="fld fld-sm" name={`v:${f.key}`} defaultValue={current || f.default} />}
                {f.kind === "lines" && <textarea id={`f-${f.key}`} className="fld" name={`v:${f.key}`} rows={Math.max(2, (current || f.default).split("\n").length + 1)} defaultValue={current || f.default} />}
                {f.kind === "rich" && <RichEditor name={`v:${f.key}`} initialHtml={current || f.default} minHeight={200} />}
                {f.hint && <span style={{ fontSize: 13, color: "#7A5566" }}>{f.hint}</span>}
                {isChanged && f.kind !== "rich" && (
                  <span style={{ fontSize: 13, color: "#7A5566" }}>
                    המקור: <span style={{ whiteSpace: "pre-line" }}>{f.default}</span>
                  </span>
                )}
              </div>
            );
          })}
          <button type="submit" className="btn-primary" disabled={pending} style={{ alignSelf: "flex-start", height: 46, fontSize: 16 }}>
            {pending ? "שומרת…" : visibleKeys ? "שמירת השדות שמוצגים" : "שמירת הקבוצה"}
          </button>
        </form>
      )}
    </section>
  );
}
