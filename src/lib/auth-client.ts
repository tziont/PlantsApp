import { createAuthClient } from "better-auth/react";

// Same-origin, so no baseURL: the client targets /api/auth on its own.
// This is the only auth module the browser ever imports -- it must never reach
// `lib/auth.ts` or `lib/db.ts`.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
