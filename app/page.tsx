"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

interface CheckResult {
  isOwner: boolean;
  postAuthor: string;
  postAuthorHandle: string;
  loggedInHandle: string;
  tweetText: string;
  embedHtml: string;
}

function TweetEmbed({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = html;
    // Load Twitter widget script to render the embed
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    containerRef.current.appendChild(script);
  }, [html]);

  return <div ref={containerRef} className="w-full max-w-lg" />;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");

  async function handleCheck() {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/check-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="flex w-full max-w-2xl items-center justify-between px-6 py-6">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-white">Clawdin</span>
        </h1>
        {session && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">
              @{session.username}
            </span>
            <button
              onClick={() => signOut()}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              Sign out
            </button>
          </div>
        )}
      </header>

      <main className="flex w-full max-w-2xl flex-1 flex-col items-center px-6 pt-12">
        {!session ? (
          /* Logged out state */
          <div className="flex flex-col items-center gap-8 pt-24 text-center">
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-4xl font-bold tracking-tight text-white">
                Verify your X posts
              </h2>
              <p className="max-w-md text-lg text-zinc-400">
                Sign in with your X account, paste a post URL, and check if
                it belongs to you.
              </p>
            </div>
            <button
              onClick={() => signIn("twitter")}
              className="flex items-center gap-2.5 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Sign in with X
            </button>
          </div>
        ) : (
          /* Logged in state */
          <div className="flex w-full flex-col items-center gap-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Check a post
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Paste an X/Twitter post URL to verify ownership and see its
                content.
              </p>
            </div>

            {/* Input */}
            <div className="flex w-full gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                placeholder="https://x.com/username/status/..."
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              />
              <button
                onClick={handleCheck}
                disabled={loading || !url.trim()}
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-black" />
                ) : (
                  "Check"
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="w-full rounded-xl border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="flex w-full flex-col gap-4">
                {/* Ownership badge */}
                <div
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                    result.isOwner
                      ? "border-emerald-800/50 bg-emerald-950/30"
                      : "border-amber-800/50 bg-amber-950/30"
                  }`}
                >
                  <span className="text-lg">
                    {result.isOwner ? "✓" : "✗"}
                  </span>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        result.isOwner ? "text-emerald-300" : "text-amber-300"
                      }`}
                    >
                      {result.isOwner
                        ? "This post is yours"
                        : "This post is NOT yours"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Posted by{" "}
                      <span className="font-medium text-zinc-300">
                        @{result.postAuthorHandle}
                      </span>
                      {" · "}
                      Logged in as{" "}
                      <span className="font-medium text-zinc-300">
                        @{result.loggedInHandle}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Tweet text */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Post content
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                    {result.tweetText}
                  </p>
                </div>

                {/* Embedded tweet */}
                <div className="flex justify-center">
                  <TweetEmbed html={result.embedHtml} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-xs text-zinc-600">
        Uses X oEmbed (free, no API key) · No tweets are stored
      </footer>
    </div>
  );
}
