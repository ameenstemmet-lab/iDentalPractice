"use client";

import * as React from "react";

import type { AvailabilityService } from "../services/availability-service";
import type { DayAvailability, ISODate, TimeZone } from "../types";

export interface UseAvailabilityParams {
  /** Caller constructs and owns the service (and its Supabase client) — this hook has no opinion on either. */
  service: AvailabilityService;
  dentistId: string;
  date: ISODate;
  timezone: TimeZone;
  durationMinutes: number;
  slotIntervalMinutes?: number;
  enabled?: boolean;
}

export interface UseAvailabilityResult {
  data: DayAvailability | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Thin client-side wrapper over AvailabilityService.getDayAvailability.
 * Deliberately takes an already-constructed service rather than building
 * one internally, so this module stays agnostic to how the caller
 * authenticates/constructs its Supabase client.
 */
export function useAvailability(params: UseAvailabilityParams): UseAvailabilityResult {
  const {
    service,
    dentistId,
    date,
    timezone,
    durationMinutes,
    slotIntervalMinutes,
    enabled = true,
  } = params;

  const [data, setData] = React.useState<DayAvailability | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    service
      .getDayAvailability({ dentistId, date, timezone, durationMinutes, slotIntervalMinutes })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [service, dentistId, date, timezone, durationMinutes, slotIntervalMinutes, enabled, reloadToken]);

  const refetch = React.useCallback(() => setReloadToken((t) => t + 1), []);

  return { data, isLoading, error, refetch };
}
