export const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export interface WorkingDay {
  dayOfWeek: number; // 0=Sunday..6=Saturday
  isWorking: boolean;
  startTime: string | null; // HH:mm
  endTime: string | null;
}

export interface PractitionerBreak {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  description: string | null;
}

export interface SaveWorkingDayInput {
  practitionerId: string;
  practiceId: string;
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface AddBreakInput {
  practitionerId: string;
  practiceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  description?: string;
}
