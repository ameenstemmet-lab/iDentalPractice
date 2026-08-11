import "server-only";
import Anthropic from "@anthropic-ai/sdk";

import { listAppointments } from "@/features/reception/appointments/actions";
import type { AppointmentStatus } from "@/features/reception/appointments/types";
import { getPatient, searchPatients } from "@/features/reception/patients/actions";
import { listPractitioners } from "@/features/reception/practitioners/actions";
import { listTreatments } from "@/features/reception/treatments/actions";
import { getDashboardStats, getRecentActivity } from "@/features/reception/dashboard/actions";
import { BookingRulesService, SupabaseSchedulingRepository } from "@/features/scheduling";
import { calculateEndTime } from "@/features/scheduling/utils/time-math";
import { formatDateLong } from "@/features/booking/utils/format";
import { createAdminClient } from "@/features/reception/shared/supabase-admin";
import type { CurrentSession } from "@/lib/auth/session";
import type { AppointmentProposal } from "./types";

// Everything here is read-only except propose_appointment, which is itself
// read-only in effect — it validates a slot and returns a proposal, but
// never writes. The actual insert only happens from confirmAppointmentProposal
// (src/features/assistant/actions.ts), triggered by an explicit "Confirm"
// click in the UI, never by the model deciding to. Keeps the blast radius of
// a misread instruction to "wrong proposal shown," never "wrong booking made."
export const ASSISTANT_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_dashboard_summary",
    description:
      "Today's and this week's appointment counts for the practice: today's appointments, upcoming appointments in the next 7 days, distinct patients seen in the last 7 days, cancellations in the last 7 days, and no-shows in the last 7 days.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_recent_activity",
    description: "The most recently booked appointments across the practice, newest first.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max items to return, default 8." },
      },
    },
  },
  {
    name: "list_practitioners",
    description:
      "The practice's practitioners (the people who see patients), with id, name, title, profession, and whether they're currently active. Call this before list_appointments or propose_appointment if you need a specific practitioner's id.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_treatments",
    description:
      "The treatment types the practice offers, with id, price, and duration. Practice staff only. Call this before propose_appointment to get a treatmentId.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "search_patients",
    description:
      "Search the practice's patients by name, cellphone, or email. Always call this before propose_appointment to check whether the patient already exists — only treat them as new if nothing matches.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search text — a name, phone number, or email fragment." },
      },
      required: ["query"],
    },
  },
  {
    name: "list_appointments",
    description:
      "List appointments for the practice, optionally filtered. Dates are yyyy-mm-dd. Use list_practitioners first to resolve a practitioner's name to their id.",
    input_schema: {
      type: "object",
      properties: {
        fromDate: { type: "string", description: "Earliest appointment date (yyyy-mm-dd), inclusive." },
        toDate: { type: "string", description: "Latest appointment date (yyyy-mm-dd), inclusive." },
        status: {
          type: "string",
          enum: ["booked", "confirmed", "completed", "cancelled", "no_show"],
          description: "Filter to a single status.",
        },
        practitionerId: { type: "string", description: "Filter to one practitioner's id (from list_practitioners)." },
        search: { type: "string", description: "Filter by patient name or cellphone." },
        limit: { type: "number", description: "Max results, default 20, max 50." },
      },
    },
  },
  {
    name: "propose_appointment",
    description:
      "Check whether a specific slot is available and prepare a booking proposal for the user to review. " +
      "This never books anything by itself — it only validates the slot and returns a proposal; the appointment " +
      "is only created after the user explicitly confirms it in the UI. Resolve practitionerId via " +
      "list_practitioners and treatmentId via list_treatments first, and always call search_patients first to " +
      "check whether the patient already exists — only pass newPatient when nothing matched. date must be " +
      "yyyy-mm-dd; always state the resolved date and day of the week back to the user in your own reply before " +
      "calling this, so they can catch a misunderstood date before you check availability.",
    input_schema: {
      type: "object",
      properties: {
        practitionerId: { type: "string", description: "From list_practitioners." },
        treatmentId: { type: "string", description: "From list_treatments — its duration sets the appointment length." },
        date: { type: "string", description: "yyyy-mm-dd." },
        startTime: { type: "string", description: "HH:mm, 24-hour." },
        patientId: { type: "string", description: "An existing patient's id, from search_patients. Omit if the patient is new." },
        newPatient: {
          type: "object",
          description: "Only when search_patients found no existing match.",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            cellphone: { type: "string" },
            email: { type: "string" },
          },
        },
        notes: { type: "string", description: "Optional appointment notes." },
      },
      required: ["practitionerId", "treatmentId", "date", "startTime"],
    },
  },
];

interface ToolExecutionContext {
  practiceId: string;
  session: CurrentSession;
  timezone: string;
}

function clampLimit(value: unknown, fallback: number, max: number): number {
  const n = typeof value === "number" ? value : fallback;
  return Math.min(Math.max(1, Math.round(n)), max);
}

interface NewPatientInput {
  firstName?: string;
  lastName?: string;
  cellphone?: string;
  email?: string;
}

