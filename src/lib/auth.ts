import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Profile = Tables<"profiles">;

export interface Session {
  userId: string;
  email: string;
  profile: Profile;
}

/** The signed-in member and her profile, or null. Cached per request. */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) return null;
  return { userId: user.id, email: user.email ?? profile.email, profile };
});

export function isProfileComplete(p: Profile): boolean {
  return (
    p.first_name.trim() !== "" &&
    p.last_name.trim() !== "" &&
    p.phone.trim() !== "" &&
    p.birth_month !== null &&
    p.over_30_confirmed
  );
}

/** Where a signed-in member belongs right now, given her status. */
export function homeFor(p: Profile): string {
  if (!isProfileComplete(p)) return "/welcome";
  if (p.status !== "active") return "/pending";
  return "/home";
}

/** Signed in, details complete, account active. Otherwise redirect to the right place. */
export async function requireActive(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  const home = homeFor(session.profile);
  if (home !== "/home") redirect(home);
  return session;
}

/** Signed in – any status. For /welcome and /pending. */
export async function requireSignedIn(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireActive();
  if (session.profile.role !== "admin") redirect("/home");
  return session;
}

export function displayName(p: Pick<Profile, "first_name" | "last_name">): string {
  return `${p.first_name} ${p.last_name}`.trim() || "חברת המעטפת";
}

export function initialOf(p: Pick<Profile, "first_name" | "last_name">): string {
  return (p.first_name || p.last_name || "מ").trim().charAt(0);
}
