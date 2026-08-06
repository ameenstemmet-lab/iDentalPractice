export const BLOCKED_TIME_REASONS = ["Leave", "Training", "Meeting", "Public Holiday", "Maintenance", "Other"] as const;

export interface BlockedPeriod {
  id: string;
  dentistId: string;
  dentistName: string;
  startsAt: string; // ISO instant
  endsAt: string;
  reason: string | null;
}

export interface BlockedPeriodInput {
  dentistId: string;
  startsAt: string; // ISO instant
  endsAt: string;
  reason?: string;
}
