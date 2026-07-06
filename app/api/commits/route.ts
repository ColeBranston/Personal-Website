import { NextRequest, NextResponse } from "next/server";
import { getRepoCommitData, revalidateRepoCommitData } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const repo = req.nextUrl.searchParams.get("repo");
  if (!repo) {
    return NextResponse.json(
      { error: "Missing required 'repo' query param (a GitHub repo URL)." },
      { status: 400 }
    );
  }

  const revalidate = req.nextUrl.searchParams.get("revalidate") === "1";

  try {
    if (revalidate) {
      // Background check: always hits GitHub live and only reports a change
      // if the fresh data actually differs from what's cached.
      const { data, changed } = await revalidateRepoCommitData(repo);
      return NextResponse.json({ ...data, changed });
    }

    // Fast path: serve the cached copy immediately if one exists.
    const data = await getRepoCommitData(repo);
    return NextResponse.json({ ...data, changed: false });
  } catch (err) {
    console.error("[api/commits] error:", err);
    return NextResponse.json(
      { error: "Failed to load commit data for this repo." },
      { status: 502 }
    );
  }
}
