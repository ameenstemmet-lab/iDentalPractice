export type AssistantRole = "user" | "assistant";

export interface AppointmentProposal {
  practitionerId: string;
  practitionerName: string;
  treatmentId: string;
  treatmentName: string;
  treatmentPrice: number;
  durationMinutes: number;
  date: string; // yyyy-mm-dd
  dateLabel: string; // e.g. "Wednesday, 12 August 2026" — resolved server-side, never trust model-generated text for this
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  patientId: string | null; // set when booking an existing patient
  newPatient: { firstName: string; lastName: string; cellphone: string | null; email: string | null } | null;
  patientLabel: string; // display name, resolved server-side either way
  notes: string | null;
}

export interface AssistantMessage {
  role: AssistantRole;
  content: string;
  /** Present only on an assistant reply that proposed a bookable slot — the UI renders a confirm/cancel card. Never written until the user explicitly confirms it. */
  proposal?: AppointmentProposal;
}
