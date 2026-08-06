import type { ISODate, SlotUnavailableReason, TimeString, TimeZone } from "../types";
import type { SchedulingRepository } from "../repository/scheduling-repository";
import { ConflictDetector } from "./conflict-detector-service";
import { timeStringToMinutes, windowToInterval } from "../utils/time-math";

export interface BookingRequest {
  dentistId: string;
  date: ISODate;
  timezone: TimeZone;
  startTime: TimeString;
  durationMinutes: number;
  now?: Date;
  /** For rescheduling — the appointment's own current slot doesn't conflict with itself. */
  excludeAppointmentId?: string;
}

export type BookingRejectionReason = SlotUnavailableReason | "invalid_duration";

export interface BookingValidationResult {
  valid: boolean;
  reason?: BookingRejectionReason;
  message?: string;
}

const REJECTION_MESSAGES: Record<BookingRejectionReason, string> = {
  invalid_duration: "Appointment duration must be a positive number of minutes.",
  past: "This time has already passed.",
  outside_working_hours: "This time is outside the dentist's working hours.",
  break: "This time falls during the dentist's break.",
  blocked_period: "This time is blocked off and unavailable.",
  booked: "This time is already booked.",
};

/**
 * The final, authoritative gate before any booking is written. Re-runs
 * the full availability check server-side against live data — the
 * client's belief that a slot was free (from an earlier render) is never
 * trusted. Call this immediately before inserting into `appointments`,
 * inside the same request that performs the insert.
 */
export class BookingRulesService {
  private readonly conflictDetector: ConflictDetector;

  constructor(repository: SchedulingRepository) {
    this.conflictDetector = new ConflictDetector(repository);
  }

  async validateBooking(request: BookingRequest): Promise<BookingValidationResult> {
    if (!Number.isFinite(request.durationMinutes) || request.durationMinutes <= 0) {
      return { valid: false, reason: "invalid_duration", message: REJECTION_MESSAGES.invalid_duration };
    }

    const startMinutes = timeStringToMinutes(request.startTime);
    const interval = windowToInterval(
      { startMinutes, endMinutes: startMinutes + request.durationMinutes },
      request.date,
      request.timezone
    );

    const result = await this.conflictDetector.check({
      dentistId: request.dentistId,
      date: request.date,
      timezone: request.timezone,
      interval,
      now: request.now,
      excludeAppointmentId: request.excludeAppointmentId,
    });

    if (!result.hasConflict) {
      return { valid: true };
    }

    const reason = result.reason ?? "outside_working_hours";
    return { valid: false, reason, message: REJECTION_MESSAGES[reason] };
  }
}
