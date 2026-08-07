"use client";

import * as React from "react";

export interface PracticeContextValue {
  practiceId: string | null;
  practiceName: string | null;
  timezone: string;
  role: "staff" | "practitioner";
  /** Set only when role === "practitioner" — used to scope their dashboard to their own diary. */
  practitionerId: string | null;
}

const PracticeContext = React.createContext<PracticeContextValue>({
  practiceId: null,
  practiceName: null,
  timezone: "UTC",
  role: "staff",
  practitionerId: null,
});

/**
 * Makes the server-resolved "current practice" (see
 * features/reception/shared/practice-context.ts — TODO(auth) applies
 * there, not here) available to client components in the dashboard shell
 * without prop-drilling it through every page.
 */
export function PracticeProvider({
  value,
  children,
}: {
  value: PracticeContextValue;
  children: React.ReactNode;
}) {
  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
}

export function usePracticeContext(): PracticeContextValue {
  return React.useContext(PracticeContext);
}
