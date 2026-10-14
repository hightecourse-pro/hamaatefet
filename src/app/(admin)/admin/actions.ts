"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { approvedEmail, pausedEmail, sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/site";
import { hebrewToday } from "@/lib/hebrew";
import { parseAgenda } from "@/lib/agenda";
import { CONTENT_GROUPS } from "@/lib/content";
import { sanitizeRich } from "@/lib/rich-text";

export interface AdminState {
  error: string | null;
  ok?: string | null;
}

const ALL_ADMIN = ["/admin", "/admin/forum", "/admin/millionaire", "/admin/birthday", "/admin/events"];
function revalidateAdmin(extra: string[] = []) {
  for (const p of [...ALL_ADMIN, ...extra]) revalidatePath(p);
}

// ───────────────────────── members ─────────────────────────

export async function setMemberStatus(id: string, status: "active" | "paused" | "pending"): Promise<AdminState> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: before } = await admin.from("profiles").select("status, email, first_name").eq("id", id).maybeSingle();
  if (!before) return { error: "לא מצאנו את המשתתפת." };
  const patch: { status: typeof status; approved_at?: string } = { status };
  if (status === "active" && before.status !== "active") patch.approved_at = new Date().toISOString();
  const { error } = await admin.from("profiles").update(patch).eq("id", id);
  if (error) return { error: "לא הצלחנו לעדכן." };
  if (status === "active" && before.status === "pending") {
    const built = approvedEmail(before.first_name, getSiteUrl());
    await sendEmail({ to: before.email, subject: built.subject, html: built.html });
  } else if (status === "paused" && before.status === "active") {
    const built = pausedEmail(before.first_name);
    await sendEmail({ to: before.email, subject: built.subject, html: built.html });
  }
  revalidateAdmin([`/admin/members/${id}`]);
  return { error: null, ok: status === "active" ? "אושרה ונשלח לה מייל." : status === "paused" ? "הושהתה." : "הוחזרה להמתנה." };
}

export async function updateMember(id: string, _prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const first_name = String(fd.get("first_name") ?? "").trim();
  const last_name = String(fd.get("last_name") ?? "").trim();
  const phone = String(fd.get("phone") ?? "").trim();
  const birth_month = Number(fd.get("birth_month") ?? 0) || null;
  const role = String(fd.get("role") ?? "member") === "admin" ? "admin" : "member";
  const over_30 = fd.get("over_30") === "on";
  const remind = fd.get("remind") === "on";
  if (!first_name) return { error: "שם פרטי חסר." };
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ first_name, last_name, phone, birth_month, role, over_30_confirmed: over_30, remind_birthday: remind }).eq("id", id);
  if (error) return { error: "לא הצלחנו לשמור." };
  revalidateAdmin([`/admin/members/${id}`]);
  return { error: null, ok: "נשמר." };
}

export async function inviteMember(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const first_name = String(fd.get("first_name") ?? "").trim();
  const last_name = String(fd.get("last_name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const phone = String(fd.get("phone") ?? "").trim();
  const birth_month = Number(fd.get("birth_month") ?? 0) || null;
  if (!first_name || !last_name) return { error: "שם פרטי ושם משפחה." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "כתובת המייל לא תקינה." };
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { first_name, last_name, phone, birth_month, over_30: true, terms: false },
    redirectTo: `${getSiteUrl()}/welcome`,
  });
  if (error) return { error: error.code === "email_exists" ? "כבר יש משתתפת עם המייל הזה." : `לא הצלחנו להזמין: ${error.message}` };
  if (data.user) {
    await admin.from("profiles").update({ status: "active", approved_at: new Date().toISOString(), first_name, last_name, phone, birth_month }).eq("id", data.user.id);
  }
  revalidateAdmin();
  redirect("/admin?invited=1");
}

