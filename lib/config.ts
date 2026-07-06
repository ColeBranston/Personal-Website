import { cacheGet, cacheSet } from "./redis";
import type { SiteConfig } from "./types";

const CACHE_KEY = "site:config";
const DEFAULT_CONFIG_URL =
  "https://raw.githubusercontent.com/ColeBranston/personal-website-config/main/config.json";

function getTtl(): number {
  const raw = process.env.CONFIG_CACHE_TTL;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300;
}

async function fetchConfigFromSource(): Promise<SiteConfig> {
  const url = process.env.CONFIG_URL || DEFAULT_CONFIG_URL;
  const res = await fetch(url, {
    headers: { "User-Agent": "cole-branston-portfolio" },
    // Always hit the network here — freshness is handled by our own Redis TTL.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch config.json: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  try {
    return JSON.parse(text) as SiteConfig;
  } catch (err) {
    const snippet = text.slice(0, 200).replace(/\s+/g, " ");
    throw new Error(
      `config.json from ${url} is not valid JSON (${
        (err as Error).message
      }). First 200 chars of response: "${snippet}"`
    );
  }
}

/**
 * Returns the site config, preferring a fresh Redis cache entry, falling
 * back to fetching config.json from GitHub, and — if GitHub is unreachable —
 * serving a stale cached copy rather than a broken page.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  const cached = await cacheGet<SiteConfig>(CACHE_KEY);
  if (cached) return cached;

  try {
    const fresh = await fetchConfigFromSource();
    await cacheSet(CACHE_KEY, fresh, getTtl());
    // Keep a long-lived fallback copy in case GitHub is unreachable later.
    await cacheSet(`${CACHE_KEY}:stale`, fresh, 60 * 60 * 24 * 7);
    return fresh;
  } catch (err) {
    console.error("[config] fetch failed, checking for stale cache:", err);
    const stale = await cacheGet<SiteConfig>(`${CACHE_KEY}:stale`);
    if (stale) return stale;
    throw err;
  }
}
