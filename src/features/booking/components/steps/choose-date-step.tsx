"use client";

import * as React from "react";
import { CalendarXIcon, SparklesIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { StepContainer } from "../step-container";
import { StepHeader } from "../step-header";
import { useBookingStore } from "../../store/booking-store";
import {
  findNextAvailableDate,
  getBookingWindowBounds,
  isDayFullyBooked,
  isPastDate,
  isPracticeClosed,
} from "../../services/availability-service";
import { formatDateLong, toISODate } from "../../utils/format";

export function ChooseDateStep() {
  const dentistId = useBookingStore((s) => s.dentistId) ?? "unknown";
  const date = useBookingStore((s) => s.date);
  const selectDate = useBookingStore((s) => s.selectDate);
  const [pendingFullDate, setPendingFullDate] = React.useState<Date | null>(null);
  const { from, to } = getBookingWindowBounds();

  const selected =
    pendingFullDate ?? (date ? new Date(`${date}T00:00:00`) : undefined);

  function handleSelect(next: Date | undefined) {
    if (!next) return;
    if (isDayFullyBooked(dentistId, next)) {
      setPendingFullDate(next);
    } else {
      setPendingFullDate(null);
      selectDate(toISODate(next));
    }
  }

  function jumpToNextAvailable() {
    if (!pendingFullDate) return;
    const next = findNextAvailableDate(dentistId, pendingFullDate);
    if (next) {
      setPendingFullDate(null);
      selectDate(toISODate(next));
    }
  }

  return (
    <StepContainer>
      <StepHeader
        eyebrow="Step 3 of 6"
        title="Choose a date"
        description="Pick a day that works for you. We're closed Sundays."
      />

      <div className="flex flex-col items-center gap-4">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          startMonth={from}
          endMonth={to}
          disabled={(d) => isPastDate(d) || isPracticeClosed(d) || d > to}
          modifiers={{ full: (d) => isDayFullyBooked(dentistId, d) }}
          modifiersClassNames={{ full: "opacity-40 line-through" }}
          className="rounded-xl border border-border bg-card p-3 shadow-xs [--cell-size:2.75rem]"
        />

        {pendingFullDate ? (
          <Alert variant="warning" className="w-full max-w-sm">
            <CalendarXIcon />
            <AlertTitle>Fully booked</AlertTitle>
            <AlertDescription>
              <p>{formatDateLong(toISODate(pendingFullDate))} has no remaining openings.</p>
              <Button
                type="button"
                variant="warning"
                size="sm"
                onClick={jumpToNextAvailable}
                className="mt-2 gap-1.5"
              >
                <SparklesIcon className="size-3.5" />
                View next available date
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </StepContainer>
  );
}