export async function deleteMember(id: string): Promise<AdminState> {
  const { userId } = await requireAdmin();
  if (id === userId) return { error: "אי אפשר למחוק את עצמך." };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: "לא הצלחנו למחוק." };
  revalidateAdmin();
  redirect("/admin");
}

// ───────────────────────── forum ─────────────────────────

export async function setSectionVisible(id: string, visible: boolean): Promise<AdminState> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("forum_sections").update({ visible }).eq("id", id);
  if (error) return { error: "לא הצלחנו לשמור." };
  revalidateAdmin(["/forum", "/home"]);
  return { error: null };
}

export async function addSection(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const name = String(fd.get("name") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  if (!name) return { error: "שם המדור חסר." };
  const key = "s" + Date.now().toString(36);
  const admin = createAdminClient();
  const { count } = await admin.from("forum_sections").select("id", { count: "exact", head: true });
  const { error } = await admin.from("forum_sections").insert({ key, name, description, sort_order: (count ?? 0) + 1, icon: "M4 6h16M4 12h16M4 18h10", color: "#4A1942", tint: "#F1E2EE" });
  if (error) return { error: "לא הצלחנו להוסיף." };
  revalidateAdmin(["/forum", "/home"]);
  return { error: null, ok: "המדור נוסף." };
}

export async function setPost(id: string, patch: { status?: "published" | "hidden" | "pending"; pinned?: boolean }): Promise<AdminState> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("posts").update(patch).eq("id", id);
  if (error) return { error: "לא הצלחנו לעדכן." };
  revalidateAdmin(["/forum"]);
  return { error: null };
}

// ───────────────────────── millionaire ─────────────────────────

export async function scheduleProposal(id: string, _prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: p } = await admin.from("hosting_proposals").select("*").eq("id", id).maybeSingle();
  if (!p) return { error: "ההצעה לא נמצאה." };
  const event_date = String(fd.get("event_date") ?? "") || null;
  const start_time = String(fd.get("start_time") ?? "") || null;
  const end_time = String(fd.get("end_time") ?? "") || null;
  const location = String(fd.get("location") ?? "").trim();
  const title = String(fd.get("title") ?? "").trim() || p.title;
  const capacity = Number(fd.get("capacity") ?? 0) || null;
  const price_ils = Number(fd.get("price_ils") ?? 0) || 0;
  if (!event_date) return { error: "בחרי תאריך." };
  const { data: ev, error } = await admin
    .from("events")
    .insert({ type: "millionaire", title, description: p.description, event_date, start_time, end_time, location, capacity, price_ils, kind: p.kind, host_name: p.display_name, host_user_id: p.user_id, published: true })
    .select("id")
    .single();
  if (error) return { error: "לא הצלחנו ליצור את המפגש." };
  await admin.from("hosting_proposals").update({ status: "scheduled", event_id: ev.id }).eq("id", id);
  revalidateAdmin(["/millionaire", "/home"]);
  return { error: null, ok: "נקבע מועד והמפגש פורסם." };
}

export async function setProposalStatus(id: string, status: "new" | "declined"): Promise<AdminState> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("hosting_proposals").update({ status }).eq("id", id);
  if (error) return { error: "לא הצלחנו לעדכן." };
  revalidateAdmin();
  return { error: null };
}

// ───────────────────────── events (general + millionaire + birthday) ─────────────────────────

