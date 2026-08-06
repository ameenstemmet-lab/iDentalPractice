// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UsersIcon } from "lucide-react";
import { StatCard } from "./stat-card";

describe("StatCard", () => {
  it("renders the label and value", () => {
    render(<StatCard label="Today's appointments" value={12} icon={UsersIcon} />);
    expect(screen.getByText("Today's appointments")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("shows a skeleton instead of the value while loading", () => {
    render(<StatCard label="Today's appointments" value={12} icon={UsersIcon} isLoading />);
    expect(screen.queryByText("12")).not.toBeInTheDocument();
  });

  it("renders an optional hint", () => {
    render(<StatCard label="Cancelled" value={3} icon={UsersIcon} hint="Last 7 days" />);
    expect(screen.getByText("Last 7 days")).toBeInTheDocument();
  });
});
