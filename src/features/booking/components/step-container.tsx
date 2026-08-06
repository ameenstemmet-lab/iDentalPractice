import { cn } from "@/lib/utils";

/** Consistent outer padding/max-width for every step view. `wide` is for
 *  card-grid steps (dentist, treatment); the default suits form-like steps. */
export function StepContainer({
  wide = false,
  className,
  children,
}: {
  wide?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12",
        wide ? "max-w-5xl" : "max-w-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}
