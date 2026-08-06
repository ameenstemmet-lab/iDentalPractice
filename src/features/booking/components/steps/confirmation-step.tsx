"use client";

import Link from "next/link";
import { toast } from "sonner";
import { CheckIcon, DownloadIcon, HomeIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StepContainer } from "../step-container";
import { BookingSummary } from "../booking-summary";
import { useBookingSelection } from "../../hooks/use-booking-selection";
import { useBookingStore } from "../../store/booking-store";

export function ConfirmationStep() {
  const { dentist, treatment } = useBookingSelection();
  const date = useBookingStore((s) => s.date);
  const time = useBookingStore((s) => s.time);
  const patient = useBookingStore((s) => s.patient);
  const reservation = useBookingStore((s) => s.reservation);
  const reset = useBookingStore((s) => s.reset);

  if (!dentist || !treatment || !date || !time || !reservation) return null;

  function bookAnother() {
    reset();
  }

  return (
    <StepContainer className="items-center text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-success/10 duration-500 ease-premium animate-in zoom-in-50 fade-in-0">
        <CheckIcon className="size-8 text-success" strokeWidth={2.5} />
      </div>

      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Booking confirmed
      </p>
      <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        You&apos;re all set
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
        A confirmation has been sent to {patient?.email}. We look forward to seeing you.
      </p>

      <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-2">
        <span className="text-xs text-muted-foreground">Reference</span>
        <p className="font-mono text-sm font-semibold tracking-wide text-foreground">
          {reservation.reference}
        </p>
      </div>

      <div className="mt-8 w-full text-left">
        <BookingSummary dentist={dentist} treatment={treatment} date={date} time={time} />
      </div>

      <div className="mt-8 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          onClick={() => toast.info("Download coming soon")}
        >
          <DownloadIcon className="size-4" />
          Download confirmation
        </Button>
        <Button type="button" variant="secondary" className="gap-1.5" onClick={bookAnother}>
          <RotateCcwIcon className="size-4" />
          Book another appointment
        </Button>
        <Button asChild className="gap-1.5" onClick={reset}>
          <Link href="/">
            <HomeIcon className="size-4" />
            Return home
          </Link>
        </Button>
      </div>
    </StepContainer>
  );
}
