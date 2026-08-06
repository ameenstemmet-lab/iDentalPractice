import { dentists } from "../data/dentists";
import { treatments } from "../data/treatments";
import type { Dentist, PatientDetails, Treatment, BookingReservation } from "../types";

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Mocked network calls — simulate latency so loading states are real. */
export function fetchDentists(): Promise<Dentist[]> {
  return delay(dentists, 500);
}

export function fetchTreatments(): Promise<Treatment[]> {
  return delay(treatments, 500);
}

function generateReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `IDP-${code}`;
}

export interface SubmitBookingInput {
  dentistId: string;
  treatmentId: string;
  date: string;
  time: string;
  patient: PatientDetails;
}

/** Mocked submission — payload is unused for now, kept for the real API's shape. */
export function submitBooking(input: SubmitBookingInput): Promise<BookingReservation> {
  void input;
  return delay(
    { reference: generateReference(), confirmedAt: new Date().toISOString() },
    900
  );
}
