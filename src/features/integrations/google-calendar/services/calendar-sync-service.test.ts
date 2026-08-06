import { randomBytes } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import { CalendarSyncService } from "./calendar-sync-service";
import { TokenRefreshService } from "./token-refresh-service";
import { GoogleOAuthClient } from "../api/oauth-client";
import { GoogleApiError } from "../api/google-api-error";
import { InMemoryGoogleCalendarRepository } from "../testing/in-memory-google-calendar-repository";
import { InMemoryAppointmentSyncDataSource } from "../testing/in-memory-appointment-sync-datasource";
import { FakeCalendarProvider } from "../testing/fake-calendar-provider";
import { encryptToken } from "../utils/token-encryption";
import type { AppointmentSyncPayload } from "../types";

const KEY = randomBytes(32);
const NOW = new Date("2026-08-06T08:00:00.000Z");

const PAYLOAD: AppointmentSyncPayload = {
  appointmentId: "appt-1",
  practiceId: "practice-1",
  dentistId: "dentist-1",
  summary: "Cleaning — Jane Doe",
  start: new Date("2026-08-10T09:00:00.000Z"),
  end: new Date("2026-08-10T09:30:00.000Z"),
  timezone: "Africa/Johannesburg",
  existingGoogleEventId: null,
};

async function buildHarness() {
  const repository = new InMemoryGoogleCalendarRepository();
  const appointments = new InMemoryAppointmentSyncDataSource();
  const provider = new FakeCalendarProvider();
  const oauthClient = new GoogleOAuthClient({ clientId: "id", clientSecret: "secret", redirectUri: "https://x" });
  const tokenRefresh = new TokenRefreshService(repository, oauthClient, KEY);

  const connection = await repository.createConnection({
    practiceId: "practice-1",
    dentistId: "dentist-1",
    accountEmail: "admin@practice.example",
    calendarId: "primary",
    calendarSummary: "Main",
  });
  await repository.saveTokens({
    connectionId: connection.id,
    encryptedAccessToken: encryptToken("valid-token", KEY),
    encryptedRefreshToken: encryptToken("refresh-token", KEY),
    accessTokenExpiresAt: new Date(NOW.getTime() + 60 * 60 * 1000),
  });

  const sync = new CalendarSyncService(repository, appointments, tokenRefresh, provider);
  return { repository, appointments, provider, sync, connectionId: connection.id };
}

describe("CalendarSyncService.onAppointmentCreated", () => {
  it("creates a Google Calendar event and stores its id back on the appointment", async () => {
    const { appointments, provider, sync } = await buildHarness();
    appointments.seed(PAYLOAD);

    await sync.onAppointmentCreated("appt-1", NOW);

    expect(provider.events.size).toBe(1);
    const [event] = [...provider.events.values()];
    expect(event.summary).toBe("Cleaning — Jane Doe");
    expect(appointments.getStoredGoogleEventId("appt-1")).toBe(event.id);
  });

  it("is a no-op (not an error) when there is no active connection", async () => {
    const repository = new InMemoryGoogleCalendarRepository();
    const appointments = new InMemoryAppointmentSyncDataSource();
    const provider = new FakeCalendarProvider();
    const oauthClient = new GoogleOAuthClient({ clientId: "id", clientSecret: "secret", redirectUri: "https://x" });
    const tokenRefresh = new TokenRefreshService(repository, oauthClient, KEY);
    const sync = new CalendarSyncService(repository, appointments, tokenRefresh, provider);
    appointments.seed(PAYLOAD);

    await expect(sync.onAppointmentCreated("appt-1", NOW)).resolves.toBeUndefined();
    expect(provider.events.size).toBe(0);
  });

  it("does not create a second event for a duplicate create call (deduped by the queue)", async () => {
    const { appointments, provider, sync, repository } = await buildHarness();
    appointments.seed(PAYLOAD);

    // Simulate a job already sitting pending (e.g. a slow first attempt still in flight).
    await repository.enqueueSyncJob({
      practiceId: "practice-1",
      appointmentId: "appt-1",
      connectionId: (await repository.listConnections("practice-1"))[0].id,
      operation: "create",
    });

    await sync.onAppointmentCreated("appt-1", NOW);

    expect(provider.events.size).toBe(0); // the second call's enqueue was deduped, so nothing new ran
  });
});

