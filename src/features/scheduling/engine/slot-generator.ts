/**
 * Turns a dentist's working hours into a grid of candidate slots, then
 * asks conflict-detector whether each one is actually bookable. The grid
 * and the "is it free" check are deliberately separate concerns — this
 * file only decides *where* the candidates are; detectConflicts decides
 * whether each one survives.
 */
import type { DayAvailability, Interval, SchedulingContext, TimeSlot } from "../types";
import { detectConflicts, type ConflictContext } from "./conflict-detector";
import { localTimeString, windowToInterval } from "../utils/time-math";

const MS_PER_MINUTE = 60_000;

function toConflictContext(context: SchedulingContext): ConflictContext {
  return {
    date: context.date,
    timezone: context.timezone,
    workingHours: context.workingHours,
    breaks: context.breaks,
    blockedPeriods: context.blockedPeriods,
    bookedAppointments: context.bookedAppointments,
    now: context.now,
  };
}

/**
 * Generates every candidate slot for one dentist on one day, each
 * annotated with whether it's actually available. The grid steps by
 * `slotIntervalMinutes` (default: the treatment's own duration — matching
 * "08:00, 08:30, 09:00..." for a 30-minute treatment). A non-working day,
 * or a treatment longer than the entire working window, yields `[]`.
 */
export function generateDailySlots(context: SchedulingContext): TimeSlot[] {
  if (context.durationMinutes <= 0) {
    throw new Error(`durationMinutes must be positive, got ${context.durationMinutes}`);
  }

  const { workingHours, date, timezone, durationMinutes } = context;
  if (!workingHours || !workingHours.isWorking || !workingHours.window) {
    return [];
  }

  const stepMinutes = context.slotIntervalMinutes ?? durationMinutes;
  if (stepMinutes <= 0) {
    throw new Error(`slotIntervalMinutes must be positive, got ${stepMinutes}`);
  }

  const dayInterval = windowToInterval(workingHours.window, date, timezone);
  const conflictContext = toConflictContext(context);
  const slots: TimeSlot[] = [];

  for (
    let candidateStart = dayInterval.start;
    ;
    candidateStart = new Date(candidateStart.getTime() + stepMinutes * MS_PER_MINUTE)
  ) {
    const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * MS_PER_MINUTE);
    if (candidateEnd > dayInterval.end) break;

    const interval: Interval = { start: candidateStart, end: candidateEnd };
    const result = detectConflicts(interval, conflictContext);

    slots.push({
      time: localTimeString(candidateStart, timezone),
      interval,
      available: !result.hasConflict,
      unavailableReason: result.reason,
    });
  }

  return slots;
}

/** Batch form of generateDailySlots — one fully-prepared context per date. */
export function generateWeeklySlots(contexts: SchedulingContext[]): DayAvailability[] {
  return contexts.map((context) => ({
    date: context.date,
    isWorkingDay: Boolean(context.workingHours?.isWorking),
    slots: generateDailySlots(context),
  }));
}
