import Redis from "ioredis";

// Lazily-created singleton Redis client. If REDIS_URL isn't configured (e.g.
// local dev without a .env file yet), every function below degrades
// gracefully to "no cache" instead of throwing, so the site still works —
// it just talks to GitHub / the config repo on every request.
//
// The client is cached on `globalThis` rather than a plain module variable.
// In Next.js dev mode, every hot reload re-executes this file from scratch;
// a plain `let client` would reset to undefined each time and spin up a
// brand-new ioredis connection per save, leaking the old ones (which keep
// retrying forever in the background) until Redis Cloud's connection limit
// is hit — the "ERR max number of clients reached" flood. Stashing it on
// globalThis survives module re-execution across hot reloads, so we only
// ever hold one real connection per dev server process.

declare global {
  // eslint-disable-next-line no-var
  var __portfolioRedisClient: Redis | null | undefined;
}

function getClient(): Redis | null {
  if (globalThis.__portfolioRedisClient !== undefined) {
    return globalThis.__portfolioRedisClient;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("[redis] REDIS_URL not set — running without a cache.");
    globalThis.__portfolioRedisClient = null;
    return null;
  }

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      retryStrategy: (times) => Math.min(times * 500, 5000),
      // Cap reconnect attempts so a bad connection doesn't retry forever
      // and pile up alongside future hot-reload instances.
      reconnectOnError: () => true,
    });
    client.on("error", (err) => {
      console.error("[redis] connection error:", err.message);
    });
    globalThis.__portfolioRedisClient = client;
  } catch (err) {
    console.error("[redis] failed to initialize client:", err);
    globalThis.__portfolioRedisClient = null;
  }

  return globalThis.__portfolioRedisClient ?? null;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[redis] GET ${key} failed:`, err);
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error(`[redis] SET ${key} failed:`, err);
  }
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL);
}
