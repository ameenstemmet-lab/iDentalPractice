import { describe, expect, it } from "vitest";
import {
  addDaysToISODate,
  calculateAppointmentDuration,
  calculateEndTime,
  dayBounds,
  getDayOfWeek,
  intervalsOverlap,
  localDateString,
  localTimeString,
  minutesToTimeString,
  timeStringToMinutes,
  windowToInterval,
} from "./time-math";

describe("timeStringToMinutes / minutesToTimeString", () => {
  it("round-trips", () => {
    expect(timeStringToMinutes("00:00")).toBe(0);
    expect(timeStringToMinutes("09:30")).toBe(570);
    expect(timeStringToMinutes("23:59")).toBe(1439);
    expect(minutesToTimeString(0)).toBe("00:00");
    expect(minutesToTimeString(570)).toBe("09:30");
    expect(minutesToTimeString(1439)).toBe("23:59");
  });

  it("rejects malformed input", () => {
    expect(() => timeStringToMinutes("9:30")).toThrow();
    expect(() => timeStringToMinutes("24:00")).toThrow();
    expect(() => timeStringToMinutes("09:60")).toThrow();
    expect(() => minutesToTimeString(1440)).toThrow();
    expect(() => minutesToTimeString(-1)).toThrow();
  });
});

describe("calculateEndTime", () => {
  it("adds duration to a start time", () => {
    expect(calculateEndTime("08:00", 30)).toBe("08:30");
    expect(calculateEndTime("08:45", 30)).toBe("09:15");
  });

  it("rejects non-positive durations", () => {
    expect(() => calculateEndTime("08:00", 0)).toThrow();
    expect(() => calculateEndTime("08:00", -15)).toThrow();
  });
});

describe("calculateAppointmentDuration", () => {
  it("computes minutes between two times", () => {
    expect(calculateAppointmentDuration("08:00", "08:30")).toBe(30);
    expect(calculateAppointmentDuration("08:00", "09:30")).toBe(90);
  });

  it("rejects end <= start", () => {
    expect(() => calculateAppointmentDuration("09:00", "09:00")).toThrow();
    expect(() => calculateAppointmentDuration("09:00", "08:00")).toThrow();
  });
});

describe("windowToInterval (timezone conversion)", () => {
  it("converts a local wall-clock window to the correct UTC instant in Africa/Johannesburg (UTC+2)", () => {
    const interval = windowToInterval(
      { startMinutes: 9 * 60, endMinutes: 17 * 60 },
      "2026-08-06",
      "Africa/Johannesburg"
    );
    expect(interval.start.toISOString()).toBe("2026-08-06T07:00:00.000Z");
    expect(interval.end.toISOString()).toBe("2026-08-06T15:00:00.000Z");
  });

  it("converts correctly for a UTC-behind zone (America/New_York, UTC-4 in August)", () => {
    const interval = windowToInterval(
      { startMinutes: 9 * 60, endMinutes: 17 * 60 },
      "2026-08-06",
      "America/New_York"
    );
    expect(interval.start.toISOString()).toBe("2026-08-06T13:00:00.000Z");
    expect(interval.end.toISOString()).toBe("2026-08-06T21:00:00.000Z");
  });
});

describe("localDateString / localTimeString", () => {
  it("reads back the correct local calendar date and time regardless of the runtime's own timezone", () => {
    // 2026-08-06T23:30:00Z is already 2026-08-07 in Johannesburg (UTC+2).
    const instant = new Date("2026-08-06T23:30:00.000Z");
    expect(localDateString(instant, "Africa/Johannesburg")).toBe("2026-08-07");
    expect(localTimeString(instant, "Africa/Johannesburg")).toBe("01:30");
  });
});

describe("intervalsOverlap (half-open [start, end))", () => {
  const at = (h: number, m = 0) => new Date(`2026-08-06T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`);

  it("detects a genuine overlap", () => {
    expect(intervalsOverlap({ start: at(9), end: at(10) }, { start: at(9, 30), end: at(10, 30) })).toBe(true);
  });

  it("detects containment", () => {
    expect(intervalsOverlap({ start: at(9), end: at(12) }, { start: at(10), end: at(11) })).toBe(true);
  });

  it("does not consider back-to-back intervals overlapping", () => {
    expect(intervalsOverlap({ start: at(9), end: at(10) }, { start: at(10), end: at(11) })).toBe(false);
  });

  it("does not overlap when clearly disjoint", () => {
    expect(intervalsOverlap({ start: at(9), end: at(10) }, { start: at(14), end: at(15) })).toBe(false);
  });
});

describe("addDaysToISODate", () => {
  it("advances within a month", () => {
    expect(addDaysToISODate("2026-08-06", 1)).toBe("2026-08-07");
  });

  it("rolls over month and year boundaries", () => {
    expect(addDaysToISODate("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDaysToISODate("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("handles February / leap years correctly", () => {
    expect(addDaysToISODate("2028-02-28", 1)).toBe("2028-02-29"); // 2028 is a leap year
    expect(addDaysToISODate("2027-02-28", 1)).toBe("2027-03-01"); // 2027 is not
  });
});

describe("getDayOfWeek", () => {
  it("matches known weekdays, independent of timezone", () => {
    expect(getDayOfWeek("2026-08-02")).toBe(0); // Sunday
    expect(getDayOfWeek("2026-08-06")).toBe(4); // Thursday
    expect(getDayOfWeek("2026-08-08")).toBe(6); // Saturday
  });
});

describe("dayBounds", () => {
  it("spans exactly 24 hours in the given zone", () => {
    const { start, end } = dayBounds("2026-08-06", "Africa/Johannesburg");
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
    expect(start.toISOString()).toBe("2026-08-05T22:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-06T22:00:00.000Z");
  });
});
