import "server-only";
import { createClient } from "@supabase/supabase-js";

import { GoogleOAuthClient } from "../api/oauth-client";
import { GoogleCalendarApiClient } from "../api/calendar-api-client";
import { SupabaseGoogleCalendarRepository } from "../repository/supabase-google-calendar-repository";
import { SupabaseAppointmentSyncDataSource } from "../repository/appointment-sync-datasource";
import { loadEncryptionKey } from "../utils/token-encryption";
import { OAuthService } from "./oauth-service";
import { TokenRefreshService } from "./token-refresh-service";
import { GoogleCalendarService } from "./google-calendar-service";
import { CalendarSyncService } from "./calendar-sync-service";
import { ConflictDetectionService } from "./conflict-detection-service";

/**
 * Composition root — the one place environment variables are read for
 * this module. `import "server-only"` makes any accidental import from
 * client code a build-time error, not a runtime credential leak.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createServiceRoleClient() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
}

export function createGoogleCalendarServices() {
  const supabase = createServiceRoleClient();
  const repository = new SupabaseGoogleCalendarRepository(supabase);
  const appointmentDataSource = new SupabaseAppointmentSyncDataSource(supabase);

  const oauthClient = new GoogleOAuthClient({
    clientId: requireEnv("GOOGLE_OAUTH_CLIENT_ID"),
    clientSecret: requireEnv("GOOGLE_OAUTH_CLIENT_SECRET"),
    redirectUri: requireEnv("GOOGLE_OAUTH_REDIRECT_URI"),
  });
  const calendarApiClient = new GoogleCalendarApiClient();
  const encryptionKey = loadEncryptionKey(requireEnv("GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY"));
  const stateSecret = requireEnv("GOOGLE_OAUTH_STATE_SECRET");

  const oauthService = new OAuthService(oauthClient, calendarApiClient, repository, encryptionKey, stateSecret);
  const tokenRefreshService = new TokenRefreshService(repository, oauthClient, encryptionKey);
  const calendarProvider = new GoogleCalendarService(calendarApiClient);
  const calendarSyncService = new CalendarSyncService(
    repository,
    appointmentDataSource,
    tokenRefreshService,
    calendarProvider
  );
  const conflictDetectionService = new ConflictDetectionService(repository, tokenRefreshService, calendarProvider);

  return {
    repository,
    appointmentDataSource,
    oauthService,
    tokenRefreshService,
    calendarProvider,
    calendarSyncService,
    conflictDetectionService,
  };
}
