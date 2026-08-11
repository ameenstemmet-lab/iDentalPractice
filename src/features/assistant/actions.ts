"use server";

import Anthropic from "@anthropic-ai/sdk";

import { getAnthropicClient } from "@/lib/ai/anthropic-client";
import { assertPracticeAccess } from "@/lib/auth/session";
import { createAdminClient } from "@/features/reception/shared/supabase-admin";
import { createPatient } from "@/features/reception/patients/actions";
import { BookingRulesService, SupabaseSchedulingRepository } from "@/features/scheduling";
import { formatDateLong } from "@/features/booking/utils/format";
import { ASSISTANT_TOOLS, executeAssistantTool } from "./tools";
import type { AppointmentProposal, AssistantMessage } from "./types";

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildSystemPrompt(): string {
  const today = todayISODate();
  return (
    "You are the front-desk assistant embedded in iPractice, a practice-management dashboard. " +
    "You answer the signed-in staff member's questions about their own practice — appointments, " +
    "practitioners, treatments, and patients — by calling the tools provided. Only ever discuss this " +
    "practice's data; you have no knowledge of, and must never speculate about, any other practice. " +
    "Keep answers short and concrete (numbers, names, times) rather than generic, and format lists " +
    "plainly rather than with heavy markdown. If a tool call comes back empty, say so plainly rather " +
    `than guessing. Today's date is ${today} (${formatDateLong(today)}). Always resolve relative dates ` +
    '("tomorrow", "next Tuesday", "the 12th") to an explicit yyyy-mm-dd and state the resolved date and ' +
    "day of the week back to the user in your reply — before checking availability — so a misunderstood " +
    "date gets caught immediately, not after. To book an appointment: resolve the practitioner " +
    "(list_practitioners), the treatment (list_treatments), and the patient (search_patients — only treat " +
    "them as new if nothing matches) first, state the resolved date/day/time back to the user, then call " +
    "propose_appointment. That tool only checks availability and prepares a proposal — it never books " +
    "anything. The user must explicitly confirm the proposal in the UI before anything is created; never " +
    "tell the user something is booked unless they've done that."
  );
}

// Bounds how many tool-call round-trips one reply can take before we give up
// and return something rather than looping indefinitely on a confused chain.
// Booking a new appointment can take several sequential tool calls
// (search_patients, then list_practitioners, then list_treatments, then
// propose_appointment) before the model has anything to reply with — leave
// enough headroom that the loop doesn't exit before a final text reply.
const MAX_TOOL_ROUNDS = 8;

async function getPracticeTimezone(practiceId: string): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("practices")
    .select("timezone")
    .eq("id", practiceId)
    .maybeSingle<{ timezone: string }>();
  return data?.timezone ?? "UTC";
}

export async function askAssistant(practiceId: string, history: AssistantMessage[]): Promise<AssistantMessage> {
  const session = await assertPracticeAccess(practiceId);

  // Returned as a normal reply rather than thrown: a thrown Error's message
  // gets redacted by Next.js outside dev mode, so "not configured yet"
  // would otherwise show up as an opaque generic failure in production.
  let client: Anthropic;
  try {
    client = getAnthropicClient();
  } catch (err) {
    return {
      role: "assistant",
      content: err instanceof Error ? err.message : "The AI assistant isn't configured yet.",
    };
  }

  const timezone = await getPracticeTimezone(practiceId);
  const messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));

  // Set only by a successful propose_appointment tool call — the model's own
  // text is never trusted for the bookable details, only what the tool
  // itself (which re-validates against live data) actually returned.
  let lastProposal: AppointmentProposal | undefined;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: buildSystemPrompt(),
      tools: ASSISTANT_TOOLS,
      messages,
    });

    const toolUses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (toolUses.length === 0 || response.stop_reason !== "tool_use") {
      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();
      return { role: "assistant", content: text || "I don't have an answer for that.", proposal: lastProposal };
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUses.map(async (toolUse) => {
        let result: unknown;
        try {
          result = await executeAssistantTool(toolUse.name, toolUse.input as Record<string, unknown>, {
            practiceId,
            session,
            timezone,
          });
          if (toolUse.name === "propose_appointment" && result && typeof result === "object" && "proposal" in result) {
            lastProposal = (result as { proposal: AppointmentProposal }).proposal;
          }
        } catch (err) {
          result = { error: err instanceof Error ? err.message : "That lookup failed." };
        }
        return {
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        };
      })
    );

    messages.push({ role: "user", content: toolResults });
  }

  return {
    role: "assistant",
    content: "I wasn't able to finish looking that up — try asking something more specific.",
  };
}

export type ConfirmAppointmentResult = { ok: true; appointmentId: string } | { ok: false; message: string };

/**
 * The only code path that actually writes an appointment for this feature —
 * called directly by the UI when the user clicks "Confirm" on a proposal
 * card, never by the model. Re-validates the slot immediately before
 * inserting (the proposal may be minutes old by the time it's confirmed),
 * exactly like every other booking path in the app — see
 * submitBookingAction in src/features/booking/actions/submit-booking-action.ts.
 */
export async function confirmAppointmentProposal(
  practiceId: string,
  proposal: AppointmentProposal
): Promise<ConfirmAppointmentResult> {
  const session = await assertPracticeAccess(practiceId);
  if (session.role === "practitioner" && session.practitionerId !== proposal.practitionerId) {
    return { ok: false, message: "You can only book into your own diary." };
  }

  const timezone = await getPracticeTimezone(practiceId);
  const supabase = createAdminClient();
  const bookingRules = new BookingRulesService(new SupabaseSchedulingRepository(supabase));

  const validation = await bookingRules.validateBooking({
    practitionerId: proposal.practitionerId,
    date: proposal.date,
    timezone,
    startTime: proposal.startTime,
    durationMinutes: proposal.durationMinutes,
  });
  if (!validation.valid) {
    return { ok: false, message: validation.message ?? "That time is no longer available." };
  }

  let patientId: string;
  if (proposal.patientId) {
    patientId = proposal.patientId;
  } else if (proposal.newPatient) {
    try {
      const patient = await createPatient(practiceId, {
        firstName: proposal.newPatient.firstName,
        lastName: proposal.newPatient.lastName,
        cellphone: proposal.newPatient.cellphone ?? undefined,
        email: proposal.newPatient.email ?? undefined,
      });
      patientId = patient.id;
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to save the new patient." };
    }
  } else {
    return { ok: false, message: "This proposal is missing patient details." };
  }

  const { data: appointment, error: insertError } = await supabase
    .from("appointments")
    .insert({
      practice_id: practiceId,
      patient_id: patientId,
      practitioner_id: proposal.practitionerId,
      treatment_id: proposal.treatmentId,
      appointment_date: proposal.date,
      start_time: proposal.startTime,
      end_time: proposal.endTime,
      status: "booked",
      notes: proposal.notes,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError) {
    if (insertError.message.includes("appointments_no_overlap")) {
      return { ok: false, message: "That time was just booked by someone else — please choose another." };
    }
    return { ok: false, message: `Failed to confirm booking: ${insertError.message}` };
  }

  try {
    const { createGoogleCalendarServices } = await import(
      "@/features/integrations/google-calendar/services/container"
    );
    await createGoogleCalendarServices().calendarSyncService.onAppointmentCreated(appointment.id);
  } catch (err) {
    // Google Calendar may not be connected/configured at all — that's a
    // valid state, not a reason to fail a booking that already succeeded.
    console.warn(`Google Calendar sync skipped for appointment ${appointment.id}:`, err);
  }

  return { ok: true, appointmentId: appointment.id };
}
