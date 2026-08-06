"use client";

import * as React from "react";

import { SkeletonCard } from "@/components/shared/skeleton-patterns";
import { StepContainer } from "../step-container";
import { StepHeader } from "../step-header";
import { TreatmentCard } from "../treatment-card";
import { fetchTreatments } from "../../services/booking-service";
import { useBookingStore } from "../../store/booking-store";
import type { Treatment } from "../../types";

export function ChooseTreatmentStep() {
  const treatmentId = useBookingStore((s) => s.treatmentId);
  const selectTreatment = useBookingStore((s) => s.selectTreatment);
  const [treatments, setTreatments] = React.useState<Treatment[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetchTreatments().then((data) => {
      if (!cancelled) setTreatments(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StepContainer wide>
      <StepHeader
        eyebrow="Step 2 of 6"
        title="Choose your treatment"
        description="Not sure exactly what you need? Pick the closest match — your dentist will confirm on the day."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {treatments === null
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