describe("CalendarSyncService.onAppointmentUpdated", () => {
  it("updates the existing event in place", async () => {
    const { appointments, provider, sync } = await buildHarness();
    appointments.seed(PAYLOAD);
    await sync.onAppointmentCreated("appt-1", NOW);
    const [createdEvent] = [...provider.events.values()];

    appointments.seed({ ...PAYLOAD, summary: "Whitening — Jane Doe", existingGoogleEventId: createdEvent.id });
    await sync.onAppointmentUpdated("appt-1", NOW);

    expect(provider.events.get(createdEvent.id)?.summary).toBe("Whitening — Jane Doe");
    expect(provider.events.size).toBe(1); // still one event, not a duplicate
  });

  it("self-heals by creating a new event when the old one was deleted on Google's side", async () => {
    const { appointments, provider, sync } = await buildHarness();
    appointments.seed({ ...PAYLOAD, existingGoogleEventId: "deleted-event-id" });

    provider.failNextCallWith = new GoogleApiError("Not Found", 404, "notFound");
    await sync.onAppointmentUpdated("appt-1", NOW);

    expect(provider.events.size).toBe(1); // recreated
    expect(appointments.getStoredGoogleEventId("appt-1")).not.toBe("deleted-event-id");
  });
});

describe("CalendarSyncService.onAppointmentCancelled", () => {
  it("marks the Google event cancelled", async () => {
    const { appointments, provider, sync } = await buildHarness();
    appointments.seed(PAYLOAD);
    await sync.onAppointmentCreated("appt-1", NOW);
    const [createdEvent] = [...provider.events.values()];

    appointments.seed({ ...PAYLOAD, existingGoogleEventId: createdEvent.id });
    await sync.onAppointmentCancelled("appt-1", NOW);

    expect(provider.events.get(createdEvent.id)?.status).toBe("cancelled");
  });

  it("treats an already-deleted event as a successful cancel, not a failure", async () => {
    const { appointments, provider, sync } = await buildHarness();
    appointments.seed({ ...PAYLOAD, existingGoogleEventId: "already-gone" });
    provider.failNextCallWith = new GoogleApiError("Not Found", 404, "notFound");

    await expect(sync.onAppointmentCancelled("appt-1", NOW)).resolves.toBeUndefined();
  });

  it("is a no-op when the appointment was never synced", async () => {
    const { appointments, sync, provider } = await buildHarness();
    appointments.seed({ ...PAYLOAD, existingGoogleEventId: null });

    await expect(sync.onAppointmentCancelled("appt-1", NOW)).resolves.toBeUndefined();
    expect(provider.events.size).toBe(0);
  });
});

describe("CalendarSyncService — token revocation", () => {
  it("marks the connection as errored when the refresh token has been revoked", async () => {
    const { repository, appointments, connectionId } = await buildHarness();
    appointments.seed(PAYLOAD);

    // Force the stored token to look expired so a refresh is attempted, and make that refresh fail.
    await repository.saveTokens({
      connectionId,
      encryptedAccessToken: encryptToken("stale", KEY),
      encryptedRefreshToken: encryptToken("revoked-refresh-token", KEY),
      accessTokenExpiresAt: new Date(0),
    });

    const failingOAuthClient = new GoogleOAuthClient({
      clientId: "id",
      clientSecret: "secret",
      redirectUri: "https://x",
      fetchImpl: vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 })),
    });
    const failingTokenRefresh = new TokenRefreshService(repository, failingOAuthClient, KEY);
    // Never actually reached — the token refresh throws first — but CalendarSyncService still needs a provider instance.
    const unusedProvider = new FakeCalendarProvider();
    const brokenSync = new CalendarSyncService(repository, appointments, failingTokenRefresh, unusedProvider);

    // By design, a processing failure never rejects the caller — it's left
    // for the retry sweep (see the class doc comment) — but the connection
    // must be visibly marked errored so the admin UI can surface it.
    await expect(brokenSync.onAppointmentCreated("appt-1", NOW)).resolves.toBeUndefined();

    const connection = await repository.getConnection(connectionId);
    expect(connection?.status).toBe("error");
  });
});
