"use server";

import Anthropic from "@anthropic-ai/sdk";

import { getAnthropicClient } from "@/lib/ai/anthropic-client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getBookingPracticeById } from "@/features/booking/actions/practice";
import { sendBookingConfirmationEmail } from "@/lib/email/send-booking-confirmation-email";
import { BookingRulesService, SupabaseSchedulingRepository } from "@/features/scheduling";
import { PUBLIC_ASSISTANT_TOOLS, executePublicAssistantTool } from "./tools";
import { findOwnedAppointment } from "./find-booking";
import type { ManageAppointmentProposal, NewBookingProposal, PublicAssistantMessage } from "./types";

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildSystemPrompt(practiceName: string): string {
  const today = todayISODate();
  return (
    `You are the booking assistant on ${practiceName}'s public booking page. You are talking to a visitor who ` +
    "is not logged in and may not be an existing patient. You can help them (a) book a new appointment, or " +
    "(b) look up, reschedule, or cancel an existing booking they already made — verified by their booking " +
    "reference (format IDP-XXXXXXXX) plus the email they used, never anything else. Never assume or guess a " +
    "reference or email; always ask for both before calling find_my_booking, propose_reschedule, or " +
    "propose_cancel. Only ever discuss this one practice — you have no knowledge of any other practice. Keep " +
    `replies short and concrete. Today's date is ${today}. Always resolve relative dates ("tomorrow", "next ` +
    'Tuesday") to an explicit yyyy-mm-dd and state the resolved date and day of the week back to the visitor ' +
    "in your own reply — before checking availability — so a misunderstood date is caught immediately. To book: " +
    "resolve the practitioner (list_practitioners), then the treatment for that practitioner " +
    "(list_treatments), confirm date/time with check_availability, collect their name/email/mobile number, " +
    "state everything back, then call propose_new_booking. To reschedule or cancel: call find_my_booking first " +
    "to confirm you have the right booking, then propose_reschedule or propose_cancel. None of the propose_* " +
    "tools book, change, or cancel anything by themselves — they only prepare a proposal. The visitor must " +
    "explicitly confirm it in the UI before anything actually happens; never tell them something is booked, " +
    "changed, or cancelled unless they've done that."
  );
}

// This flow needs more round-trips than a simple Q&A tool loop: resolving a
// practitioner, then a treatment, then availability, then the proposal
// itself is already 4 tool calls before the model can even reply with text.
const MAX_TOOL_ROUNDS = 8;

