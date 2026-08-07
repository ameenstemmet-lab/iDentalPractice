import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Session-aware Supabase client for Server Components, Server Actions, and
 * Route Handlers — reads/writes the auth cookie, so `auth.getUser()` reflects
 * the actual signed-in user. Distinct from `createSupabaseAdminClient`
 * (service-role, no session, bypasses RLS) — this one is anon-key + session.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render, where cookies can't be
          // written — the middleware's session refresh covers this case.
        }
      },
    },
  });
}
