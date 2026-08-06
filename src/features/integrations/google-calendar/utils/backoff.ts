/** Deterministic exponential backoff for sync job retries. */

export const MAX_SYNC_ATTEMPTS = 8;
const BASE_DELAY_MS = 30_000; // 30s
const MAX_DELAY_MS = 60 * 60 * 1000; // capped at 1 hour

/** Delay before attempt N (1-indexed) — attempt 1 fires immediately. */
export function calculateBackoffDelayMs(attempt: number): number {
  if (attempt <= 1) return 0;
  return Math.min(BASE_DELAY_MS * 2 ** (attempt - 2), MAX_DELAY_MS);
}

export function nextAttemptAt(attempt: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + calculateBackoffDelayMs(attempt));
}

export function hasExceededMaxAttempts(attempts: number): boolean {
  return attempts >= MAX_SYNC_ATTEMPTS;
}
