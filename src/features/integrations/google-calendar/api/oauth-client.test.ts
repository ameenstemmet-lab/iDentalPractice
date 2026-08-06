import { describe, expect, it, vi } from "vitest";
import { GoogleOAuthClient } from "./oauth-client";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const CONFIG = {
  clientId: "client-id-123",
  clientSecret: "client-secret-abc",
  redirectUri: "https://app.example.com/api/integrations/google-calendar/oauth/callback",
};

describe("GoogleOAuthClient.buildAuthorizeUrl", () => {
  it("includes the required OAuth parameters for offline, consent-forced access", () => {
    const client = new GoogleOAuthClient(CONFIG);
    const url = new URL(client.buildAuthorizeUrl({ state: "signed-state", scope: "calendar openid email" }));

    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe(CONFIG.clientId);
    expect(url.searchParams.get("redirect_uri")).toBe(CONFIG.redirectUri);
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("state")).toBe("signed-state");
    expect(url.searchParams.get("scope")).toBe("calendar openid email");
  });
});

describe("GoogleOAuthClient.exchangeCode", () => {
  it("exchanges an authorization code for tokens", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        access_token: "access-1",
        refresh_token: "refresh-1",
        expires_in: 3600,
        scope: "calendar",
      })
    );
    const client = new GoogleOAuthClient({ ...CONFIG, fetchImpl });

    const result = await client.exchangeCode("auth-code");

    expect(result).toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresInSeconds: 3600,
      scope: "calendar",
    });
    const [, init] = fetchImpl.mock.calls[0];
    expect(init.body).toContain("grant_type=authorization_code");
    expect(init.body).toContain(`code=${encodeURIComponent("auth-code")}`);
  });

  it("throws if Google does not return a refresh token", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, { access_token: "access-1", expires_in: 3600, scope: "calendar" })
    );
    const client = new GoogleOAuthClient({ ...CONFIG, fetchImpl });

    await expect(client.exchangeCode("auth-code")).rejects.toThrow(/refresh token/i);
  });

  it("throws GoogleApiError on a failed exchange", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(400, { error: "invalid_grant", error_description: "Malformed auth code." })
    );
    const client = new GoogleOAuthClient({ ...CONFIG, fetchImpl });

    await expect(client.exchangeCode("bad-code")).rejects.toMatchObject({ status: 400, reason: "invalid_grant" });
  });
});

describe("GoogleOAuthClient.refreshAccessToken", () => {
  it("refreshes using the refresh token", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, { access_token: "access-2", expires_in: 3600, scope: "calendar" })
    );
    const client = new GoogleOAuthClient({ ...CONFIG, fetchImpl });

    const result = await client.refreshAccessToken("refresh-1");

    expect(result).toEqual({ accessToken: "access-2", expiresInSeconds: 3600, scope: "calendar" });
    const [, init] = fetchImpl.mock.calls[0];
    expect(init.body).toContain("grant_type=refresh_token");
  });

  it("surfaces a revoked/invalid refresh token as a GoogleApiError", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(400, { error: "invalid_grant", error_description: "Token has been revoked." })
    );
    const client = new GoogleOAuthClient({ ...CONFIG, fetchImpl });

    await expect(client.refreshAccessToken("revoked-token")).rejects.toMatchObject({ status: 400 });
  });
});

describe("GoogleOAuthClient.getUserEmail", () => {
  it("returns the connected account's email", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { email: "admin@practice.example" }));
    const client = new GoogleOAuthClient({ ...CONFIG, fetchImpl });

    await expect(client.getUserEmail("access-1")).resolves.toBe("admin@practice.example");
  });

  it("throws if the userinfo response has no email", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    const client = new GoogleOAuthClient({ ...CONFIG, fetchImpl });

    await expect(client.getUserEmail("access-1")).rejects.toThrow(/email/i);
  });
});
