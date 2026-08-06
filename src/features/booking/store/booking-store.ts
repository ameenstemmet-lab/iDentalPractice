import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { BOOKING_STEPS, type BookingReservation, type BookingStep, type PatientDetails } from "../types";

type Direction = "forward" | "backward";

interface BookingState {
  step: BookingStep;
  direction: Direction;
  /** Highest step index reached this session — gates which steps the
   *  step indicator will let you jump back to. */
  furthestStepIndex: number;

  dentistId: string | null;
  treatmentId: string | null;
  date: string | null; // ISO yyyy-mm-dd
  time: string | null;
  patient: PatientDetails | null;
  reservation: BookingReservation | null;

  selectDentist: (id: string) => void;
  selectTreatment: (id: string) => void;
  selectDate: (date: string) => void;
  selectTime: (time: string) => void;
  submitPatientDetails: (details: PatientDetails) => void;
  setReservation: (reservation: BookingReservation) => void;
  goToStep: (step: BookingStep) => void;
  goBack: () => void;
  reset: () => void;
}

const initialState = {
  step: "dentist" as BookingStep,
  direction: "forward" as Direction,
  furthestStepIndex: 0,
  dentistId: null,
  treatmentId: null,
  date: null,
  time: null,
  patient: null,
  reservation: null,
};

function stepIndex(step: BookingStep): number {
  return BOOKING_STEPS.indexOf(step);
}

function advanceTo(
  state: BookingState,
  step: BookingStep
): Pick<BookingState, "step" | "direction" | "furthestStepIndex"> {
  return {
    step,
    direction: "forward",
    furthestStepIndex: Math.max(state.furthestStepIndex, stepIndex(step)),
  };
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      selectDentist: (id) =>
        set((state) => ({ dentistId: id, ...advanceTo(state, "treatment") })),

      selectTreatment: (id) =>
        set((state) => ({ treatmentId: id, ...advanceTo(state, "date") })),

      selectDate: (date) =>
        set((state) => ({ date, time: null, ...advanceTo(state, "time") })),

      selectTime: (time) =>
        set((state) => ({ time, ...advanceTo(state, "details") })),

      submitPatientDetails: (details) =>
        set((state) => ({ patient: details, ...advanceTo(state, "review") })),

      setReservation: (reservation) =>
        set((state) => ({ reservation, ...advanceTo(state, "confirmation") })),

      goToStep: (step) => {
        const target = stepIndex(step);
        if (target > get().furthestStepIndex) return; // no skipping ahead
        set({ step, direction: target < stepIndex(get().step) ? "backward" : "forward" });
      },

      goBack: () => {
        const current = stepIndex(get().step);
        if (current === 0) return;
        set({ step: BOOKING_STEPS[current - 1], direction: "backward" });
      },

      reset: () => set({ ...initialState }),
    }),
    {
      name: "idp-booking",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
