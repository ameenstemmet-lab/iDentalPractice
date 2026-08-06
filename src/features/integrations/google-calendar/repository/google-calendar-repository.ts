import type {
  CalendarConnection,
  ConnectionStatus,
  EncryptedTokenRecord,
  SyncJob,
  SyncJobStatus,
  SyncOperation,
} from "../types";

export interface NewConnectionInput {
  practiceId: string;
  dentistId: string | null;
  accountEmail: string;
  calendarId: string;
  calendarSummary: string | null;
}

export interface ConnectionPatch {
  calendarId?: string;
  calendarSummary?: string | null;
  status?: ConnectionStatus;
  syncEnabled?: boolean;
  lastSyncedAt?: Date | null;
  lastError?: string | null;
}

export interface NewSyncJobInput {
  practiceId: string;
  appointmentId: string;
  connectionId: string;
  operation: SyncOperation;
}

export interface SyncJobPatch {
  status?: SyncJobStatus;
  attempts?: number;
  nextAttemptAt?: Date;
  lastError?: string | null;
  googleEventId?: string | null;
}

/**
 * The only boundary services/ depend on for reading/writing connections,
 * tokens, and sync jobs. Production wires in
 * SupabaseGoogleCalendarRepository (using the service-role client — these
 * tables have no client-facing RLS for tokens, and mutations happen
 * server-side regardless); tests wire in InMemoryGoogleCalendarRepository.
 */
export interface GoogleCalendarRepository {
  getConnection(connectionId: string): Promise<CalendarConnection | null>;
  /** dentistId: null looks up the practice-wide connection. */
  getConnectionForDentist(practiceId: string, dentistId: string | null): Promise<CalendarConnection | null>;
  listConnections(practiceId: string): Promise<CalendarConnection[]>;
  createConnection(input: NewConnectionInput): Promise<CalendarConnection>;
  updateConnection(connectionId: string, patch: ConnectionPatch): Promise<CalendarConnection>;
  deleteConnection(connectionId: string): Promise<void>;

  getTokens(connectionId: string): Promise<EncryptedTokenRecord | null>;
  saveTokens(record: EncryptedTokenRecord): Promise<void>;

  /** Returns null if an equivalent pending/processing job already exists (deduped, not an error). */
  enqueueSyncJob(input: NewSyncJobInput): Promise<SyncJob | null>;
  getDueSyncJobs(limit: number, now: Date): Promise<SyncJob[]>;
  updateSyncJob(jobId: string, patch: SyncJobPatch): Promise<SyncJob>;
}
