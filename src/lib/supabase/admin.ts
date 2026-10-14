import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Service-role client – bypasses RLS. SERVER ONLY, after an explicit admin check. */
export function createAdminClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
