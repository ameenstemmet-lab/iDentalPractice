"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPatient,
  getPatient,
  getPatientAppointments,
  listPatients,
  searchPatients,
  updatePatient,
  type ListPatientsParams,
} from "./actions";
import type { PatientInput } from "./types";

export const patientKeys = {
  all: ["patients"] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (params: ListPatientsParams) => [...patientKeys.lists(), params] as const,
  detail: (id: string) => [...patientKeys.all, "detail", id] as const,
  appointments: (id: string) => [...patientKeys.all, "appointments", id] as const,
  search: (practiceId: string, term: string) => [...patientKeys.all, "search", practiceId, term] as const,
};

export function usePatients(params: ListPatientsParams) {
  return useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () => listPatients(params),
    enabled: Boolean(params.practiceId),
    placeholderData: (prev) => prev,
  });
}

export function usePatient(patientId: string | undefined) {
  return useQuery({
    queryKey: patientKeys.detail(patientId ?? ""),
    queryFn: () => getPatient(patientId!),
    enabled: Boolean(patientId),
  });
}

export function usePatientAppointments(patientId: string | undefined) {
  return useQuery({
    queryKey: patientKeys.appointments(patientId ?? ""),
    queryFn: () => getPatientAppointments(patientId!),
    enabled: Boolean(patientId),
  });
}

export function usePatientSearch(practiceId: string, term: string) {
  return useQuery({
    queryKey: patientKeys.search(practiceId, term),
    queryFn: () => searchPatients(practiceId, term),
    enabled: Boolean(practiceId) && term.trim().length > 0,
  });
}

export function useCreatePatient(practiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientInput) => createPatient(practiceId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ patientId, input }: { patientId: string; input: PatientInput }) => updatePatient(patientId, input),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(patient.id) });
    },
  });
}
