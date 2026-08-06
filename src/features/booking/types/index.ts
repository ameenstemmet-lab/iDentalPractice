export interface Dentist {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  qualification: string;
  specialInterests: string[];
  yearsOfExperience: number;
  avgConsultationDuration: number; // minutes
  photoUrl?: string;
}

export interface Treatment {
  id: string;
  name: string;
  shortDescription: string;
  durationMinutes: number;
  startingPrice: number; // major currency unit (R)
}

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
}

export interface DayAvailability {
  date: string; // ISO yyyy-mm-dd
  closed: boolean;
  slots: TimeSlot[];
}

export interface PatientDetails {
  firstName: string;
  surname: string;
  mobileNumber: string;
  email: string;
  notes?: string;
}

export const BOOKING_STEPS = [
  "dentist",
  "treatment",
  "date",
  "time",
  "details",
  "review",
  "confirmation",
] as const;

export type BookingStep = (typeof BOOKING_STEPS)[number];

export interface BookingReservation {
  reference: string;
  confirmedAt: string; // ISO datetime
}
