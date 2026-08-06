"use server";

import { createAdminClient } from "../shared/supabase-admin";
import type { Practitioner, PractitionerInput } from "./types";

interface PractitionerRow {
  id: string;
  practice_id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  profession: string;
  email: string | null;
  cellphone: string | null;
  colour_code: string;
  consultation_duration: number;
  active: boolean;
}

function toPractitioner(row: PractitionerRow): Practitioner {
  return {
    id: row.id,
    practiceId: row.practice_id,
    firstName: row.first_name,
    lastName: row.last_name,
    title: row.title,
    profession: row.profession,
    email: row.email,
    cellphone: row.cellphone,
    colourCode: row.colour_code,
    consultationDuration: row.consultation_duration,
    active: row.active,
  };
}

const SELECT =
  "id, practice_id, first_name, last_name, title, profession, email, cellphone, colour_code, consultation_duration, active";

export async function listPractitioners(practiceId: string, includeArchived = false): Promise<Practitioner[]> {
  const supabase = createAdminClient();
  let query = supabase.from("practitioners").select(SELECT).eq("practice_id", practiceId).order("first_name");
  if (!includeArchived) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(`listPractitioners failed: ${error.message}`);
  return (data as PractitionerRow[] | null ?? []).map(toPractitioner);
}

export async function getPractitioner(practitionerId: string): Promise<Practitioner | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("practitioners").select(SELECT).eq("id", practitionerId).maybeSingle<PractitionerRow>();
  if (error) throw new Error(`getPractitioner failed: ${error.message}`);
  return data ? toPractitioner(data) : null;
}

export async function createPractitioner(practiceId: string, input: PractitionerInput): Promise<Practitioner> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("practitioners")
    .insert({
      practice_id: practiceId,
      first_name: input.firstName,
      last_name: input.lastName,
      title: input.title || null,
      profession: input.profession,
      email: input.email || null,
      cellphone: input.cellphone || null,
      colour_code: input.colourCode,
      consultation_duration: input.consultationDuration,
    })
    .select(SELECT)
    .single<PractitionerRow>();
  if (error) throw new Error(`createPractitioner failed: ${error.message}`);
  return toPractitioner(data);
}

export async function updatePractitioner(practitionerId: string, input: PractitionerInput): Promise<Practitioner> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("practitioners")
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      title: input.title || null,
      profession: input.profession,
      email: input.email || null,
      cellphone: input.cellphone || null,
      colour_code: input.colourCode,
      consultation_duration: input.consultationDuration,
    })
    .eq("id", practitionerId)
    .select(SELECT)
    .single<PractitionerRow>();
  if (error) throw new Error(`updatePractitioner failed: ${error.message}`);
  return toPractitioner(data);
}

export async function setPractitionerArchived(practitionerId: string, archived: boolean): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("practitioners").update({ active: !archived }).eq("id", practitionerId);
  if (error) throw new Error(`setPractitionerArchived failed: ${error.message}`);
}

/** Distinct professions already in use at this practice — feeds the "Add practitioner" autocomplete, but never restricts input to only these. */
export async function listProfessions(practiceId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("practitioners").select("profession").eq("practice_id", practiceId);
  if (error) throw new Error(`listProfessions failed: ${error.message}`);
  const unique = new Set((data as Array<{ profession: string }> | null ?? []).map((row) => row.profession));
  return Array.from(unique).sort();
}

export async function listTreatmentIdsForPractitioner(practitionerId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("practitioner_treatments")
    .select("treatment_id")
    .eq("practitioner_id", practitionerId);
  if (error) throw new Error(`listTreatmentIdsForPractitioner failed: ${error.message}`);
  return (data as Array<{ treatment_id: string }> | null ?? []).map((row) => row.treatment_id);
}

/** Replaces the full set of treatments this practitioner offers with exactly `treatmentIds`. */
export async function setPractitionerTreatments(
  practiceId: string,
  practitionerId: string,
  treatmentIds: string[]
): Promise<void> {
  const supabase = createAdminClient();

  const { error: deleteError } = await supabase
    .from("practitioner_treatments")
    .delete()
    .eq("practitioner_id", practitionerId);
  if (deleteError) throw new Error(`setPractitionerTreatments delete failed: ${deleteError.message}`);

  if (treatmentIds.length === 0) return;

  const { error: insertError } = await supabase.from("practitioner_treatments").insert(
    treatmentIds.map((treatmentId) => ({
      practice_id: practiceId,
      practitioner_id: practitionerId,
      treatment_id: treatmentId,
    }))
  );
  if (insertError) throw new Error(`setPractitionerTreatments insert failed: ${insertError.message}`);
}
