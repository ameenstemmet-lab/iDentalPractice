import { beforeEach, describe, expect, it } from "vitest";
import { useReceptionUiStore } from "./ui-store";

function resetStore() {
  useReceptionUiStore.setState({
    sidebarCollapsed: false,
    calendarView: "week",
    calendarSelectedDentistIds: [],
  });
}

beforeEach(resetStore);

describe("useReceptionUiStore — sidebar", () => {
  it("toggles collapsed state", () => {
    expect(useReceptionUiStore.getState().sidebarCollapsed).toBe(false);
    useReceptionUiStore.getState().toggleSidebar();
    expect(useReceptionUiStore.getState().sidebarCollapsed).toBe(true);
    useReceptionUiStore.getState().toggleSidebar();
    expect(useReceptionUiStore.getState().sidebarCollapsed).toBe(false);
  });

  it("sets collapsed state directly", () => {
    useReceptionUiStore.getState().setSidebarCollapsed(true);
    expect(useReceptionUiStore.getState().sidebarCollapsed).toBe(true);
  });
});

describe("useReceptionUiStore — calendar view", () => {
  it("defaults to week", () => {
    expect(useReceptionUiStore.getState().calendarView).toBe("week");
  });

  it("switches views", () => {
    useReceptionUiStore.getState().setCalendarView("month");
    expect(useReceptionUiStore.getState().calendarView).toBe("month");
  });
});

describe("useReceptionUiStore — calendar dentist filter", () => {
  it("toggles a dentist into and out of the filter", () => {
    useReceptionUiStore.getState().toggleCalendarDentist("dentist-1");
    expect(useReceptionUiStore.getState().calendarSelectedDentistIds).toEqual(["dentist-1"]);

    useReceptionUiStore.getState().toggleCalendarDentist("dentist-2");
    expect(useReceptionUiStore.getState().calendarSelectedDentistIds).toEqual(["dentist-1", "dentist-2"]);

    useReceptionUiStore.getState().toggleCalendarDentist("dentist-1");
    expect(useReceptionUiStore.getState().calendarSelectedDentistIds).toEqual(["dentist-2"]);
  });

  it("resets the filter", () => {
    useReceptionUiStore.getState().toggleCalendarDentist("dentist-1");
    useReceptionUiStore.getState().resetCalendarDentistFilter();
    expect(useReceptionUiStore.getState().calendarSelectedDentistIds).toEqual([]);
  });
});
