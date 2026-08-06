"use client";

import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";
import { StepContainer } from "../step-container";
import { StepHeader } from "../step-header";
import { TimeSlotButton } from "../time-slot-button";
import { useBookingPractice } from "../practice-context";
import { useBookingStore } from "../../store/booking-store";
import { useBookingSelection } from "../../hooks/use-booking-selection";
import { getTimeSlotsAction } from "../../actions/availability-actions";
import { formatDateLong } from "../../utils/format";

export function ChooseTimeStep() {
  const { timezone } = useBookingPractice();
  const practitionerId = useBookingStore((s) => s.practitionerId);
  const date = useBookingStore((s) => s.date);
  const time = useBookingStore((s) => s.time);
  const selectTime = useBookingStore((s) => s.selectTime);
  const { treatment } = useBookingSelection();
  const durationMinutes = treatment?.durationMinutes ?? 30;

  const { data: day } = useQuery({
    queryKey: ["booking", "time-slots", practitionerId, date, timezone, durationMinutes],
    queryFn: () => getTimeSlotsAction(practitionerId!, date!, timezone, durationMinutes),
    enabled: !!practitionerId && !!date,
    staleTime: 15_000,
  });

  const slots = day?.slots ?? null;

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
