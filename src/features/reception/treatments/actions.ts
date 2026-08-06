"use server";

import { createAdminClient } from "../shared/supabase-admin";
import type { Treatment, TreatmentInput } from "./types";

interface TreatmentRow {
  id: string;
  practice_id: string;
  treatment_name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  colour: string;
  active: boolean;
}

function toTreatment(row: TreatmentRow): Treatment {
  return {
    id: row.id,
    practiceId: row.practice_id,
    treatmentName: row.treatment_name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    price: row.price,
    colour: row.colour,
    active: row.active,
  };
}

const SELECT = "id, practice_id, treatment_name, description, duration_minutes, price, colour, active";

export async function listTreatments(practiceId: string, includeInactive = false): Promise<Treatment[]> {
  const supabase = createAdminClient();
  let query = supabase.from("treatment_types").select(SELECT).eq("practice_id", practiceId).order("treatment_name");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(`listTreatments failed: ${error.message}`);
  return (data as TreatmentRow[] | null ?? []).map(toTreatment);
}

export async function createTreatment(practiceId: string, input: TreatmentInput): Promise<Treatment> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("treatment_types")
    .insert({
      practice_id: practiceId,
      treatment_name: input.treatmentName,
      description: input.description || null,
      duration_minutes: input.durationMinutes,
      price: input.price,
      colour: input.colour,
    })
    .select(SELECT)
    .single<TreatmentRow>();
  if (error) throw new Error(`createTreatment failed: ${error.message}`);
  return toTreatment(data);
}

export async function updateTreatment(treatmentId: string, input: TreatmentInput): Promise<Treatment> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("treatment_types")
    .update({
      treatment_name: input.treatmentName,
      description: input.description || null,
      duration_minutes: input.durationMinutes,
      price: input.price,
      colour: input.colour,
    })
    .eq("id", treatmentId)
    .select(SELECT)
    .single<TreatmentRow>();
  if (error) throw new Error(`updateTreatment failed: ${error.message}`);
  return toTreatment(data);
}

export async function setTreatmentActive(treatmentId: string, active: boolean): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("treatment_types").update({ active }).eq("id", treatmentId);
  if (error) throw new Error(`setTreatmentActive failed: ${error.message}`);
}
