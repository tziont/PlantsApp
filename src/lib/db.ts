import mongoose from "mongoose";
import type { Connection } from "mongoose";

/**
 * Cached Mongoose connection.
 *
 * Next dev/HMR re-evaluates modules, and serverless invocations reuse the same
 * process, so the connection is parked on `globalThis` to keep exactly one pool
 * alive across reloads (SPEC 23).
 */
type MongooseCache = {
  conn: Connection | null;
  promise: Promise<Connection> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  __mongooseCache?: MongooseCache;
};

const cache: MongooseCache = (globalWithMongoose.__mongooseCache ??= {
  conn: null,
  promise: null,
});

export async function connectMongoose(): Promise<Connection> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not set. Add it to .env.local.");
    }

    cache.promise = mongoose
      .connect(uri, { bufferCommands: false })
      .then((m) => m.connection)
      // Drop the rejected promise so a later request can retry the connect
      // instead of replaying the same failure forever.
      .catch((err: unknown) => {
        cache.promise = null;
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

/**
 * The native driver handles behind the Mongoose connection.
 *
 * Better Auth's adapter needs a native `Db`; deriving it here rather than
 * constructing a second `MongoClient` keeps both consumers on one pool.
 */
export async function getMongoHandles() {
  const conn = await connectMongoose();
  const db = conn.db;
  if (!db) {
    throw new Error("Mongoose connected but exposed no native Db instance.");
  }
  return { db, client: conn.getClient() };
}
