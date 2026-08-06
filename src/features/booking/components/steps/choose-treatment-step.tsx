"use client";

import { SkeletonCard } from "@/components/shared/skeleton-patterns";
import { StepContainer } from "../step-container";
import { StepHeader } from "../step-header";
import { TreatmentCard } from "../treatment-card";
import { useBookingPractice } from "../practice-context";
import { useTreatmentsQuery } from "../../hooks/use-catalog";
import { useBookingStore } from "../../store/booking-store";

export function ChooseTreatmentStep() {
  const { practiceId } = useBookingPractice();
  const practitionerId = useBookingStore((s) => s.practitionerId);
  const treatmentId = useBookingStore((s) => s.treatmentId);
  const selectTreatment = useBookingStore((s) => s.selectTreatment);
  const { data: treatments } = useTreatmentsQuery(practiceId, practitionerId);

  return (
    <StepContainer wide>
      <StepHeader
        eyebrow="Step 2 of 6"
        title="Choose your treatment"
        description="Not sure exactly what you need? Pick the closest match — your practitioner will confirm on the day."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {treatments === undefined
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : treatments.map((treatment) => (
              <TreatmentCard
                key={treatment.id}
                treatment={treatment}
                selected={treatment.id === treatmentId}
                onSelect={() => selectTreatment(treatment.id)}
              />
            ))}
      </div>
    </StepContainer>
  );
}
