import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPractitionersAction, getTreatmentsAction } from "@/features/booking/actions/catalog-actions";
import { formatDateLong } from "@/features/booking/utils/format";
import { AvailabilityService, BookingRulesService, SupabaseSchedulingRepository } from "@/features/scheduling";
import { calculateEndTime } from "@/features/scheduling/utils/time-math";
import { findOwnedAppointment } from "./find-booking";
import type { ManageAppointmentProposal, NewBookingProposal } from "./types";

// Nothing here writes to the database. propose_new_booking / propose_reschedule
// / propose_cancel all validate and return a proposal for the visitor to
// confirm explicitly in the UI — the actual writes live in actions.ts's
// confirmNewBooking/confirmManageAppointment, which are never callable by the
// model, only by a "Confirm" button click. Ownership of an existing booking
// is verified fresh (reference + email, both required) on every call that
// touches it, never assumed from an earlier step.
export const PUBLIC_ASSISTANT_TOOLS: Anthropic.Tool[] = [
  {
    name: "list_practitioners",
    description: "The practice's practitioners available for booking, with id, name, title, and profession.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_treatments",
    description:
      "The treatments a specific practitioner offers, with id, name, price, and duration. Treatments are scoped per practitioner — always call this after the visitor has picked a practitioner, using that practitioner's id.",
    input_schema: {
      type: "object",
      properties: {
        practitionerId: { type: "string", description: "From list_practitioners." },
      },
      required: ["practitionerId"],
    },
  },
  {
    name: "check_availability",
    description: "Free time slots for a practitioner on a given date, for a given treatment's duration.",
    input_schema: {
      type: "object",
      properties: {
        practitionerId: { type: "string" },
        treatmentId: { type: "string", description: "From list_treatments — its duration is used to compute free slots." },
        date: { type: "string", description: "yyyy-mm-dd." },
      },
      required: ["practitionerId", "treatmentId", "date"],
    },
  },
  {
    name: "propose_new_booking",
    description:
      "Check a specific slot is available and prepare a new-booking proposal for the visitor to confirm. Never books anything itself. " +
      "Always state the resolved date and day of the week back to the visitor in your own reply before calling this, so a misunderstood date is caught immediately.",
    input_schema: {
      type: "object",
      properties: {
        practitionerId: { type: "string" },
        treatmentId: { type: "string" },
        date: { type: "string", description: "yyyy-mm-dd." },
        startTime: { type: "string", description: "HH:mm, 24-hour." },
        firstName: { type: "string" },
        surname: { type: "string" },
        email: { type: "string" },
        mobileNumber: { type: "string" },
        notes: { type: "string" },
      },
      required: ["practitionerId", "treatmentId", "date", "startTime", "firstName", "surname", "email", "mobileNumber"],
    },
  },
  {
    name: "find_my_booking",
    description:
      "Look up an existing booking by its reference (format IDP-XXXXXXXX, shown on the confirmation screen/email) and the email address used when it was booked. Both are required — returns nothing if either doesn't match. Use this before offering to reschedule or cancel anything.",
    input_schema: {
      type: "object",
      properties: {
        reference: { type: "string" },
        email: { type: "string" },
      },
      required: ["reference", "email"],
    },
  },
  {
    name: "propose_reschedule",
    description:
      "Check a new slot is available for an existing booking and prepare a reschedule proposal. Re-verifies the reference + email match before doing anything. Never changes the booking itself — only the visitor confirming in the UI does that.",
    input_schema: {
      type: "object",
      properties: {
        reference: { type: "string" },
        email: { type: "string" },
        newDate: { type: "string", description: "yyyy-mm-dd." },
        newStartTime: { type: "string", description: "HH:mm, 24-hour." },
      },
      required: ["reference", "email", "newDate", "newStartTime"],
    },
  },
  {
    name: "propose_cancel",
    description:
      "Prepare a cancellation proposal for an existing booking. Re-verifies the reference + email match before doing anything. Never cancels the booking itself — only the visitor confirming in the UI does that.",
    input_schema: {
      type: "object",
      properties: {
        reference: { type: "string" },
        email: { type: "string" },
      },
      required: ["reference", "email"],
    },
  },
];

interface ToolExecutionContext {
  practiceId: string;
  timezone: string;
}

