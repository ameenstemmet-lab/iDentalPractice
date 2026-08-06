import type { AppointmentStatus } from "@/features/reception/appointments/types";

export interface DashboardStats {
  todayAppointments: number;
  upcomingAppointments: number; // next 7 days, excluding today
  patientsThisWeek: number; // distinct patients with an appointment in the last 7 days
  cancelledThisWeek: number;
  noShowsThisWeek: number;
}

export interface RecentActivityItem {
  id: string;
  patientName: string;
  dentistName: string;
  treatmentName: string;
  appointmentDate: string;
  startTime: string;
  status: AppointmentStatus;
  createdAt: string;
}
