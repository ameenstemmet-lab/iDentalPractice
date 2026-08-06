import type { SupabaseClient } from "@supabase/supabase-js";

import type { CalendarConnection, EncryptedTokenRecord, SyncJob } from "../types";
import type {
  ConnectionPatch,
  GoogleCalendarRepository,
  NewConnectionInput,
  NewSyncJobInput,
  SyncJobPatch,
} from "./google-calendar-repository";
import type {
  CalendarSyncQueueRow,
  GoogleCalendarConnectionRow,
  GoogleCalendarTokenRow,
} from "./database-types";

const POSTGRES_UNIQUE_VIOLATION = "23505";

function toConnection(row: GoogleCalendarConnectionRow): CalendarConnection {
  return {
    id: row.id,
    practiceId: row.practice_id,
    dentistId: row.dentist_id,
    provider: row.provider,
    accountEmail: row.google_account_email,
    calendarId: row.calendar_id,
    calendarSummary: row.calendar_summary,
    status: row.status,
    syncEnabled: row.sync_enabled,
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : null,
    lastError: row.last_error,
  };
}

function toSyncJob(row: CalendarSyncQueueRow): SyncJob {
  return {
    id: row.id,
    practiceId: row.practice_id,
    appointmentId: row.appointment_id,
    connectionId: row.connection_id,
    operation: row.operation,
    status: row.status,
    attempts: row.attempts,
    nextAttemptAt: new Date(row.next_attempt_at),
    lastError: row.last_error,
    googleEventId: row.google_event_id,
  };
}

/**
 * Production implementation. Expects a Supabase client authenticated with
 * the service-role key — google_calendar_tokens has no client-facing RLS
 * policy at all, so a regular anon/authenticated-scoped client could never
 * read or write it regardless.
 */