export async function askPublicAssistant(
  practiceId: string,
  history: PublicAssistantMessage[]
): Promise<PublicAssistantMessage> {
  let client: Anthropic;
  try {
    client = getAnthropicClient();
  } catch (err) {
    return {
      role: "assistant",
      content: err instanceof Error ? err.message : "The booking assistant isn't configured yet.",
    };
  }

  const practice = await getBookingPracticeById(practiceId);
  if (!practice) {
    return { role: "assistant", content: "This practice couldn't be found." };
  }

  const messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));

  let lastBookingProposal: NewBookingProposal | undefined;
  let lastManageProposal: ManageAppointmentProposal | undefined;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: buildSystemPrompt(practice.practiceName),
      tools: PUBLIC_ASSISTANT_TOOLS,
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
      return {
        role: "assistant",
        content: text || "I don't have an answer for that.",
        bookingProposal: lastBookingProposal,
        manageProposal: lastManageProposal,
      };
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUses.map(async (toolUse) => {
        let result: unknown;
        try {
          result = await executePublicAssistantTool(toolUse.name, toolUse.input as Record<string, unknown>, {
            practiceId,
            timezone: practice.timezone,
          });
          if (result && typeof result === "object") {
            if (toolUse.name === "propose_new_booking" && "proposal" in result) {
              lastBookingProposal = (result as { proposal: NewBookingProposal }).proposal;
            }
            if ((toolUse.name === "propose_reschedule" || toolUse.name === "propose_cancel") && "proposal" in result) {
              lastManageProposal = (result as { proposal: ManageAppointmentProposal }).proposal;
            }
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
    content: "I wasn't able to finish that — try asking something more specific.",
  };
}

export type ConfirmBookingResult = { ok: true; reference: string } | { ok: false; message: string };

async function findOrCreatePatient(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  practiceId: string,
  patient: NewBookingProposal["patient"]
): Promise<string> {
  const { data: existing } = await supabase
    .from("patients")
    .select("id")
    .eq("practice_id", practiceId)
    .eq("email", patient.email)
    .maybeSingle<{ id: string }>();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("patients")
    .insert({
      practice_id: practiceId,
      first_name: patient.firstName,
      last_name: patient.surname,
      email: patient.email,
      cellphone: patient.mobileNumber,
      notes: patient.notes,
    })
    .select("id")
    .single<{ id: string }>();
  if (error) throw new Error(`findOrCreatePatient failed: ${error.message}`);
  return created.id;
}

/**
 * The only code path that actually creates an appointment from this
 * feature — called by the UI when the visitor clicks "Confirm booking" on
 * a proposal card, never by the model. Re-validates the slot immediately
 * before inserting, same as submitBookingAction.
 */
export async function confirmNewBooking(
  practiceId: string,
  proposal: NewBookingProposal
): Promise<ConfirmBookingResult> {
  const practice = await getBookingPracticeById(practiceId);
  if (!practice) return { ok: false, message: "This practice couldn't be found." };

  const supabase = createSupabaseAdminClient();
  const bookingRules = new BookingRulesService(new SupabaseSchedulingRepository(supabase));
  const validation = await bookingRules.validateBooking({
    practitionerId: proposal.practitionerId,
    date: proposal.date,
    timezone: practice.timezone,
    startTime: proposal.startTime,
    durationMinutes: proposal.durationMinutes,
  });
  if (!validation.valid) {
    return { ok: false, message: validation.message ?? "That time is no longer available." };
  }

  let patientId: string;
  try {
    patientId = await findOrCreatePatient(supabase, practiceId, proposal.patient);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Failed to save your details." };
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
      notes: proposal.patient.notes,
    })
    .select("id, created_at")
    .single<{ id: string; created_at: string }>();

  if (insertError) {
    if (insertError.message.includes("appointments_no_overlap")) {
      return { ok: false, message: "That time was just booked by someone else — please choose another." };
    }
    return { ok: false, message: `Failed to confirm booking: ${insertError.message}` };
  }

  const reference = `IDP-${appointment.id.slice(0, 8).toUpperCase()}`;

  await Promise.all([
    (async () => {
      try {
        const { createGoogleCalendarServices } = await import(
          "@/features/integrations/google-calendar/services/container"
        );
        await createGoogleCalendarServices().calendarSyncService.onAppointmentCreated(appointment.id);
      } catch (err) {
        console.warn(`Google Calendar sync skipped for appointment ${appointment.id}:`, err);
      }
    })(),
    (async () => {
      try {
        await sendBookingConfirmationEmail({
          to: proposal.patient.email,
          patientFirstName: proposal.patient.firstName,
          practiceName: practice.practiceName,
          practitionerName: proposal.practitionerName,
          treatmentName: proposal.treatmentName,
          dateLabel: proposal.dateLabel,
          timeLabel: proposal.startTime,
          reference,
        });
      } catch (err) {
        console.warn(`Booking confirmation email skipped for reference ${reference}:`, err);
      }
    })(),
  ]);

  return { ok: true, reference };
}

async function syncCalendar(kind: "update" | "cancel", appointmentId: string): Promise<void> {
  try {
    const { createGoogleCalendarServices } = await import(
      "@/features/integrations/google-calendar/services/container"
    );
    const { calendarSyncService } = createGoogleCalendarServices();
    if (kind === "update") await calendarSyncService.onAppointmentUpdated(appointmentId);
    else await calendarSyncService.onAppointmentCancelled(appointmentId);
  } catch (err) {
    console.warn(`Google Calendar sync (${kind}) skipped for appointment ${appointmentId}:`, err);
  }
}

/**
 * The only code path that actually reschedules or cancels an appointment
 * from this feature — called by the UI on "Confirm", never by the model.
 * Re-verifies reference + email ownership again from scratch (the proposal
 * may be minutes old) before touching anything.
 */
export async function confirmManageAppointment(
  practiceId: string,
  proposal: ManageAppointmentProposal
): Promise<ConfirmBookingResult> {
  const supabase = createSupabaseAdminClient();

  const found = await findOwnedAppointment(supabase, practiceId, proposal.reference, proposal.verifiedEmail);
  if (!found || found.id !== proposal.appointmentId) {
    return { ok: false, message: "That booking couldn't be verified — please look it up again." };
  }
  if (found.status === "cancelled") {
    return { ok: false, message: "That booking has already been cancelled." };
  }

  if (proposal.action === "cancel") {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", found.id)
      .eq("practice_id", practiceId);
    if (error) return { ok: false, message: `Failed to cancel: ${error.message}` };
    await syncCalendar("cancel", found.id);
    return { ok: true, reference: proposal.reference };
  }

  // reschedule
  if (!proposal.newDate || !proposal.newStartTime || !proposal.newEndTime) {
    return { ok: false, message: "This proposal is missing the new time." };
  }

  const practice = await getBookingPracticeById(practiceId);
  if (!practice) return { ok: false, message: "This practice couldn't be found." };

  const bookingRules = new BookingRulesService(new SupabaseSchedulingRepository(supabase));
  const validation = await bookingRules.validateBooking({
    practitionerId: found.practitionerId,
    date: proposal.newDate,
    timezone: practice.timezone,
    startTime: proposal.newStartTime,
    durationMinutes: found.durationMinutes,
    excludeAppointmentId: found.id,
  });
  if (!validation.valid) {
    return { ok: false, message: validation.message ?? "That time is no longer available." };
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      appointment_date: proposal.newDate,
      start_time: proposal.newStartTime,
      end_time: proposal.newEndTime,
    })
    .eq("id", found.id)
    .eq("practice_id", practiceId);

  if (error) {
    if (error.message.includes("appointments_no_overlap")) {
      return { ok: false, message: "That time was just booked by someone else — please choose another." };
    }
    return { ok: false, message: `Failed to reschedule: ${error.message}` };
  }

  await syncCalendar("update", found.id);
  return { ok: true, reference: proposal.reference };
}
