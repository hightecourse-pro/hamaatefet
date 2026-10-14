"use client";

import { useTransition, useState } from "react";
import type { AdminState } from "./actions";

/** A small action button that calls a server action and shows the outcome inline. */
export function ActionButton({
  action,
  children,
  className = "btn-sm",
  confirm,
  style,
  ariaLabel,
}: {
  action: () => Promise<AdminState>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <button
        type="button"
        className={className}
        aria-label={ariaLabel}
        disabled={pending}
        style={style}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => {
            const r = await action();
            setMsg(r.error ?? r.ok ?? null);
            if (!r.error) setTimeout(() => setMsg(null), 2500);
          });
        }}
      >
        {pending ? "…" : children}
      </button>
      {msg && <span style={{ fontSize: 13, color: msg.includes("לא ") ? "#A3304A" : "#2F6B3A" }}>{msg}</span>}
    </span>
  );
}

export function Toggle({ checked, label, action }: { checked: boolean; label: string; action: (next: boolean) => Promise<AdminState> }) {
  const [pending, start] = useTransition();
  const [val, setVal] = useState(checked);
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, color: "#6A4558", cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
      <input
        type="checkbox"
        checked={val}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          setVal(next);
          start(async () => {
            const r = await action(next);
            if (r.error) setVal(!next);
          });
        }}
        style={{ width: 20, height: 20, accentColor: "#6E0F1A" }}
      />
      {label}
    </label>
  );
}

export const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

export const PauseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M9 5v14M15 5v14" />
  </svg>
);

export const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 5l12 7-12 7z" />
  </svg>
);
