"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BookingRulesService, SupabaseSchedulingRepository } from "@/features/scheduling";
import { calculateEndTime } from "@/features/scheduling/utils/time-math";
import { patientDetailsSchema } from "../validation/patient-details-schema";
import type { BookingReservation, PatientDetails } from "../types";
import { getCurrentBookingPractice } from "./practice";

export interface SubmitBookingInput {
  dentistId: string;
  treatmentId: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  durationMinutes: number;
  patient: PatientDetails;
}

export interface SubmitBookingResult {
  ok: true;
  reservation: BookingReservation;
}

export interface SubmitBookingError {
  ok: false;
  message: string;
}

async function findOrCreatePatient(
  practiceId: string,
  patient: PatientDetails
): Promise<string> {
  const supabase = createSupabaseAdminClient();

  const { data: existing, error: findError } = await supabase
    .from("patients")
    .select("id")
    .eq("practice_id", practiceId)
    .eq("email", patient.email)
    .maybeSingle<{ id: string }>();
  if (findError) throw new Error(`findOrCreatePatient lookup failed: ${findError.message}`);
  if (existing) return existing.id;

  const { data: created, error: insertError } = await supabase
    .from("patients")
    .insert({
      practice_id: practiceId,
      first_name: patient.firstName,
      last_name: patient.surname,
      email: patient.email,
      cellphone: patient.mobileNumber,
      notes: patient.notes || null,
    })
    .select("id")
    .single<{ id: string }>();
  if (insertError) throw new Error(`findOrCreatePatient insert failed: ${insertError.message}`);
  return created.id;
}

async function syncNewAppointmentToGoogleCalendar(appointmentId: string): Promise<void> {
  try {
    const { createGoogleCalendarServices } = await import(
      "@/features/integrations/google-calendar/services/container"
    );
    await createGoogleCalendarServices().calendarSyncService.onAppointmentCreated(appointmentId);
  } catch (err) {
    // Google Calendar may not be connected/configured at all — that's a
    // valid state, not a reason to fail a booking that already succeeded.
    console.warn(`Google Calendar sync skipped for appointment ${appointmentId}:`, err);
  }
}

/**
 * The real, server-side "never trust the client" gate: re-validates the
 * requested slot against live data via BookingRulesService immediately
 * before writing, regardless of what the browser believed was free when it
 * rendered the slot grid a few minutes (or seconds) earlier.
 */
export async function submitBookingAction(
  input: SubmitBookingInput
): Promise<SubmitBookingResult | SubmitBookingError> {
  const parsedPatient = patientDetailsSchema.safeParse(input.patient);
  if (!parsedPatient.success) {
    return { ok: false, message: "Please check your details and try again." };
  }

  const practice = await getCurrentBookingPractice();
  if (!practice) {
    return { ok: false, message: "This practice could not be found." };
  }

  const supabase = createSupabaseAdminClient();
  const bookingRules = new BookingRulesService(new SupabaseSchedulingRepository(supabase));

  const validation = await bookingRules.validateBooking({
    dentistId: input.dentistId,
    date: input.date,
    timezone: practice.timezone,
    startTime: input.time,
    durationMinutes: input.durationMinutes,
  });

  if (!validation.valid) {
    return { ok: false, message: validation.message ?? "That time is no longer available." };
  }

  let patientId: string;
  try {
    patientId = await findOrCreatePatient(practice.id, parsedPatient.data);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Failed to save your details." };
  }

  const endTime = calculateEndTime(input.time, input.durationMinutes);

  const { data: appointment, error: insertError } = await supabase
    .from("appointments")
    .insert({
      practice_id: practice.id,
      patient_id: patientId,
      dentist_id: input.dentistId,
      treatment_id: input.treatmentId,
      appointment_date: input.date,
      start_time: input.time,
      end_time: endTime,
      status: "booked",
      notes: parsedPatient.data.notes || null,
    })
    .select("id, created_at")
    .single<{ id: string; created_at: string }>();

  if (insertError) {
    if (insertError.message.includes("appointments_no_overlap")) {
      return { ok: false, message: "That time was just booked by someone else — please choose another." };
    }
    return { ok: false, message: `Failed to confirm booking: ${insertError.message}` };
  }

  await syncNewAppointmentToGoogleCalendar(appointment.id);

  return {
    ok: true,
    reservation: {
      reference: `IDP-${appointment.id.slice(0, 8).toUpperCase()}`,
      confirmedAt: appointment.created_at,
    },
  };
}
