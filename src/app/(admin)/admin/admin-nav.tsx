"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { key: "members", href: "/admin", label: "משתתפות", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" },
  { key: "forum", href: "/admin/forum", label: "הפורום", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { key: "mill", href: "/admin/millionaire", label: "המיליונרית", icon: "M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z" },
  { key: "bday", href: "/admin/birthday", label: "חוגגות חודש טוב", icon: "M4 21h16M5 21V12h14v9M12 12V8M12 5a1 1 0 0 0 0-2M8 12V9M16 12V9" },
  { key: "events", href: "/admin/events", label: "מפגשים והרשמות", icon: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 3v4M8 3v4M3 11h18" },
];

export function AdminNav({ badges }: { badges: Record<string, number> }) {
  const path = usePathname();
  const activeKey = path === "/admin" || path.startsWith("/admin/members") ? "members" : (TABS.find((t) => t.key !== "members" && path.startsWith(t.href))?.key ?? "members");
  return (
    <nav aria-label="תפריט ניהול" style={{ flex: "1 1 240px", maxWidth: "100%", boxSizing: "border-box", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 6, background: "#FFFFFF", borderLeft: "2px solid #F0E2D8", alignSelf: "stretch" }}>
      {TABS.map((t) => {
        const on = t.key === activeKey;
        const badge = badges[t.key] ?? 0;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={on ? "page" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              minHeight: 50,
              padding: "0 14px",
              borderRadius: 14,
              border: "none",
              fontSize: 17,
              textAlign: "right",
              textDecoration: "none",
              background: on ? "#6E0F1A" : "transparent",
              color: on ? "#FFF3EA" : "#3A1530",
              fontWeight: on ? 600 : 500,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={t.icon} />
            </svg>
            <span style={{ flex: 1 }}>{t.label}</span>
            {badge > 0 && (
              <span style={{ minWidth: 26, height: 26, padding: "0 6px", boxSizing: "border-box", borderRadius: 999, background: "#F0A35E", color: "#3A1530", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
