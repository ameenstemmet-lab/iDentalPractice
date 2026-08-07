"use server";

import { revalidatePath } from "next/cache";

import { createGoogleCalendarServices } from "../services/container";
import type { CalendarConnection, CalendarListEntry } from "../types";
import { requireSession } from "@/lib/auth/session";

const SETTINGS_PATH = "/settings/integrations/google-calendar";

/** Every action below verifies the caller's session before touching a connection they don't own. */
async function assertOwnsPractice(practiceId: string): Promise<void> {
  const session = await requireSession();
  if (session.practiceId !== practiceId) {
    throw new Error("You don't have permission to manage this practice's integrations.");
  }
}

async function assertOwnsConnection(connectionId: string): Promise<CalendarConnection> {
  const session = await requireSession();
  const { repository } = createGoogleCalendarServices();
  const connection = await repository.getConnection(connectionId);
  if (!connection || connection.practiceId !== session.practiceId) {
    throw new Error("You don't have permission to manage this calendar connection.");
  }
  return connection;
}

export async function getConnectionStatusAction(
  practiceId: string,
  practitionerId: string | null
): Promise<CalendarConnection | null> {
  await assertOwnsPractice(practiceId);
  const { repository } = createGoogleCalendarServices();
  return repository.getConnectionForPractitioner(practiceId, practitionerId);
}

export async function listPracticeConnectionsAction(practiceId: string): Promise<CalendarConnection[]> {
  await assertOwnsPractice(practiceId);
  const { repository } = createGoogleCalendarServices();
  return repository.listConnections(practiceId);
}

export async function disconnectCalendarAction(connectionId: string): Promise<void> {
  await assertOwnsConnection(connectionId);
  const { oauthService } = createGoogleCalendarServices();
  await oauthService.disconnect(connectionId);
  revalidatePath(SETTINGS_PATH);
}

export async function listAvailableCalendarsAction(connectionId: string): Promise<CalendarListEntry[]> {
  await assertOwnsConnection(connectionId);
  const { tokenRefreshService, calendarProvider } = createGoogleCalendarServices();
  const accessToken = await tokenRefreshService.getValidAccessToken(connectionId);
  return calendarProvider.listCalendars({ accessToken });
}

export async function selectCalendarAction(connectionId: string, calendarId: string): Promise<void> {
  await assertOwnsConnection(connectionId);
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
  await assertOwnsConnection(connectionId);
  const { repository } = createGoogleCalendarServices();
  await repository.updateConnection(connectionId, { syncEnabled });
  revalidatePath(SETTINGS_PATH);
}

export interface TestConnectionResult {
  ok: boolean;
  message: string;
}

export async function testConnectionAction(connectionId: string): Promise<TestConnectionResult> {
  await assertOwnsConnection(connectionId);
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
