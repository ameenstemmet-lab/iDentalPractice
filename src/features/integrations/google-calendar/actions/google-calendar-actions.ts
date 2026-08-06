"use server";

import { revalidatePath } from "next/cache";

import { createGoogleCalendarServices } from "../services/container";
import type { CalendarConnection, CalendarListEntry } from "../types";

const SETTINGS_PATH = "/settings/integrations/google-calendar";

// TODO(auth): every action below trusts its connectionId/practiceId
// argument as-is. Once a login system exists, each must additionally
// verify the calling user is a member of the connection's practice with
// permission to manage integrations.

export async function getConnectionStatusAction(
  practiceId: string,
  practitionerId: string | null
): Promise<CalendarConnection | null> {
  const { repository } = createGoogleCalendarServices();
  return repository.getConnectionForPractitioner(practiceId, practitionerId);
}

export async function listPracticeConnectionsAction(practiceId: string): Promise<CalendarConnection[]> {
  const { repository } = createGoogleCalendarServices();
  return repository.listConnections(practiceId);
}

export async function disconnectCalendarAction(connectionId: string): Promise<void> {
  const { oauthService } = createGoogleCalendarServices();
  await oauthService.disconnect(connectionId);
  revalidatePath(SETTINGS_PATH);
}

export async function listAvailableCalendarsAction(connectionId: string): Promise<CalendarListEntry[]> {
  const { tokenRefreshService, calendarProvider } = createGoogleCalendarServices();
  const accessToken = await tokenRefreshService.getValidAccessToken(connectionId);
  return calendarProvider.listCalendars({ accessToken });
}

export async function selectCalendarAction(connectionId: string, calendarId: string): Promise<void> {
  const { repository, tokenRefreshService, calendarProvider } = createGoogleCalendarServices();
  const accessToken = await tokenRefreshService.getValidAccessToken(connectionId);
  const calendars = await calendarProvider.listCalendars({ accessToken });

  const selected = calendars.find((c) => c.id === calendarId);
  if (!selected) {
    throw new Error("That calendar is no longer available on the connected Google account.");
  }

  await repository.updateConnection(connectionId, { calendarId: selected.id, calendarSummary: selected.summary });
  revalidatePath(SETTINGS_PATH);
}

export async function toggleSyncEnabledAction(connectionId: string, syncEnabled: boolean): Promise<void> {
  const { repository } = createGoogleCalendarServices();
  await repository.updateConnection(connectionId, { syncEnabled });
  revalidatePath(SETTINGS_PATH);
}

export interface TestConnectionResult {
  ok: boolean;
  message: string;
}

export async function testConnectionAction(connectionId: string): Promise<TestConnectionResult> {
  const { repository, tokenRefreshService, calendarProvider } = createGoogleCalendarServices();

  try {
    const accessToken = await tokenRefreshService.getValidAccessToken(connectionId);
    const calendars = await calendarProvider.listCalendars({ accessToken });
    await repository.updateConnection(connectionId, { status: "connected", lastError: null });
    revalidatePath(SETTINGS_PATH);
    return { ok: true, message: `Connection is healthy — ${calendars.length} calendar(s) available.` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection test failed.";
    await repository.updateConnection(connectionId, { status: "error", lastError: message });
    revalidatePath(SETTINGS_PATH);
    return { ok: false, message };
  }
}
