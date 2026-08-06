import { NextResponse, type NextRequest } from "next/server";

import { createGoogleCalendarServices } from "@/features/integrations/google-calendar/services/container";

const SETTINGS_PATH = "/settings/integrations/google-calendar";

/**
 * Google redirects the browser here after consent. `state` is verified
 * (signature + 10-minute expiry) before anything else happens — this is
 * the CSRF protection for the whole flow, see utils/oauth-state.ts.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  const redirectTo = new URL(SETTINGS_PATH, request.nextUrl.origin);

  if (oauthError) {
    redirectTo.searchParams.set("gcal_error", oauthError);
    return NextResponse.redirect(redirectTo);
  }

  if (!code || !state) {
    redirectTo.searchParams.set("gcal_error", "missing_code_or_state");
    return NextResponse.redirect(redirectTo);
  }

  try {
    const { oauthService } = createGoogleCalendarServices();
    await oauthService.handleCallback(code, state);
    redirectTo.searchParams.set("gcal_connected", "1");
  } catch (err) {
    redirectTo.searchParams.set("gcal_error", err instanceof Error ? err.message : "unknown_error");
  }

  return NextResponse.redirect(redirectTo);
}
