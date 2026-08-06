/**
 * Thin client for Google's OAuth2 token endpoint. No orchestration, no
 * storage — just the two HTTP calls (authorize URL, code/refresh exchange)
 * with an injectable fetch for hermetic testing.
 */
import { GoogleApiError } from "./google-api-error";

const AUTHORIZE_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

export interface OAuthClientConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  fetchImpl?: typeof fetch;
}

export interface TokenExchangeResult {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  scope: string;
}

export interface TokenRefreshResult {
  accessToken: string;
  expiresInSeconds: number;
  scope: string;
}

interface RawTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  error?: string;
  error_description?: string;
}

async function postForm(
  fetchImpl: typeof fetch,
  params: Record<string, string>
): Promise<RawTokenResponse> {
  const response = await fetchImpl(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });

  const body = (await response.json().catch(() => ({}))) as RawTokenResponse;

  if (!response.ok) {
    throw new GoogleApiError(
      body.error_description ?? body.error ?? `Google OAuth token request failed (${response.status})`,
      response.status,
      body.error
    );
  }

  return body;
}

export class GoogleOAuthClient {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly config: OAuthClientConfig) {
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  /** URL to send the browser to for the Google consent screen. */
  buildAuthorizeUrl(params: { state: string; scope: string }): string {
    const url = new URL(AUTHORIZE_ENDPOINT);
    url.searchParams.set("client_id", this.config.clientId);
    url.searchParams.set("redirect_uri", this.config.redirectUri);
    url.searchParams.set("response_type", "code");
    // offline + consent guarantees a refresh_token is returned even on re-auth.
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("scope", params.scope);
    url.searchParams.set("state", params.state);
    return url.toString();
  }

  async exchangeCode(code: string): Promise<TokenExchangeResult> {
    const body = await postForm(this.fetchImpl, {
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      grant_type: "authorization_code",
    });

    if (!body.refresh_token) {
      throw new Error(
        "Google did not return a refresh token. This happens if the user has already granted access without a fresh consent prompt — disconnect and reconnect to force one."
      );
    }

    return {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      expiresInSeconds: body.expires_in,
      scope: body.scope,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenRefreshResult> {
    const body = await postForm(this.fetchImpl, {
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "refresh_token",
    });

    return {
      accessToken: body.access_token,
      expiresInSeconds: body.expires_in,
      scope: body.scope,
    };
  }

  /** Requires the `openid email` scopes to be included in the authorize request. */
  async getUserEmail(accessToken: string): Promise<string> {
    const response = await this.fetchImpl(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = (await response.json().catch(() => ({}))) as { email?: string; error?: string };

    if (!response.ok) {
      throw new GoogleApiError(body.error ?? `Failed to fetch Google account info (${response.status})`, response.status);
    }
    if (!body.email) {
      throw new Error("Google userinfo response did not include an email address");
    }
    return body.email;
  }
}
