import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic redirect only.
 *
 * This runs on every matched request (including prefetches), so it checks for
 * the session cookie and nothing else -- no database call, and deliberately no
 * import of `lib/auth` or `lib/db`. A cookie can be stale or forged, so the
 * real check stays in `requireSession()` on each page.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  // Remember where they were headed so signing in finishes the navigation they
  // started, rather than dumping everyone on the dashboard.
  const url = new URL("/auth", request.nextUrl);
  url.searchParams.set(
    "next",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.redirect(url);
}

export const config = {
  // Guard the controllers area only; /api/auth/* must never be intercepted.
  matcher: ["/controllers/:path*"],
};
