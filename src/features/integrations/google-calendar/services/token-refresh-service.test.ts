import { randomBytes } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import { TokenRefreshService, TokenRevokedError } from "./token-refresh-service";
import { GoogleOAuthClient } from "../api/oauth-client";
import { InMemoryGoogleCalendarRepository } from "../testing/in-memory-google-calendar-repository";
import { encryptToken } from "../utils/token-encryption";

const KEY = randomBytes(32);
const CONFIG = { clientId: "id", clientSecret: "secret", redirectUri: "https://example.com/callback" };

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function seedTokens(
  repository: InMemoryGoogleCalendarRepository,
  connectionId: string,
  expiresAt: Date
) {
  await repository.saveTokens({
    connectionId,
    encryptedAccessToken: encryptToken("current-access-token", KEY),
    encryptedRefreshToken: encryptToken("stored-refresh-token", KEY),
    accessTokenExpiresAt: expiresAt,
  });
}

describe("TokenRefreshService.getValidAccessToken", () => {
  it("returns the stored access token without refreshing when it's not near expiry", async () => {
    const repository = new InMemoryGoogleCalendarRepository();
    const now = new Date("2026-08-06T10:00:00.000Z");
    await seedTokens(repository, "conn-1", new Date(now.getTime() + 60 * 60 * 1000)); // expires in 1h

    const fetchImpl = vi.fn(); // must not be called
    const oauthClient = new GoogleOAuthClient({ ...CONFIG, fetchImpl });
    const service = new TokenRefreshService(repository, oauthClient, KEY);

    const token = await service.getValidAccessToken("conn-1", now);

    expect(token).toBe("current-access-token");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refreshes when the access token is expiring within the buffer window", async () => {
    const repository = new InMemoryGoogleCalendarRepository();
    const now = new Date("2026-08-06T10:00:00.000Z");
    await seedTokens(repository, "conn-1", new Date(now.getTime() + 30_000)); // expires in 30s

    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, { access_token: "fresh-access-token", expires_in: 3600, scope: "calendar" })
    );
    const oauthClient = new GoogleOAuthClient({ ...CONFIG, fetchImpl });
    const service = new TokenRefreshService(repository, oauthClient, KEY);

    const token = await service.getValidAccessToken("conn-1", now);

    expect(token).toBe("fresh-access-token");
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const stored = await repository.getTokens("conn-1");
    expect(stored?.accessTokenExpiresAt.getTime()).toBe(now.getTime() + 3600 * 1000);
  });

  it("throws TokenRevokedError when Google rejects the refresh token", async () => {
    const repository = new InMemoryGoogleCalendarRepository();
    const now = new Date("2026-08-06T10:00:00.000Z");
    await seedTokens(repository, "conn-1", new Date(now.getTime() - 1000)); // already expired

    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(400, { error: "invalid_grant", error_description: "Token revoked" })
    );
    const oauthClient = new GoogleOAuthClient({ ...CONFIG, fetchImpl });
    const service = new TokenRefreshService(repository, oauthClient, KEY);

    await expect(service.getValidAccessToken("conn-1", now)).rejects.toBeInstanceOf(TokenRevokedError);
  });

  it("throws a plain error when there are no stored tokens at all", async () => {
    const repository = new InMemoryGoogleCalendarRepository();
    const oauthClient = new GoogleOAuthClient(CONFIG);
    const service = new TokenRefreshService(repository, oauthClient, KEY);

    await expect(service.getValidAccessToken("nonexistent")).rejects.toThrow(/no stored credentials/i);
  });
});
