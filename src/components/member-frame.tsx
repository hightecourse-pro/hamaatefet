import type { Profile } from "@/lib/auth";
import { SiteHeader, SiteFooter, type NavKey } from "@/components/site-header";
import { SessionKeeper } from "@/components/session-keeper";

/** The member area's page frame: header, content, footer. */
export function MemberFrame({ profile, current, children }: { profile: Profile; current?: NavKey; children: React.ReactNode }) {
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#FFF8F2", color: "#3A1530", display: "flex", flexDirection: "column" }}>
      <SiteHeader profile={profile} current={current} />
      <div style={{ flex: 1 }}>{children}</div>
      <SiteFooter />
      <SessionKeeper />
    </div>
  );
}
