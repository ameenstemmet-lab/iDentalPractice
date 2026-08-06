"use client";

import { SkeletonCard } from "@/components/shared/skeleton-patterns";
import { StepContainer } from "../step-container";
import { StepHeader } from "../step-header";
import { PractitionerCard } from "../practitioner-card";
import { useBookingPractice } from "../practice-context";
import { usePractitionersQuery } from "../../hooks/use-catalog";
import { useBookingStore } from "../../store/booking-store";

export function ChoosePractitionerStep() {
  const { practiceId } = useBookingPractice();
  const practitionerId = useBookingStore((s) => s.practitionerId);
  const selectPractitioner = useBookingStore((s) => s.selectPractitioner);
  const { data: practitioners } = usePractitionersQuery(practiceId);

  return (
    <StepContainer wide>
      <StepHeader
        eyebrow="Step 1 of 6"
        title="Choose your practitioner"
        description="Every practitioner on our team is here to make your visit comfortable — pick whoever feels right for you."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {practitioners === undefined
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : practitioners.map((practitioner) => (
              <PractitionerCard
                key={practitioner.id}
                practitioner={practitioner}
                selected={practitioner.id === practitionerId}
                onSelect={() => selectPractitioner(practitioner.id)}
              />
            ))}
      </div>
    </StepContainer>
  );
}