export class SupabaseGoogleCalendarRepository implements GoogleCalendarRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getConnection(connectionId: string): Promise<CalendarConnection | null> {
    const { data, error } = await this.client
      .from("google_calendar_connections")
      .select("*")
      .eq("id", connectionId)
      .maybeSingle<GoogleCalendarConnectionRow>();
    if (error) throw new Error(`getConnection failed: ${error.message}`);
    return data ? toConnection(data) : null;
  }

  async getConnectionForDentist(practiceId: string, dentistId: string | null): Promise<CalendarConnection | null> {
    let query = this.client
      .from("google_calendar_connections")
      .select("*")
      .eq("practice_id", practiceId);
    query = dentistId ? query.eq("dentist_id", dentistId) : query.is("dentist_id", null);

    const { data, error } = await query.maybeSingle<GoogleCalendarConnectionRow>();
    if (error) throw new Error(`getConnectionForDentist failed: ${error.message}`);
    return data ? toConnection(data) : null;
  }

  async listConnections(practiceId: string): Promise<CalendarConnection[]> {
    const { data, error } = await this.client
      .from("google_calendar_connections")
      .select("*")
      .eq("practice_id", practiceId);
    if (error) throw new Error(`listConnections failed: ${error.message}`);
    return (data as GoogleCalendarConnectionRow[] | null ?? []).map(toConnection);
  }

  async createConnection(input: NewConnectionInput): Promise<CalendarConnection> {
    const { data, error } = await this.client
      .from("google_calendar_connections")
      .insert({
        practice_id: input.practiceId,
        dentist_id: input.dentistId,
        google_account_email: input.accountEmail,
        calendar_id: input.calendarId,
        calendar_summary: input.calendarSummary,
      })
      .select("*")
      .single<GoogleCalendarConnectionRow>();
    if (error) throw new Error(`createConnection failed: ${error.message}`);
    return toConnection(data);
  }

  async updateConnection(connectionId: string, patch: ConnectionPatch): Promise<CalendarConnection> {
    const { data, error } = await this.client
      .from("google_calendar_connections")
      .update({
        ...(patch.calendarId !== undefined ? { calendar_id: patch.calendarId } : {}),
        ...(patch.calendarSummary !== undefined ? { calendar_summary: patch.calendarSummary } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.syncEnabled !== undefined ? { sync_enabled: patch.syncEnabled } : {}),
        ...(patch.lastSyncedAt !== undefined ? { last_synced_at: patch.lastSyncedAt?.toISOString() ?? null } : {}),
        ...(patch.lastError !== undefined ? { last_error: patch.lastError } : {}),
      })
      .eq("id", connectionId)
      .select("*")
      .single<GoogleCalendarConnectionRow>();
    if (error) throw new Error(`updateConnection failed: ${error.message}`);
    return toConnection(data);
  }

  async deleteConnection(connectionId: string): Promise<void> {
    const { error } = await this.client.from("google_calendar_connections").delete().eq("id", connectionId);
    if (error) throw new Error(`deleteConnection failed: ${error.message}`);
  }

  async getTokens(connectionId: string): Promise<EncryptedTokenRecord | null> {
    const { data, error } = await this.client
      .from("google_calendar_tokens")
      .select("*")
      .eq("connection_id", connectionId)
      .maybeSingle<GoogleCalendarTokenRow>();
    if (error) throw new Error(`getTokens failed: ${error.message}`);
    if (!data) return null;
    return {
      connectionId: data.connection_id,
      encryptedAccessToken: data.encrypted_access_token,
      encryptedRefreshToken: data.encrypted_refresh_token,
      accessTokenExpiresAt: new Date(data.access_token_expires_at),
    };
  }

  async saveTokens(record: EncryptedTokenRecord): Promise<void> {
    const { error } = await this.client.from("google_calendar_tokens").upsert(
      {
        connection_id: record.connectionId,
        encrypted_access_token: record.encryptedAccessToken,
        encrypted_refresh_token: record.encryptedRefreshToken,
        access_token_expires_at: record.accessTokenExpiresAt.toISOString(),
      },
      { onConflict: "connection_id" }
    );
    if (error) throw new Error(`saveTokens failed: ${error.message}`);
  }

  async enqueueSyncJob(input: NewSyncJobInput): Promise<SyncJob | null> {
    const { data, error } = await this.client
      .from("calendar_sync_queue")
      .insert({
        practice_id: input.practiceId,
        appointment_id: input.appointmentId,
        connection_id: input.connectionId,
        operation: input.operation,
      })
      .select("*")
      .single<CalendarSyncQueueRow>();

    if (error) {
      if (error.code === POSTGRES_UNIQUE_VIOLATION) {
        return null; // an equivalent pending/processing job already exists — not an error, just a no-op.
      }
      throw new Error(`enqueueSyncJob failed: ${error.message}`);
    }
    return toSyncJob(data);
  }

  async getDueSyncJobs(limit: number, now: Date): Promise<SyncJob[]> {
    const { data, error } = await this.client
      .from("calendar_sync_queue")
      .select("*")
      .eq("status", "pending")
      .lte("next_attempt_at", now.toISOString())
      .order("next_attempt_at", { ascending: true })
      .limit(limit);
    if (error) throw new Error(`getDueSyncJobs failed: ${error.message}`);
    return (data as CalendarSyncQueueRow[] | null ?? []).map(toSyncJob);
  }

  async updateSyncJob(jobId: string, patch: SyncJobPatch): Promise<SyncJob> {
    const { data, error } = await this.client
      .from("calendar_sync_queue")
      .update({
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.attempts !== undefined ? { attempts: patch.attempts } : {}),
        ...(patch.nextAttemptAt !== undefined ? { next_attempt_at: patch.nextAttemptAt.toISOString() } : {}),
        ...(patch.lastError !== undefined ? { last_error: patch.lastError } : {}),
        ...(patch.googleEventId !== undefined ? { google_event_id: patch.googleEventId } : {}),
      })
      .eq("id", jobId)
      .select("*")
      .single<CalendarSyncQueueRow>();
    if (error) throw new Error(`updateSyncJob failed: ${error.message}`);
    return toSyncJob(data);
  }
}
