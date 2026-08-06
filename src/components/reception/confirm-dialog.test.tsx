// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
  it("renders nothing interactive when closed", () => {
    render(
      <ConfirmDialog open={false} onOpenChange={() => {}} title="Cancel appointment?" onConfirm={() => {}} />
    );
    expect(screen.queryByText("Cancel appointment?")).not.toBeInTheDocument();
  });

  it("shows title/description and calls onConfirm when confirmed", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Cancel appointment?"
        description="This can't be undone."
        confirmLabel="Yes, cancel"
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText("Cancel appointment?")).toBeInTheDocument();
    expect(screen.getByText("This can't be undone.")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Yes, cancel"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenChange(false) when cancelled", () => {
    const onOpenChange = vi.fn();
    render(<ConfirmDialog open onOpenChange={onOpenChange} title="Delete?" onConfirm={() => {}} />);

    fireEvent.click(screen.getByText("Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables the buttons while loading", () => {
    render(<ConfirmDialog open onOpenChange={() => {}} title="Delete?" onConfirm={() => {}} isLoading />);
    expect(screen.getByText("Please wait…").closest("button")).toBeDisabled();
    expect(screen.getByText("Cancel").closest("button")).toBeDisabled();
  });
});
