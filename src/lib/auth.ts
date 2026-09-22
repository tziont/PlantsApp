import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

import { getMongoHandles } from "@/lib/db";

async function buildAuth() {
  const { db, client } = await getMongoHandles();

  return betterAuth({
    database: mongodbAdapter(db, {
      client,
      // The adapter turns transactions on as soon as a client is passed, but
      // they need a replica set. A standalone local mongod would error, so the
      // POC opts out explicitly.
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
      // Email verification is out of POC scope (SPEC 26). Password/email rules
      // are deliberately left at Better Auth's defaults (SPEC 20).
      requireEmailVerification: false,
    },
  });
}

// Inferred from the builder: `betterAuth` is generic over its options, so a
// hand-written `ReturnType<typeof betterAuth>` would widen the instance and
// lose the adapter's type.
export type Auth = Awaited<ReturnType<typeof buildAuth>>;

const globalWithAuth = globalThis as typeof globalThis & {
  __authPromise?: Promise<Auth>;
};

/**
 * Better Auth needs a live `Db`, which is only available after an async
 * connect, so the instance cannot be a plain module-level export.
 *
 * The *promise* is cached rather than the resolved value: concurrent requests
 * during a cold start then share one in-flight build instead of racing to
 * create two Better Auth instances.
 */
export function getAuth(): Promise<Auth> {
  return (globalWithAuth.__authPromise ??= buildAuth().catch((err: unknown) => {
    globalWithAuth.__authPromise = undefined;
    throw err;
  }));
}
