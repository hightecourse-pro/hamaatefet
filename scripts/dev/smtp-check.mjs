// node scripts/dev/smtp-check.mjs – signs up a Resend test address on the env in .env.local, proves the verification mail is accepted by SMTP and the profile trigger fires, then deletes the user.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const email = `delivered+hm-${Date.now()}@resend.dev`;
const { data, error } = await anon.auth.signUp({ email, password: "Smtp-Test-2026!", options: { data: { first_name: "בדיקת", last_name: "מייל", phone: "050-0000000", birth_month: 2, over_30: true, terms: true } } });
console.log("signUp:", error ? `ERROR ${error.code ?? ""} ${error.message}` : `ok user=${data.user?.id} identities=${data.user?.identities?.length} confirmation_sent_at=${data.user?.confirmation_sent_at}`);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
if (data.user?.id) {
  const { data: p } = await admin.from("profiles").select("status, role, first_name, birth_month, over_30_confirmed, terms_accepted_at").eq("id", data.user.id).maybeSingle();
  console.log("profile row via trigger:", p);
  const { error: delErr } = await admin.auth.admin.deleteUser(data.user.id);
  console.log("cleanup:", delErr ? delErr.message : "deleted");
}
