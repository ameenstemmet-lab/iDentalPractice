"use client";

import * as React from "react";

import { SkeletonCard } from "@/components/shared/skeleton-patterns";
import { StepContainer } from "../step-container";
import { StepHeader } from "../step-header";
import { DentistCard } from "../dentist-card";
import { fetchDentists } from "../../services/booking-service";
import { useBookingStore } from "../../store/booking-store";
import type { Dentist } from "../../types";

export function ChooseDentistStep() {
  const dentistId = useBookingStore((s) => s.dentistId);
  const selectDentist = useBookingStore((s) => s.selectDentist);
  const [dentists, setDentists] = React.useState<Dentist[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetchDentists().then((data) => {
      if (!cancelled) setDentists(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StepContainer wide>
      <StepHeader
        eyebrow="Step 1 of 6"
        title="Choose your dentist"
        description="Every dentist on our team is here to make your visit comfortable — pick whoever feels right for you."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {dentists === null
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
