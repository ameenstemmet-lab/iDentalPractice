import { randomBytes } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import { OAuthService } from "./oauth-service";
import { GoogleOAuthClient } from "../api/oauth-client";
import { GoogleCalendarApiClient } from "../api/calendar-api-client";
import { InMemoryGoogleCalendarRepository } from "../testing/in-memory-google-calendar-repository";
import { createOAuthState } from "../utils/oauth-state";
import { decryptToken } from "../utils/token-encryption";

const KEY = randomBytes(32);
const STATE_SECRET = "state-secret";
const CONFIG = { clientId: "id", clientSecret: "secret", redirectUri: "https://example.com/callback" };

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function buildService(fetchImpl: ReturnType<typeof vi.fn>) {
  const repository = new InMemoryGoogleCalendarRepository();
  const oauthClient = new GoogleOAuthClient({ ...CONFIG, fetchImpl });
  const calendarApiClient = new GoogleCalendarApiClient({ fetchImpl });
  const service = new OAuthService(oauthClient, calendarApiClient, repository, KEY, STATE_SECRET);
  return { service, repository };
}

describe("OAuthService.buildAuthorizeUrl", () => {
  it("embeds a signed state carrying the practice and dentist ids", () => {
    const { service } = buildService(vi.fn());
    const url = new URL(service.buildAuthorizeUrl({ practiceId: "practice-1", dentistId: "dentist-1" }));
    expect(url.searchParams.get("state")).toBeTruthy();
    expect(url.searchParams.get("scope")).toContain("calendar");
  });
});

describe("OAuthService.handleCallback", () => {
  it("rejects an invalid/tampered state before ever calling Google", async () => {
    const fetchImpl = vi.fn();
    const { service } = buildService(fetchImpl);

    await expect(service.handleCallback("some-code", "garbage-state")).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("exchanges the code, resolves the account + primary calendar, and stores an encrypted connection", async () => {
    const fetchImpl = vi
      .fn()
      // 1. token exchange
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "access-1", refresh_token: "refresh-1", expires_in: 3600, scope: "calendar openid email" })
      )
      // 2. userinfo
      .mockResolvedValueOnce(jsonResponse(200, { email: "admin@practice.example" }))
      // 3. calendarList
      .mockResolvedValueOnce(
        jsonResponse(200, { items: [{ id: "cal-2", summary: "Secondary" }, { id: "primary", summary: "Main", primary: true }] })
      );

    const { service, repository } = buildService(fetchImpl);
    const state = createOAuthState({ practiceId: "practice-1", dentistId: null }, STATE_SECRET);

    const connection = await service.handleCallback("auth-code", state);

    expect(connection.practiceId).toBe("practice-1");
    expect(connection.accountEmail).toBe("admin@practice.example");
    expect(connection.calendarId).toBe("primary"); // picked the primary calendar, not the first in the list
    expect(connection.status).toBe("connected");

    const storedTokens = await repository.getTokens(connection.id);
    expect(storedTokens).not.toBeNull();
    expect(decryptToken(storedTokens!.encryptedAccessToken, KEY)).toBe("access-1");
    expect(decryptToken(storedTokens!.encryptedRefreshToken, KEY)).toBe("refresh-1");
  });

  it("re-connecting the same practice/dentist updates the existing connection instead of creating a duplicate", async () => {
    const tokenResponse = () =>
      jsonResponse(200, { access_token: "access-1", refresh_token: "refresh-1", expires_in: 3600, scope: "calendar" });
    const userInfoResponse = () => jsonResponse(200, { email: "admin@practice.example" });
    const calendarListResponse = () =>
      jsonResponse(200, { items: [{ id: "primary", summary: "Main", primary: true }] });

    // Three Google calls per handleCallback invocation, called twice.
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(userInfoResponse())
      .mockResolvedValueOnce(calendarListResponse())
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(userInfoResponse())
      .mockResolvedValueOnce(calendarListResponse());

    const { service, repository } = buildService(fetchImpl);
    const state = createOAuthState({ practiceId: "practice-1", dentistId: null }, STATE_SECRET);

    const first = await service.handleCallback("code-1", state);
    const second = await service.handleCallback(
      "code-2",
      createOAuthState({ practiceId: "practice-1", dentistId: null }, STATE_SECRET)
    );

    expect(second.id).toBe(first.id);
    expect(await repository.listConnections("practice-1")).toHaveLength(1);
  });
});

describe("OAuthService.disconnect", () => {
  it("removes the connection", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "a", refresh_token: "r", expires_in: 3600, scope: "calendar" })
      )
      .mockResolvedValueOnce(jsonResponse(200, { email: "admin@practice.example" }))
      .mockResolvedValueOnce(jsonResponse(200, { items: [{ id: "primary", summary: "Main", primary: true }] }));

    const { service, repository } = buildService(fetchImpl);
    const state = createOAuthState({ practiceId: "practice-1", dentistId: null }, STATE_SECRET);
    const connection = await service.handleCallback("code", state);

    await service.disconnect(connection.id);

    expect(await repository.getConnection(connection.id)).toBeNull();
  });
});
