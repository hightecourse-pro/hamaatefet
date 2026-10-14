import Link from "next/link";
import Image from "next/image";
import { requireAdmin, initialOf } from "@/lib/auth";
import { adminCounts } from "@/lib/admin-data";
import { AdminNav } from "./admin-nav";

export const metadata = { title: { default: "ממשק ניהול", template: "%s · ניהול המעטפת" } };

const TILE = { flex: "1 1 180px", borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", gap: 4 } as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  const counts = await adminCounts();
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#FFF8F2", color: "#3A1530" }}>
      <header style={{ background: "#4A1942", color: "#FBE3D6" }}>
        <div style={{ padding: "12px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link href="/home" aria-label="חזרה לאתר" style={{ display: "flex", background: "#FFFFFF", borderRadius: 14, padding: "4px 10px" }}>
              <Image src="/brand/logo.png" alt="המעטפת" width={95} height={40} style={{ height: 40, width: "auto" }} />
            </Link>
            <span style={{ fontSize: 20, fontWeight: 600 }}>ממשק ניהול</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/home" style={{ color: "#FBE3D6", fontSize: 16, padding: 10 }}>
              לצפייה באתר
            </Link>
            <Link href="/profile" aria-label="החשבון שלי" style={{ width: 40, height: 40, borderRadius: "50%", background: "#F0A35E", color: "#3A1530", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, textDecoration: "none" }}>
              {initialOf(profile)}
            </Link>
          </div>
        </div>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start" }}>
        <AdminNav badges={{ members: counts.pendingMembers, forum: counts.pendingPosts, mill: counts.newProposals }} />
        <main style={{ flex: "999 1 640px", minWidth: 0, padding: "28px clamp(16px, 3vw, 40px) 56px", display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            <div style={{ ...TILE, background: "#FFFFFF", border: "2px solid #F0E2D8" }}>
              <span style={{ fontSize: 15, color: "#6A4558" }}>משתתפות פעילות</span>
              <span style={{ fontSize: 32, fontWeight: 700, color: "#4A1942" }}>{counts.activeMembers}</span>
            </div>
            <div style={{ ...TILE, background: "#FFF4E8", border: "2px solid #F5D7BD" }}>
              <span style={{ fontSize: 15, color: "#6A4558" }}>ממתינות לאישור</span>
              <span style={{ fontSize: 32, fontWeight: 700, color: "#9A4318" }}>{counts.pendingMembers}</span>
            </div>
            <div style={{ ...TILE, background: "#FFFFFF", border: "2px solid #F0E2D8" }}>
              <span style={{ fontSize: 15, color: "#6A4558" }}>פוסטים לבדיקה</span>
              <span style={{ fontSize: 32, fontWeight: 700, color: "#A3304A" }}>{counts.pendingPosts}</span>
            </div>
            <div style={{ ...TILE, background: "#FFFFFF", border: "2px solid #F0E2D8" }}>
              <span style={{ fontSize: 15, color: "#6A4558" }}>נרשמות למפגש הקרוב{counts.nextEventTitle ? ` · ${counts.nextEventTitle}` : ""}</span>
              <span style={{ fontSize: 32, fontWeight: 700, color: "#6E0F1A" }}>{counts.nextEventRegistrations}</span>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
