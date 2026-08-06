"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StepContainer } from "../step-container";
import { StepHeader } from "../step-header";
import { BookingSummary } from "../booking-summary";
import { useBookingSelection } from "../../hooks/use-booking-selection";
import { useBookingStore } from "../../store/booking-store";
import { submitBooking } from "../../services/booking-service";

export function ReviewBookingStep() {
  const { dentist, treatment } = useBookingSelection();
  const date = useBookingStore((s) => s.date);
  const time = useBookingStore((s) => s.time);
  const patient = useBookingStore((s) => s.patient);
  const goBack = useBookingStore((s) => s.goBack);
  const goToStep = useBookingStore((s) => s.goToStep);
  const setReservation = useBookingStore((s) => s.setReservation);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isComplete = dentist && treatment && date && time && patient;

  React.useEffect(() => {
    if (!isComplete) goToStep("dentist");
  }, [isComplete, goToStep]);

  if (!isComplete) return null;

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      const reservation = await submitBooking({
        dentistId: dentist!.id,
        treatmentId: treatment!.id,
        date: date!,
        time: time!,
        patient: patient!,
      });
      setReservation(reservation);
    } catch {
      toast.error("Something went wrong confirming your booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <StepContainer>
      <StepHeader
        eyebrow="Step 6 of 6"
        title="Review your booking"
        description="Please check everything is correct before confirming."
      />

      <BookingSummary
        dentist={dentist}
        treatment={treatment}
        date={date}
        time={time}
        patient={patient}
      />

      <div className="mt-8 flex items-center gap-3">
        <Button type="button" variant="outline" onClick={goBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button type="button" onClick={handleConfirm} disabled={isSubmitting} className="flex-1 sm:flex-none">
          {isSubmitting ? "Confirming…" : "Confirm booking"}
        </Button>
      </div>
    </StepContainer>
  );
}
