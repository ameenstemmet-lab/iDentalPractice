import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookingShell } from "@/features/booking/components/booking-shell";
import { BookingPracticeProvider } from "@/features/booking/components/practice-context";
import { getBookingPracticeBySlug } from "@/features/booking/actions/practice";

// Availability changes constantly — this page must never be statically cached.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ practiceSlug: string }>;
}): Promise<Metadata> {
  const { practiceSlug } = await params;
  const practice = await getBookingPracticeBySlug(practiceSlug);
  return {
    title: practice ? `Reserve Your Visit — ${practice.practiceName}` : "Reserve Your Visit",
    description: "Book an appointment in a few simple steps.",
  };
}

export default async function BookingBySlugPage({ params }: { params: Promise<{ practiceSlug: string }> }) {
  const { practiceSlug } = await params;
  const practice = await getBookingPracticeBySlug(practiceSlug);
  if (!practice) notFound();

  return (
    <BookingPracticeProvider value={{ practiceId: practice.id, timezone: practice.timezone }}>
      <BookingShell />
    </BookingPracticeProvider>
  );
}
