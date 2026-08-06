"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getAppointment,
  listAppointments,
  rescheduleAppointment,
  updateAppointmentStatus,
  type RescheduleInput,
} from "./actions";
import type { AppointmentStatus, ListAppointmentsFilters } from "./types";

export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters: ListAppointmentsFilters) => [...appointmentKeys.lists(), filters] as const,
  detail: (id: string) => [...appointmentKeys.all, "detail", id] as const,
};

export function useAppointments(filters: ListAppointmentsFilters) {
  return useQuery({
    queryKey: appointmentKeys.list(filters),
    queryFn: () => listAppointments(filters),
    enabled: Boolean(filters.practiceId),
    placeholderData: (prev) => prev,
  });
}

export function useAppointment(appointmentId: string | undefined) {
  return useQuery({
    queryKey: appointmentKeys.detail(appointmentId ?? ""),
    queryFn: () => getAppointment(appointmentId!),
    enabled: Boolean(appointmentId),
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(appointmentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RescheduleInput) => rescheduleAppointment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}
