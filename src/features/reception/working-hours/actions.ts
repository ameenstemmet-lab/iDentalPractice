"use server";

import { createAdminClient } from "../shared/supabase-admin";
import type { AddBreakInput, PractitionerBreak, SaveWorkingDayInput, WorkingDay } from "./types";

interface WorkingHoursRow {
  day_of_week: number;
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
}

interface BreakRow {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  description: string | null;
}

function toTimeString(pgTime: string | null): string | null {
  return pgTime ? pgTime.slice(0, 5) : null;
}

export async function getWorkingHours(practitionerId: string): Promise<WorkingDay[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("practitioner_working_hours")
    .select("day_of_week, is_working, start_time, end_time")
    .eq("practitioner_id", practitionerId);
  if (error) throw new Error(`getWorkingHours failed: ${error.message}`);

  const byDay = new Map((data as WorkingHoursRow[] | null ?? []).map((r) => [r.day_of_week, r]));
  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const row = byDay.get(dayOfWeek);
    return {
      dayOfWeek,
      isWorking: row?.is_working ?? false,
      startTime: toTimeString(row?.start_time ?? null),
      endTime: toTimeString(row?.end_time ?? null),
    };
  });
}

export async function saveWorkingDay(input: SaveWorkingDayInput): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("practitioner_working_hours").upsert(
    {
      practitioner_id: input.practitionerId,
      practice_id: input.practiceId,
      day_of_week: input.dayOfWeek,
      is_working: input.isWorking,
      start_time: input.isWorking ? input.startTime : null,
      end_time: input.isWorking ? input.endTime : null,
    },
    { onConflict: "practitioner_id,day_of_week" }
  );
  if (error) throw new Error(`saveWorkingDay failed: ${error.message}`);
}

export async function getBreaks(practitionerId: string): Promise<PractitionerBreak[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("practitioner_breaks")
    .select("id, day_of_week, start_time, end_time, description")
    .eq("practitioner_id", practitionerId)
    .order("day_of_week");
  if (error) throw new Error(`getBreaks failed: ${error.message}`);
  return (data as BreakRow[] | null ?? []).map((row) => ({
    id: row.id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    description: row.description,
  }));
}

export async function addBreak(input: AddBreakInput): Promise<PractitionerBreak> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("practitioner_breaks")
    .insert({
      practitioner_id: input.practitionerId,
      practice_id: input.practiceId,
      day_of_week: input.dayOfWeek,
      start_time: input.startTime,
      end_time: input.endTime,
      description: input.description || null,
    })
    .select("id, day_of_week, start_time, end_time, description")
    .single<BreakRow>();
  if (error) throw new Error(`addBreak failed: ${error.message}`);
  return {
    id: data.id,
    dayOfWeek: data.day_of_week,
    startTime: data.start_time.slice(0, 5),
    endTime: data.end_time.slice(0, 5),
    description: data.description,
  };
}

export async function deleteBreak(breakId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("practitioner_breaks").delete().eq("id", breakId);
  if (error) throw new Error(`deleteBreak failed: ${error.message}`);
}
