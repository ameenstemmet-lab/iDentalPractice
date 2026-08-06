"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarXIcon, SparklesIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { StepContainer } from "../step-container";
import { StepHeader } from "../step-header";
import { useBookingPractice } from "../practice-context";
import { useBookingStore } from "../../store/booking-store";
import { useBookingSelection } from "../../hooks/use-booking-selection";
import { findNextAvailableAction, getRangeAvailabilityAction } from "../../actions/availability-actions";
import { formatDateLong, toISODate } from "../../utils/format";
import type { DayAvailability } from "../../types";

const BOOKING_WINDOW_DAYS = 60;

function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function getBookingWindowBounds(): { from: Date; to: Date } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + BOOKING_WINDOW_DAYS);
  return { from, to };
}

function isFullyBooked(day: DayAvailability | undefined): boolean {
  if (!day || day.closed) return false;
  return day.slots.length > 0 && day.slots.every((s) => !s.available);
}

export function ChooseDateStep() {
  const { timezone } = useBookingPractice();
  const dentistId = useBookingStore((s) => s.dentistId);
  const date = useBookingStore((s) => s.date);
  const selectDate = useBookingStore((s) => s.selectDate);
  const { treatment } = useBookingSelection();
  const durationMinutes = treatment?.durationMinutes ?? 30;
  const [pendingFullDate, setPendingFullDate] = React.useState<Date | null>(null);
  const { from, to } = getBookingWindowBounds();

  const { data: range } = useQuery({
    queryKey: ["booking", "range-availability", dentistId, timezone, durationMinutes],
    queryFn: () =>
      getRangeAvailabilityAction(dentistId!, toISODate(from), BOOKING_WINDOW_DAYS, timezone, durationMinutes),
    enabled: !!dentistId,
    staleTime: 30_000,
  });

  const byDate = React.useMemo(() => {
    const map = new Map<string, DayAvailability>();
    range?.forEach((day) => map.set(day.date, day));
    return map;
  }, [range]);

  const selected = pendingFullDate ?? (date ? new Date(`${date}T00:00:00`) : undefined);

  function handleSelect(next: Date | undefined) {
    if (!next) return;
    if (isFullyBooked(byDate.get(toISODate(next)))) {
      setPendingFullDate(next);
    } else {
      setPendingFullDate(null);
      selectDate(toISODate(next));
    }
  }

  async function jumpToNextAvailable() {
    if (!pendingFullDate || !dentistId) return;
    const next = await findNextAvailableAction(dentistId, toISODate(pendingFullDate), timezone, durationMinutes);
    if (next) {
      setPendingFullDate(null);
      selectDate(next.date);
    }
  }

  return (
    <StepContainer>
      <StepHeader
        eyebrow="Step 3 of 6"
        title="Choose a date"
        description="Pick a day that works for you."
      />

      <div className="flex flex-col items-center gap-4">
        {range === undefined ? (
          <Skeleton className="h-[19rem] w-full max-w-sm rounded-xl" />
        ) : (
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            startMonth={from}
            endMonth={to}
            disabled={(d) => isPastDate(d) || d > to || (byDate.get(toISODate(d))?.closed ?? true)}
            modifiers={{ full: (d) => isFullyBooked(byDate.get(toISODate(d))) }}
            modifiersClassNames={{ full: "opacity-40 line-through" }}
            className="rounded-xl border border-border bg-card p-3 shadow-xs [--cell-size:2.75rem]"
          />
        )}

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
