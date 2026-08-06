/**
 * Thin client for the Google Calendar REST API — calendarList and events
 * only, nothing more. No orchestration, no token refresh logic, no
 * storage. Injectable fetch for hermetic testing.
 *
 * Update deliberately uses PATCH, not PUT: a PUT replaces the whole event
 * resource, which would silently strip extendedProperties (our ownership
 * tag, see utils/event-tag.ts) unless it were re-sent on every update.
 * PATCH only touches the fields provided, so the tag set at creation time
 * survives every subsequent update for free.
 */
import { GoogleApiError } from "./google-api-error";
import { isOwnedByUs } from "../utils/event-tag";
import type { CalendarEvent, CalendarEventInput, CalendarListEntry } from "../types";

const BASE_URL = "https://www.googleapis.com/calendar/v3";

export interface CalendarApiClientConfig {
  fetchImpl?: typeof fetch;
}

interface RawGoogleEvent {
  id: string;
  summary?: string;
  status: "confirmed" | "cancelled" | "tentative";
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  extendedProperties?: { private?: Record<string, string> };
}

interface RawGoogleErrorBody {
  error?: { message?: string; errors?: Array<{ reason?: string }> };
}

function toCalendarEvent(raw: RawGoogleEvent): CalendarEvent {
  return {
    id: raw.id,
    summary: raw.summary ?? "",
    start: new Date(raw.start.dateTime ?? raw.start.date ?? ""),
    end: new Date(raw.end.dateTime ?? raw.end.date ?? ""),
    status: raw.status,
    isOwnedByUs: isOwnedByUs(raw.extendedProperties),
  };
}

function toGoogleEventBody(event: CalendarEventInput) {
  return {
    summary: event.summary,
    description: event.description,
    start: { dateTime: event.start.toISOString(), timeZone: event.timezone },
    end: { dateTime: event.end.toISOString(), timeZone: event.timezone },
  };
}

async function request<T>(
  fetchImpl: typeof fetch,
  accessToken: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetchImpl(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => ({}))) as RawGoogleErrorBody & T;

  if (!response.ok) {
    const reason = body?.error?.errors?.[0]?.reason;
    const retryAfterHeader = response.headers.get("Retry-After");
    throw new GoogleApiError(
      body?.error?.message ?? `Google Calendar API request failed (${response.status})`,
      response.status,
      reason,
      retryAfterHeader ? Number(retryAfterHeader) : undefined
    );
  }

  return body;
}

export class GoogleCalendarApiClient {
  private readonly fetchImpl: typeof fetch;

  constructor(config: CalendarApiClientConfig = {}) {
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async listCalendars(accessToken: string): Promise<CalendarListEntry[]> {
    const result = await request<{ items: CalendarListEntry[] }>(
      this.fetchImpl,
      accessToken,
      "/users/me/calendarList"
    );
    return result.items ?? [];
  }

  async insertEvent(
    accessToken: string,
    calendarId: string,
    appointmentId: string,
    event: CalendarEventInput
  ): Promise<CalendarEvent> {
    const raw = await request<RawGoogleEvent>(
      this.fetchImpl,
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        body: JSON.stringify({
          ...toGoogleEventBody(event),
          extendedProperties: { private: { idp_appointment_id: appointmentId } },
        }),
      }
    );
    return toCalendarEvent(raw);
  }

  /** PATCH, not PUT — see file-level comment. */
  async updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    event: CalendarEventInput
  ): Promise<CalendarEvent> {
    const raw = await request<RawGoogleEvent>(
      this.fetchImpl,
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: "PATCH", body: JSON.stringify(toGoogleEventBody(event)) }
    );
    return toCalendarEvent(raw);
  }

  /** Marks the event cancelled rather than hard-deleting — recoverable, and shows clearly in Google Calendar's UI. */
  async cancelEvent(accessToken: string, calendarId: string, eventId: string): Promise<void> {
    await request<void>(
      this.fetchImpl,
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: "PATCH", body: JSON.stringify({ status: "cancelled" }) }
    );
  }

  async listEvents(
    accessToken: string,
    calendarId: string,
    range: { start: Date; end: Date }
  ): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
      timeMin: range.start.toISOString(),
      timeMax: range.end.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
    });
    const result = await request<{ items: RawGoogleEvent[] }>(
      this.fetchImpl,
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
    );
    return (result.items ?? []).map(toCalendarEvent);
  }
}
