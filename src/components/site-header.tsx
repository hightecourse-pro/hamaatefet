import Link from "next/link";
import Image from "next/image";
import type { Profile } from "@/lib/auth";
import { initialOf } from "@/lib/auth";

export type NavKey = "forum" | "millionaire" | "birthday" | "profile" | "home";

const NAV: { key: NavKey; href: string; contentKey: string; activeColor: string }[] = [
  { key: "forum", href: "/forum", contentKey: "home.forum.title", activeColor: "#A3304A" },
  { key: "millionaire", href: "/millionaire", contentKey: "home.mill.title", activeColor: "#B5532F" },
  { key: "birthday", href: "/birthday", contentKey: "home.bday.title", activeColor: "#A3304A" },
];

export function SiteHeader({ profile, current, labels }: { profile: Profile; current?: NavKey; labels: { forum: string; millionaire: string; birthday: string; admin: string } }) {
  const isAdmin = profile.role === "admin";
  const onProfile = current === "profile";
  const label = (key: string) => (key === "home.forum.title" ? labels.forum : key === "home.mill.title" ? labels.millionaire : labels.birthday);
  return (
    <header style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E2D8" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <Link href="/home" aria-label="המעטפת – דף הבית" style={{ display: "flex" }}>
          <Image src="/brand/logo.png" alt="המעטפת" width={138} height={58} priority style={{ height: 58, width: "auto" }} />
        </Link>
        <nav aria-label="ניווט ראשי" style={{ display: "flex", flexWrap: "wrap", gap: "6px 24px", fontSize: 18, fontWeight: 500 }}>
          {NAV.map((item) => {
            const active = item.key === current;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                style={active ? { padding: "10px 0", color: item.activeColor, fontWeight: 700, borderBottom: "3px solid #F0A35E", textDecoration: "none" } : { padding: "10px 0", color: "#3A1530", textDecoration: "none" }}
              >
                {label(item.contentKey)}
              </Link>
            );
          })}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isAdmin && (
            <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 6, height: 44, padding: "0 16px", borderRadius: 999, border: "2px dashed #C9A3B0", color: "#4A1942", textDecoration: "none", fontSize: 15, fontWeight: 500 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
              {labels.admin}
            </Link>
          )}
          <Link
            href="/profile"
            aria-label="החשבון שלי"
            aria-current={onProfile ? "page" : undefined}
            style={{ width: 44, height: 44, borderRadius: "50%", background: onProfile ? "#6E0F1A" : "#F6D9CB", color: onProfile ? "#FFF3EA" : "#6E0F1A", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, textDecoration: "none", fontSize: 18 }}
          >
            {initialOf(profile)}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ text }: { text: string }) {
  return <footer style={{ padding: "28px 24px", textAlign: "center", fontSize: 15, color: "#7A5566" }}>{text}</footer>;
}
