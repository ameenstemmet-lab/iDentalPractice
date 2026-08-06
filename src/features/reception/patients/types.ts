import type { AppointmentStatus } from "@/features/reception/appointments/types";

export interface Patient {
  id: string;
  practiceId: string;
  firstName: string;
  lastName: string;
  cellphone: string | null;
  email: string | null;
  dateOfBirth: string | null; // yyyy-mm-dd
  gender: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PatientListItem extends Patient {
  lastVisit: string | null; // ISO date of most recent past appointment
  nextAppointment: string | null; // ISO date of next upcoming appointment
}

export interface PatientAppointmentSummary {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  dentistName: string;
  treatmentName: string;
}

export interface PatientInput {
  firstName: string;
  lastName: string;
  cellphone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  notes?: string;
}
