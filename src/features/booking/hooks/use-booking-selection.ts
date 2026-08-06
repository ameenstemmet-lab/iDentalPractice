import { dentists } from "../data/dentists";
import { treatments } from "../data/treatments";
import { useBookingStore } from "../store/booking-store";

/** Resolves the store's selected ids to their full mock records. */
export function useBookingSelection() {
  const dentistId = useBookingStore((s) => s.dentistId);
  const treatmentId = useBookingStore((s) => s.treatmentId);

  const dentist = dentistId ? dentists.find((d) => d.id === dentistId) ?? null : null;
  const treatment = treatmentId
    ? treatments.find((t) => t.id === treatmentId) ?? null
    : null;

  return { dentist, treatment };
}
