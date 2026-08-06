import type { NextAvailableResult, SchedulingContext } from "../types";
import { generateDailySlots } from "./slot-generator";

/**
 * Returns the first available slot across `contexts`, in the order given.
 * Deliberately takes pre-built, ordered contexts rather than a date range —
 * how far ahead to search (and whether to widen the search window when
 * nothing turns up) is a fetching/performance concern that belongs to the
 * service layer, not this pure function. Callers typically pass contexts
 * in chronological order starting the day after a fully-booked day.
 */
export function findNextAvailableSlot(contexts: SchedulingContext[]): NextAvailableResult | null {
  for (const context of contexts) {
    const slot = generateDailySlots(context).find((s) => s.available);
    if (slot) {
      return { date: context.date, time: slot.time, interval: slot.interval };
    }
  }
  return null;
}
