/**
 * Pure time/interval arithmetic. No Supabase, no React, no implicit
 * `Date.now()` — every function is a straight input -> output mapping.
 *
 * Two timezone-sensitive primitives, deliberately narrow:
 * - `windowToInterval` — local wall-clock (TimeWindow) + calendar date +
 *   IANA zone -> an absolute Interval. Uses `fromZonedTime`, which is not
 *   sensitive to the runtime's own system timezone.
 * - `localDateString` — an absolute instant + IANA zone -> the calendar
 *   date it falls on in that zone. Uses `formatInTimeZone`, same guarantee.
 *
 * Deliberately NOT used: `toZonedTime` + native `Date` getters. That
 * combination's behavior depends on the *runtime's* system timezone, which
 * is exactly the class of bug that shipped once already in this codebase
 * (see the booking module's original `toISODate`). Every other date
 * comparison in this module operates on two real instants directly
 * (`<`/`>`), which is always correct regardless of timezone.
 */
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import type { DayOfWeek, ISODate, Interval, TimeString, TimeWindow, TimeZone } from "../types";

const TIME_STRING_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function timeStringToMinutes(time: TimeString): number {
  const match = TIME_STRING_PATTERN.exec(time);
  if (!match) {
    throw new Error(`Invalid time string: "${time}" (expected HH:mm)`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToTimeString(minutes: number): TimeString {
  if (minutes < 0 || minutes >= 24 * 60) {
    throw new Error(`Minutes out of range for a single day: ${minutes}`);
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** End time = start + duration, both as wall-clock time strings. */
export function calculateEndTime(start: TimeString, durationMinutes: number): TimeString {
  if (durationMinutes <= 0) {
    throw new Error(`durationMinutes must be positive, got ${durationMinutes}`);
  }
  return minutesToTimeString(timeStringToMinutes(start) + durationMinutes);
}

/** Duration in minutes between two wall-clock time strings on the same day. */
export function calculateAppointmentDuration(start: TimeString, end: TimeString): number {
  const duration = timeStringToMinutes(end) - timeStringToMinutes(start);
  if (duration <= 0) {
    throw new Error(`end (${end}) must be after start (${start})`);
  }
  return duration;
}

/** Converts a local wall-clock window on a specific calendar date to an absolute Interval. */
export function windowToInterval(window: TimeWindow, date: ISODate, timezone: TimeZone): Interval {
  return {
    start: fromZonedTime(`${date}T${minutesToTimeString(window.startMinutes)}:00`, timezone),
    end: fromZonedTime(`${date}T${minutesToTimeString(window.endMinutes)}:00`, timezone),
  };
}

/** The full [00:00, 24:00) span of a calendar date, as an absolute Interval — for range-scoped lookups. */
export function dayBounds(date: ISODate, timezone: TimeZone): Interval {
  return {
    start: fromZonedTime(`${date}T00:00:00`, timezone),
    end: fromZonedTime(`${addDaysToISODate(date, 1)}T00:00:00`, timezone),
  };
}

/** The calendar date (yyyy-mm-dd) that an absolute instant falls on, in the given zone. */
export function localDateString(instant: Date, timezone: TimeZone): ISODate {
  return formatInTimeZone(instant, timezone, "yyyy-MM-dd");
}

/** The wall-clock time (HH:mm) an absolute instant represents, in the given zone. */
export function localTimeString(instant: Date, timezone: TimeZone): TimeString {
  return formatInTimeZone(instant, timezone, "HH:mm");
}

/** Half-open interval overlap: [a.start, a.end) intersects [b.start, b.end). */
export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

export function isInstantWithin(instant: Date, interval: Interval): boolean {
  return instant >= interval.start && instant < interval.end;
}

/**
 * Pure calendar arithmetic (yyyy-mm-dd, no time-of-day) — deliberately
 * timezone-independent. "The day after 2026-08-06" doesn't depend on
 * anyone's clock, so this never touches date-fns-tz.
 */
export function addDaysToISODate(date: ISODate, days: number): ISODate {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(
    shifted.getUTCDate()
  ).padStart(2, "0")}`;
}

/** Day of week (0=Sunday..6=Saturday) for a calendar date — timezone-independent, see addDaysToISODate. */
export function getDayOfWeek(date: ISODate): DayOfWeek {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() as DayOfWeek;
}
