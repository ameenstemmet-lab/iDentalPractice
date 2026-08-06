/**
 * Single source of truth for "is this exact interval bookable." Both
 * slot-generator (grid candidates) and BookingRulesService (the final,
 * never-trust-the-client check before insert) call detectConflicts —
 * deliberately the same function, so the two can never disagree about
 * what "available" means.
 */
import type {
  BlockedPeriodRecord,
  BookedAppointment,
  BreakRecord,
  ConflictResult,
  ISODate,
  Interval,
  TimeZone,
  WorkingHoursRecord,
} from "../types";
import { intervalsOverlap, windowToInterval } from "../utils/time-math";

export interface ConflictContext {
  date: ISODate;
  timezone: TimeZone;
  workingHours: WorkingHoursRecord | null;
  breaks: BreakRecord[];
  blockedPeriods: BlockedPeriodRecord[];
  bookedAppointments: BookedAppointment[];
  now: Date;
  /** Excluded from the booked-appointment check — for re-validating an appointment's own current slot on reschedule. */
  excludeAppointmentId?: string;
}

/** Whether `appointment` occupies `interval` — cancelled/no-show appointments never block. */
export function overlapsAppointment(interval: Interval, appointment: BookedAppointment): boolean {
  if (appointment.status === "cancelled" || appointment.status === "no_show") {
    return false;
  }
  return intervalsOverlap(interval, appointment.interval);
}

function isFullyWithin(inner: Interval, outer: Interval): boolean {
  return inner.start >= outer.start && inner.end <= outer.end;
}

/**
 * Checks `interval` against every scheduling rule, in priority order, and
 * returns the first violation found. All five rules from the spec — past
 * time, working hours, breaks, blocked periods, existing bookings — are
 * evaluated here and nowhere else.
 */
export function detectConflicts(interval: Interval, context: ConflictContext): ConflictResult {
  if (interval.start < context.now) {
    return { hasConflict: true, reason: "past" };
  }

  if (!context.workingHours || !context.workingHours.isWorking || !context.workingHours.window) {
    return { hasConflict: true, reason: "outside_working_hours" };
  }

  const workingInterval = windowToInterval(context.workingHours.window, context.date, context.timezone);
  if (!isFullyWithin(interval, workingInterval)) {
    return { hasConflict: true, reason: "outside_working_hours" };
  }

  for (const brk of context.breaks) {
    const breakInterval = windowToInterval(brk.window, context.date, context.timezone);
    if (intervalsOverlap(interval, breakInterval)) {
      return { hasConflict: true, reason: "break" };
    }
  }

  for (const blocked of context.blockedPeriods) {
    if (intervalsOverlap(interval, blocked.interval)) {
      return { hasConflict: true, reason: "blocked_period" };
    }
  }

  for (const appointment of context.bookedAppointments) {
    if (appointment.id === context.excludeAppointmentId) continue;
    if (overlapsAppointment(interval, appointment)) {
      return { hasConflict: true, reason: "booked", conflictingAppointmentId: appointment.id };
    }
  }

  return { hasConflict: false };
}

export function isSlotAvailable(interval: Interval, context: ConflictContext): boolean {
  return !detectConflicts(interval, context).hasConflict;
}
