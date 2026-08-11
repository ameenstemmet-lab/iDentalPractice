import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * There is no login on the public booking page, so "proving you own this
 * appointment" has to work without a session — every lookup here requires
 * BOTH the booking reference (from the confirmation screen/email) AND the
 * email address used at booking time. Neither alone is enough: the
 * reference is only 8 hex chars (guessable-ish at scale) and email alone
 * would let anyone browse a stranger's bookings by knowing their address.
 * Called fresh (never cached) at every step — find, propose, and confirm —
 * so a reference that's since been reused or an appointment that's been
 * cancelled by someone else in the meantime is always re-verified against
 * live data, not trusted from an earlier step in the conversation.
 */
export interface OwnedAppointment {
  id: string;
  patientId: string;
  practitionerId: string;
  practitionerName: string;
  treatmentId: string;
  treatmentName: string;
  durationMinutes: number;
  date: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: string;
}

interface AppointmentRow {
  id: string;
  patient_id: string;
  practitioner_id: string;
  treatment_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  practitioners: { first_name: string; last_name: string; title: string | null } | null;
  treatment_types: { treatment_name: string; duration_minutes: number } | null;
}

export function referenceToPrefix(reference: string): string {
  return reference.trim().toUpperCase().replace(/^IDP-/, "");
}

export async function findOwnedAppointment(
  supabase: SupabaseClient,
  practiceId: string,
  reference: string,
  email: string
): Promise<OwnedAppointment | null> {
  const cleanEmail = email.trim().toLowerCase();
  const prefix = referenceToPrefix(reference);
  if (!cleanEmail || prefix.length !== 8) return null;

  const { data: patients } = await supabase
    .from("patients")
    .select("id")
    .eq("practice_id", practiceId)
    .ilike("email", cleanEmail);
  if (!patients || patients.length === 0) return null;

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      "id, patient_id, practitioner_id, treatment_id, appointment_date, start_time, end_time, status, practitioners(first_name, last_name, title), treatment_types(treatment_name, duration_minutes)"
    )
    .eq("practice_id", practiceId)
    .in(
      "patient_id",
      patients.map((p) => p.id)
    );
  if (!appointments) return null;

  const match = (appointments as unknown as AppointmentRow[]).find(
    (a) => a.id.slice(0, 8).toUpperCase() === prefix
  );
  if (!match) return null;

  return {
    id: match.id,
    patientId: match.patient_id,
    practitionerId: match.practitioner_id,
    practitionerName: match.practitioners
      ? `${match.practitioners.title ? `${match.practitioners.title} ` : ""}${match.practitioners.first_name} ${match.practitioners.last_name}`
      : "your practitioner",
    treatmentId: match.treatment_id,
    treatmentName: match.treatment_types?.treatment_name ?? "your appointment",
    durationMinutes: match.treatment_types?.duration_minutes ?? 30,
    date: match.appointment_date,
    startTime: match.start_time.slice(0, 5),
    endTime: match.end_time.slice(0, 5),
    status: match.status,
  };
}
