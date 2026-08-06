import { describe, expect, it } from "vitest";
import { findNextAvailableSlot } from "./next-available";
import { getDayOfWeek, windowToInterval } from "../utils/time-math";
import type { SchedulingContext } from "../types";

const TZ = "Africa/Johannesburg";

function contextFor(date: string, overrides: Partial<SchedulingContext> = {}): SchedulingContext {
  return {
    practitionerId: "d1",
    date,
    timezone: TZ,
    durationMinutes: 30,
    workingHours: {
      practitionerId: "d1",
      dayOfWeek: getDayOfWeek(date),
      isWorking: true,
      window: { startMinutes: 9 * 60, endMinutes: 10 * 60 }, // a deliberately tiny window: one 30-min slot
    },
    breaks: [],
    blockedPeriods: [],
    bookedAppointments: [],
    now: windowToInterval({ startMinutes: 0, endMinutes: 60 }, date, TZ).start,
    ...overrides,
  };
}

function fullyBooked(date: string): SchedulingContext {
  const bookedInterval = windowToInterval({ startMinutes: 9 * 60, endMinutes: 10 * 60 }, date, TZ);
  return contextFor(date, {
    bookedAppointments: [{ id: `booked-${date}`, practitionerId: "d1", interval: bookedInterval, status: "booked" }],
  });
}

describe("findNextAvailableSlot", () => {
  it("returns the first day's first available slot when it's free", () => {
    const result = findNextAvailableSlot([contextFor("2026-08-10")]);
    expect(result).toMatchObject({ date: "2026-08-10", time: "09:00" });
  });

  it("skips a fully booked day and returns the next day's slot — the spec's own example", () => {
    // "No appointments available on Tuesday. Next available: Wednesday 09:30" —
    // same shape, using an available 09:30 on day 2 instead (day 2's 09:00 also booked).
    const day1 = fullyBooked("2026-08-10");
    const day2 = contextFor("2026-08-11", {
      workingHours: {
        practitionerId: "d1",
        dayOfWeek: getDayOfWeek("2026-08-11"),
        isWorking: true,
        window: { startMinutes: 9 * 60, endMinutes: 10 * 60 + 30 },
      },
      bookedAppointments: [
        {
          id: "booked-day2",
          practitionerId: "d1",
          interval: windowToInterval({ startMinutes: 9 * 60, endMinutes: 9 * 60 + 30 }, "2026-08-11", TZ),
          status: "booked",
        },
      ],
    });

    const result = findNextAvailableSlot([day1, day2]);
    expect(result).toMatchObject({ date: "2026-08-11", time: "09:30" });
  });

  it("skips a non-working day", () => {
    const closed = contextFor("2026-08-09", {
      workingHours: { practitionerId: "d1", dayOfWeek: 0, isWorking: false, window: null },
    });
    const open = contextFor("2026-08-10");

    const result = findNextAvailableSlot([closed, open]);
    expect(result?.date).toBe("2026-08-10");
  });

  it("returns null when every context in the search window is full", () => {
    const result = findNextAvailableSlot([fullyBooked("2026-08-10"), fullyBooked("2026-08-11")]);
    expect(result).toBeNull();
  });

  it("returns null for an empty context list", () => {
    expect(findNextAvailableSlot([])).toBeNull();
  });
});
