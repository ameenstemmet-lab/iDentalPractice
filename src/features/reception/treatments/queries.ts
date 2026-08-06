"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createTreatment, listTreatments, setTreatmentActive, updateTreatment } from "./actions";
import type { TreatmentInput } from "./types";

export const treatmentKeys = {
  all: ["treatments"] as const,
  lists: () => [...treatmentKeys.all, "list"] as const,
  list: (practiceId: string, includeInactive: boolean) =>
    [...treatmentKeys.lists(), practiceId, includeInactive] as const,
};

export function useTreatments(practiceId: string, includeInactive = false) {
  return useQuery({
    queryKey: treatmentKeys.list(practiceId, includeInactive),
    queryFn: () => listTreatments(practiceId, includeInactive),
    enabled: Boolean(practiceId),
  });
}

export function useCreateTreatment(practiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TreatmentInput) => createTreatment(practiceId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: treatmentKeys.lists() }),
  });
}

export function useUpdateTreatment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ treatmentId, input }: { treatmentId: string; input: TreatmentInput }) =>
      updateTreatment(treatmentId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: treatmentKeys.lists() }),
  });
}

export function useSetTreatmentActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ treatmentId, active }: { treatmentId: string; active: boolean }) =>
      setTreatmentActive(treatmentId, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: treatmentKeys.lists() }),
  });
}
