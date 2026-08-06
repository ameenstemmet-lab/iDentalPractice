"use client";

import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { BOOKING_STEPS, type BookingStep } from "../types";
import { useBookingStore } from "../store/booking-store";

const STEP_LABELS: Record<Exclude<BookingStep, "confirmation">, string> = {
  practitioner: "Practitioner",
  treatment: "Treatment",
  date: "Date",
  time: "Time",
  details: "Your details",
  review: "Review",
};

const visibleSteps = BOOKING_STEPS.filter(
  (step): step is Exclude<BookingStep, "confirmation"> => step !== "confirmation"
);

export function StepIndicator() {
  const step = useBookingStore((s) => s.step);
  const furthestStepIndex = useBookingStore((s) => s.furthestStepIndex);
  const goToStep = useBookingStore((s) => s.goToStep);
  const currentIndex = visibleSteps.indexOf(step as Exclude<BookingStep, "confirmation">);

  return (
    <nav aria-label="Booking progress" className="w-full">
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {visibleSteps.map((s, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isReachable = i <= furthestStepIndex;

          return (
            <li key={s} className="flex flex-1 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                disabled={!isReachable || isCurrent}
                onClick={() => goToStep(s)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium transition-colors duration-fast disabled:cursor-default",
                  isCurrent &&
                    "border-primary bg-primary text-primary-foreground",
                  isComplete &&
                    "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20",
                  !isCurrent &&
                    !isComplete &&
                    "border-border bg-transparent text-muted-foreground"
                )}
              >
                {isComplete ? <CheckIcon className="size-3" /> : i + 1}
              </button>
              <span
                className={cn(
                  "hidden text-xs font-medium whitespace-nowrap sm:inline",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {STEP_LABELS[s]}
              </span>
              {i < visibleSteps.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "h-px flex-1 transition-colors duration-fast",
                    isComplete ? "bg-primary/30" : "bg-border"
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
