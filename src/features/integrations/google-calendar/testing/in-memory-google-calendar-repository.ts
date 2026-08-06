import { randomUUID } from "node:crypto";

import type { CalendarConnection, EncryptedTokenRecord, SyncJob } from "../types";
import type {
  ConnectionPatch,
  GoogleCalendarRepository,
  NewConnectionInput,
  NewSyncJobInput,
  SyncJobPatch,
} from "../repository/google-calendar-repository";

/** In-memory GoogleCalendarRepository for tests — no Supabase, no mocking. */
export class InMemoryGoogleCalendarRepository implements GoogleCalendarRepository {
  private connections = new Map<string, CalendarConnection>();
  private tokens = new Map<string, EncryptedTokenRecord>();
  private jobs = new Map<string, SyncJob>();

  async getConnection(connectionId: string): Promise<CalendarConnection | null> {
    return this.connections.get(connectionId) ?? null;
  }

  async getConnectionForPractitioner(practiceId: string, practitionerId: string | null): Promise<CalendarConnection | null> {
    for (const connection of this.connections.values()) {
      if (connection.practiceId === practiceId && connection.practitionerId === practitionerId) return connection;
    }
    return null;
  }

  async listConnections(practiceId: string): Promise<CalendarConnection[]> {
    return [...this.connections.values()].filter((c) => c.practiceId === practiceId);
  }

  async createConnection(input: NewConnectionInput): Promise<CalendarConnection> {
    const connection: CalendarConnection = {
      id: randomUUID(),
      practiceId: input.practiceId,
      practitionerId: input.practitionerId,
      provider: "google",
      accountEmail: input.accountEmail,
      calendarId: input.calendarId,
      calendarSummary: input.calendarSummary,
      status: "connected",
      syncEnabled: true,
      lastSyncedAt: null,
      lastError: null,
    };
    this.connections.set(connection.id, connection);
    return connection;
  }

  async updateConnection(connectionId: string, patch: ConnectionPatch): Promise<CalendarConnection> {
    const existing = this.connections.get(connectionId);
    if (!existing) throw new Error(`No connection with id ${connectionId}`);
    const updated: CalendarConnection = {
      ...existing,
      ...(patch.calendarId !== undefined ? { calendarId: patch.calendarId } : {}),
      ...(patch.calendarSummary !== undefined ? { calendarSummary: patch.calendarSummary } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.syncEnabled !== undefined ? { syncEnabled: patch.syncEnabled } : {}),
      ...(patch.lastSyncedAt !== undefined ? { lastSyncedAt: patch.lastSyncedAt } : {}),
      ...(patch.lastError !== undefined ? { lastError: patch.lastError } : {}),
    };
    this.connections.set(connectionId, updated);
    return updated;
  }

  async deleteConnection(connectionId: string): Promise<void> {
    this.connections.delete(connectionId);
    this.tokens.delete(connectionId);
  }

  async getTokens(connectionId: string): Promise<EncryptedTokenRecord | null> {
    return this.tokens.get(connectionId) ?? null;
  }

  async saveTokens(record: EncryptedTokenRecord): Promise<void> {
    this.tokens.set(record.connectionId, record);
  }

  async enqueueSyncJob(input: NewSyncJobInput): Promise<SyncJob | null> {
    const alreadyPending = [...this.jobs.values()].some(
      (job) =>
        job.appointmentId === input.appointmentId &&
        job.operation === input.operation &&
        (job.status === "pending" || job.status === "processing")
    );
    if (alreadyPending) return null;

    const job: SyncJob = {
      id: randomUUID(),
      practiceId: input.practiceId,
      appointmentId: input.appointmentId,
      connectionId: input.connectionId,
      operation: input.operation,
      status: "pending",
      attempts: 0,
      nextAttemptAt: new Date(),
      lastError: null,
      googleEventId: null,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  async getDueSyncJobs(limit: number, now: Date): Promise<SyncJob[]> {
    return [...this.jobs.values()]
      .filter((job) => job.status === "pending" && job.nextAttemptAt <= now)
      .sort((a, b) => a.nextAttemptAt.getTime() - b.nextAttemptAt.getTime())
      .slice(0, limit);
  }

  async updateSyncJob(jobId: string, patch: SyncJobPatch): Promise<SyncJob> {
    const existing = this.jobs.get(jobId);
    if (!existing) throw new Error(`No sync job with id ${jobId}`);
    const updated: SyncJob = {
      ...existing,
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.attempts !== undefined ? { attempts: patch.attempts } : {}),
      ...(patch.nextAttemptAt !== undefined ? { nextAttemptAt: patch.nextAttemptAt } : {}),
      ...(patch.lastError !== undefined ? { lastError: patch.lastError } : {}),
      ...(patch.googleEventId !== undefined ? { googleEventId: patch.googleEventId } : {}),
    };
    this.jobs.set(jobId, updated);
    return updated;
  }

  /** Test helper — not part of the interface. */
  seedJob(job: SyncJob) {
    this.jobs.set(job.id, job);
  }
}
