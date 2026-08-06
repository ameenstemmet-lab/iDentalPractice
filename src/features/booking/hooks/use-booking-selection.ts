"use client";

import { useBookingPractice } from "../components/practice-context";
import { useBookingStore } from "../store/booking-store";
import { usePractitionersQuery, useTreatmentsQuery } from "./use-catalog";

/**
 * Resolves the store's selected ids to their full records from the catalog
 * cache. `isLoading` is true only while the catalog is still in flight —
 * callers must wait for it before treating a null practitioner/treatment as "not
 * selected" (a persisted id that no longer matches any record, e.g. a stale
 * session from before a data reset, is a distinct, load-bearing case: it
 * settles to null once loading finishes and should be handled explicitly,
 * not confused with "still loading").
 */
export function useBookingSelection() {
  const { practiceId } = useBookingPractice();
  const practitionerId = useBookingStore((s) => s.practitionerId);
  const treatmentId = useBookingStore((s) => s.treatmentId);

  const { data: practitioners, isLoading: practitionersLoading } = usePractitionersQuery(practiceId);
  const { data: treatments, isLoading: treatmentsLoading } = useTreatmentsQuery(practiceId, practitionerId);

  const practitioner = practitionerId ? practitioners?.find((d) => d.id === practitionerId) ?? null : null;
  const treatment = treatmentId ? treatments?.find((t) => t.id === treatmentId) ?? null : null;
  const isLoading = practitionersLoading || treatmentsLoading;

  return { practitioner, treatment, isLoading };
}
