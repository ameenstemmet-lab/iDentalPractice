"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createBlockedPeriod, deleteBlockedPeriod, listBlockedPeriods } from "./actions";
import type { BlockedPeriodInput } from "./types";

export const blockedTimeKeys = {
  list: (practiceId: string) => ["blocked-periods", practiceId] as const,
};

export function useBlockedPeriods(practiceId: string) {
  return useQuery({
    queryKey: blockedTimeKeys.list(practiceId),
    queryFn: () => listBlockedPeriods(practiceId),
    enabled: Boolean(practiceId),
  });
}

export function useCreateBlockedPeriod(practiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BlockedPeriodInput) => createBlockedPeriod(practiceId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: blockedTimeKeys.list(practiceId) }),
  });
}

export function useDeleteBlockedPeriod(practiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockedPeriodId: string) => deleteBlockedPeriod(blockedPeriodId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: blockedTimeKeys.list(practiceId) }),
  });
}
