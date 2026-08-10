import "server-only";
import Anthropic from "@anthropic-ai/sdk";

import { listAppointments } from "@/features/reception/appointments/actions";
import type { AppointmentStatus } from "@/features/reception/appointments/types";
import { searchPatients } from "@/features/reception/patients/actions";
import { listPractitioners } from "@/features/reception/practitioners/actions";
import { listTreatments } from "@/features/reception/treatments/actions";
import { getDashboardStats, getRecentActivity } from "@/features/reception/dashboard/actions";
import type { CurrentSession } from "@/lib/auth/session";

// Read-only by design: the assistant can look things up, but every write
// (booking, rescheduling, cancelling) still goes through the existing
// dashboard UI, where a human confirms it. Keeps the blast radius of a
// misread instruction to "wrong answer," never "wrong action."
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
      "The practice's practitioners (the people who see patients), with id, name, title, profession, and whether they're currently active. Call this before list_appointments if you need to filter by a specific practitioner's name.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_treatments",
    description: "The treatment types the practice offers, with price and duration. Practice staff only.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "search_patients",
    description: "Search the practice's patients by name, cellphone, or email.",
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
];

interface ToolExecutionContext {
  practiceId: string;
  session: CurrentSession;
}

function clampLimit(value: unknown, fallback: number, max: number): number {
  const n = typeof value === "number" ? value : fallback;
  return Math.min(Math.max(1, Math.round(n)), max);
}

/**
 * Runs one assistant-requested tool call. `ctx.session` is the caller's own
 * verified session (never client-supplied) — practitioner-role sessions
 * inherit the same "own diary only" narrowing that listAppointments already
 * applies everywhere else in the app, so the assistant can't be talked into
 * showing one practitioner another's patients.
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

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
