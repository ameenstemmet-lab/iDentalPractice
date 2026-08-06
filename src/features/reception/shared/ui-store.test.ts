import { beforeEach, describe, expect, it } from "vitest";
import { useReceptionUiStore } from "./ui-store";

function resetStore() {
  useReceptionUiStore.setState({
    sidebarCollapsed: false,
    calendarView: "week",
    calendarSelectedPractitionerIds: [],
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

describe("useReceptionUiStore — calendar practitioner filter", () => {
  it("toggles a practitioner into and out of the filter", () => {
    useReceptionUiStore.getState().toggleCalendarPractitioner("practitioner-1");
    expect(useReceptionUiStore.getState().calendarSelectedPractitionerIds).toEqual(["practitioner-1"]);

    useReceptionUiStore.getState().toggleCalendarPractitioner("practitioner-2");
    expect(useReceptionUiStore.getState().calendarSelectedPractitionerIds).toEqual(["practitioner-1", "practitioner-2"]);

    useReceptionUiStore.getState().toggleCalendarPractitioner("practitioner-1");
    expect(useReceptionUiStore.getState().calendarSelectedPractitionerIds).toEqual(["practitioner-2"]);
  });

  it("resets the filter", () => {
    useReceptionUiStore.getState().toggleCalendarPractitioner("practitioner-1");
    useReceptionUiStore.getState().resetCalendarPractitionerFilter();
    expect(useReceptionUiStore.getState().calendarSelectedPractitionerIds).toEqual([]);
  });
});
