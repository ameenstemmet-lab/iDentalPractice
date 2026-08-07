"use server";

import { createAdminClient } from "../shared/supabase-admin";
import { assertPracticeAccess } from "@/lib/auth/session";
import { addDaysToISODate } from "@/features/scheduling/utils/time-math";
import type { AppointmentStatus } from "@/features/reception/appointments/types";
import type { DashboardStats, RecentActivityItem } from "./types";

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDashboardStats(practiceId: string): Promise<DashboardStats> {
  await assertPracticeAccess(practiceId);
  const supabase = createAdminClient();
  const today = todayISODate();
  const weekAgo = addDaysToISODate(today, -7);
  const weekAhead = addDaysToISODate(today, 7);

  const [todayCount, upcomingCount, weekPatients, cancelledCount, noShowCount] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .eq("appointment_date", today)
      .not("status", "in", "(cancelled)"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .gt("appointment_date", today)
      .lte("appointment_date", weekAhead)
      .not("status", "in", "(cancelled)"),
    supabase
      .from("appointments")
      .select("patient_id")
      .eq("practice_id", practiceId)
      .gte("appointment_date", weekAgo)
      .lte("appointment_date", today),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .eq("status", "cancelled")
      .gte("appointment_date", weekAgo)
      .lte("appointment_date", today),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .eq("status", "no_show")
      .gte("appointment_date", weekAgo)
      .lte("appointment_date", today),
  ]);

  for (const result of [todayCount, upcomingCount, weekPatients, cancelledCount, noShowCount]) {
    if (result.error) throw new Error(`getDashboardStats failed: ${result.error.message}`);
  }

  const distinctPatients = new Set((weekPatients.data as { patient_id: string }[] | null ?? []).map((r) => r.patient_id));

  return {
    todayAppointments: todayCount.count ?? 0,
    upcomingAppointments: upcomingCount.count ?? 0,
    patientsThisWeek: distinctPatients.size,
    cancelledThisWeek: cancelledCount.count ?? 0,
    noShowsThisWeek: noShowCount.count ?? 0,
  };
}

export async function getRecentActivity(practiceId: string, limit = 8): Promise<RecentActivityItem[]> {
  await assertPracticeAccess(practiceId);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, appointment_date, start_time, status, created_at, patients(first_name, last_name), practitioners(first_name, last_name), treatment_types(treatment_name)"
    )
    .eq("practice_id", practiceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getRecentActivity failed: ${error.message}`);

  return (
    (
      (data ?? []) as unknown as Array<{
        id: string;
        appointment_date: string;
        start_time: string;
        status: AppointmentStatus;
        created_at: string;
        patients: { first_name: string; last_name: string } | null;
        practitioners: { first_name: string; last_name: string } | null;
        treatment_types: { treatment_name: string } | null;
      }>
    ).map((row) => ({
    id: row.id,
    patientName: row.patients ? `${row.patients.first_name} ${row.patients.last_name}` : "—",
    practitionerName: row.practitioners ? `${row.practitioners.first_name} ${row.practitioners.last_name}` : "—",
    treatmentName: row.treatment_types?.treatment_name ?? "—",
    appointmentDate: row.appointment_date,
    startTime: row.start_time.slice(0, 5),
    status: row.status,
    createdAt: row.created_at,
  })));
}
