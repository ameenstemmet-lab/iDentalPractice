"use server";

import { createAdminClient } from "../shared/supabase-admin";
import type { PracticeSettings, PracticeSettingsInput } from "./types";

interface PracticeRow {
  id: string;
  practice_name: string;
  registration_number: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  logo_url: string | null;
  timezone: string;
}

const SELECT =
  "id, practice_name, registration_number, email, phone, address, city, province, postal_code, logo_url, timezone";

function toSettings(row: PracticeRow): PracticeSettings {
  return {
    id: row.id,
    practiceName: row.practice_name,
    registrationNumber: row.registration_number,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    logoUrl: row.logo_url,
    timezone: row.timezone,
  };
}

export async function getPracticeSettings(practiceId: string): Promise<PracticeSettings | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("practices").select(SELECT).eq("id", practiceId).maybeSingle<PracticeRow>();
  if (error) throw new Error(`getPracticeSettings failed: ${error.message}`);
  return data ? toSettings(data) : null;
}

export async function updatePracticeSettings(practiceId: string, input: PracticeSettingsInput): Promise<PracticeSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("practices")
    .update({
      practice_name: input.practiceName,
      registration_number: input.registrationNumber || null,
      email: input.email,
      phone: input.phone || null,
      address: input.address || null,
      city: input.city || null,
      province: input.province || null,
      postal_code: input.postalCode || null,
      logo_url: input.logoUrl || null,
      timezone: input.timezone,
    })
    .eq("id", practiceId)
    .select(SELECT)
    .single<PracticeRow>();
  if (error) throw new Error(`updatePracticeSettings failed: ${error.message}`);
  return toSettings(data);
}
