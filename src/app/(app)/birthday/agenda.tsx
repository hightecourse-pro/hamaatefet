"use client";

import { useState } from "react";

export interface AgendaItem {
  id: string;
  time_label: string;
  title: string;
  body: string;
  questions: string[];
}

const PALETTE = [
  { color: "#9A4318", tint: "#FCE7D6" },
  { color: "#A3304A", tint: "#FBE1E4" },
  { color: "#4A1942", tint: "#F1E2EE" },
  { color: "#6E0F1A", tint: "#F6DADC" },
];

export function Agenda({ items }: { items: AgendaItem[] }) {
  const [open, setOpen] = useState<number>(items.length > 1 ? 1 : 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((a, i) => {
        const on = open === i;
        const c = PALETTE[i % PALETTE.length];
        return (
          <div key={a.id} style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 22, overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => setOpen(on ? -1 : i)}
              aria-expanded={on}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: "18px 22px", border: "none", background: "transparent", color: "#3A1530", cursor: "pointer", textAlign: "right" }}
            >
              <span style={{ flex: "none", minWidth: 70, padding: "6px 10px", borderRadius: 12, background: c.tint, color: c.color, fontSize: 15, fontWeight: 600, textAlign: "center" }}>{a.time_label || "·"}</span>
              <span style={{ flex: 1, fontSize: 20, fontWeight: 600 }}>{a.title}</span>
              <span aria-hidden="true" style={{ flex: "none", width: 36, height: 36, borderRadius: "50%", background: "#FBEDE4", color: "#6E0F1A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>
                {on ? "−" : "+"}
              </span>
            </button>
            {on && (
              <div style={{ padding: "0 22px 22px 22px", paddingRight: 108, display: "flex", flexDirection: "column", gap: 10 }}>
                {a.body && <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "#5A3348", whiteSpace: "pre-wrap" }}>{a.body}</p>}
                {a.questions.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, borderRight: "4px solid #F0A35E", paddingRight: 14 }}>
                    <span className="hand" style={{ fontSize: 16, color: "#A3304A" }}>
                      שאלות לדיון
                    </span>
                    {a.questions.map((q, qi) => (
                      <span key={qi} style={{ fontSize: 16 }}>
                        {q}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
