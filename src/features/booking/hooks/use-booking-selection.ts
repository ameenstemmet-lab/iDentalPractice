"use client";

import { useBookingPractice } from "../components/practice-context";
import { useBookingStore } from "../store/booking-store";
import { useDentistsQuery, useTreatmentsQuery } from "./use-catalog";

/** Resolves the store's selected ids to their full records from the catalog cache. */
export function useBookingSelection() {
  const { practiceId } = useBookingPractice();
  const dentistId = useBookingStore((s) => s.dentistId);
  const treatmentId = useBookingStore((s) => s.treatmentId);

  const { data: dentists } = useDentistsQuery(practiceId);
  const { data: treatments } = useTreatmentsQuery(practiceId);

  const dentist = dentistId ? dentists?.find((d) => d.id === dentistId) ?? null : null;
  const treatment = treatmentId ? treatments?.find((t) => t.id === treatmentId) ?? null : null;

  return { dentist, treatment };
}
