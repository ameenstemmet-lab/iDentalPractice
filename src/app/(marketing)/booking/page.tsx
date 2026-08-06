import type { Metadata } from "next";

import { BookingShell } from "@/features/booking/components/booking-shell";
import { BookingPracticeProvider } from "@/features/booking/components/practice-context";
import { getCurrentBookingPractice } from "@/features/booking/actions/practice";

export const metadata: Metadata = {
  title: "Reserve Your Visit — iDentalPractice",
  description: "Book an appointment in a few simple steps.",
};

// Availability changes constantly — this page must never be statically cached.
export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const practice = await getCurrentBookingPractice();

  return (
    <BookingPracticeProvider value={{ practiceId: practice?.id ?? null, timezone: practice?.timezone ?? "UTC" }}>
      <BookingShell />
    </BookingPracticeProvider>
  );
}
