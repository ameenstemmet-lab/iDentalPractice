import { randomUUID } from "node:crypto";

import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarListEntry,
  CalendarProvider,
  ProviderCredentials,
} from "../types";
import { buildOwnershipExtendedProperties } from "../utils/event-tag";

/**
 * In-memory CalendarProvider for tests. Also doubles as a demonstration
 * that the CalendarProvider interface is genuinely provider-agnostic — an
 * Outlook or Apple Calendar implementation would look exactly like this
 * shape, swapped in without touching CalendarSyncService or
 * ConflictDetectionService.
 */
export class FakeCalendarProvider implements CalendarProvider {
  readonly name = "google" as const;
  events = new Map<string, CalendarEvent & { extendedProperties: ReturnType<typeof buildOwnershipExtendedProperties> }>();
  calendars: CalendarListEntry[] = [{ id: "primary", summary: "Primary Calendar", primary: true }];
  failNextCallWith: Error | null = null;

  private maybeThrow() {
    if (this.failNextCallWith) {
      const err = this.failNextCallWith;
      this.failNextCallWith = null;
      throw err;
    }
  }

  async listCalendars(_credentials: ProviderCredentials): Promise<CalendarListEntry[]> {
    void _credentials;
    this.maybeThrow();
    return this.calendars;
  }

  async createEvent(
    _credentials: ProviderCredentials,
    _calendarId: string,
    appointmentId: string,
    event: CalendarEventInput
  ): Promise<CalendarEvent> {
    this.maybeThrow();
    const id = randomUUID();
    const extendedProperties = buildOwnershipExtendedProperties(appointmentId);
    const record = {
      id,
      summary: event.summary,
      start: event.start,
      end: event.end,
      status: "confirmed" as const,
      isOwnedByUs: true,
      extendedProperties,
    };
    this.events.set(id, record);
    return record;
  }

  async updateEvent(
    _credentials: ProviderCredentials,
    _calendarId: string,
    eventId: string,
    event: CalendarEventInput
  ): Promise<CalendarEvent> {
    this.maybeThrow();
    const existing = this.events.get(eventId);
    if (!existing) throw new Error(`FakeCalendarProvider: no event ${eventId}`);
    const updated = { ...existing, summary: event.summary, start: event.start, end: event.end };
    this.events.set(eventId, updated);
    return updated;
  }

  async cancelEvent(_credentials: ProviderCredentials, _calendarId: string, eventId: string): Promise<void> {
    this.maybeThrow();
    const existing = this.events.get(eventId);
    if (!existing) throw new Error(`FakeCalendarProvider: no event ${eventId}`);
    this.events.set(eventId, { ...existing, status: "cancelled" });
  }

  async listEvents(
    _credentials: ProviderCredentials,
    _calendarId: string,
    range: { start: Date; end: Date }
  ): Promise<CalendarEvent[]> {
    this.maybeThrow();
    return [...this.events.values()].filter((e) => e.start < range.end && e.end > range.start);
  }

  /** Test helper — seed an event that Google "already has" (an external event we didn't create). */
  seedExternalEvent(event: CalendarEvent) {
    this.events.set(event.id, { ...event, extendedProperties: {} });
  }
}
