/** Where a user lands after signing in with nothing else requested. */
export const DEFAULT_SIGNED_IN_PATH = "/controllers";

/**
 * Sanitises the `?next=` value the proxy attaches when it bounces an
 * unauthenticated visitor.
 *
 * The value reaches us through the URL, so a crafted link could otherwise turn
 * the login form into an open redirect — the user signs in for real and is then
 * handed to an attacker's page still trusting the site they started on. Only a
 * path on this origin is allowed through; anything else falls back.
 */
export function sanitizeNextPath(value: string | string[] | undefined): string {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return DEFAULT_SIGNED_IN_PATH;
  }

  // `//host` is protocol-relative and `/\host` is normalised to it by browsers,
  // so both leave the origin despite the leading slash.
  if (value.startsWith("//") || value.includes("\\")) {
    return DEFAULT_SIGNED_IN_PATH;
  }

  // Sending someone to a route handler after login renders raw JSON.
  if (value === "/api" || value.startsWith("/api/")) {
    return DEFAULT_SIGNED_IN_PATH;
  }

  return value;
}
