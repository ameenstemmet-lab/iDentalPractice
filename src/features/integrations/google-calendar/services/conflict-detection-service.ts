import type { GoogleCalendarRepository } from "../repository/google-calendar-repository";
import type { TokenRefreshService } from "./token-refresh-service";
import type { CalendarProvider, ConflictCheckResult } from "../types";

/**
 * Checks a practitioner's connected Google Calendar for events that would
 * conflict with a proposed appointment slot — events on their *personal*
 * calendar that this system doesn't know about (a practitioner's own doctor's
 * appointment, school pickup, etc). Our own synced appointments are
 * excluded via the ownership tag (see utils/event-tag.ts), so an
 * appointment never "conflicts" with its own calendar event.
 *
 * This is deliberately a standalone capability, not wired into
 * features/scheduling's SchedulingRepository — that module must not be
 * modified. A future orchestration layer can call both and combine the
 * results; this service only answers "does Google know about anything
 * external here."
 */
export class ConflictDetectionService {
  constructor(
    private readonly repository: GoogleCalendarRepository,
    private readonly tokenRefreshService: TokenRefreshService,
    private readonly calendarProvider: CalendarProvider
  ) {}

  async findExternalConflicts(
    practiceId: string,
    practitionerId: string | null,
    range: { start: Date; end: Date },
    now: Date = new Date()
  ): Promise<ConflictCheckResult> {
    const connection =
      (await this.repository.getConnectionForPractitioner(practiceId, practitionerId)) ??
      (await this.repository.getConnectionForPractitioner(practiceId, null));

    if (!connection || !connection.syncEnabled || connection.status !== "connected") {
      return { hasConflict: false, conflictingEvents: [] };
    }

    const accessToken = await this.tokenRefreshService.getValidAccessToken(connection.id, now);
    const events = await this.calendarProvider.listEvents({ accessToken }, connection.calendarId, range);

    const conflictingEvents = events.filter((event) => !event.isOwnedByUs && event.status !== "cancelled");

    return { hasConflict: conflictingEvents.length > 0, conflictingEvents };
  }
}
