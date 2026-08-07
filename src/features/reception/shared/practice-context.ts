"use server";

import { createAdminClient } from "./supabase-admin";
import { getCurrentSession, type StaffRole } from "@/lib/auth/session";

export interface CurrentPractice {
  id: string;
  practiceName: string;
  timezone: string;
  userEmail: string;
  role: StaffRole;
  practitionerId: string | null;
}

/**
 * Resolves the signed-in staff/practitioner's practice from their session
 * (see src/lib/auth/session.ts) — practiceId comes from the JWT's
 * app_metadata, never from a client-supplied value, so a session can never
 * read another practice's data. Returns null when not signed in; the
 * dashboard layout's redirect (backed by middleware) is what actually
 * enforces that this is never reached unauthenticated.
 */
export async function getCurrentPractice(): Promise<CurrentPractice | null> {
  const session = await getCurrentSession();
  if (!session) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("practices")
    .select("id, practice_name, timezone")
    .eq("id", session.practiceId)
    .maybeSingle<{ id: string; practice_name: string; timezone: string }>();

  if (error) throw new Error(`getCurrentPractice failed: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    practiceName: data.practice_name,
    timezone: data.timezone,
    userEmail: session.email,
    role: session.role,
    practitionerId: session.practitionerId,
  };
}
