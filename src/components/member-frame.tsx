import type { Profile } from "@/lib/auth";
import { SiteHeader, SiteFooter, type NavKey } from "@/components/site-header";
import { SessionKeeper } from "@/components/session-keeper";
import { TeamMessageWidget } from "@/components/team-message-widget";
import { AdSlot } from "@/components/ad-slot";
import { getContent } from "@/lib/content";
import { pickActiveAd } from "@/lib/ads";
import { createClient } from "@/lib/supabase/server";

/**
 * The member area's page frame: header, content (with the advertisement slot
 * beside it on wide screens / under it on phones, only when the team has an
 * active ad), footer, the floating team-message button.
 */
export async function MemberFrame({ profile, current, children }: { profile: Profile; current?: NavKey; children: React.ReactNode }) {
  const supabase = await createClient();
  const [c, nudge, ad] = await Promise.all([
    getContent(),
    (async () => {
      try {
        const { data } = await supabase.from("settings").select("value").eq("key", "launch_nudge").maybeSingle();
        const v = data?.value as { enabled?: boolean } | null;
        return v?.enabled !== false;
      } catch {
        return true;
      }
    })(),
    pickActiveAd(supabase),
  ]);
  const adLabel = c.get("ads.label");
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#FFF8F2", color: "#3A1530", display: "flex", flexDirection: "column" }}>
      <SiteHeader
        profile={profile}
        current={current}
        labels={{ brand: c.get("general.brand"), forum: c.get("home.forum.title"), millionaire: c.get("home.mill.title"), birthday: c.get("home.bday.title"), admin: c.get("general.admin_pill"), profile: c.get("profile.title"), sponsors: c.get("general.sponsors"), sponsorBv: c.get("general.sponsor.bv"), sponsorHop: c.get("general.sponsor.hop") }}
      />
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 0", minWidth: 0, paddingBottom: 72 }}>{children}</div>
        {ad && <AdSlot ad={ad} label={adLabel} place="side" />}
      </div>
      {ad && <AdSlot ad={ad} label={adLabel} place="bottom" />}
      <SiteFooter text={c.get("general.footer")} />
      <SessionKeeper />
      <TeamMessageWidget copy={c.copy("widget.")} nudge={nudge} />
    </div>
  );
}
