import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";

import { ConflictDetectionService } from "./conflict-detection-service";
import { TokenRefreshService } from "./token-refresh-service";
import { GoogleOAuthClient } from "../api/oauth-client";
import { InMemoryGoogleCalendarRepository } from "../testing/in-memory-google-calendar-repository";
import { FakeCalendarProvider } from "../testing/fake-calendar-provider";
import { encryptToken } from "../utils/token-encryption";

const KEY = randomBytes(32);
const NOW = new Date("2026-08-06T08:00:00.000Z");
const RANGE = { start: new Date("2026-08-10T00:00:00.000Z"), end: new Date("2026-08-11T00:00:00.000Z") };

async function buildHarness() {
  const repository = new InMemoryGoogleCalendarRepository();
  const provider = new FakeCalendarProvider();
  const oauthClient = new GoogleOAuthClient({ clientId: "id", clientSecret: "secret", redirectUri: "https://x" });
  const tokenRefresh = new TokenRefreshService(repository, oauthClient, KEY);

  const connection = await repository.createConnection({
    practiceId: "practice-1",
    practitionerId: "practitioner-1",
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

  const service = new ConflictDetectionService(repository, tokenRefresh, provider);
  return { provider, service };
}

describe("ConflictDetectionService.findExternalConflicts", () => {
  it("reports no conflict when there is no connection to check against", async () => {
    const repository = new InMemoryGoogleCalendarRepository();
    const provider = new FakeCalendarProvider();
    const oauthClient = new GoogleOAuthClient({ clientId: "id", clientSecret: "secret", redirectUri: "https://x" });
    const service = new ConflictDetectionService(repository, new TokenRefreshService(repository, oauthClient, KEY), provider);

    const result = await service.findExternalConflicts("practice-1", "practitioner-1", RANGE, NOW);

    expect(result).toEqual({ hasConflict: false, conflictingEvents: [] });
  });

  it("detects a genuine external event as a conflict", async () => {
    const { provider, service } = await buildHarness();
    provider.seedExternalEvent({
      id: "ext-1",
      summary: "Practitioner's own doctor appointment",
      start: new Date("2026-08-10T10:00:00.000Z"),
      end: new Date("2026-08-10T11:00:00.000Z"),
      status: "confirmed",
      isOwnedByUs: false,
    });

    const result = await service.findExternalConflicts("practice-1", "practitioner-1", RANGE, NOW);

    expect(result.hasConflict).toBe(true);
    expect(result.conflictingEvents).toHaveLength(1);
    expect(result.conflictingEvents[0].id).toBe("ext-1");
  });

  it("never reports our own synced appointment as a conflict with itself", async () => {
    const { provider, service } = await buildHarness();
    await provider.createEvent(
      { accessToken: "valid-token" },
      "primary",
      "appt-1",
      {
        summary: "Cleaning — Jane Doe",
        start: new Date("2026-08-10T09:00:00.000Z"),
        end: new Date("2026-08-10T09:30:00.000Z"),
        timezone: "Africa/Johannesburg",
      }
    );

    const result = await service.findExternalConflicts("practice-1", "practitioner-1", RANGE, NOW);

    expect(result).toEqual({ hasConflict: false, conflictingEvents: [] });
  });

  it("ignores cancelled external events", async () => {
    const { provider, service } = await buildHarness();
    provider.seedExternalEvent({
      id: "ext-cancelled",
      summary: "Was going to be something",
      start: new Date("2026-08-10T10:00:00.000Z"),
      end: new Date("2026-08-10T11:00:00.000Z"),
      status: "cancelled",
      isOwnedByUs: false,
    });

    const result = await service.findExternalConflicts("practice-1", "practitioner-1", RANGE, NOW);

    expect(result.hasConflict).toBe(false);
  });

  it("falls back to the practice-wide connection when no practitioner-specific one exists", async () => {
    const repository = new InMemoryGoogleCalendarRepository();
    const provider = new FakeCalendarProvider();
    const oauthClient = new GoogleOAuthClient({ clientId: "id", clientSecret: "secret", redirectUri: "https://x" });
    const tokenRefresh = new TokenRefreshService(repository, oauthClient, KEY);

    const connection = await repository.createConnection({
      practiceId: "practice-1",
      practitionerId: null, // practice-wide
      accountEmail: "front-desk@practice.example",
      calendarId: "primary",
      calendarSummary: "Front desk",
    });
    await repository.saveTokens({
      connectionId: connection.id,
      encryptedAccessToken: encryptToken("valid-token", KEY),
      encryptedRefreshToken: encryptToken("refresh-token", KEY),
      accessTokenExpiresAt: new Date(NOW.getTime() + 60 * 60 * 1000),
    });
    provider.seedExternalEvent({
      id: "ext-1",
      summary: "External",
      start: new Date("2026-08-10T10:00:00.000Z"),
      end: new Date("2026-08-10T11:00:00.000Z"),
      status: "confirmed",
      isOwnedByUs: false,
    });

    const service = new ConflictDetectionService(repository, tokenRefresh, provider);
    const result = await service.findExternalConflicts("practice-1", "practitioner-with-no-own-connection", RANGE, NOW);

    expect(result.hasConflict).toBe(true);
  });
});
