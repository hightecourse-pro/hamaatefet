/** Client-safe helpers for the editable copy (no server imports here). */
export type Copy = Record<string, string>;

/** "היי {שם}," + { שם: "רות" } → "היי רות," – unknown placeholders stay as they are. */
export function fill(text: string, vars?: Record<string, string | number | null | undefined>): string {
  if (!vars) return text;
  return text.replace(/\{([^}]+)\}/g, (m, k: string) => (k in vars && vars[k] !== null && vars[k] !== undefined ? String(vars[k]) : m));
}

/** A "lines" value split for rendering. */
export function lines(text: string): string[] {
  return text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

/** The text for a key out of a resolved copy map (client components), placeholders filled. */
export function tx(copy: Copy, key: string, vars?: Record<string, string | number | null | undefined>): string {
  return fill(copy[key] ?? key, vars);
}
