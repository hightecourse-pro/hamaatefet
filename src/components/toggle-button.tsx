"use client";

import { useTransition, useState, type CSSProperties } from "react";
import type { ToggleState } from "@/app/(app)/events-actions";

/** A button that flips a server-side yes/no (RSVP, topic team) with the design's two looks. */
export function ToggleButton({
  on,
  onLabel,
  offLabel,
  onStyle,
  offStyle,
  action,
  disabled,
  disabledLabel,
}: {
  on: boolean;
  onLabel: string;
  offLabel: string;
  onStyle: CSSProperties;
  offStyle: CSSProperties;
  action: () => Promise<ToggleState>;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={pending || disabled}
        aria-pressed={on}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await action();
            if (r.error) setError(r.error);
          })
        }
        style={{ ...(on ? onStyle : offStyle), opacity: pending || disabled ? 0.7 : 1 }}
      >
        {disabled && disabledLabel ? disabledLabel : pending ? "רגע…" : on ? onLabel : offLabel}
      </button>
      {error && (
        <span role="alert" style={{ fontSize: 14, color: "#A3304A" }}>
          {error}
        </span>
      )}
    </>
  );
}
