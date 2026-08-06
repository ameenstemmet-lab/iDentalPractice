"use client";

import * as React from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalendarListEntry } from "../types";

export function CalendarSelector({
  currentCalendarId,
  loadCalendars,
  onSelect,
  disabled,
}: {
  currentCalendarId: string;
  loadCalendars: () => Promise<CalendarListEntry[]>;
  onSelect: (calendarId: string) => void | Promise<void>;
  disabled?: boolean;
}) {
  const [calendars, setCalendars] = React.useState<CalendarListEntry[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleOpenChange(open: boolean) {
    if (!open || calendars !== null) return;
    setIsLoading(true);
    try {
      setCalendars(await loadCalendars());
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Select value={currentCalendarId} onValueChange={onSelect} onOpenChange={handleOpenChange} disabled={disabled}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Choose a calendar" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <div className="space-y-1.5 p-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          (calendars ?? []).map((calendar) => (
            <SelectItem key={calendar.id} value={calendar.id}>
              {calendar.summary}
              {calendar.primary ? " (primary)" : ""}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
