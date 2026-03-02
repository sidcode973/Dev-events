import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not defined. Please add it to your environment variables."
  );
}

/**
 * Cached connection interface.
 * - `conn`: the resolved Mongoose instance (null until connected)
 * - `promise`: the in-flight connection promise (null until first call)
 */
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

/**
 * Extend `globalThis` so the cached connection survives HMR in development.
 * Without this, every hot-reload would open a new connection and eventually
 * exhaust the MongoDB connection pool.
 */
declare global {
  // eslint-disable-next-line no-var -- must be `var` for global augmentation
  var mongooseCache: MongooseCache | undefined;
}

// Reuse the existing cache or initialise a new one.
const cache: MongooseCache = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
};
globalThis.mongooseCache = cache;

/**
 * Returns a cached Mongoose connection. Creates one on the first call and
 * reuses it for every subsequent call within the same process (or HMR session).
 */
async function connectToDatabase(): Promise<Mongoose> {
  // Return the existing connection immediately if available.
  if (cache.conn) {
    return cache.conn;
  }

  // If no connection promise exists yet, start connecting.
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false, // Fail fast instead of buffering when disconnected.
    });
  }

  // Await the (possibly already in-flight) connection promise.
  cache.conn = await cache.promise;
  return cache.conn;
}

export default connectToDatabase;
