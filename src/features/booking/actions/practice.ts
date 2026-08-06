"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface BookingPractice {
  id: string;
  timezone: string;
}

/**
 * TODO(auth): the public booking page has no way to know which practice
 * it's booking for without either a logged-in session or a practice
 * identifier in the URL (e.g. /book/[practiceSlug]) — neither exists yet.
 * This resolves the first practice in the database, correct only for a
 * single-practice deployment. Every booking action below takes this as
 * given rather than re-deriving it, so the eventual fix is localized here.
 */
export async function getCurrentBookingPractice(): Promise<BookingPractice | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("practices")
    .select("id, timezone")
    .limit(1)
    .maybeSingle<{ id: string; timezone: string }>();
  if (error) throw new Error(`getCurrentBookingPractice failed: ${error.message}`);
  return data;
}
