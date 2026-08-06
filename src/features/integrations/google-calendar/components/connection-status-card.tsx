"use client";

import * as React from "react";
import { toast } from "sonner";
import { AlertTriangleIcon, MailIcon, RefreshCwIcon, UnplugIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from "date-fns";

import { useGoogleCalendarConnection } from "../hooks/use-google-calendar-connection";
import { ConnectCalendarButton } from "./connect-calendar-button";
import { SyncStatusBadge } from "./sync-status-badge";
import { CalendarSelector } from "./calendar-selector";

export function ConnectionStatusCard({
  practiceId,
  practitionerId = null,
  title = "Google Calendar",
}: {
  practiceId: string;
  practitionerId?: string | null;
  title?: string;
}) {
  const {
    connection,
    isLoading,
    isMutating,
    error,
    connectUrl,
    disconnect,
    testConnection,
    listAvailableCalendars,
    selectCalendar,
    toggleSyncEnabled,
  } = useGoogleCalendarConnection({ practiceId, practitionerId });

  async function handleTest() {
    const result = await testConnection();
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  }

  async function handleDisconnect() {
    await disconnect();
    toast.info("Google Calendar disconnected.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Appointments are synced to this calendar automatically. Supabase always stays the source of
          truth — Google is never written back to it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading connection status…</p>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangleIcon className="size-4" />
            {error}
          </div>
        ) : !connection ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">No calendar connected yet.</p>
            <ConnectCalendarButton connectUrl={connectUrl} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <SyncStatusBadge status={connection.status} />
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MailIcon className="size-3.5" />
                {connection.accountEmail}
              </span>
            </div>

            {connection.lastError ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {connection.lastError}
              </p>
            ) : null}

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Synced calendar</p>
                <p className="text-xs text-muted-foreground">
                  {connection.calendarSummary ?? connection.calendarId}
                </p>
              </div>
              <CalendarSelector
                currentCalendarId={connection.calendarId}
                loadCalendars={listAvailableCalendars}
                onSelect={selectCalendar}
                disabled={isMutating}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Sync enabled</p>
                <p className="text-xs text-muted-foreground">
                  {connection.lastSyncedAt
                    ? `Last synced ${formatDistanceToNow(connection.lastSyncedAt, { addSuffix: true })}`
                    : "Not synced yet"}
                </p>
              </div>
              <Switch
                checked={connection.syncEnabled}
                disabled={isMutating}
                onCheckedChange={toggleSyncEnabled}
              />
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleTest} disabled={isMutating} className="gap-1.5">
                <RefreshCwIcon className="size-3.5" />
                Test connection
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                disabled={isMutating}
                className="gap-1.5"
              >
                <UnplugIcon className="size-3.5" />
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
