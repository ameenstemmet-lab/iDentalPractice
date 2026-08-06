"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getPracticeSettings, updatePracticeSettings } from "./actions";
import type { PracticeSettingsInput } from "./types";

export function usePracticeSettings(practiceId: string) {
  return useQuery({
    queryKey: ["practice-settings", practiceId],
    queryFn: () => getPracticeSettings(practiceId),
    enabled: Boolean(practiceId),
  });
}

export function useUpdatePracticeSettings(practiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PracticeSettingsInput) => updatePracticeSettings(practiceId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["practice-settings", practiceId] }),
  });
}
