import { cn } from "@/lib/utils";

export function TimeSlotButton({
  time,
  available,
  selected,
  onSelect,
}: {
  time: string;
  available: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!available}
      aria-pressed={selected}
      aria-label={available ? `${time}, available` : `${time}, unavailable`}
      onClick={onSelect}
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-fast focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        !available && "cursor-not-allowed border-border/60 text-muted-foreground/50 line-through",
        available &&
          !selected &&
          "border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xs",
        selected && "border-primary bg-primary text-primary-foreground shadow-xs"
      )}
    >
      {time}
    </button>
  );
}
