export type AppointmentStatus = "booked" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface AppointmentListItem {
  id: string;
  practiceId: string;
  appointmentDate: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  notes: string | null;
  googleCalendarEventId: string | null;
  patientId: string;
  patientName: string;
  patientCellphone: string | null;
  practitionerId: string;
  practitionerName: string;
  practitionerColour: string;
  treatmentId: string;
  treatmentName: string;
  treatmentPrice: number;
}

export interface ListAppointmentsFilters {
  practiceId: string;
  search?: string;
  status?: AppointmentStatus | "all";
  practitionerId?: string | "all";
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "date_asc" | "date_desc";
}

export interface ListAppointmentsResult {
  appointments: AppointmentListItem[];
  total: number;
}
