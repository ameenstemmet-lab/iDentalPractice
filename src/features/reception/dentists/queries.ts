"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createDentist, getDentist, listDentists, setDentistArchived, updateDentist } from "./actions";
import type { DentistInput } from "./types";

export const dentistKeys = {
  all: ["dentists"] as const,
  lists: () => [...dentistKeys.all, "list"] as const,
  list: (practiceId: string, includeArchived: boolean) => [...dentistKeys.lists(), practiceId, includeArchived] as const,
  detail: (id: string) => [...dentistKeys.all, "detail", id] as const,
};

export function useDentists(practiceId: string, includeArchived = false) {
  return useQuery({
    queryKey: dentistKeys.list(practiceId, includeArchived),
    queryFn: () => listDentists(practiceId, includeArchived),
    enabled: Boolean(practiceId),
  });
}

export function useDentist(dentistId: string | undefined) {
  return useQuery({
    queryKey: dentistKeys.detail(dentistId ?? ""),
    queryFn: () => getDentist(dentistId!),
    enabled: Boolean(dentistId),
  });
}

export function useCreateDentist(practiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DentistInput) => createDentist(practiceId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dentistKeys.lists() }),
  });
}

export function useUpdateDentist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dentistId, input }: { dentistId: string; input: DentistInput }) => updateDentist(dentistId, input),
    onSuccess: (dentist) => {
      queryClient.invalidateQueries({ queryKey: dentistKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dentistKeys.detail(dentist.id) });
    },
  });
}

export function useSetDentistArchived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dentistId, archived }: { dentistId: string; archived: boolean }) =>
      setDentistArchived(dentistId, archived),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dentistKeys.lists() }),
  });
}
