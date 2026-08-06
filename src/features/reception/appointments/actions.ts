"use server";

import { createAdminClient } from "../shared/supabase-admin";
import type {
  AppointmentListItem,
  AppointmentStatus,
  ListAppointmentsFilters,
  ListAppointmentsResult,
} from "./types";

interface AppointmentRow {
  id: string;
  practice_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  google_calendar_event_id: string | null;
  patient_id: string;
  dentist_id: string;
  treatment_id: string;
  patients: { first_name: string; last_name: string; cellphone: string | null } | null;
  dentists: { first_name: string; last_name: string; colour_code: string } | null;
  treatment_types: { treatment_name: string; price: number } | null;
}

function toListItem(row: AppointmentRow): AppointmentListItem {
  return {
    id: row.id,
    practiceId: row.practice_id,
    appointmentDate: row.appointment_date,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    status: row.status,
    notes: row.notes,
    googleCalendarEventId: row.google_calendar_event_id,
    patientId: row.patient_id,
    patientName: row.patients ? `${row.patients.first_name} ${row.patients.last_name}` : "—",
    patientCellphone: row.patients?.cellphone ?? null,
    dentistId: row.dentist_id,
    dentistName: row.dentists ? `${row.dentists.first_name} ${row.dentists.last_name}` : "—",
    dentistColour: row.dentists?.colour_code ?? "#64748b",
    treatmentId: row.treatment_id,
    treatmentName: row.treatment_types?.treatment_name ?? "—",
    treatmentPrice: row.treatment_types?.price ?? 0,
  };
}

const SELECT =
  "id, practice_id, appointment_date, start_time, end_time, status, notes, google_calendar_event_id, patient_id, dentist_id, treatment_id, patients(first_name, last_name, cellphone), dentists(first_name, last_name, colour_code), treatment_types(treatment_name, price)";

export async function listAppointments(filters: ListAppointmentsFilters): Promise<ListAppointmentsResult> {
  const {
    practiceId,
    search,
    status,
    dentistId,
    fromDate,
    toDate,
    page = 1,
    pageSize = 20,
    sortBy = "date_asc",
  } = filters;

  const supabase = createAdminClient();
  let query = supabase.from("appointments").select(SELECT, { count: "exact" }).eq("practice_id", practiceId);

  if (status && status !== "all") query = query.eq("status", status);
  if (dentistId && dentistId !== "all") query = query.eq("dentist_id", dentistId);
  if (fromDate) query = query.gte("appointment_date", fromDate);
  if (toDate) query = query.lte("appointment_date", toDate);

  query = query
    .order("appointment_date", { ascending: sortBy === "date_asc" })
    .order("start_time", { ascending: sortBy === "date_asc" });

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw new Error(`listAppointments failed: ${error.message}`);

  let appointments = ((data ?? []) as unknown as AppointmentRow[]).map(toListItem);

  // Patient-name search is applied post-join (Supabase can't filter on an
  // embedded relation's column directly in the same query as top-level
  // filters without a view) — fine at this page size.
  if (search) {
    const term = search.toLowerCase();
    appointments = appointments.filter(
      (a) => a.patientName.toLowerCase().includes(term) || a.patientCellphone?.includes(term)
    );
  }

  return { appointments, total: count ?? appointments.length };
}

export async function getAppointment(appointmentId: string): Promise<AppointmentListItem | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("appointments").select(SELECT).eq("id", appointmentId).maybeSingle<AppointmentRow>();
  if (error) throw new Error(`getAppointment failed: ${error.message}`);
  return data ? toListItem(data) : null;
}

async function syncToGoogleCalendar(kind: "update" | "cancel", appointmentId: string): Promise<void> {
  try {
    const { createGoogleCalendarServices } = await import(
      "@/features/integrations/google-calendar/services/container"
    );
    const { calendarSyncService } = createGoogleCalendarServices();
    if (kind === "update") await calendarSyncService.onAppointmentUpdated(appointmentId);
    else await calendarSyncService.onAppointmentCancelled(appointmentId);
  } catch (err) {
    // Google Calendar may not be configured/connected at all — that's a
    // valid state, not a failure of the appointment update itself.
    console.warn(`Google Calendar sync (${kind}) skipped for appointment ${appointmentId}:`, err);
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("appointments").update({ status }).eq("id", appointmentId);
  if (error) throw new Error(`updateAppointmentStatus failed: ${error.message}`);

  if (status === "cancelled") await syncToGoogleCalendar("cancel", appointmentId);
  else await syncToGoogleCalendar("update", appointmentId);
}

export interface RescheduleInput {
  appointmentId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export async function rescheduleAppointment(input: RescheduleInput): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("appointments")
    .update({ appointment_date: input.date, start_time: input.startTime, end_time: input.endTime })
    .eq("id", input.appointmentId);

  if (error) {
    if (error.message.includes("appointments_no_overlap")) {
      throw new Error("That time overlaps another appointment for this dentist.");
    }
    throw new Error(`rescheduleAppointment failed: ${error.message}`);
  }

  await syncToGoogleCalendar("update", input.appointmentId);
}
