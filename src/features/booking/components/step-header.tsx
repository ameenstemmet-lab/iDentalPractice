import { cn } from "@/lib/utils";

export function StepHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 sm:mb-10", className)}>
      <p className="text-xs font-medium tracking-wide text-primary uppercase">{eyebrow}</p>
      <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
