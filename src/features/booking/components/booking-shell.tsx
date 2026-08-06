"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { StepIndicator } from "./step-indicator";
import { ChoosePractitionerStep } from "./steps/choose-practitioner-step";
import { ChooseTreatmentStep } from "./steps/choose-treatment-step";
import { ChooseDateStep } from "./steps/choose-date-step";
import { ChooseTimeStep } from "./steps/choose-time-step";
import { PatientDetailsStep } from "./steps/patient-details-step";
import { ReviewBookingStep } from "./steps/review-booking-step";
import { ConfirmationStep } from "./steps/confirmation-step";
import { useBookingStore } from "../store/booking-store";
import type { BookingStep } from "../types";

const stepComponents: Record<BookingStep, React.ComponentType> = {
  practitioner: ChoosePractitionerStep,
  treatment: ChooseTreatmentStep,
  date: ChooseDateStep,
  time: ChooseTimeStep,
  details: PatientDetailsStep,
  review: ReviewBookingStep,
  confirmation: ConfirmationStep,
};

/**
 * Wizard chrome: brand mark, step progress, back navigation, and an
 * animated viewport that swaps in the active step. Each step is its own
 * full view — there is no long scrolling page.
 */
export function BookingShell() {
  const step = useBookingStore((s) => s.step);
  const direction = useBookingStore((s) => s.direction);
  const goBack = useBookingStore((s) => s.goBack);
  const isConfirmation = step === "confirmation";
  const StepComponent = stepComponents[step];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            iD
          </span>
          <span className="hidden sm:inline">iDentalPractice</span>
        </Link>

        {!isConfirmation ? (
          <div className="min-w-0 flex-1 px-2 sm:px-8">
            <StepIndicator />
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <ThemeToggle className="shrink-0" />
      </header>

      <main className="flex flex-1 flex-col">
        {!isConfirmation && step !== "practitioner" ? (
          <div className="px-4 pt-4 sm:px-6">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="gap-1.5 text-muted-foreground"
            >
              <ArrowLeftIcon className="size-3.5" />
              Back
            </Button>
          </div>
        ) : null}

        <div
          key={step}
          className={cn(
            "flex flex-1 flex-col duration-300 ease-out animate-in fade-in-0",
            direction === "forward" ? "slide-in-from-right-6" : "slide-in-from-left-6"
          )}
        >
          <StepComponent />
        </div>
      </main>
    </div>
  );
}
