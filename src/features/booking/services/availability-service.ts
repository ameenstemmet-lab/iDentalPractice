import type { DayAvailability, TimeSlot } from "../types";
import { toISODate } from "../utils/format";

/**
 * Mocked availability only — deterministic per (dentist, date, time) so the
 * same inputs always produce the same result across re-renders, without a
 * real backend. Replace with a real scheduling query in a later milestone.
 */

const CLINIC_OPEN_MINUTES = 9 * 60; // 09:00
const CLINIC_CLOSE_MINUTES = 17 * 60; // 17:00
const SLOT_STEP_MINUTES = 30;
const BOOKING_WINDOW_DAYS = 60;

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pseudoRandom(seed: string): number {
  let hashed = hashString(seed);
  // mulberry32
  let t = (hashed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Single source of truth for a day's slots — "fully booked" is derived from
 * this list (every slot unavailable), never computed independently, so the
 * two can never disagree.
 */
function generateDaySlots(dentistId: string, date: Date): TimeSlot[] {
  const iso = toISODate(date);
  // ~16% of days are fully booked; the rest vary in how busy they are.
  const dayBookedRatio = pseudoRandom(`${dentistId}:${iso}:ratio`);
  const forcedFull = dayBookedRatio > 0.84;

  const slots: TimeSlot[] = [];
  for (
    let minutes = CLINIC_OPEN_MINUTES;
    minutes < CLINIC_CLOSE_MINUTES;
    minutes += SLOT_STEP_MINUTES
  ) {
    const time = minutesToLabel(minutes);
    const available = !forcedFull && pseudoRandom(`${dentistId}:${iso}:${time}`) > 0.35;
    slots.push({ time, available });
  }
  return slots;
}

export function isPracticeClosed(date: Date): boolean {
  return date.getDay() === 0; // Sunday
}

export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function isDayFullyBooked(dentistId: string, date: Date): boolean {
  if (isPracticeClosed(date) || isPastDate(date)) return false;
  return generateDaySlots(dentistId, date).every((slot) => !slot.available);
}

export function getDayAvailability(dentistId: string, date: Date): DayAvailability {
  const closed = isPracticeClosed(date) || isPastDate(date);
  return {
    date: toISODate(date),
    closed,
    slots: closed ? [] : generateDaySlots(dentistId, date),
  };
}

/** Next date within the booking window that has at least one open slot. */
export function findNextAvailableDate(dentistId: string, fromDate: Date): Date | null {
  const cursor = new Date(fromDate);
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < BOOKING_WINDOW_DAYS; i++) {
    if (!isPracticeClosed(cursor) && !isPastDate(cursor) && !isDayFullyBooked(dentistId, cursor)) {
      return new Date(cursor);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
}

/** Same-shape as getDayAvailability, with simulated latency for a realistic loading state. */
export function fetchDayAvailability(dentistId: string, date: Date): Promise<DayAvailability> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(getDayAvailability(dentistId, date)), 400);
  });
}

export function getBookingWindowBounds(): { from: Date; to: Date } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + BOOKING_WINDOW_DAYS);
  return { from, to };
}
