import { NextRequest, NextResponse } from "next/server";
import { execSync } from "node:child_process";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Only allow image URLs from known hosts
  const allowed = ["your-objectstorage.com", "pbs.twimg.com", "abs.twimg.com"];
  try {
    const host = new URL(url).hostname;
    if (!allowed.some((h) => host.endsWith(h))) {
      return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    // Node.js fetch/https can't reach some hosts; curl works reliably
    const buffer = execSync(`curl -sL --max-time 10 "${url}"`, {
      maxBuffer: 10 * 1024 * 1024,
    });

    // Detect content type from URL extension, default to jpeg
    const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase();
    const ctMap: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
    };

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": ctMap[ext ?? ""] || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("[image-proxy] curl error:", err);
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}
