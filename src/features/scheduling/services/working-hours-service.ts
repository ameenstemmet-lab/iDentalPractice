import type { BreakRecord, ISODate, WorkingHoursRecord } from "../types";
import type { SchedulingRepository } from "../repository/scheduling-repository";
import { getDayOfWeek } from "../utils/time-math";

export interface ResolvedWorkingWindow {
  workingHours: WorkingHoursRecord | null;
  breaks: BreakRecord[];
}

/** Resolves a dentist's recurring weekly working hours + breaks for a specific calendar date. */
export class WorkingHoursService {
  constructor(private readonly repository: SchedulingRepository) {}

  async getWorkingWindow(dentistId: string, date: ISODate): Promise<ResolvedWorkingWindow> {
    const dayOfWeek = getDayOfWeek(date);
    const [workingHours, breaks] = await Promise.all([
      this.repository.getWorkingHours(dentistId, dayOfWeek),
      this.repository.getBreaks(dentistId, dayOfWeek),
    ]);
    return { workingHours, breaks };
  }

  async isWorkingDay(dentistId: string, date: ISODate): Promise<boolean> {
    const { workingHours } = await this.getWorkingWindow(dentistId, date);
    return Boolean(workingHours?.isWorking);
  }
}
