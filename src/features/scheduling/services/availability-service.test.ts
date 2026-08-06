import { describe, expect, it } from "vitest";
import { AvailabilityService } from "./availability-service";
import { InMemorySchedulingRepository } from "../testing/in-memory-scheduling-repository";
import { windowToInterval } from "../utils/time-math";
import type { BookedAppointment, WorkingHoursRecord } from "../types";

const TZ = "Africa/Johannesburg";

// Mon–Fri, 09:00–10:00 (a deliberately small window so "fully booked" is easy to set up).
const workingHours: WorkingHoursRecord[] = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
  practitionerId: "d1",
  dayOfWeek: dayOfWeek as WorkingHoursRecord["dayOfWeek"],
  isWorking: true,
  window: { startMinutes: 9 * 60, endMinutes: 10 * 60 },
}));

const EARLY_MORNING_NOW = windowToInterval({ startMinutes: 0, endMinutes: 60 }, "2026-08-10", TZ).start;

describe("AvailabilityService.getDayAvailability", () => {
  it("returns the working day's slot grid via the repository", async () => {
    const repository = new InMemorySchedulingRepository({ workingHours });
    const service = new AvailabilityService(repository);

    const result = await service.getDayAvailability({
      practitionerId: "d1",
      date: "2026-08-10", // Monday
      timezone: TZ,
      durationMinutes: 30,
      now: EARLY_MORNING_NOW,
    });

    expect(result.isWorkingDay).toBe(true);
    expect(result.slots.map((s) => s.time)).toEqual(["09:00", "09:30"]);
    expect(result.slots.every((s) => s.available)).toBe(true);
  });

  it("flags a non-working day (Saturday)", async () => {
    const repository = new InMemorySchedulingRepository({ workingHours });
    const service = new AvailabilityService(repository);

    const result = await service.getDayAvailability({
      practitionerId: "d1",
      date: "2026-08-08", // Saturday — no working-hours record seeded
      timezone: TZ,
      durationMinutes: 30,
      now: EARLY_MORNING_NOW,
    });

    expect(result.isWorkingDay).toBe(false);
    expect(result.slots).toEqual([]);
  });
});

describe("AvailabilityService.getRangeAvailability", () => {
  it("returns one DayAvailability per day in the range", async () => {
    const repository = new InMemorySchedulingRepository({ workingHours });
    const service = new AvailabilityService(repository);

    const result = await service.getRangeAvailability({
      practitionerId: "d1",
      fromDate: "2026-08-08", // Sat, Sun, Mon
      days: 3,
      timezone: TZ,
      durationMinutes: 30,
      now: EARLY_MORNING_NOW,
    });

    expect(result.map((d) => d.date)).toEqual(["2026-08-08", "2026-08-09", "2026-08-10"]);
    expect(result[0].isWorkingDay).toBe(false); // Sat
    expect(result[1].isWorkingDay).toBe(false); // Sun
    expect(result[2].isWorkingDay).toBe(true); // Mon
  });
});

describe("AvailabilityService.findNextAvailable — the spec's own example, end to end", () => {
  it('finds "next available" the day after a fully booked day', async () => {
    // Monday's window is 09:00-10:00 with 30-min slots = 2 slots; book both.
    const bothSlotsBooked: BookedAppointment[] = [
      {
        id: "a1",
        practitionerId: "d1",
        interval: windowToInterval({ startMinutes: 9 * 60, endMinutes: 9 * 60 + 30 }, "2026-08-10", TZ),
        status: "booked",
      },
      {
        id: "a2",
        practitionerId: "d1",
        interval: windowToInterval({ startMinutes: 9 * 60 + 30, endMinutes: 10 * 60 }, "2026-08-10", TZ),
        status: "booked",
      },
    ];
    const repo = new InMemorySchedulingRepository({ workingHours, appointments: bothSlotsBooked });
    const service = new AvailabilityService(repo);

    const result = await service.findNextAvailable({
      practitionerId: "d1",
      fromDate: "2026-08-10", // Monday, fully booked
      timezone: TZ,
      durationMinutes: 30,
      now: EARLY_MORNING_NOW,
    });

    // Monday full, Tuesday (2026-08-11) is next and open.
    expect(result).toMatchObject({ date: "2026-08-11", time: "09:00" });
  });

  it("returns null when the entire search window is exhausted", async () => {
    const repo = new InMemorySchedulingRepository({ workingHours: [] }); // practitioner never works
    const service = new AvailabilityService(repo);

    const result = await service.findNextAvailable({
      practitionerId: "d1",
      fromDate: "2026-08-10",
      timezone: TZ,
      durationMinutes: 30,
      maxDays: 3,
      now: EARLY_MORNING_NOW,
    });

    expect(result).toBeNull();
  });
});
