"use client";

import { useQuery } from "@tanstack/react-query";

import { getPractitionersAction, getTreatmentsAction } from "../actions/catalog-actions";

export function usePractitionersQuery(practiceId: string | null) {
  return useQuery({
    queryKey: ["booking", "practitioners", practiceId],
    queryFn: () => getPractitionersAction(practiceId!),
    enabled: !!practiceId,
    staleTime: 60_000,
  });
}

export function useTreatmentsQuery(practiceId: string | null, practitionerId: string | null) {
  return useQuery({
    queryKey: ["booking", "treatments", practiceId, practitionerId],
    queryFn: () => getTreatmentsAction(practiceId!, practitionerId!),
    enabled: !!practiceId && !!practitionerId,
    staleTime: 60_000,
  });
}
