/**
 * Hand-written row shapes for exactly the columns this module queries —
 * matching the migrations in supabase/migrations/. Not a generated schema;
 * regenerate against the real project (`supabase gen types typescript`)
 * once there's DB access in the environment running codegen, and this file
 * can be replaced wholesale.
 */

export interface DentistWorkingHoursRow {
  dentist_id: string;
  day_of_week: number;
  start_time: string | null; // "HH:mm:ss"
  end_time: string | null;
  is_working: boolean;
}

export interface DentistBreakRow {
  dentist_id: string;
  day_of_week: number;
  start_time: string; // "HH:mm:ss"
  end_time: string;
  description: string | null;
}

export interface BlockedPeriodRow {
  id: string;
  dentist_id: string;
  starts_at: string; // timestamptz ISO string
  ends_at: string;
  reason: string | null;
}

export type AppointmentStatusRow =
  | "booked"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface AppointmentRow {
  id: string;
  dentist_id: string;
  appointment_date: string; // "yyyy-mm-dd"
  start_time: string; // "HH:mm:ss"
  end_time: string;
  status: AppointmentStatusRow;
}
