"use client";

import { ConfirmDialog } from "./confirm-dialog";

export interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemLabel: string;
  isLoading?: boolean;
  onConfirm: () => void;
}

/** Specialized ConfirmDialog for destructive deletes — always the destructive button variant. */
export function DeleteDialog({ open, onOpenChange, itemLabel, isLoading, onConfirm }: DeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete ${itemLabel}?`}
      description="This can't be undone."
      confirmLabel="Delete"
      variant="destructive"
      isLoading={isLoading}
      onConfirm={onConfirm}
    />
  );
}
