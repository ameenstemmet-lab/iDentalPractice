import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client, shared across server-only code that has no
 * user session to build an RLS-scoped client from (there is no auth system
 * yet — see the TODO(auth) notes wherever this is used). Every query using
 * this client must filter by practice_id explicitly, since RLS is bypassed
 * entirely by the service role.
 */
export function createSupabaseAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}
