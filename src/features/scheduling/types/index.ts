/**
 * Canonical types for the scheduling engine.
 *
 * Two deliberately different shapes for "a period of time":
 * - `TimeWindow` — minutes-from-local-midnight. Used for recurring weekly
 *   patterns (working hours, breaks) that have no date attached.
 * - `Interval` — real absolute instants (`Date`). Used for anything that
 *   already has a specific date: appointments, blocked periods, and the
 *   generated slots themselves.
 *
 * The engine converts TimeWindow -> Interval for a specific calendar date
 * exactly once, in engine/slot-generator.ts. Everywhere else only compares
 * Interval to Interval, which sidesteps timezone bugs by construction.
 */

/** IANA timezone identifier, e.g. "Africa/Johannesburg". */
export type TimeZone = string;

/** yyyy-mm-dd, always interpreted as a calendar date in the practice's timezone. */
export type ISODate = string;

/** HH:mm (24h), always interpreted as local wall-clock time. */
export type TimeString = string;

export const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const;
/** 0 = Sunday .. 6 = Saturday, matching JS Date#getDay(). */
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

/** Minutes from local midnight (0–1440). */
export interface TimeWindow {
  startMinutes: number;
  endMinutes: number;
}

/** An absolute, timezone-unambiguous span of time. */
export interface Interval {
  start: Date;
  end: Date;
}

export interface WorkingHoursRecord {
  practitionerId: string;
  dayOfWeek: DayOfWeek;
  isWorking: boolean;
  /** Present iff isWorking is true. */
  window: TimeWindow | null;
}

export interface BreakRecord {
  practitionerId: string;
  dayOfWeek: DayOfWeek;
  window: TimeWindow;
  description?: string;
}

export interface BlockedPeriodRecord {
  id: string;
  practitionerId: string;
  interval: Interval;
  reason?: string;
}

export type AppointmentStatus =
  | "booked"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

/** The subset of an appointment the engine actually needs. */
export interface BookedAppointment {
  id: string;
  practitionerId: string;
  interval: Interval;
  status: AppointmentStatus;
}

export interface TimeSlot {
  /** Local wall-clock time the slot starts, "HH:mm". */
  time: TimeString;
  interval: Interval;
  available: boolean;
  /** Present when available is false, for observability/debugging — never shown to end users as-is. */
  unavailableReason?: SlotUnavailableReason;
}

export type SlotUnavailableReason =
  | "outside_working_hours"
  | "break"
  | "blocked_period"
  | "booked"
  | "past";

export interface DayAvailability {
  date: ISODate;
  /** False when the practitioner doesn't work this day at all (weekly off-day). */
  isWorkingDay: boolean;
  slots: TimeSlot[];
}

export interface NextAvailableResult {
  date: ISODate;
  time: TimeString;
  interval: Interval;
}

/** Everything the engine needs to compute one practitioner's availability for one day. */
export interface SchedulingContext {
  practitionerId: string;
  date: ISODate;
  timezone: TimeZone;
  /** Length of the treatment being booked. */
  durationMinutes: number;
  /** Grid step between candidate slot start times. Defaults to durationMinutes. */
  slotIntervalMinutes?: number;
  workingHours: WorkingHoursRecord | null;
  breaks: BreakRecord[];
  blockedPeriods: BlockedPeriodRecord[];
  bookedAppointments: BookedAppointment[];
  /** Injected for testability — never read from Date.now() inside the engine. */
  now: Date;
}

export interface ConflictCheckInput {
  practitionerId: string;
  interval: Interval;
  /** Excluded from the check — used when re-validating an existing appointment's own slot on reschedule. */
  excludeAppointmentId?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  reason?: SlotUnavailableReason;
  conflictingAppointmentId?: string;
}
