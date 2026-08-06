import { describe, expect, it } from "vitest";
import { SyncQueueService } from "./sync-queue-service";
import { InMemoryGoogleCalendarRepository } from "../testing/in-memory-google-calendar-repository";
import { MAX_SYNC_ATTEMPTS } from "../utils/backoff";

async function enqueueDueJob(repository: InMemoryGoogleCalendarRepository) {
  const job = await repository.enqueueSyncJob({
    practiceId: "practice-1",
    appointmentId: "appt-1",
    connectionId: "conn-1",
    operation: "create",
  });
  return job!;
}

describe("SyncQueueService.enqueue — deduplication", () => {
  it("returns null instead of a duplicate when an equivalent job is already pending", async () => {
    const repository = new InMemoryGoogleCalendarRepository();
    const service = new SyncQueueService(repository);

    const first = await service.enqueue({
      practiceId: "practice-1",
      appointmentId: "appt-1",
      connectionId: "conn-1",
      operation: "create",
    });
    const second = await service.enqueue({
      practiceId: "practice-1",
      appointmentId: "appt-1",
      connectionId: "conn-1",
      operation: "create",
    });

    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });
});

describe("SyncQueueService.processDue", () => {
  it("marks a job succeeded when the processor resolves", async () => {
    const repository = new InMemoryGoogleCalendarRepository();
    await enqueueDueJob(repository);
    const service = new SyncQueueService(repository);

    const result = await service.processDue(async () => {});

    expect(result).toEqual({ succeeded: 1, retried: 0, failed: 0 });
  });

  it("retries with backoff when the processor throws, below the attempt limit", async () => {
    const repository = new InMemoryGoogleCalendarRepository();
    const now = new Date("2026-08-06T10:00:00.000Z");
    const job = await enqueueDueJob(repository);
    // enqueueSyncJob timestamps nextAttemptAt with the real wall clock;
    // pin it to a known past instant so this test doesn't race real time.
    repository.seedJob({
      id: job.id,
      practiceId: "practice-1",
      appointmentId: "appt-1",
      connectionId: "conn-1",
      operation: "create",
      status: "pending",
      attempts: 0,
      nextAttemptAt: new Date(now.getTime() - 1000),
      lastError: null,
      googleEventId: null,
    });
    const service = new SyncQueueService(repository);

    const result = await service.processDue(async () => {
      throw new Error("network blip");
    }, 20, now);

    expect(result).toEqual({ succeeded: 0, retried: 1, failed: 0 });

    const updated = await repository.getDueSyncJobs(20, new Date(now.getTime() + 60 * 60 * 1000));
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe(job.id);
    expect(updated[0].attempts).toBe(1);
    expect(updated[0].lastError).toBe("network blip");
    expect(updated[0].nextAttemptAt.getTime()).toBeGreaterThan(now.getTime());
  });

  it("marks a job permanently failed once it exhausts the attempt limit", async () => {
    const repository = new InMemoryGoogleCalendarRepository();
    const job = await enqueueDueJob(repository);
    // Seed it already one attempt away from the limit.
    repository.seedJob({
      id: job.id,
      practiceId: "practice-1",
      appointmentId: "appt-1",
      connectionId: "conn-1",
      operation: "create",
      status: "pending",
      attempts: MAX_SYNC_ATTEMPTS - 1,
      nextAttemptAt: new Date("2026-08-06T09:00:00.000Z"),
      lastError: "previous failure",
      googleEventId: null,
    });
    const service = new SyncQueueService(repository);

    const result = await service.processDue(async () => {
      throw new Error("still failing");
    }, 20, new Date("2026-08-06T10:00:00.000Z"));

    expect(result).toEqual({ succeeded: 0, retried: 0, failed: 1 });
  });

  it("only processes jobs whose next_attempt_at has arrived", async () => {
    const repository = new InMemoryGoogleCalendarRepository();
    const job = await enqueueDueJob(repository);
    const future = new Date("2099-01-01T00:00:00.000Z");
    repository.seedJob({
      id: job.id,
      practiceId: "practice-1",
      appointmentId: "appt-1",
      connectionId: "conn-1",
      operation: "create",
      status: "pending",
      attempts: 1,
      nextAttemptAt: future,
      lastError: null,
      googleEventId: null,
    });
    const service = new SyncQueueService(repository);

    const result = await service.processDue(async () => {}, 20, new Date("2026-08-06T10:00:00.000Z"));

    expect(result).toEqual({ succeeded: 0, retried: 0, failed: 0 });
  });
});
