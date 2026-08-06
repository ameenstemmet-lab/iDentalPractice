import { NextResponse, type NextRequest } from "next/server";

import { createGoogleCalendarServices } from "@/features/integrations/google-calendar/services/container";

/**
 * Redirects the browser to Google's consent screen. `practiceId` (and
 * optionally `dentistId`) travel in the signed `state` parameter, verified
 * on callback.
 *
 * TODO(auth): once a login system exists, this must verify the caller is
 * an authenticated member of `practiceId` with permission to manage
 * integrations, rather than trusting the query parameter as-is.
 */
export async function GET(request: NextRequest) {
  const practiceId = request.nextUrl.searchParams.get("practiceId");
  const dentistId = request.nextUrl.searchParams.get("dentistId");

  if (!practiceId) {
    return NextResponse.json({ error: "practiceId query parameter is required" }, { status: 400 });
  }

  try {
    const { oauthService } = createGoogleCalendarServices();
    const authorizeUrl = oauthService.buildAuthorizeUrl({ practiceId, dentistId: dentistId || null });
    return NextResponse.redirect(authorizeUrl);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start Google Calendar connection" },
      { status: 500 }
    );
  }
}
