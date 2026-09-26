import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

import { getMongoHandles } from "@/lib/db";

/**
 * Indexes for Better Auth's own collections.
 *
 * The MongoDB adapter only creates indexes a table *declares*; a field-level
 * `unique: true` (which is what `user.email` has) never becomes one. Without
 * this, email uniqueness rests on a racy read-then-write, and every session
 * validation scans the whole `session` collection.
 *
 * Declared as a plugin schema because that is the merge point Better Auth
 * exposes: entries named `user`/`session`/`account`/`verification` are folded
 * into the built-in tables rather than added alongside them. Better Auth stays
 * the owner -- it issues the `createIndex` calls itself.
 *
 * Do not create these by hand. An index on the same keys under a different
 * name makes the adapter's own `createIndex` fail, and it swallows that error.
 *
 * The names are explicit and `app_`-prefixed because Better Auth reserves the
 * generated names (`user_email_uidx`, `session_userId_idx`, ...) for the
 * field-level metadata it does not yet act on; reusing one is a startup error.
 * If a later release starts creating those itself, drop this plugin.
 */
const authIndexes = {
  id: "auth-indexes",
  schema: {
    user: {
      fields: {},
      indexes: [
        { name: "app_user_email_unique", fields: ["email"], unique: true },
      ],
    },
    session: {
      fields: {},
      indexes: [
        { name: "app_session_token_unique", fields: ["token"], unique: true },
        { name: "app_session_user", fields: ["userId"] },
      ],
    },
    account: {
      fields: {},
      indexes: [{ name: "app_account_user", fields: ["userId"] }],
    },
  },
} satisfies BetterAuthPlugin;

async function buildAuth() {
  const { db, client } = await getMongoHandles();

  return betterAuth({
    database: mongodbAdapter(db, {
      client,
      // Transactions must stay off, even though Atlas supports them.
      //
      // The adapter creates the indexes declared above lazily, inside the
      // first write to each collection. MongoDB cannot build an index inside a
      // transaction, so that first signup dies with "Transaction with
      // { txnNumber: N } has been aborted" -- verified, not theoretical.
      //
      // The cost is that signup's `user` + `account` writes are not atomic. A
      // half-finished signup leaves a user with no credential account, who
      // then cannot log in. Acceptable for the POC; revisit by creating the
      // indexes in a bootstrap step outside the request path, after which
      // `createIndex` is a no-op and transactions can be turned back on.
      transaction: false,
    }),
    plugins: [authIndexes],
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
 *
 * In dev this cache outlives HMR -- it lives on `globalThis`, which a recompile
 * does not clear -- so editing the options above has no effect until the dev
 * server is restarted.
 */
export function getAuth(): Promise<Auth> {
  return (globalWithAuth.__authPromise ??= buildAuth().catch((err: unknown) => {
    globalWithAuth.__authPromise = undefined;
    throw err;
  }));
}
