import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api-error";
import { getAuth } from "@/lib/auth";

/**
 * Server-side session read, memoised for the duration of one render pass so
 * several components can ask without repeating the lookup.
 */
export const getSession = cache(async () => {
  // `headers()` is async-only in Next 16, and is awaited *first* on purpose:
  // it marks the caller dynamic, so a build-time prerender bails out here
  // rather than trying to open a database connection.
  const requestHeaders = await headers();
  const auth = await getAuth();
  return auth.api.getSession({ headers: requestHeaders });
});

/**
 * The authorization boundary for pages. Called per page rather than from a
 * layout: layouts do not re-render on navigation and do not control whether
 * the rest of the route renders.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/auth");
  return session;
}

/**
 * The same boundary for route handlers, which must answer with SPEC 21's error
 * envelope rather than a redirect -- an API client has no use for a 307 to an
 * HTML login page.
 *
 * Throws so a handler's single `catch (e) { return toErrorResponse(e) }` covers
 * it, instead of every caller having to test for a Response it might return.
 */
export async function requireApiSession() {
  const session = await getSession();
  if (!session) throw new ApiError("UNAUTHORIZED");
  return session;
}
