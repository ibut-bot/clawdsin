import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

function extractTweetText(html: string): string {
  // Extract text from the <p> tag inside the blockquote
  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  if (!pMatch) return "";
  let text = pMatch[1];
  // Replace <br> with newlines
  text = text.replace(/<br\s*\/?>/gi, "\n");
  // Replace anchor tags with their text content
  text = text.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, "$1");
  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");
  // Decode HTML entities
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
  // Normalize x.com to twitter.com for oEmbed compatibility
  return url.replace(/https?:\/\/(www\.)?x\.com/i, "https://twitter.com");
}

function extractUsernameFromUrl(authorUrl: string): string {
  // author_url is like https://twitter.com/username
  const match = authorUrl.match(/twitter\.com\/(\w+)/i);
  return match ? match[1].toLowerCase() : "";
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.username) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { url } = await request.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "Please provide a valid URL" },
      { status: 400 }
    );
  }

  // Validate it looks like a tweet URL
  const tweetUrlPattern =
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
  if (!tweetUrlPattern.test(url)) {
    return NextResponse.json(
      { error: "Not a valid X/Twitter post URL" },
      { status: 400 }
    );
  }

  const normalizedUrl = normalizeUrl(url);

  try {
    // Use Twitter's free oEmbed endpoint — no API key needed
    const oembedRes = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(normalizedUrl)}&omit_script=true`,
      { next: { revalidate: 0 } }
    );

    if (!oembedRes.ok) {
      if (oembedRes.status === 404) {
        return NextResponse.json(
          { error: "Post not found. It may be deleted or from a private account." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch post data" },
        { status: 502 }
      );
    }

    const oembed = await oembedRes.json();
    const postAuthor = extractUsernameFromUrl(oembed.author_url);
    const loggedInUser = session.username.toLowerCase();
    const isOwner = postAuthor === loggedInUser;
    const tweetText = extractTweetText(oembed.html);

    return NextResponse.json({
      isOwner,
      postAuthor: oembed.author_name,
      postAuthorHandle: postAuthor,
      loggedInHandle: session.username,
      tweetText,
      embedHtml: oembed.html,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while checking the post" },
      { status: 500 }
    );
  }
}
