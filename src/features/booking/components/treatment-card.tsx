import { ClockIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Treatment } from "../types";
import { formatCurrency } from "../utils/format";

export function TreatmentCard({
  treatment,
  selected = false,
  onSelect,
}: {
  treatment: Treatment;
  selected?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group flex flex-col items-start gap-2 rounded-xl border bg-card p-5 text-left shadow-xs transition-all duration-base",
        "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40"
      )}
    >
      <p className="text-sm font-semibold text-foreground">{treatment.name}</p>
      <p className="text-sm text-muted-foreground">{treatment.shortDescription}</p>

      <div className="mt-auto flex w-full items-center justify-between border-t border-border pt-3 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <ClockIcon className="size-3" />
          {treatment.durationMinutes} min
        </span>
        <span className="font-medium text-foreground">
          from {formatCurrency(treatment.startingPrice)}
        </span>
      </div>
    </button>
  );
}
