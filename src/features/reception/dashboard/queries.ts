"use client";

import { useQuery } from "@tanstack/react-query";

import { getDashboardStats, getRecentActivity } from "./actions";

export function useDashboardStats(practiceId: string) {
  return useQuery({
    queryKey: ["dashboard-stats", practiceId],
    queryFn: () => getDashboardStats(practiceId),
    enabled: Boolean(practiceId),
  });
}

export function useRecentActivity(practiceId: string) {
  return useQuery({
    queryKey: ["dashboard-recent-activity", practiceId],
    queryFn: () => getRecentActivity(practiceId),
    enabled: Boolean(practiceId),
  });
}
