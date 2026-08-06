import type {
  BlockedPeriodRecord,
  BookedAppointment,
  BreakRecord,
  DayOfWeek,
  ISODate,
  TimeZone,
  WorkingHoursRecord,
} from "../types";

/**
 * The only boundary the engine/services depend on for reading scheduling
 * data. Production wires in `SupabaseSchedulingRepository`; tests wire in
 * an in-memory fake (see testing/in-memory-scheduling-repository.ts) —
 * neither the engine nor the services know or care which. This is also
 * the seam a future integration (e.g. blocked periods sourced from a
 * synced Google/Outlook calendar) would implement against, without
 * touching any scheduling logic.
 */
export interface SchedulingRepository {
  getWorkingHours(practitionerId: string, dayOfWeek: DayOfWeek): Promise<WorkingHoursRecord | null>;
  getBreaks(practitionerId: string, dayOfWeek: DayOfWeek): Promise<BreakRecord[]>;
  /** Blocked periods overlapping the given calendar date, in the given timezone. */
  getBlockedPeriods(practitionerId: string, date: ISODate, timezone: TimeZone): Promise<BlockedPeriodRecord[]>;
  /** Non-cancelled appointments for the practitioner on the given calendar date. */
  getBookedAppointments(practitionerId: string, date: ISODate, timezone: TimeZone): Promise<BookedAppointment[]>;
}
