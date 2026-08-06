"use client";

import * as React from "react";

import {
  disconnectCalendarAction,
  getConnectionStatusAction,
  listAvailableCalendarsAction,
  selectCalendarAction,
  testConnectionAction,
  toggleSyncEnabledAction,
} from "../actions/google-calendar-actions";
import type { CalendarConnection, CalendarListEntry } from "../types";

export interface UseGoogleCalendarConnectionParams {
  practiceId: string;
  practitionerId?: string | null;
}

export function useGoogleCalendarConnection({ practiceId, practitionerId = null }: UseGoogleCalendarConnectionParams) {
  const [connection, setConnection] = React.useState<CalendarConnection | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isMutating, setIsMutating] = React.useState(false);

  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setConnection(await getConnectionStatusAction(practiceId, practitionerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar connection status.");
    } finally {
      setIsLoading(false);
    }
  }, [practiceId, practitionerId]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const connectUrl = React.useMemo(() => {
    const params = new URLSearchParams({ practiceId });
    if (practitionerId) params.set("practitionerId", practitionerId);
    return `/api/integrations/google-calendar/oauth/start?${params.toString()}`;
  }, [practiceId, practitionerId]);

  const disconnect = React.useCallback(async () => {
    if (!connection) return;
    setIsMutating(true);
    try {
      await disconnectCalendarAction(connection.id);
      await refetch();
    } finally {
      setIsMutating(false);
    }
  }, [connection, refetch]);

  const testConnection = React.useCallback(async () => {
    if (!connection) return { ok: false, message: "No connection to test." };
    setIsMutating(true);
    try {
      const result = await testConnectionAction(connection.id);
      await refetch();
      return result;
    } finally {
      setIsMutating(false);
    }
  }, [connection, refetch]);

  const listAvailableCalendars = React.useCallback(async (): Promise<CalendarListEntry[]> => {
    if (!connection) return [];
    return listAvailableCalendarsAction(connection.id);
  }, [connection]);

  const selectCalendar = React.useCallback(
    async (calendarId: string) => {
      if (!connection) return;
      setIsMutating(true);
      try {
        await selectCalendarAction(connection.id, calendarId);
        await refetch();
      } finally {
        setIsMutating(false);
      }
    },
    [connection, refetch]
  );

  const toggleSyncEnabled = React.useCallback(
    async (syncEnabled: boolean) => {
      if (!connection) return;
      setIsMutating(true);
      try {
        await toggleSyncEnabledAction(connection.id, syncEnabled);
        await refetch();
      } finally {
        setIsMutating(false);
      }
    },
    [connection, refetch]
  );

  return {
    connection,
    isLoading,
    isMutating,
    error,
    connectUrl,
    refetch,
    disconnect,
    testConnection,
    listAvailableCalendars,
    selectCalendar,
    toggleSyncEnabled,
  };
}
