import type { GoogleOAuthClient } from "../api/oauth-client";
import { GoogleApiError } from "../api/google-api-error";
import type { GoogleCalendarRepository } from "../repository/google-calendar-repository";
import { decryptToken, encryptToken } from "../utils/token-encryption";
import type { EncryptedTokenRecord } from "../types";

/** Thrown when Google rejects the refresh token itself — access was revoked; reconnection is required, not a retry. */
export class TokenRevokedError extends Error {
  constructor(message = "Google access has been revoked. The calendar must be reconnected.") {
    super(message);
    this.name = "TokenRevokedError";
  }
}

const EXPIRY_BUFFER_MS = 2 * 60 * 1000; // refresh 2 minutes before actual expiry, never serve a token about to die mid-request

/**
 * Ensures callers always have a valid access token, refreshing
 * transparently when the stored one is expired or about to be. This is
 * the only place that turns an encrypted refresh token back into a usable
 * access token — GoogleCalendarService never sees encrypted anything.
 */
export class TokenRefreshService {
  constructor(
    private readonly repository: GoogleCalendarRepository,
    private readonly oauthClient: GoogleOAuthClient,
    private readonly encryptionKey: Buffer
  ) {}

  async getValidAccessToken(connectionId: string, now: Date = new Date()): Promise<string> {
    const record = await this.repository.getTokens(connectionId);
    if (!record) {
      throw new Error(`No stored credentials for calendar connection ${connectionId}`);
    }

    const isExpiringSoon = record.accessTokenExpiresAt.getTime() - now.getTime() < EXPIRY_BUFFER_MS;
    if (!isExpiringSoon) {
      return decryptToken(record.encryptedAccessToken, this.encryptionKey);
    }

    return this.refresh(record, now);
  }

  private async refresh(record: EncryptedTokenRecord, now: Date): Promise<string> {
    const refreshToken = decryptToken(record.encryptedRefreshToken, this.encryptionKey);

    let result;
    try {
      result = await this.oauthClient.refreshAccessToken(refreshToken);
    } catch (err) {
      if (err instanceof GoogleApiError && (err.status === 400 || err.status === 401)) {
        throw new TokenRevokedError();
      }
      throw err;
    }

    await this.repository.saveTokens({
      connectionId: record.connectionId,
      encryptedAccessToken: encryptToken(result.accessToken, this.encryptionKey),
      encryptedRefreshToken: record.encryptedRefreshToken, // Google does not rotate refresh tokens on refresh
      accessTokenExpiresAt: new Date(now.getTime() + result.expiresInSeconds * 1000),
    });

    return result.accessToken;
  }
}
