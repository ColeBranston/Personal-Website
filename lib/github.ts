import dns from "node:dns";
import { cacheGet, cacheSet } from "./redis";
import { parseRepoLink } from "./repo";
import type { CommitSummary, RepoCommitData, WeeklyActivity } from "./types";

export { parseRepoLink } from "./repo";

// Some Windows/network setups advertise IPv6 for api.github.com but can't
// actually route to it, so Node's fetch hangs trying the IPv6 address until
// it times out (UND_ERR_CONNECT_TIMEOUT) before ever falling back to IPv4.
// Preferring IPv4 first sidesteps that entirely. Harmless on networks/hosts
// (e.g. Vercel) where IPv6 works fine.
dns.setDefaultResultOrder("ipv4first");

const API_BASE = "https://api.github.com";
const COMMIT_LIMIT = 25; // how many recent commits to show in detail (rate-limit friendly)
const REVALIDATE_COOLDOWN_MS = 30_000; // don't hit GitHub more than once per repo per 30s
const FETCH_TIMEOUT_MS = 8000; // fail fast instead of hanging on a bad connection

function getTtl(): number {
  const raw = process.env.COMMITS_CACHE_TTL;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3600;
}

function cacheKeyFor(owner: string, name: string): string {
  // v2 bumps the cache key so entries cached before totalCommitCount/totalLines
  // existed (which would otherwise serve stale-shaped data until their TTL
  // expires and crash the UI on the missing fields) are ignored immediately.
  return `github:commits:v2:${owner}/${name}`;
}

function ghHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "cole-branston-portfolio",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function ghFetch(path: string): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      return await fetch(`${API_BASE}${path}`, {
        headers: ghHeaders(),
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (err) {
      lastErr = err;
      // Brief backoff before the one retry — a transient connection hiccup
      // often clears up immediately.
      if (attempt === 0) await new Promise((r) => setTimeout(r, 300));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

async function fetchCommitActivity(owner: string, name: string): Promise<WeeklyActivity[]> {
  // GitHub computes these stats asynchronously; a 202 means "come back shortly".
  // We retry once after a short delay, then give up gracefully with no data.
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await ghFetch(`/repos/${owner}/${name}/stats/commit_activity`);
    if (res.status === 202) {
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ week: number; total: number; days: number[] }>;
    if (!Array.isArray(data)) return [];
    return data.map((w) => ({
      weekStart: new Date(w.week * 1000).toISOString(),
      total: w.total,
      days: w.days,
    }));
  }
  return [];
}

/**
 * GitHub doesn't expose a direct "total commit count" endpoint. The
 * standard trick: request 1 commit per page, then read the last page
 * number off the `Link` pagination header — that number equals the total
 * commit count on this branch.
 */
async function fetchTotalCommitCount(owner: string, name: string, branch: string): Promise<number> {
  const res = await ghFetch(
    `/repos/${owner}/${name}/commits?sha=${encodeURIComponent(branch)}&per_page=1`
  );
  if (!res.ok) return 0;

  const link = res.headers.get("link");
  if (!link) {
    // No Link header means everything fit on one page.
    const body = (await res.json()) as unknown[];
    return Array.isArray(body) ? body.length : 0;
  }
  const match = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Approximates the repo's current total lines of code by summing weekly
 * net changes (additions + deletions, where GitHub reports deletions as
 * negative) from the code-frequency endpoint. Not exact — doesn't account
 * for binary files or history rewrites — but a reasonable proxy without
 * cloning the repo. Returns null if GitHub hasn't finished computing stats.
 */
async function fetchTotalLines(owner: string, name: string): Promise<number | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await ghFetch(`/repos/${owner}/${name}/stats/code_frequency`);
    if (res.status === 202) {
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
    if (!res.ok) return null;
    const data = (await res.json()) as Array<[number, number, number]>;
    if (!Array.isArray(data)) return null;
    const net = data.reduce((sum, [, additions, deletions]) => sum + additions + deletions, 0);
    return Math.max(0, Math.round(net));
  }
  return null;
}

async function fetchRecentCommits(
  owner: string,
  name: string,
  branch: string
): Promise<{ commits: CommitSummary[]; totalCommits: number }> {
  const listRes = await ghFetch(
    `/repos/${owner}/${name}/commits?sha=${encodeURIComponent(branch)}&per_page=${COMMIT_LIMIT}`
  );
  if (!listRes.ok) {
    throw new Error(`GitHub commits list failed: ${listRes.status}`);
  }
  const list = (await listRes.json()) as Array<{
    sha: string;
    html_url: string;
    commit: { message: string; author: { name: string; date: string } };
  }>;

  // Fetch per-commit stats (additions/deletions) in small batches to stay
  // polite to the API and to whatever's left of the rate limit.
  const detailed: CommitSummary[] = [];
  const batchSize = 5;
  for (let i = 0; i < list.length; i += batchSize) {
    const batch = list.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (c) => {
        try {
          const detailRes = await ghFetch(`/repos/${owner}/${name}/commits/${c.sha}`);
          if (detailRes.ok) {
            const detail = (await detailRes.json()) as {
              stats?: { additions: number; deletions: number };
              files?: unknown[];
            };
            return {
              sha: c.sha,
              shortSha: c.sha.slice(0, 7),
              message: c.commit.message.split("\n")[0],
              author: c.commit.author?.name ?? "unknown",
              date: c.commit.author?.date ?? "",
              url: c.html_url,
              additions: detail.stats?.additions ?? 0,
              deletions: detail.stats?.deletions ?? 0,
              filesChanged: detail.files?.length ?? 0,
            } satisfies CommitSummary;
          }
        } catch {
          // fall through to the summary-only version below
        }
        return {
          sha: c.sha,
          shortSha: c.sha.slice(0, 7),
          message: c.commit.message.split("\n")[0],
          author: c.commit.author?.name ?? "unknown",
          date: c.commit.author?.date ?? "",
          url: c.html_url,
          additions: 0,
          deletions: 0,
          filesChanged: 0,
        } satisfies CommitSummary;
      })
    );
    detailed.push(...results);
  }

  return { commits: detailed, totalCommits: detailed.length };
}

