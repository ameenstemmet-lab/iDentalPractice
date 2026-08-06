/** Hand-written row shapes matching supabase/migrations/20260806100010_create_google_calendar_tables.sql. */

export interface GoogleCalendarConnectionRow {
  id: string;
  practice_id: string;
  practitioner_id: string | null;
  provider: "google";
  google_account_email: string;
  calendar_id: string;
  calendar_summary: string | null;
  status: "connected" | "error" | "disconnected";
  sync_enabled: boolean;
  last_synced_at: string | null;
  last_error: string | null;
}

export interface GoogleCalendarTokenRow {
  connection_id: string;
  encrypted_access_token: string;
  encrypted_refresh_token: string;
  access_token_expires_at: string;
}

export interface CalendarSyncQueueRow {
  id: string;
  practice_id: string;
  appointment_id: string;
  connection_id: string;
  operation: "create" | "update" | "cancel";
  status: "pending" | "processing" | "succeeded" | "failed";
  attempts: number;
  next_attempt_at: string;
  last_error: string | null;
  google_event_id: string | null;
}
