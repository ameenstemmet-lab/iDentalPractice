/**
 * Canonical types for the Google Calendar integration.
 *
 * `CalendarProvider` is the provider-agnostic seam: GoogleCalendarService
 * implements it today; an OutlookCalendarService or AppleCalendarService
 * would implement it tomorrow, and CalendarSyncService / ConflictDetectionService
 * would not change at all.
 */

export type CalendarProviderName = "google";

export type ConnectionStatus = "connected" | "error" | "disconnected";

export interface CalendarConnection {
  id: string;
  practiceId: string;
  /** Null = a practice-wide connection rather than one practitioner's own calendar. */
  practitionerId: string | null;
  provider: CalendarProviderName;
  accountEmail: string;
  calendarId: string;
  calendarSummary: string | null;
  status: ConnectionStatus;
  syncEnabled: boolean;
  lastSyncedAt: Date | null;
  lastError: string | null;
}

/** Decrypted, in-memory-only credentials — never persisted in this shape. */
export interface ProviderCredentials {
  accessToken: string;
}

/** As stored (encrypted) in google_calendar_tokens. */
export interface EncryptedTokenRecord {
  connectionId: string;
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  accessTokenExpiresAt: Date;
}

/** Decrypted token pair — exists only transiently in server memory. */
export interface DecryptedTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
}

export interface CalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  timezone: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  status: "confirmed" | "cancelled" | "tentative";
  /** True when this event carries our sync tag (extendedProperties.private) — see utils/event-tag.ts. */
  isOwnedByUs: boolean;
}

/**
 * Everything CalendarSyncService needs to build a calendar event, decoupled
 * from the appointments table's exact shape — the caller (outside this
 * module) assembles this from wherever appointment/patient/treatment data
 * actually lives, so this module never needs to know that schema.
 */
export interface AppointmentSyncPayload {
  appointmentId: string;
  practiceId: string;
  practitionerId: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  timezone: string;
  /** Whatever's currently stored in appointments.google_calendar_event_id — null if never synced. */
  existingGoogleEventId: string | null;
}

/**
 * The one interface every calendar provider implements. Nothing in
 * services/ (besides GoogleCalendarService itself) imports Google's SDK or
 * knows Google's REST shape — they call this.
 */
export interface CalendarProvider {
  readonly name: CalendarProviderName;
  listCalendars(credentials: ProviderCredentials): Promise<CalendarListEntry[]>;
  createEvent(
    credentials: ProviderCredentials,
    calendarId: string,
    appointmentId: string,
    event: CalendarEventInput
  ): Promise<CalendarEvent>;
  updateEvent(
    credentials: ProviderCredentials,
    calendarId: string,
    eventId: string,
    event: CalendarEventInput
  ): Promise<CalendarEvent>;
  /** Never hard-deletes by default — see CalendarSyncService for the cancel semantics. */
  cancelEvent(credentials: ProviderCredentials, calendarId: string, eventId: string): Promise<void>;
  listEvents(
    credentials: ProviderCredentials,
    calendarId: string,
    range: { start: Date; end: Date }
  ): Promise<CalendarEvent[]>;
}

export type SyncOperation = "create" | "update" | "cancel";
export type SyncJobStatus = "pending" | "processing" | "succeeded" | "failed";

export interface SyncJob {
  id: string;
  practiceId: string;
  appointmentId: string;
  connectionId: string;
  operation: SyncOperation;
  status: SyncJobStatus;
  attempts: number;
  nextAttemptAt: Date;
  lastError: string | null;
  googleEventId: string | null;
}

export interface OAuthStatePayload {
  practiceId: string;
  practitionerId: string | null;
  nonce: string;
  issuedAt: number;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingEvents: CalendarEvent[];
}
