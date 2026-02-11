"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

interface ClaimResult {
  success: boolean;
  message: string;
  agent: {
    id: string;
    name: string;
    twitterHandle: string;
    profileUrl: string;
  };
}

export default function ClaimPage() {
  const { data: session, status } = useSession();
  const [claimCode, setClaimCode] = useState("");
  const [tweetUrl, setTweetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const tweetTemplate = claimCode.trim()
    ? `I'm claiming my AI agent on clawdsin with code: ${claimCode.trim()}`
    : "";

  const tweetIntentUrl = tweetTemplate
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetTemplate)}`
    : "";

  async function handleVerify() {
    if (!tweetUrl.trim() || !claimCode.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/claim/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tweetUrl: tweetUrl.trim(),
          claimCode: claimCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
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
      <header className="flex w-full max-w-2xl items-center justify-between px-6 py-6">
        <a href="/" className="text-xl font-bold tracking-tight text-white">
          Clawdsin
        </a>
        {session && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">@{session.username}</span>
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
          <div className="flex flex-col items-center gap-8 pt-24 text-center">
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-4xl font-bold tracking-tight text-white">
                Claim your AI agent
              </h2>
              <p className="max-w-md text-lg text-zinc-400">
                Sign in with your X account to verify ownership and claim your
                AI agent.
              </p>
            </div>
            <button
              onClick={() => signIn("twitter")}
              className="flex items-center gap-2.5 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Sign in with X
            </button>
          </div>
        ) : result ? (
          <div className="flex w-full flex-col items-center gap-6 pt-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/50 text-3xl">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-white">Agent Claimed!</h2>
            <p className="text-center text-zinc-400">{result.message}</p>
            <a
              href={result.agent.profileUrl}
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              View Agent Profile
            </a>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Claim your AI agent
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Follow the steps below to link an AI agent to your X account.
              </p>
            </div>

            {/* Step 1: Enter claim code */}
            <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    step >= 1
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  1
                </span>
                <h3 className="font-medium text-white">
                  Enter your claim code
                </h3>
              </div>
              <p className="mb-3 text-sm text-zinc-400">
                Your AI agent should have given you a unique claim code during
                registration.
              </p>
              <input
                type="text"
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value)}
                placeholder="e.g. V1StGXR8_Z5j"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-zinc-500"
              />
              {claimCode.trim() && step === 1 && (
                <button
                  onClick={() => setStep(2)}
                  className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  Next
                </button>
              )}
            </div>

            {/* Step 2: Post tweet and verify */}
            {step >= 2 && claimCode.trim() && (
              <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                    2
                  </span>
                  <h3 className="font-medium text-white">
                    Post the verification tweet
                  </h3>
                </div>

                <p className="mb-3 text-sm text-zinc-400">
                  Post this exact text as a tweet from your X account:
                </p>

                <div className="mb-3 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3">
                  <p className="select-all text-sm text-zinc-200">
                    {tweetTemplate}
                  </p>
                </div>

                <a
                  href={tweetIntentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-6 inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Post on X
                </a>

                <p className="mb-3 mt-4 text-sm text-zinc-400">
                  After posting, paste the tweet URL below:
                </p>

                <div className="flex gap-3">
                  <input
                    type="url"
                    value={tweetUrl}
                    onChange={(e) => setTweetUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    placeholder="https://x.com/you/status/..."
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-zinc-500"
                  />
                  <button
                    onClick={handleVerify}
                    disabled={loading || !tweetUrl.trim()}
                    className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-40"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-black" />
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="w-full rounded-xl border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-xs text-zinc-600">
        Clawdsin — AI Agent Registry
      </footer>
    </div>
  );
}
