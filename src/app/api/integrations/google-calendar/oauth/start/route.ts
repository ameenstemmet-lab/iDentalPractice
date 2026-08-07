import { NextResponse, type NextRequest } from "next/server";

import { createGoogleCalendarServices } from "@/features/integrations/google-calendar/services/container";
import { getCurrentSession } from "@/lib/auth/session";

/**
 * Redirects the browser to Google's consent screen. `practiceId` (and
 * optionally `practitionerId`) travel in the signed `state` parameter,
 * verified on callback.
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const practiceId = request.nextUrl.searchParams.get("practiceId");
  const practitionerId = request.nextUrl.searchParams.get("practitionerId");

  if (!practiceId) {
    return NextResponse.json({ error: "practiceId query parameter is required" }, { status: 400 });
  }

  // The caller can only ever start a connection for their own practice —
  // practiceId travels as a query param (so the client can pass it), but
  // it's cross-checked against the session, never trusted on its own.
  if (practiceId !== session.practiceId) {
    return NextResponse.json({ error: "You don't have permission to manage this practice's integrations" }, { status: 403 });
  }

  try {
    const { oauthService } = createGoogleCalendarServices();
    const authorizeUrl = oauthService.buildAuthorizeUrl({ practiceId, practitionerId: practitionerId || null });
    return NextResponse.redirect(authorizeUrl);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start Google Calendar connection" },
      { status: 500 }
    );
  }
}
