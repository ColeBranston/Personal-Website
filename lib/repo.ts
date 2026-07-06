/** Client-safe helper for parsing a GitHub repo URL into owner/name. No env/fetch here. */
export function parseRepoLink(link: string): { owner: string; name: string } | null {
  try {
    const url = new URL(link);
    const parts = url.pathname
      .replace(/^\/|\/$/g, "")
      .replace(/\.git$/, "")
      .split("/");
    if (parts.length < 2) return null;
    return { owner: parts[0], name: parts[1] };
  } catch {
    return null;
  }
}

/**
 * A "github.com/.../blob/..." link is the HTML page GitHub renders around a
 * file — great for browsing, useless as an <img src> since it serves an
 * HTML document, not image bytes. This rewrites it to the equivalent
 * raw.githubusercontent.com URL, which serves the actual file. Non-GitHub
 * URLs (e.g. already-raw links, or images hosted elsewhere entirely) pass
 * through unchanged.
 */
export function normalizeImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "github.com") {
      const parts = parsed.pathname.split("/").filter(Boolean); // [owner, repo, "blob", branch, ...path]
      const blobIndex = parts.indexOf("blob");
      if (blobIndex > 0 && parts.length > blobIndex + 1) {
        const owner = parts[0];
        const repo = parts[1];
        const rest = parts.slice(blobIndex + 1).join("/"); // branch/path/to/file
        return `https://raw.githubusercontent.com/${owner}/${repo}/${rest}`;
      }
    }
  } catch {
    // Not a valid absolute URL — just return it as given.
  }
  return url;
}
