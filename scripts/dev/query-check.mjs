// node scripts/dev/query-check.mjs – runs the admin forum page's joins with the service role and prints errors (debug helper).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const a = await admin.from("posts").select("id, title, created_at, status, pinned, forum_sections(name), profiles!posts_author_id_fkey(first_name, last_name)").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(5);
console.log("posts:", a.error ?? a.data.map((p) => p.title));
const b = await admin.from("comments").select("id, body, created_at, post_id, profiles(first_name, last_name), posts(title)").limit(3);
console.log("comments:", b.error ?? b.data.length);
