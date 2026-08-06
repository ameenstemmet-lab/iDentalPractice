import type { SupabaseClient } from "@supabase/supabase-js";
import { fromZonedTime } from "date-fns-tz";

import type { AppointmentSyncPayload } from "../types";

/**
 * The only thing this module reads from `appointments` — deliberately not
 * a dependency on features/booking or features/scheduling (which this
 * integration must not modify or import). Implemented as a direct,
 * narrow Supabase query against columns that already existed before this
 * module (appointments.google_calendar_event_id was created in the
 * original schema migration specifically for this purpose).
 */
export interface AppointmentSyncDataSource {
  getSyncPayload(appointmentId: string): Promise<AppointmentSyncPayload | null>;
  setGoogleEventId(appointmentId: string, googleEventId: string | null): Promise<void>;
}

interface AppointmentJoinRow {
  id: string;
  practice_id: string;
  dentist_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  google_calendar_event_id: string | null;
  patients: { first_name: string; last_name: string } | null;
  treatment_types: { treatment_name: string } | null;
  practices: { timezone: string } | null;
}

export class SupabaseAppointmentSyncDataSource implements AppointmentSyncDataSource {
  constructor(private readonly client: SupabaseClient) {}

  async getSyncPayload(appointmentId: string): Promise<AppointmentSyncPayload | null> {
    const { data, error } = await this.client
      .from("appointments")
      .select(
        "id, practice_id, dentist_id, appointment_date, start_time, end_time, notes, google_calendar_event_id, patients(first_name, last_name), treatment_types(treatment_name), practices(timezone)"
      )
      .eq("id", appointmentId)
      .maybeSingle<AppointmentJoinRow>();

    if (error) throw new Error(`getSyncPayload failed: ${error.message}`);
    if (!data) return null;

    const patientName = data.patients ? `${data.patients.first_name} ${data.patients.last_name}` : "Patient";
    const treatmentName = data.treatment_types?.treatment_name ?? "Appointment";
    const timezone = data.practices?.timezone ?? "UTC";

    return {
      appointmentId: data.id,
      practiceId: data.practice_id,
      dentistId: data.dentist_id,
      summary: `${treatmentName} — ${patientName}`,
      description: data.notes ?? undefined,
      // appointment_date/start_time/end_time are practice-local wall-clock
      // values with no timezone attached — fromZonedTime interprets them
      // as being in `timezone`, not the server's own timezone. A plain
      // `new Date(...)` here would silently misinterpret the time in any
      // timezone other than the server's, exactly as it once did in the
      // booking module (see features/booking's toISODate fix).
      start: fromZonedTime(`${data.appointment_date}T${data.start_time}`, timezone),
      end: fromZonedTime(`${data.appointment_date}T${data.end_time}`, timezone),
      timezone,
      existingGoogleEventId: data.google_calendar_event_id,
    };
  }

  async setGoogleEventId(appointmentId: string, googleEventId: string | null): Promise<void> {
    const { error } = await this.client
      .from("appointments")
      .update({ google_calendar_event_id: googleEventId })
      .eq("id", appointmentId);
    if (error) throw new Error(`setGoogleEventId failed: ${error.message}`);
  }
}
