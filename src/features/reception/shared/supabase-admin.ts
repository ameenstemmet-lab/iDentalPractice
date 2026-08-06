import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for the reception portal's server actions.
 *
 * TODO(auth): every read/write in this portal goes through this
 * RLS-bypassing client because there is no session to authenticate a
 * scoped client with yet. Once auth exists, this should be replaced with
 * a per-request client built from the caller's session, and RLS (already
 * written — see supabase/migrations) becomes the actual enforcement layer
 * instead of application code alone. Every query still filters by
 * practiceId explicitly in the meantime, so the switch is additive, not a
 * rewrite.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}
