"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface BookingPractice {
  id: string;
  practiceName: string;
  timezone: string;
}

/** Resolves the practice a public /book/[practiceSlug] page belongs to — deliberately unauthenticated, patients never log in. */
export async function getBookingPracticeBySlug(slug: string): Promise<BookingPractice | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("practices")
    .select("id, practice_name, timezone")
    .eq("slug", slug)
    .maybeSingle<{ id: string; practice_name: string; timezone: string }>();
  if (error) throw new Error(`getBookingPracticeBySlug failed: ${error.message}`);
  if (!data) return null;
  return { id: data.id, practiceName: data.practice_name, timezone: data.timezone };
}

/** Re-fetches practice details (timezone, name) once practiceId is already known — used by submitBookingAction. */
export async function getBookingPracticeById(practiceId: string): Promise<BookingPractice | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("practices")
    .select("id, practice_name, timezone")
    .eq("id", practiceId)
    .maybeSingle<{ id: string; practice_name: string; timezone: string }>();
  if (error) throw new Error(`getBookingPracticeById failed: ${error.message}`);
  if (!data) return null;
  return { id: data.id, practiceName: data.practice_name, timezone: data.timezone };
}

export interface FeaturedBookingPractice extends BookingPractice {
  slug: string;
}

/**
 * Used only by the platform's own marketing homepage and the legacy
 * /booking redirect, both of which have no specific-tenant context to key
 * off of — not a real multi-tenant practice-resolution point, so "the
 * first practice" is an acceptable, deliberate choice here (unlike the
 * old TODO(auth) placeholders it replaced elsewhere in the codebase).
 */
export async function getFeaturedBookingPractice(): Promise<FeaturedBookingPractice | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("practices")
    .select("id, practice_name, timezone, slug")
    .limit(1)
    .maybeSingle<{ id: string; practice_name: string; timezone: string; slug: string }>();
  if (error) throw new Error(`getFeaturedBookingPractice failed: ${error.message}`);
  if (!data) return null;
  return { id: data.id, practiceName: data.practice_name, timezone: data.timezone, slug: data.slug };
}
