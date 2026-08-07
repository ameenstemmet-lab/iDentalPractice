import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Mirrors the (dashboard) route group's pages — that group is a URL-less
// folder, so there's no shared path prefix to match on; this list is the
// explicit source of truth for "requires a signed-in session."
const PROTECTED_PATHS = [
  "/dashboard",
  "/appointments",
  "/calendar",
  "/patients",
  "/practitioners",
  "/treatments",
  "/working-hours",
  "/blocked-time",
  "/reports",
  "/settings",
];

// Staff-only: practitioner-role sessions are redirected back to their own
// calendar if they try to reach these. Everything else in PROTECTED_PATHS
// (dashboard, appointments, calendar, patients) is shared.
const STAFF_ONLY_PATHS = ["/practitioners", "/treatments", "/working-hours", "/blocked-time", "/settings", "/reports"];

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  // Refreshes the session token if expired — required so Server Components
  // downstream always see a valid session, not just the middleware itself.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && matchesPath(pathname, PROTECTED_PATHS)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = user?.app_metadata?.role as string | undefined;
  if (user && role === "practitioner" && matchesPath(pathname, STAFF_ONLY_PATHS)) {
    return NextResponse.redirect(new URL("/calendar", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
