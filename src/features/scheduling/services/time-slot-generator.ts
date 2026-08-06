import type { DayAvailability, ISODate, TimeSlot, TimeZone } from "../types";
import type { SchedulingRepository } from "../repository/scheduling-repository";
import { WorkingHoursService } from "./working-hours-service";
import { fetchDayData } from "./context-builder";
import { generateDailySlots as generateDailySlotsEngine } from "../engine/slot-generator";

export interface GenerateSlotsParams {
  dentistId: string;
  date: ISODate;
  timezone: TimeZone;
  durationMinutes: number;
  slotIntervalMinutes?: number;
  now?: Date;
}

interface DailyResult {
  isWorkingDay: boolean;
  slots: TimeSlot[];
}

/**
 * Fetches everything needed for one dentist/day and generates the slot
 * grid. This is the I/O-performing counterpart to engine/slot-generator's
 * pure `generateDailySlots` — same name, service layer.
 */
export class TimeSlotGenerator {
  private readonly workingHoursService: WorkingHoursService;

  constructor(private readonly repository: SchedulingRepository) {
    this.workingHoursService = new WorkingHoursService(repository);
  }

  private async generateWithMeta(params: GenerateSlotsParams): Promise<DailyResult> {
    const dayData = await fetchDayData(
      this.repository,
      this.workingHoursService,
      params.dentistId,
      params.date,
      params.timezone
    );

    const slots = generateDailySlotsEngine({
      dentistId: params.dentistId,
      date: params.date,
      timezone: params.timezone,
      durationMinutes: params.durationMinutes,
      slotIntervalMinutes: params.slotIntervalMinutes,
      now: params.now ?? new Date(),
      ...dayData,
    });

    return { isWorkingDay: Boolean(dayData.workingHours?.isWorking), slots };
  }

  async generateDailySlots(params: GenerateSlotsParams): Promise<TimeSlot[]> {
    return (await this.generateWithMeta(params)).slots;
  }

  async generateForDates(
    params: Omit<GenerateSlotsParams, "date"> & { dates: ISODate[] }
  ): Promise<DayAvailability[]> {
    const { dates, ...rest } = params;
    return Promise.all(
      dates.map(async (date) => {
        const { isWorkingDay, slots } = await this.generateWithMeta({ ...rest, date });
        return { date, isWorkingDay, slots };
      })
    );
  }
}
