"use client";

import * as React from "react";

export interface BookingPracticeContextValue {
  practiceId: string | null;
  timezone: string;
}

const BookingPracticeContext = React.createContext<BookingPracticeContextValue>({
  practiceId: null,
  timezone: "UTC",
});

export function BookingPracticeProvider({
  value,
  children,
}: {
  value: BookingPracticeContextValue;
  children: React.ReactNode;
}) {
  return <BookingPracticeContext.Provider value={value}>{children}</BookingPracticeContext.Provider>;
}

export function useBookingPractice(): BookingPracticeContextValue {
  return React.useContext(BookingPracticeContext);
}
