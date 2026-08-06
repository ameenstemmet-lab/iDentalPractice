"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Dentist, Treatment } from "../types";

interface DentistRow {
  id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  qualification: string | null;
  special_interests: string[];
  years_of_experience: number | null;
  consultation_duration: number;
}

interface TreatmentRow {
  id: string;
  treatment_name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
}

export async function getDentistsAction(practiceId: string): Promise<Dentist[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("dentists")
    .select("id, first_name, last_name, title, qualification, special_interests, years_of_experience, consultation_duration")
    .eq("practice_id", practiceId)
    .eq("active", true)
    .order("first_name");

  if (error) throw new Error(`getDentistsAction failed: ${error.message}`);

  return ((data ?? []) as unknown as DentistRow[]).map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    title: row.title ?? "Dr.",
    qualification: row.qualification ?? "",
    specialInterests: row.special_interests ?? [],
    yearsOfExperience: row.years_of_experience ?? 0,
    avgConsultationDuration: row.consultation_duration,
  }));
}

export async function getTreatmentsAction(practiceId: string): Promise<Treatment[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("treatment_types")
    .select("id, treatment_name, description, duration_minutes, price")
    .eq("practice_id", practiceId)
    .eq("active", true)
    .order("treatment_name");

  if (error) throw new Error(`getTreatmentsAction failed: ${error.message}`);

  return ((data ?? []) as unknown as TreatmentRow[]).map((row) => ({
    id: row.id,
    name: row.treatment_name,
    shortDescription: row.description ?? "",
    durationMinutes: row.duration_minutes,
    startingPrice: row.price,
  }));
}
