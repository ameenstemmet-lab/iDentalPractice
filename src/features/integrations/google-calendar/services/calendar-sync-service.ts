import type { GoogleCalendarRepository } from "../repository/google-calendar-repository";
import type { AppointmentSyncDataSource } from "../repository/appointment-sync-datasource";
import { SyncQueueService } from "./sync-queue-service";
import { TokenRevokedError, type TokenRefreshService } from "./token-refresh-service";
import { GoogleApiError } from "../api/google-api-error";
import type { CalendarEventInput, CalendarProvider, SyncJob, SyncOperation } from "../types";

function toEventInput(payload: {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  timezone: string;
}): CalendarEventInput {
  return {
    summary: payload.summary,
    description: payload.description,
    start: payload.start,
    end: payload.end,
    timezone: payload.timezone,
  };
}

/**
 * Supabase is always authoritative — this service only ever pushes
 * Supabase's state *to* Google, never the reverse. Call
 * onAppointmentCreated/Updated/Cancelled right after the corresponding
 * write to `appointments` succeeds. Each call enqueues a durable job
 * (deduped automatically) and makes one best-effort inline attempt; a
 * failure here is not surfaced to the caller as an error — it's left
 * pending for SyncQueueService's retry sweep, per "retry automatically,
 * log the error, notify the administrator" rather than failing the
 * appointment write itself.
 *
 * `now` is accepted everywhere and threaded down to TokenRefreshService —
 * never implicitly read from the system clock inside this class — the
 * same testability discipline as the rest of this codebase.
 */
export class CalendarSyncService {
  private readonly syncQueue: SyncQueueService;

  constructor(
    private readonly repository: GoogleCalendarRepository,
    private readonly appointmentDataSource: AppointmentSyncDataSource,
    private readonly tokenRefreshService: TokenRefreshService,
    private readonly calendarProvider: CalendarProvider
  ) {
    this.syncQueue = new SyncQueueService(repository);
  }

  async onAppointmentCreated(appointmentId: string, now: Date = new Date()): Promise<void> {
    await this.enqueueAndAttempt(appointmentId, "create", now);
  }

  async onAppointmentUpdated(appointmentId: string, now: Date = new Date()): Promise<void> {
    await this.enqueueAndAttempt(appointmentId, "update", now);
  }

  async onAppointmentCancelled(appointmentId: string, now: Date = new Date()): Promise<void> {
    await this.enqueueAndAttempt(appointmentId, "cancel", now);
  }

  private async enqueueAndAttempt(appointmentId: string, operation: SyncOperation, now: Date): Promise<void> {
    const payload = await this.appointmentDataSource.getSyncPayload(appointmentId);
    if (!payload) return; // nothing to sync — appointment doesn't exist

    const connection =
      (await this.repository.getConnectionForPractitioner(payload.practiceId, payload.practitionerId)) ??
      (await this.repository.getConnectionForPractitioner(payload.practiceId, null));

    if (!connection || !connection.syncEnabled || connection.status !== "connected") {
      return; // no active connection — sync is a no-op, not a failure
    }

    const job = await this.syncQueue.enqueue({
      practiceId: payload.practiceId,
      appointmentId,
      connectionId: connection.id,
      operation,
    });
    if (!job) return; // deduped: an equivalent job is already pending/processing

    // Deliberately no `now` passed to processDue here: the job was just
    // enqueued with a real-time nextAttemptAt (see the repository), so
    // it's due right now regardless of what `now` this call was given —
    // that value is only for the token-expiry check inside processJob.
    await this.syncQueue.processDue((dueJob) => this.processJob(dueJob, now), 1);
  }

  private async processJob(job: SyncJob, now: Date): Promise<void> {
    const connection = await this.repository.getConnection(job.connectionId);
    if (!connection) {
      throw new Error(`Sync job ${job.id} references a missing connection ${job.connectionId}`);
    }

    const payload = await this.appointmentDataSource.getSyncPayload(job.appointmentId);
    if (!payload) {
      throw new Error(`Sync job ${job.id} references a missing appointment ${job.appointmentId}`);
    }

    let accessToken: string;
    try {
      accessToken = await this.tokenRefreshService.getValidAccessToken(job.connectionId, now);
    } catch (err) {
      if (err instanceof TokenRevokedError) {
        await this.repository.updateConnection(job.connectionId, { status: "error", lastError: err.message });
      }
      throw err;
    }
    const credentials = { accessToken };

    if (job.operation === "create") {
      const event = await this.calendarProvider.createEvent(
        credentials,
        connection.calendarId,
        job.appointmentId,
        toEventInput(payload)
      );
      await this.appointmentDataSource.setGoogleEventId(job.appointmentId, event.id);
      await this.repository.updateSyncJob(job.id, { googleEventId: event.id });
    } else if (job.operation === "update") {
      if (!payload.existingGoogleEventId) {
        // Nothing to update yet — this appointment never successfully synced. Create instead.
        const event = await this.calendarProvider.createEvent(
          credentials,
          connection.calendarId,
          job.appointmentId,
          toEventInput(payload)
        );
        await this.appointmentDataSource.setGoogleEventId(job.appointmentId, event.id);
      } else {
        try {
          await this.calendarProvider.updateEvent(
            credentials,
            connection.calendarId,
            payload.existingGoogleEventId,
            toEventInput(payload)
          );
        } catch (err) {
          if (err instanceof GoogleApiError && err.isNotFound) {
            // The event was deleted on Google's side — self-heal by
            // recreating it rather than retrying an update that can never
            // succeed. We never overwrite external state; this only
            // replaces an event that used to be ours.
            const event = await this.calendarProvider.createEvent(
              credentials,
              connection.calendarId,
              job.appointmentId,
              toEventInput(payload)
            );
            await this.appointmentDataSource.setGoogleEventId(job.appointmentId, event.id);
          } else {
            throw err;
          }
        }
      }
    } else {
      // cancel
      if (payload.existingGoogleEventId) {
        try {
          await this.calendarProvider.cancelEvent(credentials, connection.calendarId, payload.existingGoogleEventId);
        } catch (err) {
          // Already gone on Google's side — the goal ("this event is not
          // active") is already achieved, so this is success, not failure.
          if (!(err instanceof GoogleApiError && err.isNotFound)) throw err;
        }
      }
      // No event ever existed to cancel — nothing to do, not an error.
    }

    await this.repository.updateConnection(job.connectionId, { lastSyncedAt: now, lastError: null });
  }

  /** For the retry sweep — call this from a scheduled invocation (see README for the deployment note). */
  async processPendingJobs(limit = 20, now: Date = new Date()) {
    return this.syncQueue.processDue((job) => this.processJob(job, now), limit, now);
  }
}
