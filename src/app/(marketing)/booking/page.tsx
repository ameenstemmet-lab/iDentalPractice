import type { Metadata } from "next";

import { BookingShell } from "@/features/booking/components/booking-shell";

export const metadata: Metadata = {
  title: "Reserve Your Visit — iDentalPractice",
  description: "Book an appointment in a few simple steps.",
};

export default function BookingPage() {
  return <BookingShell />;
}
