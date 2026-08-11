export type PublicAssistantRole = "user" | "assistant";

export interface NewBookingProposal {
  practitionerId: string;
  practitionerName: string;
  treatmentId: string;
  treatmentName: string;
  treatmentPrice: number;
  durationMinutes: number;
  date: string; // yyyy-mm-dd
  dateLabel: string; // resolved server-side — never trust model-generated text for this
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  patient: {
    firstName: string;
    surname: string;
    email: string;
    mobileNumber: string;
    notes: string | null;
  };
}

export interface ManageAppointmentProposal {
  action: "reschedule" | "cancel";
  appointmentId: string;
  reference: string;
  verifiedEmail: string; // re-checked again at confirm time, never trusted from a stale round trip alone
  practitionerName: string;
  treatmentName: string;
  currentDateLabel: string;
  currentStartTime: string;
  currentEndTime: string;
  // Only set when action === "reschedule"
  newDate?: string;
  newDateLabel?: string;
  newStartTime?: string;
  newEndTime?: string;
}

export interface PublicAssistantMessage {
  role: PublicAssistantRole;
  content: string;
  bookingProposal?: NewBookingProposal;
  manageProposal?: ManageAppointmentProposal;
}
