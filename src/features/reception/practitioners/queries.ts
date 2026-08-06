"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPractitioner,
  getPractitioner,
  listPractitioners,
  listProfessions,
  listTreatmentIdsForPractitioner,
  setPractitionerArchived,
  setPractitionerTreatments,
  updatePractitioner,
} from "./actions";
import type { PractitionerInput } from "./types";

export const practitionerKeys = {
  all: ["practitioners"] as const,
  lists: () => [...practitionerKeys.all, "list"] as const,
  list: (practiceId: string, includeArchived: boolean) => [...practitionerKeys.lists(), practiceId, includeArchived] as const,
  detail: (id: string) => [...practitionerKeys.all, "detail", id] as const,
  professions: (practiceId: string) => [...practitionerKeys.all, "professions", practiceId] as const,
  treatmentIds: (practitionerId: string) => [...practitionerKeys.all, "treatment-ids", practitionerId] as const,
};

export function usePractitioners(practiceId: string, includeArchived = false) {
  return useQuery({
    queryKey: practitionerKeys.list(practiceId, includeArchived),
    queryFn: () => listPractitioners(practiceId, includeArchived),
    enabled: Boolean(practiceId),
  });
}

export function usePractitioner(practitionerId: string | undefined) {
  return useQuery({
    queryKey: practitionerKeys.detail(practitionerId ?? ""),
    queryFn: () => getPractitioner(practitionerId!),
    enabled: Boolean(practitionerId),
  });
}

export function useCreatePractitioner(practiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PractitionerInput) => createPractitioner(practiceId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: practitionerKeys.lists() }),
  });
}

export function useUpdatePractitioner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ practitionerId, input }: { practitionerId: string; input: PractitionerInput }) => updatePractitioner(practitionerId, input),
    onSuccess: (practitioner) => {
      queryClient.invalidateQueries({ queryKey: practitionerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: practitionerKeys.detail(practitioner.id) });
    },
  });
}

export function useSetPractitionerArchived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ practitionerId, archived }: { practitionerId: string; archived: boolean }) =>
      setPractitionerArchived(practitionerId, archived),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: practitionerKeys.lists() }),
  });
}

/** Distinct professions already used at the practice, for the "Add practitioner" autocomplete. */
export function useProfessions(practiceId: string) {
  return useQuery({
    queryKey: practitionerKeys.professions(practiceId),
    queryFn: () => listProfessions(practiceId),
    enabled: Boolean(practiceId),
  });
}

export function usePractitionerTreatmentIds(practitionerId: string | undefined) {
  return useQuery({
    queryKey: practitionerKeys.treatmentIds(practitionerId ?? ""),
    queryFn: () => listTreatmentIdsForPractitioner(practitionerId!),
    enabled: Boolean(practitionerId),
  });
}

export function useSetPractitionerTreatments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      practiceId,
      practitionerId,
      treatmentIds,
    }: {
      practiceId: string;
      practitionerId: string;
      treatmentIds: string[];
    }) => setPractitionerTreatments(practiceId, practitionerId, treatmentIds),
    onSuccess: (_, { practitionerId }) =>
      queryClient.invalidateQueries({ queryKey: practitionerKeys.treatmentIds(practitionerId) }),
  });
}
