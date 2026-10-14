"use client";

import { useActionState, useState } from "react";
import { addSection, type AdminState } from "../actions";

export function NewSectionForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminState, FormData>(addSection, { error: null });
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={{ height: 42, padding: "0 14px", borderRadius: 12, border: "2px dashed #C9A3B0", background: "#FFFFFF", color: "#6E0F1A", cursor: "pointer", alignSelf: "flex-start" }}>
        + מדור חדש
      </button>
    );
  }
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 8, background: "#FFFCFA", border: "1.5px dashed #C9A3B0", borderRadius: 16, padding: 12 }}>
      <input className="fld fld-sm" name="name" placeholder="שם המדור" required />
      <input className="fld fld-sm" name="description" placeholder="משפט קצר שמסביר מה יש בו" />
      {state.error && (
        <span role="alert" style={{ fontSize: 14, color: "#A3304A" }}>
          {state.error}
        </span>
      )}
      {state.ok && (
        <span role="status" style={{ fontSize: 14, color: "#2F6B3A" }}>
          {state.ok}
        </span>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn-sm-green" disabled={pending}>
          {pending ? "…" : "הוספה"}
        </button>
        <button type="button" className="btn-sm" onClick={() => setOpen(false)}>
          ביטול
        </button>
      </div>
    </form>
  );
}
