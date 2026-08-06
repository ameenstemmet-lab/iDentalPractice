import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CalendarViewMode = "day" | "week" | "month" | "agenda";

interface ReceptionUiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  calendarView: CalendarViewMode;
  setCalendarView: (view: CalendarViewMode) => void;
  calendarSelectedPractitionerIds: string[];
  toggleCalendarPractitioner: (practitionerId: string) => void;
  resetCalendarPractitionerFilter: () => void;
}

/**
 * Client-only UI state — never server data. Server data (appointments,
 * patients, ...) lives in React Query's cache, not here; this store only
 * remembers layout/view preferences across navigation within a session.
 */
export const useReceptionUiStore = create<ReceptionUiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      calendarView: "week",
      setCalendarView: (view) => set({ calendarView: view }),
      calendarSelectedPractitionerIds: [],
      toggleCalendarPractitioner: (practitionerId) =>
        set((s) => ({
          calendarSelectedPractitionerIds: s.calendarSelectedPractitionerIds.includes(practitionerId)
            ? s.calendarSelectedPractitionerIds.filter((id) => id !== practitionerId)
            : [...s.calendarSelectedPractitionerIds, practitionerId],
        })),
      resetCalendarPractitionerFilter: () => set({ calendarSelectedPractitionerIds: [] }),
    }),
    { name: "idp-reception-ui" }
  )
);
