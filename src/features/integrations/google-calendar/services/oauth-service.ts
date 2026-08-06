import type { GoogleOAuthClient } from "../api/oauth-client";
import type { GoogleCalendarApiClient } from "../api/calendar-api-client";
import type { GoogleCalendarRepository } from "../repository/google-calendar-repository";
import { createOAuthState, verifyOAuthState } from "../utils/oauth-state";
import { encryptToken } from "../utils/token-encryption";
import type { CalendarConnection } from "../types";

/** Read-write calendar access plus enough identity scope to show which Google account is connected. */
const OAUTH_SCOPE = "https://www.googleapis.com/auth/calendar openid email";

export interface StartConnectParams {
  practiceId: string;
  /** Null connects a practice-wide calendar; a dentist id connects that dentist's own calendar. */
  dentistId: string | null;
}

/**
 * Orchestrates the OAuth 2.0 authorization-code flow: builds the consent
 * URL (with a signed, tenant-scoped `state`), and on callback exchanges
 * the code, resolves the account + calendar, and persists the connection
 * and encrypted tokens. Never touches an appointment or a sync job.
 */
export class OAuthService {
  constructor(
    private readonly oauthClient: GoogleOAuthClient,
    private readonly calendarApiClient: GoogleCalendarApiClient,
    private readonly repository: GoogleCalendarRepository,
    private readonly encryptionKey: Buffer,
    private readonly stateSecret: string
  ) {}

  buildAuthorizeUrl(params: StartConnectParams): string {
    const state = createOAuthState(params, this.stateSecret);
    return this.oauthClient.buildAuthorizeUrl({ state, scope: OAUTH_SCOPE });
  }

  async handleCallback(code: string, state: string, now: Date = new Date()): Promise<CalendarConnection> {
    const verified = verifyOAuthState(state, this.stateSecret, now);
    if (!verified.valid || !verified.payload) {
      throw new Error(verified.error ?? "Invalid OAuth state parameter");
    }
    const { practiceId, dentistId } = verified.payload;

    const tokens = await this.oauthClient.exchangeCode(code);
    const [accountEmail, calendars] = await Promise.all([
      this.oauthClient.getUserEmail(tokens.accessToken),
      this.calendarApiClient.listCalendars(tokens.accessToken),
    ]);
    const primaryCalendar = calendars.find((c) => c.primary) ?? calendars[0];

    const existing = await this.repository.getConnectionForDentist(practiceId, dentistId);
    const connection = existing
      ? await this.repository.updateConnection(existing.id, {
          calendarId: primaryCalendar?.id ?? "primary",
          calendarSummary: primaryCalendar?.summary ?? null,
          status: "connected",
          lastError: null,
        })
      : await this.repository.createConnection({
          practiceId,
          dentistId,
          accountEmail,
          calendarId: primaryCalendar?.id ?? "primary",
          calendarSummary: primaryCalendar?.summary ?? null,
        });

    await this.repository.saveTokens({
      connectionId: connection.id,
      encryptedAccessToken: encryptToken(tokens.accessToken, this.encryptionKey),
      encryptedRefreshToken: encryptToken(tokens.refreshToken, this.encryptionKey),
      accessTokenExpiresAt: new Date(now.getTime() + tokens.expiresInSeconds * 1000),
    });

    return connection;
  }

  async disconnect(connectionId: string): Promise<void> {
    // Deleting the connection cascades to google_calendar_tokens (FK on delete cascade) —
    // no separate token-wipe step needed.
    await this.repository.deleteConnection(connectionId);
  }
}
