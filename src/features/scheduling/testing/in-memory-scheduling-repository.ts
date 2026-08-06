import type {
  BlockedPeriodRecord,
  BookedAppointment,
  BreakRecord,
  DayOfWeek,
  ISODate,
  TimeZone,
  WorkingHoursRecord,
} from "../types";
import type { SchedulingRepository } from "../repository/scheduling-repository";
import { dayBounds } from "../utils/time-math";

/**
 * In-memory SchedulingRepository for unit/integration tests — no mocking
 * framework, no network, no database. Seed it with plain data and it
 * behaves exactly like the Supabase implementation from the services'
 * point of view.
 */
export class InMemorySchedulingRepository implements SchedulingRepository {
  constructor(
    private readonly seed: {
      workingHours?: WorkingHoursRecord[];
      breaks?: BreakRecord[];
      blockedPeriods?: BlockedPeriodRecord[];
      appointments?: BookedAppointment[];
    } = {}
  ) {}

  async getWorkingHours(dentistId: string, dayOfWeek: DayOfWeek): Promise<WorkingHoursRecord | null> {
    return (
      this.seed.workingHours?.find((w) => w.dentistId === dentistId && w.dayOfWeek === dayOfWeek) ?? null
    );
  }

  async getBreaks(dentistId: string, dayOfWeek: DayOfWeek): Promise<BreakRecord[]> {
    return (this.seed.breaks ?? []).filter((b) => b.dentistId === dentistId && b.dayOfWeek === dayOfWeek);
  }

  async getBlockedPeriods(
    dentistId: string,
    date: ISODate,
    timezone: TimeZone
  ): Promise<BlockedPeriodRecord[]> {
    const { start, end } = dayBounds(date, timezone);
    return (this.seed.blockedPeriods ?? []).filter(
      (b) => b.dentistId === dentistId && b.interval.start < end && b.interval.end > start
    );
  }

  async getBookedAppointments(
    dentistId: string,
    date: ISODate,
    timezone: TimeZone
  ): Promise<BookedAppointment[]> {
    const { start, end } = dayBounds(date, timezone);
    return (this.seed.appointments ?? []).filter(
      (a) => a.dentistId === dentistId && a.interval.start < end && a.interval.end > start
    );
  }
}