/** Hits GitHub directly (no cache read) and assembles a fresh RepoCommitData. */
async function fetchLiveRepoCommitData(owner: string, name: string): Promise<RepoCommitData> {
  const repoRes = await ghFetch(`/repos/${owner}/${name}`);
  if (!repoRes.ok) throw new Error(`GitHub repo lookup failed: ${repoRes.status}`);
  const repoJson = (await repoRes.json()) as { default_branch: string };
  const defaultBranch = repoJson.default_branch || "main";

  const [{ commits, totalCommits }, weeklyActivity, totalCommitCount, totalLines] = await Promise.all([
    fetchRecentCommits(owner, name, defaultBranch),
    fetchCommitActivity(owner, name),
    fetchTotalCommitCount(owner, name, defaultBranch),
    fetchTotalLines(owner, name),
  ]);

  return {
    repo: `${owner}/${name}`,
    owner,
    name,
    defaultBranch,
    totalCommits,
    totalCommitCount,
    totalLines,
    commits,
    weeklyActivity,
    fetchedAt: new Date().toISOString(),
  };
}

/** True if two RepoCommitData snapshots represent the same underlying data (ignoring fetchedAt/stale bookkeeping). */
function isSameRepoData(a: RepoCommitData, b: RepoCommitData): boolean {
  const normalize = (d: RepoCommitData) =>
    JSON.stringify({
      defaultBranch: d.defaultBranch,
      totalCommits: d.totalCommits,
      totalCommitCount: d.totalCommitCount,
      totalLines: d.totalLines,
      commits: d.commits,
      weeklyActivity: d.weeklyActivity,
    });
  return normalize(a) === normalize(b);
}

/**
 * Returns commit history + weekly commit-activity heatmap data for a repo,
 * preferring a fresh Redis cache entry (to stay well under GitHub's rate
 * limits) and falling back to a stale cache if a live fetch fails. This is
 * the fast path used for the initial page load — cache-first, so the UI can
 * render instantly instead of waiting on GitHub.
 */
export async function getRepoCommitData(repoLink: string): Promise<RepoCommitData> {
  const parsed = parseRepoLink(repoLink);
  if (!parsed) throw new Error(`Invalid GitHub repo link: ${repoLink}`);
  const { owner, name } = parsed;
  const cacheKey = cacheKeyFor(owner, name);

  const cached = await cacheGet<RepoCommitData>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchLiveRepoCommitData(owner, name);
    await cacheSet(cacheKey, data, getTtl());
    await cacheSet(`${cacheKey}:stale`, data, 60 * 60 * 24 * 7);
    return data;
  } catch (err) {
    console.error(`[github] live fetch failed for ${owner}/${name}:`, err);
    const stale = await cacheGet<RepoCommitData>(`${cacheKey}:stale`);
    if (stale) return { ...stale, stale: true };
    throw err;
  }
}

/**
 * Background revalidation: always hits GitHub live (skipping the cache
 * read), compares the result against what's currently cached, and only
 * overwrites the cache — and tells the caller to update the UI — if
 * something actually changed. Called after the cached copy has already been
 * shown to the user, so a redundant fetch never blocks the page from
 * feeling instant.
 *
 * Rate-limited to once per repo per REVALIDATE_COOLDOWN_MS so rapidly
 * opening/closing a project modal can't hammer GitHub.
 */
export async function revalidateRepoCommitData(
  repoLink: string
): Promise<{ data: RepoCommitData; changed: boolean }> {
  const parsed = parseRepoLink(repoLink);
  if (!parsed) throw new Error(`Invalid GitHub repo link: ${repoLink}`);
  const { owner, name } = parsed;
  const cacheKey = cacheKeyFor(owner, name);

  const cached = await cacheGet<RepoCommitData>(cacheKey);

  if (cached) {
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    if (Number.isFinite(age) && age < REVALIDATE_COOLDOWN_MS) {
      return { data: cached, changed: false };
    }
  }

  const fresh = await fetchLiveRepoCommitData(owner, name);

  if (cached && isSameRepoData(cached, fresh)) {
    // Nothing actually changed — just refresh the TTL, no need to touch the UI.
    await cacheSet(cacheKey, cached, getTtl());
    return { data: cached, changed: false };
  }

  await cacheSet(cacheKey, fresh, getTtl());
  await cacheSet(`${cacheKey}:stale`, fresh, 60 * 60 * 24 * 7);
  return { data: fresh, changed: true };
}
