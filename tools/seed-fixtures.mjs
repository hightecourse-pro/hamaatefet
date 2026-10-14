// node tools/seed-fixtures.mjs <staging>
// The test accounts the E2E suite and the sanity script log in as. Idempotent:
// existing accounts are reset to their canonical state. NEVER run against production.
import { createClient } from "@supabase/supabase-js";
import { HDate } from "@hebcal/core";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, refFor, apiKeys } from "./deploy-helpers.mjs";

const env = process.argv[2];
if (env !== "staging") {
  console.log("usage: node tools/seed-fixtures.mjs staging   (production is never seeded)");
  process.exit(1);
}
const ref = refFor(env);
const { serviceRole } = await apiKeys(ref);
const admin = createClient(`https://${ref}.supabase.co`, serviceRole, { auth: { persistSession: false } });

// Hebrew month, Tishrei-first (same mapping as src/lib/hebrew.ts).
const hd = new HDate(new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" })));
const hm = hd.getMonth();
const thisMonth = hm === 13 ? 6 : hm >= 7 ? hm - 6 : hm + 6;
const otherMonth = (thisMonth % 12) + 1;
const thisYear = hd.getFullYear();

export const FIXTURES = JSON.parse(readFileSync(join(ROOT, "e2e", "fixtures.json"), "utf8"));

async function upsertUser(f) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  let user = list.users.find((u) => u.email === f.email);
  const meta = { first_name: f.first_name, last_name: f.last_name, phone: f.phone, birth_month: f.birth_month === "this" ? thisMonth : f.birth_month === "other" ? otherMonth : f.birth_month, over_30: true, terms: true };
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({ email: f.email, password: f.password, email_confirm: true, user_metadata: meta });
    if (error) throw new Error(`create ${f.email}: ${error.message}`);
    user = data.user;
  } else {
    await admin.auth.admin.updateUserById(user.id, { password: f.password, email_confirm: true, user_metadata: meta });
  }
  const { error } = await admin
    .from("profiles")
    .update({
      first_name: meta.first_name,
      last_name: meta.last_name,
      phone: meta.phone,
      birth_month: meta.birth_month,
      over_30_confirmed: true,
      terms_accepted_at: new Date().toISOString(),
      role: f.role,
      status: f.status,
      approved_at: f.status === "active" ? new Date().toISOString() : null,
      remind_birthday: true,
    })
    .eq("id", user.id);
  if (error) throw new Error(`profile ${f.email}: ${error.message}`);
  return user.id;
}

const ids = {};
for (const f of FIXTURES.accounts) ids[f.key] = await upsertUser(f);
console.log("accounts:", Object.keys(ids).join(", "));

// Clean what the suite creates, so every run starts from the same place.
const qaIds = Object.values(ids);
await admin.from("posts").delete().in("author_id", qaIds);
await admin.from("comments").delete().in("author_id", qaIds);
await admin.from("hosting_proposals").delete().in("user_id", qaIds);
await admin.from("registrations").delete().in("user_id", qaIds);
await admin.from("topic_team").delete().in("user_id", qaIds);
await admin.from("events").delete().like("title", "QA %");
await admin.from("forum_sections").delete().like("name", "QA %");
await admin.from("settings").upsert({ key: "forum_moderation", value: { enabled: false } });

// This month's birthday party gets a date (a weekday – never Friday/Shabbat), so RSVP and the host view can be exercised.
const in10 = new Date(Date.now() + 10 * 24 * 3600 * 1000);
while ([5, 6].includes(in10.getUTCDay())) in10.setUTCDate(in10.getUTCDate() + 1);
const dateStr = in10.toISOString().slice(0, 10);
const { data: party } = await admin.from("events").select("id").eq("type", "birthday").eq("hebrew_year", thisYear).eq("hebrew_month", thisMonth).maybeSingle();
const partyPatch = { title: `מסיבת ${["תשרי", "חשון", "כסלו", "טבת", "שבט", "אדר", "ניסן", "אייר", "סיון", "תמוז", "אב", "אלול"][thisMonth - 1]}`, event_date: dateStr, start_time: "20:00", end_time: "22:30", location: "מינהל קהילתי בית וגן, רח׳ לויכטר 9", topic: "", published: true };
let partyId = party?.id;
if (partyId) await admin.from("events").update(partyPatch).eq("id", partyId);
else {
  const { data } = await admin.from("events").insert({ type: "birthday", hebrew_year: thisYear, hebrew_month: thisMonth, ...partyPatch }).select("id").single();
  partyId = data.id;
}
const { count: agendaCount } = await admin.from("event_agenda").select("id", { count: "exact", head: true }).eq("event_id", partyId);
if (!agendaCount) {
  await admin.from("event_agenda").insert([
    { event_id: partyId, sort_order: 1, time_label: "20:00", title: "מתכנסות: עוגה, חטיפים ובלונים", body: "פינת צילום, ברכה קטנה בכניסה.", questions: [] },
    { event_id: partyId, sort_order: 2, time_label: "20:30", title: "הנושא המרכזי של הערב", body: "בהובלת בעלות השמחה.", questions: ["מה הדבר שהכי שימח אותך השנה?", "מה היית אומרת לעצמך לפני עשר שנים?"] },
    { event_id: partyId, sort_order: 3, time_label: "22:00", title: "משאלות וברכות", body: "כל אחת מוסיפה משאלה למעטפה של בעלות השמחה.", questions: [] },
  ]);
}
// A millionaire evening to RSVP to.
const { data: evening } = await admin.from("events").select("id").eq("type", "millionaire").eq("title", "ערב סיפורים עם רות").maybeSingle();
if (!evening) {
  await admin.from("events").insert({ type: "millionaire", title: "ערב סיפורים עם רות", description: "סיפור אחד, שלא סיפרתי לאף אחת.", event_date: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString().slice(0, 10), start_time: "20:30", end_time: "22:00", location: "אצל רות, בית וגן", kind: "story", host_name: "רות", capacity: 12, published: true });
}
console.log(`fixtures ready on ${env}: this month=${thisMonth}, party ${dateStr}`);
