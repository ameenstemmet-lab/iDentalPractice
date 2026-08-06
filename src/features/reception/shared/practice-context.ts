"use server";

import { createAdminClient } from "./supabase-admin";

export interface CurrentPractice {
  id: string;
  practiceName: string;
  timezone: string;
}

/**
 * TODO(auth): resolves the *first* practice in the database — correct for
 * a single-practice deployment, not for real multi-tenant use. Replace
 * with session-derived practice resolution once login exists; every
 * caller already treats this as "the current practice," so the swap is
 * localized to this one function.
 */
export async function getCurrentPractice(): Promise<CurrentPractice | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("practices")
    .select("id, practice_name, timezone")
    .limit(1)
    .maybeSingle<{ id: string; practice_name: string; timezone: string }>();

  if (error) throw new Error(`getCurrentPractice failed: ${error.message}`);
  if (!data) return null;

  return { id: data.id, practiceName: data.practice_name, timezone: data.timezone };
}
