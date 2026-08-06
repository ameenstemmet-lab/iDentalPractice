"use client";

import { SkeletonCard } from "@/components/shared/skeleton-patterns";
import { StepContainer } from "../step-container";
import { StepHeader } from "../step-header";
import { DentistCard } from "../dentist-card";
import { useBookingPractice } from "../practice-context";
import { useDentistsQuery } from "../../hooks/use-catalog";
import { useBookingStore } from "../../store/booking-store";

export function ChooseDentistStep() {
  const { practiceId } = useBookingPractice();
  const dentistId = useBookingStore((s) => s.dentistId);
  const selectDentist = useBookingStore((s) => s.selectDentist);
  const { data: dentists } = useDentistsQuery(practiceId);

  return (
    <StepContainer wide>
      <StepHeader
        eyebrow="Step 1 of 6"
        title="Choose your dentist"
        description="Every dentist on our team is here to make your visit comfortable — pick whoever feels right for you."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {dentists === undefined
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : dentists.map((dentist) => (
              <DentistCard
                key={dentist.id}
                dentist={dentist}
                selected={dentist.id === dentistId}
                onSelect={() => selectDentist(dentist.id)}
              />
            ))}
      </div>
    </StepContainer>
  );
}