export async function saveEvent(id: string | null, _prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const type = String(fd.get("type") ?? "general");
  if (!["general", "millionaire", "birthday"].includes(type)) return { error: "סוג מפגש לא תקין." };
  const title = String(fd.get("title") ?? "").trim();
  if (!title) return { error: "שם המפגש חסר." };
  const patch = {
    type: type as "general" | "millionaire" | "birthday",
    title,
    description: String(fd.get("description") ?? "").trim(),
    event_date: String(fd.get("event_date") ?? "") || null,
    start_time: String(fd.get("start_time") ?? "") || null,
    end_time: String(fd.get("end_time") ?? "") || null,
    location: String(fd.get("location") ?? "").trim(),
    price_ils: Number(fd.get("price_ils") ?? 0) || 0,
    capacity: Number(fd.get("capacity") ?? 0) || null,
    topic: String(fd.get("topic") ?? "").trim(),
    host_name: String(fd.get("host_name") ?? "").trim(),
    published: fd.get("published") === "on",
    hebrew_month: Number(fd.get("hebrew_month") ?? 0) || null,
    hebrew_year: Number(fd.get("hebrew_year") ?? 0) || null,
  };
  if (patch.type === "birthday" && !patch.hebrew_month) return { error: "למסיבת יומולדת צריך חודש עברי." };
  if (patch.type === "birthday" && !patch.hebrew_year) patch.hebrew_year = hebrewToday().year;

  const admin = createAdminClient();
  let eventId = id;
  if (eventId) {
    const { error } = await admin.from("events").update(patch).eq("id", eventId);
    if (error) return { error: error.message.includes("events_birthday_month_idx") ? "כבר יש מסיבה לחודש הזה." : "לא הצלחנו לשמור." };
  } else {
    const { data, error } = await admin.from("events").insert(patch).select("id").single();
    if (error) return { error: error.message.includes("events_birthday_month_idx") ? "כבר יש מסיבה לחודש הזה." : "לא הצלחנו ליצור." };
    eventId = data.id;
  }
  if (fd.has("agenda")) {
    const items = parseAgenda(String(fd.get("agenda") ?? ""));
    await admin.from("event_agenda").delete().eq("event_id", eventId);
    if (items.length) await admin.from("event_agenda").insert(items.map((it) => ({ ...it, event_id: eventId! })));
  }
  revalidateAdmin(["/home", "/millionaire", "/birthday", `/admin/events/${eventId}`]);
  if (!id) redirect(type === "birthday" ? "/admin/birthday" : `/admin/events/${eventId}`);
  return { error: null, ok: "נשמר." };
}

export async function deleteEvent(id: string): Promise<AdminState> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("events").delete().eq("id", id);
  if (error) return { error: "לא הצלחנו למחוק." };
  revalidateAdmin(["/home", "/millionaire", "/birthday"]);
  redirect("/admin/events");
}

export async function removeRegistration(eventId: string, userId: string): Promise<AdminState> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("registrations").delete().eq("event_id", eventId).eq("user_id", userId);
  if (error) return { error: "לא הצלחנו להסיר." };
  revalidateAdmin([`/admin/events/${eventId}`]);
  return { error: null };
}

// ───────────────────────── site content ─────────────────────────

/** Saves one group of the content registry: changed values are stored, "reset" boxes delete the override. */
export async function saveContentGroup(groupKey: string, _prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const group = CONTENT_GROUPS.find((g) => g.key === groupKey);
  if (!group) return { error: "קבוצה לא מוכרת." };
  const admin = createAdminClient();
  const upserts: { key: string; value: string; updated_at: string }[] = [];
  const deletes: string[] = [];
  for (const f of group.fields) {
    if (fd.get(`reset:${f.key}`) === "on") {
      deletes.push(f.key);
      continue;
    }
    const raw = fd.get(`v:${f.key}`);
    if (raw === null) continue;
    let value = String(raw).split(String.fromCharCode(13)).join("");
    if (f.kind === "rich") value = sanitizeRich(value);
    else value = value.trim();
    if (value === "" || value === f.default) deletes.push(f.key);
    else upserts.push({ key: f.key, value, updated_at: new Date().toISOString() });
  }
  if (deletes.length) await admin.from("site_content").delete().in("key", deletes);
  if (upserts.length) {
    const { error } = await admin.from("site_content").upsert(upserts);
    if (error) return { error: "לא הצלחנו לשמור." };
  }
  revalidatePath("/", "layout");
  return { error: null, ok: "נשמר. השינויים כבר באתר." };
}
