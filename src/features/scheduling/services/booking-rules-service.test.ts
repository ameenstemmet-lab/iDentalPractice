import { describe, expect, it } from "vitest";
import { BookingRulesService } from "./booking-rules-service";
import { InMemorySchedulingRepository } from "../testing/in-memory-scheduling-repository";
import { windowToInterval } from "../utils/time-math";
import type { BookedAppointment, WorkingHoursRecord } from "../types";

const TZ = "Africa/Johannesburg";
const DATE = "2026-08-10"; // Monday

const workingHours: WorkingHoursRecord[] = [
  { dentistId: "d1", dayOfWeek: 1, isWorking: true, window: { startMinutes: 8 * 60, endMinutes: 17 * 60 } },
];

const lunchBreak = { dentistId: "d1", dayOfWeek: 1 as const, window: { startMinutes: 12 * 60, endMinutes: 13 * 60 } };

const EARLY_NOW = windowToInterval({ startMinutes: 0, endMinutes: 60 }, DATE, TZ).start;

describe("BookingRulesService.validateBooking — the never-trust-the-client gate", () => {
  it("accepts a genuinely free slot", async () => {
    const repository = new InMemorySchedulingRepository({ workingHours });
    const service = new BookingRulesService(repository);

    const result = await service.validateBooking({
      dentistId: "d1",
      date: DATE,
      timezone: TZ,
      startTime: "09:00",
      durationMinutes: 30,
      now: EARLY_NOW,
    });

    expect(result).toEqual({ valid: true });
  });

  it("rejects a non-positive duration before even checking availability", async () => {
    const repository = new InMemorySchedulingRepository({ workingHours });
    const service = new BookingRulesService(repository);

    const result = await service.validateBooking({
      dentistId: "d1",
      date: DATE,
      timezone: TZ,
      startTime: "09:00",
      durationMinutes: 0,
      now: EARLY_NOW,
    });

    expect(result).toMatchObject({ valid: false, reason: "invalid_duration" });
  });

  it("rejects a slot outside working hours", async () => {
    const repository = new InMemorySchedulingRepository({ workingHours });
    const service = new BookingRulesService(repository);

    const result = await service.validateBooking({
      dentistId: "d1",
      date: DATE,
      timezone: TZ,
      startTime: "18:00",
      durationMinutes: 30,
      now: EARLY_NOW,
    });

    expect(result).toMatchObject({ valid: false, reason: "outside_working_hours" });
  });

  it("rejects a slot during a break", async () => {
    const repository = new InMemorySchedulingRepository({ workingHours, breaks: [lunchBreak] });
    const service = new BookingRulesService(repository);

    const result = await service.validateBooking({
      dentistId: "d1",
      date: DATE,
      timezone: TZ,
      startTime: "12:15",
      durationMinutes: 30,
      now: EARLY_NOW,
    });

    expect(result).toMatchObject({ valid: false, reason: "break" });
  });

  it("rejects a slot in a blocked period", async () => {
    const blockedInterval = windowToInterval({ startMinutes: 14 * 60, endMinutes: 16 * 60 }, DATE, TZ);
    const repository = new InMemorySchedulingRepository({
      workingHours,
      blockedPeriods: [{ id: "b1", dentistId: "d1", interval: blockedInterval }],
    });
    const service = new BookingRulesService(repository);

    const result = await service.validateBooking({
      dentistId: "d1",
      date: DATE,
      timezone: TZ,
      startTime: "14:30",
      durationMinutes: 30,
      now: EARLY_NOW,
    });

    expect(result).toMatchObject({ valid: false, reason: "blocked_period" });
  });

  it("rejects a double-booking attempt — this is the core guarantee of the whole engine", async () => {
    const existing: BookedAppointment = {
      id: "existing-1",
      dentistId: "d1",
      interval: windowToInterval({ startMinutes: 10 * 60, endMinutes: 10 * 60 + 30 }, DATE, TZ),
      status: "booked",
    };
    const repository = new InMemorySchedulingRepository({ workingHours, appointments: [existing] });
    const service = new BookingRulesService(repository);

    const result = await service.validateBooking({
      dentistId: "d1",
      date: DATE,
      timezone: TZ,
      startTime: "10:00",
      durationMinutes: 30,
      now: EARLY_NOW,
    });

    expect(result).toMatchObject({ valid: false, reason: "booked" });
  });

  it("rejects a past slot even if it would otherwise be free", async () => {
    const repository = new InMemorySchedulingRepository({ workingHours });
    const service = new BookingRulesService(repository);
    const lateNow = windowToInterval({ startMinutes: 11 * 60, endMinutes: 11 * 60 }, DATE, TZ).start;

    const result = await service.validateBooking({
      dentistId: "d1",
      date: DATE,
      timezone: TZ,
      startTime: "09:00",
      durationMinutes: 30,
      now: lateNow,
    });

    expect(result).toMatchObject({ valid: false, reason: "past" });
  });

  it("excludeAppointmentId allows re-validating an appointment's own current slot (reschedule)", async () => {
    const existing: BookedAppointment = {
      id: "existing-1",
      dentistId: "d1",
      interval: windowToInterval({ startMinutes: 10 * 60, endMinutes: 10 * 60 + 30 }, DATE, TZ),
      status: "booked",
    };
    const repository = new InMemorySchedulingRepository({ workingHours, appointments: [existing] });
    const service = new BookingRulesService(repository);

    const result = await service.validateBooking({
      dentistId: "d1",
      date: DATE,
      timezone: TZ,
      startTime: "10:00",
      durationMinutes: 30,
      now: EARLY_NOW,
      excludeAppointmentId: "existing-1",
    });

    expect(result).toEqual({ valid: true });
  });
});
