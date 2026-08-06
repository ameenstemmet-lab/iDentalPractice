"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addBreak, deleteBreak, getBreaks, getWorkingHours, saveWorkingDay } from "./actions";
import type { AddBreakInput, SaveWorkingDayInput } from "./types";

export const workingHoursKeys = {
  hours: (dentistId: string) => ["working-hours", dentistId] as const,
  breaks: (dentistId: string) => ["dentist-breaks", dentistId] as const,
};

export function useWorkingHours(dentistId: string | undefined) {
  return useQuery({
    queryKey: workingHoursKeys.hours(dentistId ?? ""),
    queryFn: () => getWorkingHours(dentistId!),
    enabled: Boolean(dentistId),
  });
}

export function useDentistBreaks(dentistId: string | undefined) {
  return useQuery({
    queryKey: workingHoursKeys.breaks(dentistId ?? ""),
    queryFn: () => getBreaks(dentistId!),
    enabled: Boolean(dentistId),
  });
}

export function useSaveWorkingDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveWorkingDayInput) => saveWorkingDay(input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: workingHoursKeys.hours(input.dentistId) });
    },
  });
}

export function useAddBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddBreakInput) => addBreak(input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: workingHoursKeys.breaks(input.dentistId) });
    },
  });
}

export function useDeleteBreak(dentistId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (breakId: string) => deleteBreak(breakId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workingHoursKeys.breaks(dentistId) });
    },
  });
}
