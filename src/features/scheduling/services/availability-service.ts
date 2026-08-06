import type { DayAvailability, ISODate, NextAvailableResult, TimeZone } from "../types";
import type { SchedulingRepository } from "../repository/scheduling-repository";
import { TimeSlotGenerator } from "./time-slot-generator";
import { fetchDayData } from "./context-builder";
import { WorkingHoursService } from "./working-hours-service";
import { findNextAvailableSlot } from "../engine/next-available";
import { addDaysToISODate } from "../utils/time-math";

const DEFAULT_SEARCH_BATCH_DAYS = 14;
const DEFAULT_MAX_SEARCH_DAYS = 60;

export interface AvailabilityParams {
  dentistId: string;
  timezone: TimeZone;
  durationMinutes: number;
  slotIntervalMinutes?: number;
  now?: Date;
}

/**
 * Main public entry point for "what can be booked" queries — the surface
 * most callers (booking UI, a future AI receptionist, a future WhatsApp
 * bot) actually use. Composes TimeSlotGenerator for day/range queries and
 * the engine's findNextAvailableSlot for the "day is full" fallback.
 */
export class AvailabilityService {
  private readonly slotGenerator: TimeSlotGenerator;
  private readonly workingHoursService: WorkingHoursService;

  constructor(private readonly repository: SchedulingRepository) {
    this.slotGenerator = new TimeSlotGenerator(repository);
    this.workingHoursService = new WorkingHoursService(repository);
  }

  async getDayAvailability(params: AvailabilityParams & { date: ISODate }): Promise<DayAvailability> {
    const [result] = await this.slotGenerator.generateForDates({ ...params, dates: [params.date] });
    return result;
  }

  async getRangeAvailability(
    params: AvailabilityParams & { fromDate: ISODate; days: number }
  ): Promise<DayAvailability[]> {
    const dates = Array.from({ length: params.days }, (_, i) => addDaysToISODate(params.fromDate, i));
    return this.slotGenerator.generateForDates({ ...params, dates });
  }

  /**
   * Walks forward day by day from `fromDate` (inclusive) looking for the
   * first available slot, in batches, up to `maxDays`. Batching avoids
   * fetching a 60-day window when the answer is almost always within the
   * first week or two.
   */
  async findNextAvailable(
    params: AvailabilityParams & { fromDate: ISODate; maxDays?: number }
  ): Promise<NextAvailableResult | null> {
    const maxDays = params.maxDays ?? DEFAULT_MAX_SEARCH_DAYS;
    const now = params.now ?? new Date();

    for (let offset = 0; offset < maxDays; offset += DEFAULT_SEARCH_BATCH_DAYS) {
      const batchSize = Math.min(DEFAULT_SEARCH_BATCH_DAYS, maxDays - offset);
      const dates = Array.from({ length: batchSize }, (_, i) =>
        addDaysToISODate(params.fromDate, offset + i)
      );

      const contexts = await Promise.all(
        dates.map(async (date) => {
          const dayData = await fetchDayData(
            this.repository,
            this.workingHoursService,
            params.dentistId,
            date,
            params.timezone
          );
          return {
            dentistId: params.dentistId,
            date,
            timezone: params.timezone,
            durationMinutes: params.durationMinutes,
            slotIntervalMinutes: params.slotIntervalMinutes,
            now,
            ...dayData,
          };
        })
      );

      const result = findNextAvailableSlot(contexts);
      if (result) return result;
    }

    return null;
  }
}
