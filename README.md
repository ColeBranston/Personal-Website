# Cole Branston - Portfolio

A dark, terminal-inspired personal site built with Next.js (App Router). Content
(personal info, education, skills, work experience, projects) is pulled at
request time from `config.json` in the
[personal-website-config](https://github.com/ColeBranston/personal-website-config)
repo, and GitHub commit history/activity for each project is fetched from the
GitHub REST API and cached in Redis so the site doesn't get rate-limited.

## How it's wired together

- **`lib/config.ts`** — fetches `config.json` from `CONFIG_URL` (raw GitHub
  URL), cached in Redis for `CONFIG_CACHE_TTL` seconds. Falls back to a
  week-old stale copy if GitHub is briefly unreachable.
- **`lib/github.ts`** — for a project's repo link, fetches the default
  branch, the last 25 commits (with per-commit +/- line stats), and 6 months
  of weekly commit-activity data from the GitHub REST API. Cached in Redis
  for `COMMITS_CACHE_TTL` seconds per repo.
- **`lib/redis.ts`** — thin Redis client wrapper. If `REDIS_URL` isn't set,
  every cache call becomes a no-op instead of throwing, so the site still
  works locally without Redis (it just calls GitHub/GitHub raw on every
  request).
- **`app/api/config/route.ts`** and **`app/api/commits/route.ts`** — the two
  backend endpoints. The homepage (`app/page.tsx`) calls `getSiteConfig()`
  directly on the server; `ProjectModal` calls `/api/commits?repo=<url>`
  client-side when a project card is opened.
- All secrets (`CONFIG_URL`, `REDIS_URL`, `TOKEN`) are read from
  environment variables — nothing is hardcoded.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Required | Notes |
|---|---|---|
| `CONFIG_URL` | no | Defaults to your config repo's raw `main` branch URL. |
| `REDIS_URL` | recommended | `REDIS_URL` — grab the password from your Redis Cloud dashboard. Without it, the site works but skips caching. |
| `TOKEN` | recommended | A [personal access token](https://github.com/settings/tokens) (no scopes needed, repos are public) — raises the GitHub API limit from 60/hr to 5,000/hr. Without it, caching alone should keep you under 60/hr as long as you don't have >60 site loads hitting uncached repos per hour. |
| `COMMITS_CACHE_TTL` | no | Seconds to cache GitHub commit data. Default `3600` (1 hour). |
| `CONFIG_CACHE_TTL` | no | Seconds to cache `config.json`. Default `300` (5 minutes). |

## Per-company timeline colors

Each `work_experience` entry accepts an optional `primary_color` field — any
valid CSS color (a named color like `"blue"`, a hex code like `"#EE3124"`,
or `rgb()`/`hsl()`). It's used to tint that entry's timeline node, card
border, and company name, and the timeline's vertical progress line
smoothly transitions to match whichever entry is currently centered in the
viewport as you scroll. Entries without `primary_color` fall back to the
site's default purple accent.

## Updating content

Edit `config.json` in the **personal-website-config** repo (not this one) —
new work experience, projects, or skills show up on the site within
`CONFIG_CACHE_TTL` seconds, no redeploy required. To add a project's commit
graph and history, just include a `link` field pointing at its public GitHub
repo; the commit graph and commit list are generated automatically from that
link.

### Project cover images

Each project accepts an optional `cover_image` field — any image URL. If
omitted, the project falls back to GitHub's auto-generated repo preview
image. A `https://github.com/owner/repo/blob/branch/path.png` link (the
normal GitHub file-viewer URL) is automatically rewritten to the equivalent
`raw.githubusercontent.com` URL under the hood, since the `blob` page serves
an HTML wrapper, not the actual image — so you can paste either the raw URL
or just copy the link straight from GitHub's UI and it'll work.
