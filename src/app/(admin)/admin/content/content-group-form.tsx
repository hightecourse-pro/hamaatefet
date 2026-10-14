"use client";

import { useActionState, useState } from "react";
import type { ContentGroup } from "@/lib/content";
import { saveContentGroup, type AdminState } from "../actions";
import { RichEditor } from "@/components/rich-editor";

export function ContentGroupForm({ group, overrides }: { group: ContentGroup; overrides: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminState, FormData>(saveContentGroup.bind(null, group.key), { error: null });
  const changed = group.fields.filter((f) => overrides[f.key] !== undefined && overrides[f.key] !== "").length;
  return (
    <section style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, border: "none", background: "transparent", cursor: "pointer", textAlign: "right", padding: 0 }}>
        <span style={{ fontSize: 24, fontWeight: 700 }} className="grad">
          {group.title}
        </span>
        <span style={{ fontSize: 14, color: "#6A4558" }}>
          {group.fields.length} שדות{changed ? ` · ${changed} שונו` : ""} {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
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
          {group.fields.map((f) => {
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
            {pending ? "שומרת…" : "שמירת הקבוצה"}
          </button>
        </form>
      )}
    </section>
  );
}
