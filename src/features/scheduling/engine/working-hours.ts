import type { DayOfWeek, TimeWindow } from "../types";
import { timeStringToMinutes } from "../utils/time-math";

export interface WorkingHoursInput {
  dayOfWeek: number;
  isWorking: boolean;
  startTime?: string | null;
  endTime?: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a raw working-hours record (as it would arrive from a form or
 * an API payload) before it's persisted or converted into a TimeWindow.
 * Mirrors the DB check constraints in
 * supabase/migrations/20260806100007_create_scheduling_tables.sql — kept
 * in sync deliberately, since the DB is the final authority but the app
 * should fail fast with a readable error first.
 */
export function validateWorkingHours(input: WorkingHoursInput): ValidationResult {
  const errors: string[] = [];

  if (!Number.isInteger(input.dayOfWeek) || input.dayOfWeek < 0 || input.dayOfWeek > 6) {
    errors.push(`dayOfWeek must be an integer 0–6, got ${input.dayOfWeek}`);
  }

  if (input.isWorking) {
    if (!input.startTime || !input.endTime) {
      errors.push("startTime and endTime are required when isWorking is true");
    } else {
      try {
        const start = timeStringToMinutes(input.startTime);
        const end = timeStringToMinutes(input.endTime);
        if (start >= end) {
          errors.push(`startTime (${input.startTime}) must be before endTime (${input.endTime})`);
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Builds a TimeWindow from validated start/end time strings. Throws if invalid — call validateWorkingHours first. */
export function toTimeWindow(startTime: string, endTime: string): TimeWindow {
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = timeStringToMinutes(endTime);
  if (startMinutes >= endMinutes) {
    throw new Error(`startTime (${startTime}) must be before endTime (${endTime})`);
  }
  return { startMinutes, endMinutes };
}

export function isValidDayOfWeek(value: number): value is DayOfWeek {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}
