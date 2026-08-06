"use server";

import { createAdminClient } from "../shared/supabase-admin";
import type { AppointmentStatus } from "@/features/reception/appointments/types";
import type { Patient, PatientAppointmentSummary, PatientInput, PatientListItem } from "./types";

interface PatientRow {
  id: string;
  practice_id: string;
  first_name: string;
  last_name: string;
  cellphone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  notes: string | null;
  created_at: string;
}

function toPatient(row: PatientRow): Patient {
  return {
    id: row.id,
    practiceId: row.practice_id,
    firstName: row.first_name,
    lastName: row.last_name,
    cellphone: row.cellphone,
    email: row.email,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export interface ListPatientsParams {
  practiceId: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListPatientsResult {
  patients: PatientListItem[];
  total: number;
}

const DEFAULT_PAGE_SIZE = 20;

export async function listPatients(params: ListPatientsParams): Promise<ListPatientsResult> {
  const { practiceId, search, page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
  const supabase = createAdminClient();

  let query = supabase
    .from("patients")
    .select("id, practice_id, first_name, last_name, cellphone, email, date_of_birth, gender, notes, created_at", {
      count: "exact",
    })
    .eq("practice_id", practiceId)
    .order("last_name", { ascending: true });

  if (search) {
    const escaped = search.replace(/[%,]/g, "");
    query = query.or(
      `first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%,email.ilike.%${escaped}%,cellphone.ilike.%${escaped}%`
    );
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw new Error(`listPatients failed: ${error.message}`);

  const patients = (data as PatientRow[] | null ?? []).map(toPatient);
  const patientIds = patients.map((p) => p.id);

  const visitInfo = patientIds.length ? await getVisitInfo(practiceId, patientIds) : new Map();

  return {
    patients: patients.map((p) => ({
      ...p,
      lastVisit: visitInfo.get(p.id)?.lastVisit ?? null,
      nextAppointment: visitInfo.get(p.id)?.nextAppointment ?? null,
    })),
    total: count ?? patients.length,
  };
}

async function getVisitInfo(practiceId: string, patientIds: string[]) {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("appointments")
    .select("patient_id, appointment_date")
    .eq("practice_id", practiceId)
    .in("patient_id", patientIds)
    .not("status", "in", "(cancelled)")
    .order("appointment_date", { ascending: true });

  if (error) throw new Error(`getVisitInfo failed: ${error.message}`);

  const map = new Map<string, { lastVisit: string | null; nextAppointment: string | null }>();
  for (const row of (data as { patient_id: string; appointment_date: string }[] | null) ?? []) {
    const entry = map.get(row.patient_id) ?? { lastVisit: null, nextAppointment: null };
    if (row.appointment_date < today) {
      if (!entry.lastVisit || row.appointment_date > entry.lastVisit) entry.lastVisit = row.appointment_date;
    } else if (!entry.nextAppointment || row.appointment_date < entry.nextAppointment) {
      entry.nextAppointment = row.appointment_date;
    }
    map.set(row.patient_id, entry);
  }
  return map;
}

export async function getPatient(patientId: string): Promise<Patient | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id, practice_id, first_name, last_name, cellphone, email, date_of_birth, gender, notes, created_at")
    .eq("id", patientId)
    .maybeSingle<PatientRow>();
  if (error) throw new Error(`getPatient failed: ${error.message}`);
  return data ? toPatient(data) : null;
}

export async function getPatientAppointments(patientId: string): Promise<PatientAppointmentSummary[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, appointment_date, start_time, end_time, status, practitioners(first_name, last_name), treatment_types(treatment_name)"
    )
    .eq("patient_id", patientId)
    .order("appointment_date", { ascending: false });

  if (error) throw new Error(`getPatientAppointments failed: ${error.message}`);

  return (
    (
      (data ?? []) as unknown as Array<{
        id: string;
        appointment_date: string;
        start_time: string;
        end_time: string;
        status: AppointmentStatus;
        practitioners: { first_name: string; last_name: string } | null;
        treatment_types: { treatment_name: string } | null;
      }>
    ).map((row) => ({
    id: row.id,
    appointmentDate: row.appointment_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    practitionerName: row.practitioners ? `${row.practitioners.first_name} ${row.practitioners.last_name}` : "—",
    treatmentName: row.treatment_types?.treatment_name ?? "—",
  })));
}

export async function createPatient(practiceId: string, input: PatientInput): Promise<Patient> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("patients")
    .insert({
      practice_id: practiceId,
      first_name: input.firstName,
      last_name: input.lastName,
      cellphone: input.cellphone || null,
      email: input.email || null,
      date_of_birth: input.dateOfBirth || null,
      gender: input.gender || null,
      notes: input.notes || null,
    })
    .select("id, practice_id, first_name, last_name, cellphone, email, date_of_birth, gender, notes, created_at")
    .single<PatientRow>();
  if (error) throw new Error(`createPatient failed: ${error.message}`);
  return toPatient(data);
}

export async function updatePatient(patientId: string, input: PatientInput): Promise<Patient> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("patients")
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      cellphone: input.cellphone || null,
      email: input.email || null,
      date_of_birth: input.dateOfBirth || null,
      gender: input.gender || null,
      notes: input.notes || null,
    })
    .eq("id", patientId)
    .select("id, practice_id, first_name, last_name, cellphone, email, date_of_birth, gender, notes, created_at")
    .single<PatientRow>();
  if (error) throw new Error(`updatePatient failed: ${error.message}`);
  return toPatient(data);
}

export async function searchPatients(practiceId: string, search: string): Promise<Patient[]> {
  if (!search.trim()) return [];
  const supabase = createAdminClient();
  const escaped = search.replace(/[%,]/g, "");
  const { data, error } = await supabase
    .from("patients")
    .select("id, practice_id, first_name, last_name, cellphone, email, date_of_birth, gender, notes, created_at")
    .eq("practice_id", practiceId)
    .or(`first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%`)
    .limit(8);
  if (error) throw new Error(`searchPatients failed: ${error.message}`);
  return (data as PatientRow[] | null ?? []).map(toPatient);
}
