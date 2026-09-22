import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
 * The actual authorization boundary. Called per page rather than from a
 * layout: layouts do not re-render on navigation and do not control whether
 * the rest of the route renders.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/auth");
  return session;
}
