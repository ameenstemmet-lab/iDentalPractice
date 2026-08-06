"use client";

import { useQuery } from "@tanstack/react-query";

import { getDentistsAction, getTreatmentsAction } from "../actions/catalog-actions";

export function useDentistsQuery(practiceId: string | null) {
  return useQuery({
    queryKey: ["booking", "dentists", practiceId],
    queryFn: () => getDentistsAction(practiceId!),
    enabled: !!practiceId,
    staleTime: 60_000,
  });
}

export function useTreatmentsQuery(practiceId: string | null) {
  return useQuery({
    queryKey: ["booking", "treatments", practiceId],
    queryFn: () => getTreatmentsAction(practiceId!),
    enabled: !!practiceId,
    staleTime: 60_000,
  });
}
