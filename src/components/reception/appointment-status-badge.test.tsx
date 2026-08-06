// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppointmentStatusBadge } from "./appointment-status-badge";

describe("AppointmentStatusBadge", () => {
  it("renders the correct label for each status", () => {
    const { rerender } = render(<AppointmentStatusBadge status="booked" />);
    expect(screen.getByText("Booked")).toBeInTheDocument();

    rerender(<AppointmentStatusBadge status="confirmed" />);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();

    rerender(<AppointmentStatusBadge status="completed" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();

    rerender(<AppointmentStatusBadge status="cancelled" />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();

    rerender(<AppointmentStatusBadge status="no_show" />);
    expect(screen.getByText("No Show")).toBeInTheDocument();
  });
});
