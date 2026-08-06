import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CalendarViewMode = "day" | "week" | "month" | "agenda";

interface ReceptionUiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  calendarView: CalendarViewMode;
  setCalendarView: (view: CalendarViewMode) => void;
  calendarSelectedDentistIds: string[];
  toggleCalendarDentist: (dentistId: string) => void;
  resetCalendarDentistFilter: () => void;
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
      calendarSelectedDentistIds: [],
      toggleCalendarDentist: (dentistId) =>
        set((s) => ({
          calendarSelectedDentistIds: s.calendarSelectedDentistIds.includes(dentistId)
            ? s.calendarSelectedDentistIds.filter((id) => id !== dentistId)
            : [...s.calendarSelectedDentistIds, dentistId],
        })),
      resetCalendarDentistFilter: () => set({ calendarSelectedDentistIds: [] }),
    }),
    { name: "idp-reception-ui" }
  )
);
