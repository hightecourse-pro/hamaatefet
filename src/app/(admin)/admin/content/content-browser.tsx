"use client";

import { useState } from "react";
import type { ContentGroup } from "@/lib/content-registry";
import { ContentGroupForm } from "./content-group-form";

/** The content screen: a search box over every text, and the groups below it. */
export function ContentBrowser({ groups, overrides }: { groups: ContentGroup[]; overrides: Record<string, string> }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const matches = (f: ContentGroup["fields"][number]) =>
    !term || f.label.toLowerCase().includes(term) || f.default.toLowerCase().includes(term) || (overrides[f.key] ?? "").toLowerCase().includes(term) || f.key.includes(term);
  const total = groups.reduce((n, g) => n + g.fields.length, 0);
  const changed = groups.reduce((n, g) => n + g.fields.filter((f) => overrides[f.key] !== undefined && overrides[f.key] !== "").length, 0);
  const visible = groups.map((g) => ({ group: g, fields: g.fields.filter(matches) }));
  const shown = visible.reduce((n, v) => n + v.fields.length, 0);
  return (
    <>
      <div style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 18, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <label style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 6, fontSize: 15, fontWeight: 600 }}>
          חיפוש טקסט
          <input type="search" className="fld fld-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="כתבי מילה שמופיעה באתר, למשל «מעטפה» או «סיסמה»" />
        </label>
        <span style={{ fontSize: 14, color: "#6A4558" }}>
          {term ? `${shown} מתוך ${total} טקסטים` : `${total} טקסטים ב-${groups.length} קבוצות`}
          {changed ? ` · ${changed} שונו` : ""}
        </span>
      </div>
      {term && shown === 0 && (
        <p style={{ margin: 0, padding: 18, background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, fontSize: 16, color: "#6A4558" }}>לא מצאנו טקסט כזה. אפשר לנסות מילה אחרת.</p>
      )}
      {visible.map(({ group, fields }) =>
        term && fields.length === 0 ? null : <ContentGroupForm key={group.key} group={group} overrides={overrides} visibleKeys={term ? new Set(fields.map((f) => f.key)) : null} forceOpen={!!term} />
      )}
    </>
  );
}
