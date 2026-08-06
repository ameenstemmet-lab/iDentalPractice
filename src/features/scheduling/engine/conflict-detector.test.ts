import { describe, expect, it } from "vitest";
import { detectConflicts, isSlotAvailable, overlapsAppointment } from "./conflict-detector";
import { windowToInterval } from "../utils/time-math";
import type { BookedAppointment, WorkingHoursRecord } from "../types";

const TZ = "Africa/Johannesburg";
const DATE = "2026-08-06"; // a Thursday

const fullDayWorkingHours: WorkingHoursRecord = {
  dentistId: "d1",
  dayOfWeek: 4,
  isWorking: true,
  window: { startMinutes: 8 * 60, endMinutes: 17 * 60 },
};

const notWorkingHours: WorkingHoursRecord = {
  dentistId: "d1",
  dayOfWeek: 4,
  isWorking: false,
  window: null,
};

function baseContext(overrides: Partial<Parameters<typeof detectConflicts>[1]> = {}) {
  return {
    date: DATE,
    timezone: TZ,
    workingHours: fullDayWorkingHours,
    breaks: [],
    blockedPeriods: [],
    bookedAppointments: [],
    now: windowToInterval({ startMinutes: 0, endMinutes: 60 }, DATE, TZ).start, // well before working hours
    ...overrides,
  };
}

function slot(startHour: number, endHour: number) {
  return windowToInterval({ startMinutes: startHour * 60, endMinutes: endHour * 60 }, DATE, TZ);
}

describe("detectConflicts — past time", () => {
  it("rejects a slot that starts before now", () => {
    const now = slot(10, 10).start;
    const result = detectConflicts(slot(9, 10), baseContext({ now }));
    expect(result).toEqual({ hasConflict: true, reason: "past" });
  });

  it("allows a slot starting exactly at now", () => {
    const now = slot(9, 9).start;
    const result = detectConflicts(slot(9, 10), baseContext({ now }));
    expect(result.hasConflict).toBe(false);
  });
});

describe("detectConflicts — working hours", () => {
  it("rejects when the dentist doesn't work that day", () => {
    const result = detectConflicts(slot(9, 10), baseContext({ workingHours: notWorkingHours }));
    expect(result).toEqual({ hasConflict: true, reason: "outside_working_hours" });
  });

  it("rejects a slot that starts before opening", () => {
    const result = detectConflicts(slot(6, 7), baseContext());
    expect(result).toEqual({ hasConflict: true, reason: "outside_working_hours" });
  });

  it("rejects a slot that ends after closing", () => {
    const result = detectConflicts(slot(16, 18), baseContext());
    expect(result).toEqual({ hasConflict: true, reason: "outside_working_hours" });
  });

  it("allows a slot fully within working hours", () => {
    const result = detectConflicts(slot(9, 10), baseContext());
    expect(result.hasConflict).toBe(false);
  });
});

describe("detectConflicts — breaks", () => {
  const lunchBreak = { dentistId: "d1", dayOfWeek: 4 as const, window: { startMinutes: 12 * 60, endMinutes: 13 * 60 } };

  it("rejects a slot overlapping a break", () => {
    const result = detectConflicts(slot(12, 13), baseContext({ breaks: [lunchBreak] }));
    expect(result).toEqual({ hasConflict: true, reason: "break" });
  });

  it("rejects a slot partially overlapping a break", () => {
    const result = detectConflicts(
      windowToInterval({ startMinutes: 11 * 60 + 30, endMinutes: 12 * 60 + 30 }, DATE, TZ),
      baseContext({ breaks: [lunchBreak] })
    );
    expect(result).toEqual({ hasConflict: true, reason: "break" });
  });

  it("allows a slot right before a break", () => {
    const result = detectConflicts(slot(11, 12), baseContext({ breaks: [lunchBreak] }));
    expect(result.hasConflict).toBe(false);
  });

  it("allows a slot right after a break", () => {
    const result = detectConflicts(slot(13, 14), baseContext({ breaks: [lunchBreak] }));
    expect(result.hasConflict).toBe(false);
  });
});

describe("detectConflicts — blocked periods", () => {
  it("rejects a slot overlapping a blocked period", () => {
    const blocked = { id: "b1", dentistId: "d1", interval: slot(14, 16) };
    const result = detectConflicts(slot(15, 16), baseContext({ blockedPeriods: [blocked] }));
    expect(result).toEqual({ hasConflict: true, reason: "blocked_period" });
  });
});

describe("detectConflicts — booked appointments / double booking", () => {
  const booked: BookedAppointment = { id: "a1", dentistId: "d1", interval: slot(10, 11), status: "booked" };

  it("rejects an overlapping appointment", () => {
    const result = detectConflicts(slot(10, 11), baseContext({ bookedAppointments: [booked] }));
    expect(result).toEqual({ hasConflict: true, reason: "booked", conflictingAppointmentId: "a1" });
  });

  it("rejects a partially overlapping appointment", () => {
    // booked is 10:00-11:00; this candidate is 9:30-10:30, overlapping the first half-hour.
    const result = detectConflicts(slot(9.5, 10.5), baseContext({ bookedAppointments: [booked] }));
    expect(result.hasConflict).toBe(true);
  });

  it("allows adjacent, non-overlapping appointments", () => {
    const result = detectConflicts(slot(11, 12), baseContext({ bookedAppointments: [booked] }));
    expect(result.hasConflict).toBe(false);
  });

  it("cancelled appointments never block", () => {
    const cancelled: BookedAppointment = { ...booked, status: "cancelled" };
    const result = detectConflicts(slot(10, 11), baseContext({ bookedAppointments: [cancelled] }));
    expect(result.hasConflict).toBe(false);
  });

  it("no-show appointments never block", () => {
    const noShow: BookedAppointment = { ...booked, status: "no_show" };
    const result = detectConflicts(slot(10, 11), baseContext({ bookedAppointments: [noShow] }));
    expect(result.hasConflict).toBe(false);
  });

  it("excludeAppointmentId lets an appointment's own slot pass (reschedule case)", () => {
    const result = detectConflicts(
      slot(10, 11),
      baseContext({ bookedAppointments: [booked], excludeAppointmentId: "a1" })
    );
    expect(result.hasConflict).toBe(false);
  });
});

describe("overlapsAppointment", () => {
  it("mirrors detectConflicts' booked-appointment logic", () => {
    const booked: BookedAppointment = { id: "a1", dentistId: "d1", interval: slot(10, 11), status: "confirmed" };
    expect(overlapsAppointment(slot(10, 11), booked)).toBe(true);
    expect(overlapsAppointment(slot(11, 12), booked)).toBe(false);
    expect(overlapsAppointment(slot(10, 11), { ...booked, status: "cancelled" })).toBe(false);
  });
});

describe("isSlotAvailable", () => {
  it("is the inverse of detectConflicts().hasConflict", () => {
    expect(isSlotAvailable(slot(9, 10), baseContext())).toBe(true);
    expect(isSlotAvailable(slot(6, 7), baseContext())).toBe(false);
  });
});