async function proposeAppointment(
  input: Record<string, unknown>,
  ctx: ToolExecutionContext
): Promise<{ proposal: AppointmentProposal } | { error: string }> {
  const treatmentId = typeof input.treatmentId === "string" ? input.treatmentId : "";
  const date = typeof input.date === "string" ? input.date : "";
  const startTime = typeof input.startTime === "string" ? input.startTime : "";
  const patientId = typeof input.patientId === "string" ? input.patientId : undefined;
  const newPatient = (input.newPatient ?? undefined) as NewPatientInput | undefined;

  // A practitioner-role session can only ever book into their own diary,
  // regardless of what practitionerId the model was given or guessed.
  const practitionerId =
    ctx.session.role === "practitioner" ? (ctx.session.practitionerId ?? "") : typeof input.practitionerId === "string" ? input.practitionerId : "";

  if (!practitionerId || !treatmentId || !date || !startTime) {
    return { error: "practitionerId, treatmentId, date, and startTime are all required." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "date must be yyyy-mm-dd." };
  }
  if (!patientId && !(newPatient?.firstName && newPatient?.lastName)) {
    return { error: "Provide either an existing patientId (from search_patients) or a newPatient with firstName and lastName." };
  }

  const [practitioners, treatments] = await Promise.all([
    listPractitioners(ctx.practiceId),
    listTreatments(ctx.practiceId),
  ]);
  const practitioner = practitioners.find((p) => p.id === practitionerId);
  const treatment = treatments.find((t) => t.id === treatmentId);
  if (!practitioner) return { error: "Unknown practitionerId — call list_practitioners first." };
  if (!treatment) return { error: "Unknown treatmentId — call list_treatments first." };

  let patientId_: string | null = null;
  let resolvedNewPatient: AppointmentProposal["newPatient"] = null;
  let patientLabel: string;

  if (patientId) {
    const patient = await getPatient(patientId);
    if (!patient || patient.practiceId !== ctx.practiceId) {
      return { error: "Unknown patientId — call search_patients first." };
    }
    patientId_ = patient.id;
    patientLabel = `${patient.firstName} ${patient.lastName}`;
  } else {
    resolvedNewPatient = {
      firstName: newPatient!.firstName!,
      lastName: newPatient!.lastName!,
      cellphone: newPatient?.cellphone ?? null,
      email: newPatient?.email ?? null,
    };
    patientLabel = `${resolvedNewPatient.firstName} ${resolvedNewPatient.lastName} (new patient)`;
  }

  const supabase = createAdminClient();
  const bookingRules = new BookingRulesService(new SupabaseSchedulingRepository(supabase));
  const validation = await bookingRules.validateBooking({
    practitionerId,
    date,
    timezone: ctx.timezone,
    startTime,
    durationMinutes: treatment.durationMinutes,
  });
  if (!validation.valid) {
    return { error: validation.message ?? "That time isn't available." };
  }

  const proposal: AppointmentProposal = {
    practitionerId,
    practitionerName: `${practitioner.title ? `${practitioner.title} ` : ""}${practitioner.firstName} ${practitioner.lastName}`,
    treatmentId,
    treatmentName: treatment.treatmentName,
    treatmentPrice: treatment.price,
    durationMinutes: treatment.durationMinutes,
    date,
    dateLabel: formatDateLong(date),
    startTime,
    endTime: calculateEndTime(startTime, treatment.durationMinutes),
    patientId: patientId_,
    newPatient: resolvedNewPatient,
    patientLabel,
    notes: typeof input.notes === "string" ? input.notes : null,
  };

  return { proposal };
}

/**
 * Runs one assistant-requested tool call. `ctx.session` is the caller's own
 * verified session (never client-supplied) — practitioner-role sessions
 * inherit the same "own diary only" narrowing that listAppointments already
 * applies everywhere else in the app, so the assistant can't be talked into
 * showing (or booking into) one practitioner's diary from another's login.
 */
export async function executeAssistantTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolExecutionContext
): Promise<unknown> {
  switch (name) {
    case "get_dashboard_summary":
      return getDashboardStats(ctx.practiceId);

    case "list_recent_activity":
      return getRecentActivity(ctx.practiceId, clampLimit(input.limit, 8, 20));

    case "list_practitioners":
      return listPractitioners(ctx.practiceId);

    case "list_treatments":
      if (ctx.session.role !== "staff") {
        return { error: "Only practice staff can view the treatment list." };
      }
      return listTreatments(ctx.practiceId);

    case "search_patients":
      return searchPatients(ctx.practiceId, typeof input.query === "string" ? input.query : "");

    case "list_appointments": {
      const result = await listAppointments({
        practiceId: ctx.practiceId,
        fromDate: typeof input.fromDate === "string" ? input.fromDate : undefined,
        toDate: typeof input.toDate === "string" ? input.toDate : undefined,
        status: typeof input.status === "string" ? (input.status as AppointmentStatus) : undefined,
        practitionerId: typeof input.practitionerId === "string" ? input.practitionerId : undefined,
        search: typeof input.search === "string" ? input.search : undefined,
        pageSize: clampLimit(input.limit, 20, 50),
      });
      return result;
    }

    case "propose_appointment":
      return proposeAppointment(input, ctx);

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
