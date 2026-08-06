"use client";

import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { StepContainer } from "../step-container";
import { StepHeader } from "../step-header";
import { TimeSlotButton } from "../time-slot-button";
import { useBookingStore } from "../../store/booking-store";
import { fetchDayAvailability } from "../../services/availability-service";
import { formatDateLong } from "../../utils/format";
import type { TimeSlot } from "../../types";

export function ChooseTimeStep() {
  const dentistId = useBookingStore((s) => s.dentistId) ?? "unknown";
  const date = useBookingStore((s) => s.date);
  const time = useBookingStore((s) => s.time);
  const selectTime = useBookingStore((s) => s.selectTime);
  const [slots, setSlots] = React.useState<TimeSlot[] | null>(null);

  React.useEffect(() => {
    if (!date) return;
    setSlots(null);
    let cancelled = false;
    fetchDayAvailability(dentistId, new Date(`${date}T00:00:00`)).then((day) => {
      if (!cancelled) setSlots(day.slots);
    });
    return () => {
      cancelled = true;
    };
  }, [dentistId, date]);

  return (
    <StepContainer>
      <StepHeader
        eyebrow="Step 4 of 6"
        title="Choose a time"
        description={date ? formatDateLong(date) : undefined}
      />

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {slots === null
          ? Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))
          : slots.map((slot) => (
              <TimeSlotButton
                key={slot.time}
                time={slot.time}
                available={slot.available}
                selected={slot.time === time}
                onSelect={() => selectTime(slot.time)}
              />
            ))}
      </div>
    </StepContainer>
  );
}
