import { describe, expect, it } from "vitest";
import { isValidDayOfWeek, toTimeWindow, validateWorkingHours } from "./working-hours";

describe("validateWorkingHours", () => {
  it("accepts a valid working day", () => {
    const result = validateWorkingHours({ dayOfWeek: 1, isWorking: true, startTime: "08:00", endTime: "17:00" });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("accepts a non-working day with no times", () => {
    const result = validateWorkingHours({ dayOfWeek: 0, isWorking: false });
    expect(result.valid).toBe(true);
  });

  it("rejects an out-of-range day of week", () => {
    expect(validateWorkingHours({ dayOfWeek: 7, isWorking: false }).valid).toBe(false);
    expect(validateWorkingHours({ dayOfWeek: -1, isWorking: false }).valid).toBe(false);
  });

  it("rejects a working day missing times", () => {
    const result = validateWorkingHours({ dayOfWeek: 1, isWorking: true });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/required/);
  });

  it("rejects start >= end", () => {
    expect(validateWorkingHours({ dayOfWeek: 1, isWorking: true, startTime: "09:00", endTime: "09:00" }).valid).toBe(
      false
    );
    expect(validateWorkingHours({ dayOfWeek: 1, isWorking: true, startTime: "17:00", endTime: "08:00" }).valid).toBe(
      false
    );
  });

  it("rejects malformed time strings", () => {
    expect(validateWorkingHours({ dayOfWeek: 1, isWorking: true, startTime: "8am", endTime: "17:00" }).valid).toBe(
      false
    );
  });
});

describe("toTimeWindow", () => {
  it("builds a TimeWindow from valid times", () => {
    expect(toTimeWindow("08:00", "17:00")).toEqual({ startMinutes: 480, endMinutes: 1020 });
  });

  it("throws for start >= end", () => {
    expect(() => toTimeWindow("17:00", "08:00")).toThrow();
  });
});

describe("isValidDayOfWeek", () => {
  it("accepts 0-6", () => {
    for (let d = 0; d <= 6; d++) expect(isValidDayOfWeek(d)).toBe(true);
  });

  it("rejects out-of-range or non-integer values", () => {
    expect(isValidDayOfWeek(7)).toBe(false);
    expect(isValidDayOfWeek(-1)).toBe(false);
    expect(isValidDayOfWeek(1.5)).toBe(false);
  });
});
