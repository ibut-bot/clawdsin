import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

function extractTweetText(html: string): string {
  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  if (!pMatch) return "";
  let text = pMatch[1];
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, "$1");
  text = text.replace(/<[^>]+>/g, "");
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
  return text.trim();
}

function normalizeUrl(url: string): string {
  return url.replace(/https?:\/\/(www\.)?x\.com/i, "https://twitter.com");
}

function extractUsernameFromUrl(authorUrl: string): string {
  const match = authorUrl.match(/twitter\.com\/(\w+)/i);
  return match ? match[1].toLowerCase() : "";
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.username) {
    return NextResponse.json({ error: "Not authenticated. Sign in with X first." }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`claim:${ip}`, {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many claim attempts. Try again later." },
      { status: 429 }
    );
  }

  let body: { tweetUrl?: string; claimCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { tweetUrl, claimCode } = body;

  if (!tweetUrl || typeof tweetUrl !== "string") {
    return NextResponse.json({ error: "Tweet URL is required" }, { status: 400 });
  }

  if (!claimCode || typeof claimCode !== "string") {
    return NextResponse.json({ error: "Claim code is required" }, { status: 400 });
  }

  // Validate tweet URL
  const tweetUrlPattern =
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
  if (!tweetUrlPattern.test(tweetUrl)) {
    return NextResponse.json(
      { error: "Not a valid X/Twitter post URL" },
      { status: 400 }
    );
  }

  // Find agent by claim code
  const agent = await prisma.agent.findUnique({
    where: { claimCode },
  });

  if (!agent) {
    return NextResponse.json(
      { error: "Invalid claim code. No agent found with this code." },
      { status: 404 }
    );
  }

  if (agent.twitterHandle) {
    return NextResponse.json(
      { error: "This agent has already been claimed." },
      { status: 409 }
    );
  }

  // Fetch tweet via oEmbed
  const normalizedUrl = normalizeUrl(tweetUrl);
  let oembed: { html: string; author_url: string; author_name: string };
  try {
    const oembedRes = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(normalizedUrl)}&omit_script=true`,
      { next: { revalidate: 0 } }
    );

    if (!oembedRes.ok) {
      if (oembedRes.status === 404) {
        return NextResponse.json(
          { error: "Tweet not found. It may be deleted or from a private account." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch tweet data" },
        { status: 502 }
      );
    }
    oembed = await oembedRes.json();
  } catch {
    return NextResponse.json(
      { error: "Failed to verify tweet" },
      { status: 500 }
    );
  }

  // Verify the tweet is from the logged-in user
  const tweetAuthor = extractUsernameFromUrl(oembed.author_url);
  const loggedInUser = session.username.toLowerCase();

  if (tweetAuthor !== loggedInUser) {
    return NextResponse.json(
      {
        error: `Tweet is by @${tweetAuthor}, but you're logged in as @${session.username}. The tweet must be from your account.`,
      },
      { status: 403 }
    );
  }

  // Verify the tweet contains the claim code
  const tweetText = extractTweetText(oembed.html);
  if (!tweetText.includes(claimCode)) {
    return NextResponse.json(
      {
        error: `Tweet does not contain the claim code "${claimCode}". Make sure your tweet includes the exact code.`,
      },
      { status: 400 }
    );
  }

  // All checks passed — link agent to human
  const updatedAgent = await prisma.agent.update({
    where: { id: agent.id },
    data: {
      twitterHandle: session.username,
      claimedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    message: `Agent "${updatedAgent.name}" has been successfully claimed by @${session.username}!`,
    agent: {
      id: updatedAgent.id,
      name: updatedAgent.name,
      twitterHandle: updatedAgent.twitterHandle,
      claimedAt: updatedAgent.claimedAt?.toISOString(),
      profileUrl: `/agents/${updatedAgent.id}`,
    },
  });
}
