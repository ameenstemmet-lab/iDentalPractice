import type { BlockedPeriodRecord, BookedAppointment, BreakRecord, ISODate, TimeZone, WorkingHoursRecord } from "../types";
import type { SchedulingRepository } from "../repository/scheduling-repository";
import { WorkingHoursService } from "./working-hours-service";

export interface DayData {
  workingHours: WorkingHoursRecord | null;
  breaks: BreakRecord[];
  blockedPeriods: BlockedPeriodRecord[];
  bookedAppointments: BookedAppointment[];
}

/**
 * Fetches every piece of data the engine needs for one dentist on one day,
 * in parallel. Internal to the services layer — TimeSlotGenerator wraps
 * this into a SchedulingContext (for grid generation); ConflictDetector
 * wraps it into a ConflictContext (for ad-hoc interval checks). Neither
 * duplicates the fetching.
 */
export async function fetchDayData(
  repository: SchedulingRepository,
  workingHoursService: WorkingHoursService,
  dentistId: string,
  date: ISODate,
  timezone: TimeZone
): Promise<DayData> {
  const [{ workingHours, breaks }, blockedPeriods, bookedAppointments] = await Promise.all([
    workingHoursService.getWorkingWindow(dentistId, date),
    repository.getBlockedPeriods(dentistId, date, timezone),
    repository.getBookedAppointments(dentistId, date, timezone),
  ]);

  return { workingHours, breaks, blockedPeriods, bookedAppointments };
}
