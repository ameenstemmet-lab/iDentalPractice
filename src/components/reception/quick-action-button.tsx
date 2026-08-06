import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function QuickActionButton({
  href,
  label,
  icon: Icon,
  className,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-start gap-2.5 rounded-xl border border-border bg-card p-4 transition-all duration-base hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        className
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
  );
}
