"use server";

import { createAdminClient } from "../shared/supabase-admin";
import type { Dentist, DentistInput } from "./types";

interface DentistRow {
  id: string;
  practice_id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  email: string | null;
  cellphone: string | null;
  colour_code: string;
  consultation_duration: number;
  active: boolean;
}

function toDentist(row: DentistRow): Dentist {
  return {
    id: row.id,
    practiceId: row.practice_id,
    firstName: row.first_name,
    lastName: row.last_name,
    title: row.title,
    email: row.email,
    cellphone: row.cellphone,
    colourCode: row.colour_code,
    consultationDuration: row.consultation_duration,
    active: row.active,
  };
}

const SELECT = "id, practice_id, first_name, last_name, title, email, cellphone, colour_code, consultation_duration, active";

export async function listDentists(practiceId: string, includeArchived = false): Promise<Dentist[]> {
  const supabase = createAdminClient();
  let query = supabase.from("dentists").select(SELECT).eq("practice_id", practiceId).order("first_name");
  if (!includeArchived) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(`listDentists failed: ${error.message}`);
  return (data as DentistRow[] | null ?? []).map(toDentist);
}

export async function getDentist(dentistId: string): Promise<Dentist | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("dentists").select(SELECT).eq("id", dentistId).maybeSingle<DentistRow>();
  if (error) throw new Error(`getDentist failed: ${error.message}`);
  return data ? toDentist(data) : null;
}

export async function createDentist(practiceId: string, input: DentistInput): Promise<Dentist> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dentists")
    .insert({
      practice_id: practiceId,
      first_name: input.firstName,
      last_name: input.lastName,
      title: input.title || null,
      email: input.email || null,
      cellphone: input.cellphone || null,
      colour_code: input.colourCode,
      consultation_duration: input.consultationDuration,
    })
    .select(SELECT)
    .single<DentistRow>();
  if (error) throw new Error(`createDentist failed: ${error.message}`);
  return toDentist(data);
}

export async function updateDentist(dentistId: string, input: DentistInput): Promise<Dentist> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dentists")
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      title: input.title || null,
      email: input.email || null,
      cellphone: input.cellphone || null,
      colour_code: input.colourCode,
      consultation_duration: input.consultationDuration,
    })
    .eq("id", dentistId)
    .select(SELECT)
    .single<DentistRow>();
  if (error) throw new Error(`updateDentist failed: ${error.message}`);
  return toDentist(data);
}

export async function setDentistArchived(dentistId: string, archived: boolean): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("dentists").update({ active: !archived }).eq("id", dentistId);
  if (error) throw new Error(`setDentistArchived failed: ${error.message}`);
}
