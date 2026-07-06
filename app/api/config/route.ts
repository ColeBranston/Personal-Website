import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getSiteConfig();
    return NextResponse.json(config);
  } catch (err) {
    console.error("[api/config] error:", err);
    return NextResponse.json(
      { error: "Failed to load site configuration." },
      { status: 502 }
    );
  }
}
