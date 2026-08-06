"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Practitioner, Treatment } from "../types";

interface PractitionerRow {
  id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  profession: string;
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

export async function getPractitionersAction(practiceId: string): Promise<Practitioner[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("practitioners")
    .select(
      "id, first_name, last_name, title, profession, qualification, special_interests, years_of_experience, consultation_duration"
    )
    .eq("practice_id", practiceId)
    .eq("active", true)
    .order("first_name");

  if (error) throw new Error(`getPractitionersAction failed: ${error.message}`);

  return ((data ?? []) as unknown as PractitionerRow[]).map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    title: row.title ?? "",
    profession: row.profession,
    qualification: row.qualification ?? "",
    specialInterests: row.special_interests ?? [],
    yearsOfExperience: row.years_of_experience ?? 0,
    avgConsultationDuration: row.consultation_duration,
  }));
}

/** Only the treatments this specific practitioner personally offers — see practitioner_treatments. */
export async function getTreatmentsAction(practiceId: string, practitionerId: string): Promise<Treatment[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("practitioner_treatments")
    .select("treatment_types!inner(id, treatment_name, description, duration_minutes, price, active)")
    .eq("practice_id", practiceId)
    .eq("practitioner_id", practitionerId)
    .eq("treatment_types.active", true);

  if (error) throw new Error(`getTreatmentsAction failed: ${error.message}`);

  const rows = ((data ?? []) as unknown as Array<{ treatment_types: TreatmentRow }>).map((r) => r.treatment_types);
  rows.sort((a, b) => a.treatment_name.localeCompare(b.treatment_name));

  return rows.map((row) => ({
    id: row.id,
    name: row.treatment_name,
    shortDescription: row.description ?? "",
    durationMinutes: row.duration_minutes,
    startingPrice: row.price,
  }));
}
