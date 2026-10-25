import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { CONTENT_FIELDS } from "@/lib/content-registry";
import { fill, lines, type Copy } from "@/lib/copy";

export { CONTENT_GROUPS, CONTENT_FIELDS } from "@/lib/content-registry";
export type { ContentField, ContentGroup } from "@/lib/content-registry";

type Vars = Record<string, string | number | null | undefined>;

export type Content = {
  /** The text for a key, with {placeholders} filled from vars. */
  get: (key: string, vars?: Vars) => string;
  /** A "lines" field split for rendering. */
  lines: (key: string, vars?: Vars) => string[];
  /** The keys under these prefixes, resolved but unfilled – what a client component needs. */
  copy: (...prefixes: string[]) => Copy;
  overrides: Record<string, string>;
};

export function contentFrom(overrides: Record<string, string>): Content {
  const get = (key: string, vars?: Vars) => {
    const field = CONTENT_FIELDS[key];
    const raw = overrides[key] !== undefined && overrides[key] !== "" ? overrides[key] : (field?.default ?? key);
    return fill(raw, vars);
  };
  return {
    get,
    lines: (key, vars) => lines(get(key, vars)),
    copy: (...prefixes) =>
      Object.fromEntries(
        Object.keys(CONTENT_FIELDS)
          .filter((k) => prefixes.some((p) => k.startsWith(p)))
          .map((k) => [k, get(k)])
      ),
    overrides,
  };
}

/** All overrides from the database, once per request. */
export const getContent = cache(async (): Promise<Content> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_content").select("key, value");
    return contentFrom(Object.fromEntries((data ?? []).map((r) => [r.key, r.value])));
  } catch {
    return contentFrom({});
  }
});
