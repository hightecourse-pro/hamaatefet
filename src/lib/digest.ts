// The daily digest: what happened in the forum (and the calendar) since the
// previous run, mailed at 12:30 Israel time to every active member who keeps
// the switch on in «החשבון שלי». Server-only (service role).
import { createAdminClient } from "@/lib/supabase/admin";
import { contentFrom, type Content } from "@/lib/content";
import { digestEmail, sendEmail, sendEmailBatch, type DigestData } from "@/lib/email";
import { getSiteUrl } from "@/lib/site";
import { civilDateLabel, hebrewDateLabel, timeRange } from "@/lib/hebrew";

/** When the digest goes out (Israel time). vercel.json fires the route every hour at :30; only the 12:30 firing sends. */
export const DIGEST_HOUR = 12;
export const DIGEST_MINUTE = 30;

type Admin = ReturnType<typeof createAdminClient>;
const DAY = 24 * 3600 * 1000;

/** The content registry + the team's overrides, without a request (crons carry no cookies). */
export async function adminContent(admin: Admin): Promise<Content> {
  const { data } = await admin.from("site_content").select("key, value");
  return contentFrom(Object.fromEntries((data ?? []).map((r) => [r.key, r.value])));
}

export function israelNow(now: Date = new Date()): { hour: number; minute: number; date: string } {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hourCycle: "h23", hour: "2-digit", minute: "2-digit", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const g = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  return { hour: Number(g("hour")), minute: Number(g("minute")), date: `${g("year")}-${g("month")}-${g("day")}` };
}

/** New threads, threads that got comments, and new calendar entries between two instants. */
export async function collectDigest(admin: Admin, c: Content, since: string, until: string): Promise<DigestData> {
  const [{ data: posts }, { data: comments }, { data: events }] = await Promise.all([
    admin.from("posts").select("id, title, forum_sections(name), profiles!posts_author_id_fkey(first_name, last_name)").eq("status", "published").gt("created_at", since).lte("created_at", until).order("created_at"),
    admin.from("comments").select("post_id, posts(id, title, status)").gt("created_at", since).lte("created_at", until),
    admin.from("events").select("id, title, type, event_date, start_time, end_time").eq("published", true).gt("created_at", since).lte("created_at", until).order("event_date"),
  ]);
  const fallback = c.get("general.member_fallback");
  const newIds = new Set((posts ?? []).map((p) => p.id));
  const perThread = new Map<string, { id: string; title: string; comments: number }>();
  for (const x of comments ?? []) {
    const p = x.posts;
    if (!p || p.status !== "published" || newIds.has(p.id)) continue;
    const row = perThread.get(p.id) ?? { id: p.id, title: p.title, comments: 0 };
    row.comments += 1;
    perThread.set(p.id, row);
  }
  return {
    dateLabel: civilDateLabel(israelNow().date),
    posts: (posts ?? []).map((p) => ({ id: p.id, title: p.title, section: p.forum_sections?.name ?? "", author: `${p.profiles?.first_name ?? ""} ${p.profiles?.last_name ?? ""}`.trim() || fallback })),
    threads: [...perThread.values()].sort((a, b) => b.comments - a.comments),
    events: (events ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      href: e.type === "birthday" ? "/birthday" : e.type === "millionaire" ? "/millionaire" : "/home",
      when: `${hebrewDateLabel(e.event_date)} ${timeRange(e.start_time, e.end_time)}`.trim(),
    })),
  };
}

export interface DigestRun {
  ok: boolean;
  skipped?: string;
  since: string;
  until: string;
  recipients: number;
  sent: number;
  blocked: number;
  posts: number;
  threads: number;
  events: number;
  errors?: string[];
}

/** The scheduled run. `force` skips the hour + once-a-day guards; `dry` counts without sending or recording. */
export async function runDailyDigest(opts: { force?: boolean; dry?: boolean } = {}): Promise<DigestRun> {
  const admin = createAdminClient();
  const now = new Date();
  const until = now.toISOString();
  const [c, { data: rows }] = await Promise.all([adminContent(admin), admin.from("settings").select("key, value").in("key", ["digest", "digest_last"])]);
  const setting: Record<string, Record<string, unknown>> = {};
  for (const r of rows ?? []) setting[r.key] = (r.value ?? {}) as Record<string, unknown>;
  const enabled = setting.digest?.enabled !== false;
  const lastAt = typeof setting.digest_last?.at === "string" ? String(setting.digest_last.at) : null;
  // Continue from the previous run (so nothing falls between two digests), but never further back than a week.
  const floor = now.getTime() - 7 * DAY;
  const since = new Date(lastAt && new Date(lastAt).getTime() > floor ? lastAt : now.getTime() - DAY).toISOString();
  const base: DigestRun = { ok: true, since, until, recipients: 0, sent: 0, blocked: 0, posts: 0, threads: 0, events: 0 };

  if (!enabled && !opts.force) return { ...base, skipped: "disabled" };
  if (!opts.force) {
    const il = israelNow(now);
    if (il.hour !== DIGEST_HOUR) return { ...base, skipped: `not_the_hour (${il.hour}:${String(il.minute).padStart(2, "0")} Israel)` };
    if (lastAt && now.getTime() - new Date(lastAt).getTime() < 20 * 3600 * 1000) return { ...base, skipped: "already_ran_today" };
  }

  const data = await collectDigest(admin, c, since, until);
  const counts = { posts: data.posts.length, threads: data.threads.length, events: data.events.length };
  const record = (extra: Record<string, unknown>) => admin.from("settings").upsert({ key: "digest_last", value: { at: until, since, ...counts, ...extra }, updated_at: until });

  if (!counts.posts && !counts.threads && !counts.events) {
    if (!opts.dry) await record({ sent: 0, blocked: 0, quiet: true });
    return { ...base, ...counts, skipped: "nothing_new" };
  }
  const { data: members } = await admin.from("profiles").select("email, first_name").eq("status", "active").eq("daily_digest", true);
  const recipients = (members ?? []).filter((m) => m.email);
  if (opts.dry) return { ...base, ...counts, recipients: recipients.length, skipped: "dry_run" };

  const siteUrl = getSiteUrl();
  const items = recipients.map((m) => {
    const built = digestEmail(c, m.first_name, data, siteUrl);
    return { to: m.email, subject: built.subject, html: built.html };
  });
  const r = await sendEmailBatch(items);
  await record({ sent: r.sent, blocked: r.blocked, errors: r.errors.slice(0, 3) });
  return { ...base, ...counts, recipients: recipients.length, sent: r.sent, blocked: r.blocked, errors: r.errors };
}

/** «שליחת דוגמה אליי» in the admin: the last seven days, to one address, nothing recorded. */
export async function sendDigestSample(to: string, firstName: string): Promise<{ ok: true; posts: number; threads: number; events: number } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const c = await adminContent(admin);
  const until = new Date();
  const data = await collectDigest(admin, c, new Date(until.getTime() - 7 * DAY).toISOString(), until.toISOString());
  if (!data.posts.length && !data.threads.length && !data.events.length) return { ok: false, error: "empty" };
  const built = digestEmail(c, firstName, data, getSiteUrl());
  const r = await sendEmail({ to, subject: built.subject, html: built.html });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, posts: data.posts.length, threads: data.threads.length, events: data.events.length };
}
