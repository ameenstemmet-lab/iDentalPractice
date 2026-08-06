import { Badge } from "@/components/ui/badge";
import type { ConnectionStatus } from "../types";

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connected: "Connected",
  error: "Needs attention",
  disconnected: "Disconnected",
};

const STATUS_VARIANT: Record<ConnectionStatus, "success" | "destructive" | "secondary"> = {
  connected: "success",
  error: "destructive",
  disconnected: "secondary",
};

export function SyncStatusBadge({ status }: { status: ConnectionStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
