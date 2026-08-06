export const BLOCKED_TIME_REASONS = ["Leave", "Training", "Meeting", "Public Holiday", "Maintenance", "Other"] as const;

export interface BlockedPeriod {
  id: string;
  practitionerId: string;
  practitionerName: string;
  startsAt: string; // ISO instant
  endsAt: string;
  reason: string | null;
}

export interface BlockedPeriodInput {
  practitionerId: string;
  startsAt: string; // ISO instant
  endsAt: string;
  reason?: string;
}
