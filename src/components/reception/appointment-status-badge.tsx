import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/features/reception/appointments/types";

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  booked: { label: "Booked", variant: "secondary" },
  confirmed: { label: "Confirmed", variant: "default" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  no_show: { label: "No Show", variant: "warning" },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
