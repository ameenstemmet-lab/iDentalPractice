import { describe, expect, it } from "vitest";
import { MAX_SYNC_ATTEMPTS, calculateBackoffDelayMs, hasExceededMaxAttempts, nextAttemptAt } from "./backoff";

describe("calculateBackoffDelayMs", () => {
  it("fires the first attempt immediately", () => {
    expect(calculateBackoffDelayMs(1)).toBe(0);
    expect(calculateBackoffDelayMs(0)).toBe(0);
  });

  it("doubles the delay on each subsequent attempt", () => {
    const d2 = calculateBackoffDelayMs(2);
    const d3 = calculateBackoffDelayMs(3);
    const d4 = calculateBackoffDelayMs(4);
    expect(d3).toBe(d2 * 2);
    expect(d4).toBe(d3 * 2);
  });

  it("caps the delay at one hour instead of growing unbounded", () => {
    const ONE_HOUR_MS = 60 * 60 * 1000;
    expect(calculateBackoffDelayMs(20)).toBe(ONE_HOUR_MS);
    expect(calculateBackoffDelayMs(50)).toBe(ONE_HOUR_MS);
  });
});

describe("nextAttemptAt", () => {
  it("adds the backoff delay to the given `now`", () => {
    const now = new Date("2026-08-06T10:00:00.000Z");
    const result = nextAttemptAt(2, now);
    expect(result.getTime()).toBe(now.getTime() + calculateBackoffDelayMs(2));
  });
});

describe("hasExceededMaxAttempts", () => {
  it("is false below the max, true at and above it", () => {
    expect(hasExceededMaxAttempts(MAX_SYNC_ATTEMPTS - 1)).toBe(false);
    expect(hasExceededMaxAttempts(MAX_SYNC_ATTEMPTS)).toBe(true);
    expect(hasExceededMaxAttempts(MAX_SYNC_ATTEMPTS + 5)).toBe(true);
  });
});