async function getTreatmentById(
  supabase: SupabaseClient,
  practiceId: string,
  treatmentId: string
): Promise<{ id: string; name: string; price: number; durationMinutes: number } | null> {
  const { data } = await supabase
    .from("treatment_types")
    .select("id, treatment_name, price, duration_minutes")
    .eq("practice_id", practiceId)
    .eq("id", treatmentId)
    .eq("active", true)
    .maybeSingle<{ id: string; treatment_name: string; price: number; duration_minutes: number }>();
  if (!data) return null;
  return { id: data.id, name: data.treatment_name, price: data.price, durationMinutes: data.duration_minutes };
}

async function getPractitionerName(
  supabase: SupabaseClient,
  practiceId: string,
  practitionerId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("practitioners")
    .select("first_name, last_name, title")
    .eq("practice_id", practiceId)
    .eq("id", practitionerId)
    .eq("active", true)
    .maybeSingle<{ first_name: string; last_name: string; title: string | null }>();
  if (!data) return null;
  return `${data.title ? `${data.title} ` : ""}${data.first_name} ${data.last_name}`;
}

export async function executePublicAssistantTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolExecutionContext
): Promise<unknown> {
  const supabase = createSupabaseAdminClient();

  switch (name) {
    case "list_practitioners":
      return getPractitionersAction(ctx.practiceId);

    case "list_treatments": {
      const practitionerId = typeof input.practitionerId === "string" ? input.practitionerId : "";
      if (!practitionerId) return { error: "practitionerId is required." };
      return getTreatmentsAction(ctx.practiceId, practitionerId);
    }

    case "check_availability": {
      const practitionerId = typeof input.practitionerId === "string" ? input.practitionerId : "";
      const treatmentId = typeof input.treatmentId === "string" ? input.treatmentId : "";
      const date = typeof input.date === "string" ? input.date : "";
      if (!practitionerId || !treatmentId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return { error: "practitionerId, treatmentId, and a yyyy-mm-dd date are required." };
      }
      const treatment = await getTreatmentById(supabase, ctx.practiceId, treatmentId);
      if (!treatment) return { error: "Unknown treatmentId — call list_treatments first." };

      const availability = new AvailabilityService(new SupabaseSchedulingRepository(supabase));
      const day = await availability.getDayAvailability({
        practitionerId,
        date,
        timezone: ctx.timezone,
        durationMinutes: treatment.durationMinutes,
      });
      return {
        date,
        dateLabel: formatDateLong(date),
        isWorkingDay: day.isWorkingDay,
        availableTimes: day.slots.filter((s) => s.available).map((s) => s.time),
      };
    }

    case "propose_new_booking": {
      const practitionerId = typeof input.practitionerId === "string" ? input.practitionerId : "";
      const treatmentId = typeof input.treatmentId === "string" ? input.treatmentId : "";
      const date = typeof input.date === "string" ? input.date : "";
      const startTime = typeof input.startTime === "string" ? input.startTime : "";
      const firstName = typeof input.firstName === "string" ? input.firstName.trim() : "";
      const surname = typeof input.surname === "string" ? input.surname.trim() : "";
      const email = typeof input.email === "string" ? input.email.trim() : "";
      const mobileNumber = typeof input.mobileNumber === "string" ? input.mobileNumber.trim() : "";
      const notes = typeof input.notes === "string" ? input.notes.trim() : "";

      if (!practitionerId || !treatmentId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !startTime) {
        return { error: "practitionerId, treatmentId, date (yyyy-mm-dd), and startTime are all required." };
      }
      if (!firstName || !surname || !email || !mobileNumber) {
        return { error: "firstName, surname, email, and mobileNumber are all required to book." };
      }

      const [practitionerName, treatment] = await Promise.all([
        getPractitionerName(supabase, ctx.practiceId, practitionerId),
        getTreatmentById(supabase, ctx.practiceId, treatmentId),
      ]);
      if (!practitionerName) return { error: "Unknown practitionerId — call list_practitioners first." };
      if (!treatment) return { error: "Unknown treatmentId — call list_treatments first." };

      const bookingRules = new BookingRulesService(new SupabaseSchedulingRepository(supabase));
      const validation = await bookingRules.validateBooking({
        practitionerId,
        date,
        timezone: ctx.timezone,
        startTime,
        durationMinutes: treatment.durationMinutes,
      });
      if (!validation.valid) return { error: validation.message ?? "That time isn't available." };

      const proposal: NewBookingProposal = {
        practitionerId,
        practitionerName,
        treatmentId,
        treatmentName: treatment.name,
        treatmentPrice: treatment.price,
        durationMinutes: treatment.durationMinutes,
        date,
        dateLabel: formatDateLong(date),
        startTime,
        endTime: calculateEndTime(startTime, treatment.durationMinutes),
        patient: { firstName, surname, email, mobileNumber, notes: notes || null },
      };
      return { proposal };
    }

    case "find_my_booking": {
      const reference = typeof input.reference === "string" ? input.reference : "";
      const email = typeof input.email === "string" ? input.email : "";
      const found = await findOwnedAppointment(supabase, ctx.practiceId, reference, email);
      if (!found) return { error: "No booking found matching that reference and email." };
      if (found.status === "cancelled") {
        return { error: "That booking has already been cancelled." };
      }
      return {
        reference: `IDP-${found.id.slice(0, 8).toUpperCase()}`,
        practitionerName: found.practitionerName,
        treatmentName: found.treatmentName,
        date: found.date,
        dateLabel: formatDateLong(found.date),
        startTime: found.startTime,
        endTime: found.endTime,
        status: found.status,
      };
    }

    case "propose_reschedule": {
      const reference = typeof input.reference === "string" ? input.reference : "";
      const email = typeof input.email === "string" ? input.email : "";
      const newDate = typeof input.newDate === "string" ? input.newDate : "";
      const newStartTime = typeof input.newStartTime === "string" ? input.newStartTime : "";
      if (!reference || !email || !/^\d{4}-\d{2}-\d{2}$/.test(newDate) || !newStartTime) {
        return { error: "reference, email, newDate (yyyy-mm-dd), and newStartTime are all required." };
      }

      const found = await findOwnedAppointment(supabase, ctx.practiceId, reference, email);
      if (!found) return { error: "No booking found matching that reference and email." };
      if (found.status === "cancelled") return { error: "That booking has already been cancelled." };

      const bookingRules = new BookingRulesService(new SupabaseSchedulingRepository(supabase));
      const validation = await bookingRules.validateBooking({
        practitionerId: found.practitionerId,
        date: newDate,
        timezone: ctx.timezone,
        startTime: newStartTime,
        durationMinutes: found.durationMinutes,
        excludeAppointmentId: found.id,
      });
      if (!validation.valid) return { error: validation.message ?? "That time isn't available." };

      const proposal: ManageAppointmentProposal = {
        action: "reschedule",
        appointmentId: found.id,
        reference: `IDP-${found.id.slice(0, 8).toUpperCase()}`,
        verifiedEmail: email.trim().toLowerCase(),
        practitionerName: found.practitionerName,
        treatmentName: found.treatmentName,
        currentDateLabel: formatDateLong(found.date),
        currentStartTime: found.startTime,
        currentEndTime: found.endTime,
        newDate,
        newDateLabel: formatDateLong(newDate),
        newStartTime,
        newEndTime: calculateEndTime(newStartTime, found.durationMinutes),
      };
      return { proposal };
    }

    case "propose_cancel": {
      const reference = typeof input.reference === "string" ? input.reference : "";
      const email = typeof input.email === "string" ? input.email : "";
      if (!reference || !email) return { error: "reference and email are both required." };

      const found = await findOwnedAppointment(supabase, ctx.practiceId, reference, email);
      if (!found) return { error: "No booking found matching that reference and email." };
      if (found.status === "cancelled") return { error: "That booking has already been cancelled." };

      const proposal: ManageAppointmentProposal = {
        action: "cancel",
        appointmentId: found.id,
        reference: `IDP-${found.id.slice(0, 8).toUpperCase()}`,
        verifiedEmail: email.trim().toLowerCase(),
        practitionerName: found.practitionerName,
        treatmentName: found.treatmentName,
        currentDateLabel: formatDateLong(found.date),
        currentStartTime: found.startTime,
        currentEndTime: found.endTime,
      };
      return { proposal };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
