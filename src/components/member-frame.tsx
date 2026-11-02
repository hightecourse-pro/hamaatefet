import type { Profile } from "@/lib/auth";
import { SiteHeader, SiteFooter, type NavKey } from "@/components/site-header";
import { SessionKeeper } from "@/components/session-keeper";
import { TeamMessageWidget } from "@/components/team-message-widget";
import { getContent } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

/** The member area's page frame: header, content, footer, the floating team-message button. */
export async function MemberFrame({ profile, current, children }: { profile: Profile; current?: NavKey; children: React.ReactNode }) {
  const [c, nudge] = await Promise.all([
    getContent(),
    (async () => {
      try {
        const supabase = await createClient();
        const { data } = await supabase.from("settings").select("value").eq("key", "launch_nudge").maybeSingle();
        const v = data?.value as { enabled?: boolean } | null;
        return v?.enabled !== false;
      } catch {
        return true;
      }
    })(),
  ]);
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#FFF8F2", color: "#3A1530", display: "flex", flexDirection: "column" }}>
      <SiteHeader
        profile={profile}
        current={current}
        labels={{ brand: c.get("general.brand"), forum: c.get("home.forum.title"), millionaire: c.get("home.mill.title"), birthday: c.get("home.bday.title"), admin: c.get("general.admin_pill"), profile: c.get("profile.title"), sponsors: c.get("general.sponsors"), sponsorBv: c.get("general.sponsor.bv"), sponsorHop: c.get("general.sponsor.hop") }}
      />
      <div style={{ flex: 1, paddingBottom: 72 }}>{children}</div>
      <SiteFooter text={c.get("general.footer")} />
      <SessionKeeper />
      <TeamMessageWidget copy={c.copy("widget.")} nudge={nudge} />
    </div>
  );
}
