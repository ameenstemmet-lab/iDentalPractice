import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangleIcon, InboxIcon, Loader2Icon, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/**
 * Full-section loading placeholder. For content shape, prefer Skeleton /
 * the skeleton-patterns composites instead — reserve this for cases with
 * no known layout to mimic (first paint of an unknown-shape panel).
 */
export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex w-full flex-1 flex-col items-center justify-center gap-3 p-10 text-sm text-muted-foreground",
        className
      )}
    >
      <Loader2Icon className="size-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

const toneMedia = cva("", {
  variants: {
    tone: {
      empty: "bg-muted text-foreground",
      error: "bg-destructive/10 text-destructive",
      success: "bg-success/10 text-success",
    },
  },
  defaultVariants: { tone: "empty" },
});

interface StatusEmptyProps extends VariantProps<typeof toneMedia> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Illustrated empty / error / success state, built on the shadcn Empty
 * primitive. One component for all three since they share the same
 * anatomy — only the icon and tint change.
 */
export function StatusEmpty({
  tone = "empty",
  icon,
  title,
  description,
  action,
  className,
}: StatusEmptyProps) {
  const Icon = icon ?? (tone === "error" ? AlertTriangleIcon : InboxIcon);

  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className={cn(toneMedia({ tone }))}>
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
