import { ClockIcon, GraduationCapIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Dentist } from "../types";

export function DentistCard({
  dentist,
  selected = false,
  onSelect,
}: {
  dentist: Dentist;
  selected?: boolean;
  onSelect: () => void;
}) {
  const initials = `${dentist.firstName[0]}${dentist.lastName[0]}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group flex flex-col items-start gap-4 rounded-xl border bg-card p-5 text-left shadow-xs transition-all duration-base",
        "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40"
      )}
    >
      <div className="flex w-full items-start gap-3.5">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-base font-semibold text-foreground"
        >
          {initials}
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="truncate text-sm font-semibold text-foreground">
            {dentist.title} {dentist.firstName} {dentist.lastName}
          </p>
          <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
            <GraduationCapIcon className="mt-0.5 size-3 shrink-0" />
            <span>{dentist.qualification}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {dentist.specialInterests.map((interest) => (
          <Badge key={interest} variant="secondary" className="font-normal">
            {interest}
          </Badge>
        ))}
      </div>

      <div className="mt-auto flex w-full items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{dentist.yearsOfExperience} years experience</span>
        <span className="flex items-center gap-1">
          <ClockIcon className="size-3" />~{dentist.avgConsultationDuration} min
        </span>
      </div>
    </button>
  );
}
