import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  BlockedPeriodRecord,
  BookedAppointment,
  BreakRecord,
  DayOfWeek,
  ISODate,
  TimeZone,
  WorkingHoursRecord,
} from "../types";
import type { SchedulingRepository } from "./scheduling-repository";
import type {
  AppointmentRow,
  BlockedPeriodRow,
  PractitionerBreakRow,
  PractitionerWorkingHoursRow,
} from "./database-types";
import { dayBounds, windowToInterval } from "../utils/time-math";

/** Postgres `time` comes back as "HH:mm:ss" (or "HH:mm") — normalize to "HH:mm". */
function toTimeString(pgTime: string): string {
  return pgTime.slice(0, 5);
}

function toMinutes(pgTime: string): number {
  const [h, m] = toTimeString(pgTime).split(":").map(Number);
  return h * 60 + m;
}

/**
 * Production implementation of SchedulingRepository. Every query is scoped
 * to a single practitioner and, where relevant, a single calendar day — matching
 * the indexes created in supabase/migrations/20260806100007_create_scheduling_tables.sql
 * (practitioner_id, day_of_week) and (practitioner_id, appointment_date). Tenant
 * isolation is enforced by Postgres RLS on the passed-in client, not by
 * this class — it never filters on practice_id itself.
 */
export class SupabaseSchedulingRepository implements SchedulingRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getWorkingHours(practitionerId: string, dayOfWeek: DayOfWeek): Promise<WorkingHoursRecord | null> {
    const { data, error } = await this.client
      .from("practitioner_working_hours")
      .select("practitioner_id, day_of_week, start_time, end_time, is_working")
      .eq("practitioner_id", practitionerId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle<PractitionerWorkingHoursRow>();

    if (error) throw new Error(`getWorkingHours failed: ${error.message}`);
    if (!data) return null;

    return {
      practitionerId: data.practitioner_id,
      dayOfWeek: data.day_of_week as DayOfWeek,
      isWorking: data.is_working,
      window:
        data.is_working && data.start_time && data.end_time
          ? { startMinutes: toMinutes(data.start_time), endMinutes: toMinutes(data.end_time) }
          : null,
    };
  }

  async getBreaks(practitionerId: string, dayOfWeek: DayOfWeek): Promise<BreakRecord[]> {
    const { data, error } = await this.client
      .from("practitioner_breaks")
      .select("practitioner_id, day_of_week, start_time, end_time, description")
      .eq("practitioner_id", practitionerId)
      .eq("day_of_week", dayOfWeek);

    if (error) throw new Error(`getBreaks failed: ${error.message}`);

    return (data as PractitionerBreakRow[] | null ?? []).map((row) => ({
      practitionerId: row.practitioner_id,
      dayOfWeek: row.day_of_week as DayOfWeek,
      window: { startMinutes: toMinutes(row.start_time), endMinutes: toMinutes(row.end_time) },
      description: row.description ?? undefined,
    }));
  }

  async getBlockedPeriods(
    practitionerId: string,
    date: ISODate,
    timezone: TimeZone
  ): Promise<BlockedPeriodRecord[]> {
    const { start, end } = dayBounds(date, timezone);

    const { data, error } = await this.client
      .from("blocked_periods")
      .select("id, practitioner_id, starts_at, ends_at, reason")
      .eq("practitioner_id", practitionerId)
      .lt("starts_at", end.toISOString())
      .gt("ends_at", start.toISOString());

    if (error) throw new Error(`getBlockedPeriods failed: ${error.message}`);

    return (data as BlockedPeriodRow[] | null ?? []).map((row) => ({
      id: row.id,
      practitionerId: row.practitioner_id,
      interval: { start: new Date(row.starts_at), end: new Date(row.ends_at) },
      reason: row.reason ?? undefined,
    }));
  }

  async getBookedAppointments(
    practitionerId: string,
    date: ISODate,
    timezone: TimeZone
  ): Promise<BookedAppointment[]> {
    const { data, error } = await this.client
      .from("appointments")
      .select("id, practitioner_id, appointment_date, start_time, end_time, status")
      .eq("practitioner_id", practitionerId)
      .eq("appointment_date", date)
      .not("status", "in", "(cancelled,no_show)");

    if (error) throw new Error(`getBookedAppointments failed: ${error.message}`);

    return (data as AppointmentRow[] | null ?? []).map((row) => {
      const window = { startMinutes: toMinutes(row.start_time), endMinutes: toMinutes(row.end_time) };
      return {
        id: row.id,
        practitionerId: row.practitioner_id,
        status: row.status,
        interval: windowToInterval(window, row.appointment_date, timezone),
      };
    });
  }
}
