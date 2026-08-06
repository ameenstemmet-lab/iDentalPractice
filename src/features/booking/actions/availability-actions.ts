"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AvailabilityService, SupabaseSchedulingRepository } from "@/features/scheduling";
import type { DayAvailability } from "../types";

function buildAvailabilityService() {
  const supabase = createSupabaseAdminClient();
  const repository = new SupabaseSchedulingRepository(supabase);
  return new AvailabilityService(repository);
}

/** Which days of the week (0=Sunday..6=Saturday) this practitioner works at all — for the calendar's disabled-day rendering. */
export async function getWorkingDaysOfWeekAction(practitionerId: string): Promise<number[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("practitioner_working_hours")
    .select("day_of_week")
    .eq("practitioner_id", practitionerId)
    .eq("is_working", true);
  if (error) throw new Error(`getWorkingDaysOfWeekAction failed: ${error.message}`);
  return ((data ?? []) as unknown as Array<{ day_of_week: number }>).map((r) => r.day_of_week);
}

export interface DateAvailabilitySummary {
  closed: boolean;
  fullyBooked: boolean;
}

/** Used when the user taps a calendar date — is it open, and if so, is every slot already taken? */
export async function checkDateAvailabilityAction(
  practitionerId: string,
  date: string,
  timezone: string,
  durationMinutes: number
): Promise<DateAvailabilitySummary> {
  const service = buildAvailabilityService();
  const day = await service.getDayAvailability({ practitionerId, date, timezone, durationMinutes });
  return {
    closed: !day.isWorkingDay,
    fullyBooked: day.isWorkingDay && day.slots.length > 0 && day.slots.every((s) => !s.available),
  };
}

/** The full slot grid for the Choose a Time step. */
export async function getTimeSlotsAction(
  practitionerId: string,
  date: string,
  timezone: string,
  durationMinutes: number
): Promise<DayAvailability> {
  const service = buildAvailabilityService();
  const day = await service.getDayAvailability({ practitionerId, date, timezone, durationMinutes });
  return {
    date: day.date,
    closed: !day.isWorkingDay,
    slots: day.slots.map((s) => ({ time: s.time, available: s.available })),
  };
}

/** Fully-booked/closed lookup for every date in the visible booking window — powers the calendar's disabled/"full" styling without a round trip per cell. */
export async function getRangeAvailabilityAction(
  practitionerId: string,
  fromDate: string,
  days: number,
  timezone: string,
  durationMinutes: number
): Promise<DayAvailability[]> {
  const service = buildAvailabilityService();
  const range = await service.getRangeAvailability({ practitionerId, fromDate, days, timezone, durationMinutes });
  return range.map((day) => ({
    date: day.date,
    closed: !day.isWorkingDay,
    slots: day.slots.map((s) => ({ time: s.time, available: s.available })),
  }));
}

export interface NextAvailable {
  date: string;
  time: string;
}

export async function findNextAvailableAction(
  practitionerId: string,
  fromDate: string,
  timezone: string,
  durationMinutes: number
): Promise<NextAvailable | null> {
  const service = buildAvailabilityService();
  const result = await service.findNextAvailable({ practitionerId, fromDate, timezone, durationMinutes });
  return result ? { date: result.date, time: result.time } : null;
}
