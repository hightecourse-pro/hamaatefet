import { createAdminClient } from "@/lib/supabase/admin";
import { todayIso } from "@/lib/events";

export interface AdminCounts {
  activeMembers: number;
  pendingMembers: number;
  pendingPosts: number;
  newProposals: number;
  nextEventTitle: string | null;
  nextEventRegistrations: number;
}

/** The numbers on the admin tiles and badges. Service role – call after requireAdmin(). */
export async function adminCounts(): Promise<AdminCounts> {
  const admin = createAdminClient();
  const [active, pending, posts, proposals, next] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("posts").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("hosting_proposals").select("id", { count: "exact", head: true }).eq("status", "new"),
    admin.from("events").select("id, title").eq("published", true).gte("event_date", todayIso()).order("event_date").limit(1).maybeSingle(),
  ]);
  let nextEventRegistrations = 0;
  if (next.data) {
    const r = await admin.from("registrations").select("event_id", { count: "exact", head: true }).eq("event_id", next.data.id);
    nextEventRegistrations = r.count ?? 0;
  }
  return {
    activeMembers: active.count ?? 0,
    pendingMembers: pending.count ?? 0,
    pendingPosts: posts.count ?? 0,
    newProposals: proposals.count ?? 0,
    nextEventTitle: next.data?.title ?? null,
    nextEventRegistrations,
  };
}

export function csv(rows: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
}
