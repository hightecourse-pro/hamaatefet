import type { Profile } from "@/lib/auth";
import { SiteHeader, SiteFooter, type NavKey } from "@/components/site-header";
import { SessionKeeper } from "@/components/session-keeper";
import { getContent } from "@/lib/content";

/** The member area's page frame: header, content, footer. */
export async function MemberFrame({ profile, current, children }: { profile: Profile; current?: NavKey; children: React.ReactNode }) {
  const c = await getContent();
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#FFF8F2", color: "#3A1530", display: "flex", flexDirection: "column" }}>
      <SiteHeader profile={profile} current={current} labels={{ forum: c.get("home.forum.title"), millionaire: c.get("home.mill.title"), birthday: c.get("home.bday.title"), admin: c.get("general.admin_pill") }} />
      <div style={{ flex: 1 }}>{children}</div>
      <SiteFooter text={c.get("general.footer")} />
      <SessionKeeper />
    </div>
  );
}
