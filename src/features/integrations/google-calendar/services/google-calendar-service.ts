import type { GoogleCalendarApiClient } from "../api/calendar-api-client";
import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarListEntry,
  CalendarProvider,
  ProviderCredentials,
} from "../types";

/**
 * The Google implementation of CalendarProvider. Deliberately thin — it
 * takes an already-valid access token (TokenRefreshService's job, not
 * this class's) and translates provider-agnostic calls into Google API
 * client calls. An OutlookCalendarService would have this exact shape.
 */
export class GoogleCalendarService implements CalendarProvider {
  readonly name = "google" as const;

  constructor(private readonly apiClient: GoogleCalendarApiClient) {}

  async listCalendars(credentials: ProviderCredentials): Promise<CalendarListEntry[]> {
    return this.apiClient.listCalendars(credentials.accessToken);
  }

  async createEvent(
    credentials: ProviderCredentials,
    calendarId: string,
    appointmentId: string,
    event: CalendarEventInput
  ): Promise<CalendarEvent> {
    return this.apiClient.insertEvent(credentials.accessToken, calendarId, appointmentId, event);
  }

  async updateEvent(
    credentials: ProviderCredentials,
    calendarId: string,
    eventId: string,
    event: CalendarEventInput
  ): Promise<CalendarEvent> {
    return this.apiClient.updateEvent(credentials.accessToken, calendarId, eventId, event);
  }

  async cancelEvent(credentials: ProviderCredentials, calendarId: string, eventId: string): Promise<void> {
    return this.apiClient.cancelEvent(credentials.accessToken, calendarId, eventId);
  }

  async listEvents(
    credentials: ProviderCredentials,
    calendarId: string,
    range: { start: Date; end: Date }
  ): Promise<CalendarEvent[]> {
    return this.apiClient.listEvents(credentials.accessToken, calendarId, range);
  }
}
