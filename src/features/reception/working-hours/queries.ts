"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addBreak, deleteBreak, getBreaks, getWorkingHours, saveWorkingDay } from "./actions";
import type { AddBreakInput, SaveWorkingDayInput } from "./types";

export const workingHoursKeys = {
  hours: (practitionerId: string) => ["working-hours", practitionerId] as const,
  breaks: (practitionerId: string) => ["practitioner-breaks", practitionerId] as const,
};

export function useWorkingHours(practitionerId: string | undefined) {
  return useQuery({
    queryKey: workingHoursKeys.hours(practitionerId ?? ""),
    queryFn: () => getWorkingHours(practitionerId!),
    enabled: Boolean(practitionerId),
  });
}

export function usePractitionerBreaks(practitionerId: string | undefined) {
  return useQuery({
    queryKey: workingHoursKeys.breaks(practitionerId ?? ""),
    queryFn: () => getBreaks(practitionerId!),
    enabled: Boolean(practitionerId),
  });
}

export function useSaveWorkingDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveWorkingDayInput) => saveWorkingDay(input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: workingHoursKeys.hours(input.practitionerId) });
    },
  });
}

export function useAddBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddBreakInput) => addBreak(input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: workingHoursKeys.breaks(input.practitionerId) });
    },
  });
}

export function useDeleteBreak(practitionerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (breakId: string) => deleteBreak(breakId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workingHoursKeys.breaks(practitionerId) });
    },
  });
}
