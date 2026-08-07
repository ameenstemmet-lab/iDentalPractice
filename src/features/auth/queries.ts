"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { listTeamMembersAction } from "./team-actions";

export const teamKeys = {
  all: ["team"] as const,
  list: (practiceId: string) => [...teamKeys.all, "list", practiceId] as const,
};

export function useTeamMembers(practiceId: string) {
  return useQuery({
    queryKey: teamKeys.list(practiceId),
    queryFn: () => listTeamMembersAction(practiceId),
    enabled: Boolean(practiceId),
  });
}

export function useInvalidateTeamMembers() {
  const queryClient = useQueryClient();
  return (practiceId: string) => queryClient.invalidateQueries({ queryKey: teamKeys.list(practiceId) });
}
