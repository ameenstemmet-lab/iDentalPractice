import type { ConflictResult, ISODate, Interval, TimeZone } from "../types";
import type { SchedulingRepository } from "../repository/scheduling-repository";
import { WorkingHoursService } from "./working-hours-service";
import { fetchDayData } from "./context-builder";
import { detectConflicts } from "../engine/conflict-detector";

export { isSlotAvailable } from "../engine/conflict-detector";

export interface CheckIntervalParams {
  practitionerId: string;
  date: ISODate;
  timezone: TimeZone;
  interval: Interval;
  now?: Date;
  excludeAppointmentId?: string;
}

/**
 * Service-layer counterpart to engine/conflict-detector: fetches the data
 * for one practitioner/day and checks one specific (not necessarily grid-
 * aligned) interval against it. This is what BookingRulesService calls for
 * the final, authoritative check before a booking is written.
 */
export class ConflictDetector {
  private readonly workingHoursService: WorkingHoursService;

  constructor(private readonly repository: SchedulingRepository) {
    this.workingHoursService = new WorkingHoursService(repository);
  }

  async check(params: CheckIntervalParams): Promise<ConflictResult> {
    const dayData = await fetchDayData(
      this.repository,
      this.workingHoursService,
      params.practitionerId,
      params.date,
      params.timezone
    );

    return detectConflicts(params.interval, {
      date: params.date,
      timezone: params.timezone,
      now: params.now ?? new Date(),
      excludeAppointmentId: params.excludeAppointmentId,
      ...dayData,
    });
  }

  async isAvailable(params: CheckIntervalParams): Promise<boolean> {
    return !(await this.check(params)).hasConflict;
  }
}
