import { describe, expect, it } from "vitest";
import { generateDailySlots, generateWeeklySlots } from "./slot-generator";
import { windowToInterval } from "../utils/time-math";
import type { SchedulingContext } from "../types";

const TZ = "Africa/Johannesburg";
const DATE = "2026-08-06"; // Thursday

function baseContext(overrides: Partial<SchedulingContext> = {}): SchedulingContext {
  return {
    dentistId: "d1",
    date: DATE,
    timezone: TZ,
    durationMinutes: 30,
    workingHours: {
      dentistId: "d1",
      dayOfWeek: 4,
      isWorking: true,
      window: { startMinutes: 8 * 60, endMinutes: 17 * 60 },
    },
    breaks: [],
    blockedPeriods: [],
    bookedAppointments: [],
    now: windowToInterval({ startMinutes: 0, endMinutes: 60 }, DATE, TZ).start,
    ...overrides,
  };
}

describe("generateDailySlots — the spec's own example", () => {
  it("08:00–17:00 in 30-minute steps starts 08:00, 08:30, 09:00, 09:30, 10:00 ...", () => {
    const slots = generateDailySlots(baseContext());
    expect(slots.slice(0, 5).map((s) => s.time)).toEqual(["08:00", "08:30", "09:00", "09:30", "10:00"]);
  });

  it("generates exactly the number of 30-minute slots that fit in a 9-hour window", () => {
    const slots = generateDailySlots(baseContext());
    expect(slots).toHaveLength(18); // 9h * 60 / 30
    expect(slots[slots.length - 1].time).toBe("16:30"); // last slot ends exactly at 17:00
  });
});

describe("generateDailySlots — non-working day", () => {
  it("returns no slots when isWorking is false", () => {
    const slots = generateDailySlots(
      baseContext({ workingHours: { dentistId: "d1", dayOfWeek: 4, isWorking: false, window: null } })
    );
    expect(slots).toEqual([]);
  });

  it("returns no slots when there is no working-hours record at all", () => {
    const slots = generateDailySlots(baseContext({ workingHours: null }));
    expect(slots).toEqual([]);
  });
});

describe("generateDailySlots — treatment longer than the working window", () => {
  it("returns no slots when the treatment can't fit at all", () => {
    const slots = generateDailySlots(
      baseContext({
        workingHours: {
          dentistId: "d1",
          dayOfWeek: 4,
          isWorking: true,
          window: { startMinutes: 8 * 60, endMinutes: 8 * 60 + 15 },
        },
        durationMinutes: 30,
      })
    );
    expect(slots).toEqual([]);
  });
});

describe("generateDailySlots — custom slot interval", () => {
  it("steps by slotIntervalMinutes instead of durationMinutes when provided", () => {
    const slots = generateDailySlots(
      baseContext({
        workingHours: {
          dentistId: "d1",
          dayOfWeek: 4,
          isWorking: true,
          window: { startMinutes: 8 * 60, endMinutes: 9 * 60 },
        },
        durationMinutes: 45,
        slotIntervalMinutes: 15,
      })
    );
    // 08:00-08:45, 08:15-09:00 both fit; 08:30-09:15 does not (exceeds 09:00 close).
    expect(slots.map((s) => s.time)).toEqual(["08:00", "08:15"]);
  });
});

describe("generateDailySlots — breaks removed", () => {
  it("marks slots overlapping a lunch break unavailable, and leaves the rest untouched", () => {
    const slots = generateDailySlots(
      baseContext({
        breaks: [{ dentistId: "d1", dayOfWeek: 4, window: { startMinutes: 12 * 60, endMinutes: 13 * 60 } }],
      })
    );
    const noon = slots.find((s) => s.time === "12:00")!;
    const twelveThirty = slots.find((s) => s.time === "12:30")!;
    const eleven = slots.find((s) => s.time === "11:00")!;

    expect(noon.available).toBe(false);
    expect(noon.unavailableReason).toBe("break");
    expect(twelveThirty.available).toBe(false);
    expect(eleven.available).toBe(true);
  });
});

