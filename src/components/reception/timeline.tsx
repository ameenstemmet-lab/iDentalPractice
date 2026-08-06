import { formatDistanceToNow } from "date-fns";

import { AppointmentStatusBadge } from "./appointment-status-badge";
import type { RecentActivityItem } from "@/features/reception/dashboard/types";

export function Timeline({ items }: { items: RecentActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent activity yet.</p>;
  }

  return (
    <ol className="flex flex-col">
      {items.map((item, i) => (
        <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
          {i < items.length - 1 ? (
            <span aria-hidden className="absolute top-2.5 left-[3px] h-full w-px bg-border" />
          ) : null}
          <span aria-hidden className="relative z-10 mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-sm text-foreground">
              <span className="font-medium">{item.patientName}</span> booked with {item.dentistName}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.treatmentName} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </p>
          </div>
          <AppointmentStatusBadge status={item.status} />
        </li>
      ))}
    </ol>
  );
}
