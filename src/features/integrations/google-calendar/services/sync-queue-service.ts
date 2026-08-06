import type { GoogleCalendarRepository, NewSyncJobInput } from "../repository/google-calendar-repository";
import type { SyncJob } from "../types";
import { hasExceededMaxAttempts, nextAttemptAt } from "../utils/backoff";

export type SyncJobProcessor = (job: SyncJob) => Promise<void>;

export interface ProcessDueResult {
  succeeded: number;
  retried: number;
  failed: number;
}

/**
 * The outbox processor. `enqueue` is dedup-safe (the repository's unique
 * index on pending/processing jobs makes a duplicate enqueue a no-op, not
 * an error). `processDue` drains due jobs through an injected processor —
 * this file has no idea what a processor actually does (call Google,
 * write to Supabase, whatever); it only owns retry/backoff/failure
 * bookkeeping, so it's testable with a fake processor and no network.
 */
export class SyncQueueService {
  constructor(private readonly repository: GoogleCalendarRepository) {}

  async enqueue(input: NewSyncJobInput): Promise<SyncJob | null> {
    return this.repository.enqueueSyncJob(input);
  }

  async processDue(
    processor: SyncJobProcessor,
    limit = 20,
    now: Date = new Date()
  ): Promise<ProcessDueResult> {
    const jobs = await this.repository.getDueSyncJobs(limit, now);
    const result: ProcessDueResult = { succeeded: 0, retried: 0, failed: 0 };

    for (const job of jobs) {
      await this.repository.updateSyncJob(job.id, { status: "processing" });

      try {
        await processor(job);
        await this.repository.updateSyncJob(job.id, { status: "succeeded", lastError: null });
        result.succeeded += 1;
      } catch (err) {
        const attempts = job.attempts + 1;
        const message = err instanceof Error ? err.message : String(err);

        if (hasExceededMaxAttempts(attempts)) {
          await this.repository.updateSyncJob(job.id, { status: "failed", attempts, lastError: message });
          result.failed += 1;
        } else {
          await this.repository.updateSyncJob(job.id, {
            status: "pending",
            attempts,
            // `attempts` counts tries already made; the delay is for the
            // *upcoming* one, i.e. attempt number `attempts + 1` — passing
            // `attempts` here would give the first retry a zero delay.
            nextAttemptAt: nextAttemptAt(attempts + 1, now),
            lastError: message,
          });
          result.retried += 1;
        }
      }
    }

    return result;
  }
}