describe("generateDailySlots — blocked periods removed", () => {
  it("marks slots inside a blocked period unavailable", () => {
    const blockedInterval = windowToInterval({ startMinutes: 14 * 60, endMinutes: 16 * 60 }, DATE, TZ);
    const slots = generateDailySlots(
      baseContext({ blockedPeriods: [{ id: "b1", dentistId: "d1", interval: blockedInterval }] })
    );
    const fourteenThirty = slots.find((s) => s.time === "14:30")!;
    expect(fourteenThirty.available).toBe(false);
    expect(fourteenThirty.unavailableReason).toBe("blocked_period");
  });
});

describe("generateDailySlots — double booking prevented", () => {
  it("marks an already-booked slot unavailable", () => {
    const bookedInterval = windowToInterval({ startMinutes: 9 * 60, endMinutes: 9 * 60 + 30 }, DATE, TZ);
    const slots = generateDailySlots(
      baseContext({
        bookedAppointments: [{ id: "a1", dentistId: "d1", interval: bookedInterval, status: "confirmed" }],
      })
    );
    const nine = slots.find((s) => s.time === "09:00")!;
    expect(nine.available).toBe(false);
    expect(nine.unavailableReason).toBe("booked");
  });

  it("a cancelled appointment does not block its old slot", () => {
    const bookedInterval = windowToInterval({ startMinutes: 9 * 60, endMinutes: 9 * 60 + 30 }, DATE, TZ);
    const slots = generateDailySlots(
      baseContext({
        bookedAppointments: [{ id: "a1", dentistId: "d1", interval: bookedInterval, status: "cancelled" }],
      })
    );
    expect(slots.find((s) => s.time === "09:00")!.available).toBe(true);
  });
});

describe("generateDailySlots — past time", () => {
  it("marks slots before `now` unavailable but still includes them in the grid", () => {
    const now = windowToInterval({ startMinutes: 10 * 60, endMinutes: 10 * 60 }, DATE, TZ).start;
    const slots = generateDailySlots(baseContext({ now }));

    expect(slots.find((s) => s.time === "09:30")!.available).toBe(false);
    expect(slots.find((s) => s.time === "09:30")!.unavailableReason).toBe("past");
    expect(slots.find((s) => s.time === "10:00")!.available).toBe(true);
    // Full grid is still present — the caller decides whether to filter for display.
    expect(slots).toHaveLength(18);
  });
});

describe("generateDailySlots — timezone correctness", () => {
  it("the first slot's absolute instant matches the working-hours start converted from the given zone", () => {
    const slots = generateDailySlots(baseContext());
    expect(slots[0].interval.start.toISOString()).toBe("2026-08-06T06:00:00.000Z"); // 08:00 SAST = 06:00 UTC
  });
});

describe("generateDailySlots — invalid input", () => {
  it("throws for a non-positive duration", () => {
    expect(() => generateDailySlots(baseContext({ durationMinutes: 0 }))).toThrow();
    expect(() => generateDailySlots(baseContext({ durationMinutes: -30 }))).toThrow();
  });

  it("throws for a non-positive slot interval", () => {
    expect(() => generateDailySlots(baseContext({ slotIntervalMinutes: 0 }))).toThrow();
  });
});

describe("generateWeeklySlots", () => {
  it("produces one DayAvailability per context, correctly flagging non-working days", () => {
    const monday = baseContext({
      date: "2026-08-10",
      workingHours: { dentistId: "d1", dayOfWeek: 1, isWorking: true, window: { startMinutes: 8 * 60, endMinutes: 12 * 60 } },
    });
    const sunday = baseContext({
      date: "2026-08-09",
      workingHours: { dentistId: "d1", dayOfWeek: 0, isWorking: false, window: null },
    });

    const result = generateWeeklySlots([sunday, monday]);

    expect(result[0]).toMatchObject({ date: "2026-08-09", isWorkingDay: false, slots: [] });
    expect(result[1].date).toBe("2026-08-10");
    expect(result[1].isWorkingDay).toBe(true);
    expect(result[1].slots.length).toBeGreaterThan(0);
  });
});
