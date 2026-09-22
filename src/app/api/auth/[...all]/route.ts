import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/auth";

// `toNextJsHandler` accepts a bare `(request) => Promise<Response>`, which lets
// the auth instance be awaited per request. Better Auth owns every endpoint
// under /api/auth/* (SPEC 12) -- nothing here is hand-written.
export const { GET, POST } = toNextJsHandler(async (request: Request) => {
  const auth = await getAuth();
  return auth.handler(request);
});
