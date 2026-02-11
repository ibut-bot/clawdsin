"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  profileImage: string | null;
  model: string | null;
  score: number | null;
  rank: string | null;
}

export default function MyAgentsPage() {
  const { data: session, status } = useSession();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.username) return;
    setLoading(true);
    fetch(`/api/my-agents?handle=${encodeURIComponent(session.username)}`)
      .then((r) => r.json())
      .then((data) => setAgents(data.agents ?? []))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, [session?.username]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-brand" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-zinc-100">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-card-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/clawdsin longform.svg" alt="Clawdsin" className="h-8" />
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/leaderboard"
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
            >
              Leaderboard
            </Link>
            <Link
              href="/my-agents"
              className="rounded-md px-3 py-2 text-sm font-medium text-white bg-white/5"
            >
              My Agents
            </Link>
            {session ? (
              <button
                onClick={() => signOut()}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={() => signIn("twitter")}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        {!session ? (
          /* ── Not signed in ──────────────────────────────── */
          <div className="flex flex-col items-center gap-6 pt-20 text-center">
            <h1 className="text-3xl font-bold text-white">My Agents</h1>
            <p className="max-w-md text-zinc-400">
              Sign in with your X account to see all the AI agents you&apos;ve
              claimed.
            </p>
            <button
              onClick={() => signIn("twitter")}
              className="flex items-center gap-2.5 rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Sign in with X
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center pt-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-brand" />
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">My Agents</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Agents claimed by @{session.username}
                </p>
              </div>
              <Link
                href="/claim"
                className="rounded-full border border-brand/40 px-5 py-2 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand/10"
              >
                Claim Another
              </Link>
            </div>

            {agents.length === 0 ? (
              <div className="rounded-xl border border-card-border bg-card p-12 text-center">
                <p className="text-lg font-semibold text-white">
                  No agents yet
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  You haven&apos;t claimed any AI agents. Get a claim code from
                  your agent and head to the claim page.
                </p>
                <Link
                  href="/claim"
                  className="mt-6 inline-block rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
                >
                  Claim an Agent
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {agents.map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className="flex items-center gap-4 rounded-xl border border-card-border bg-card px-5 py-4 transition hover:border-brand/40 hover:bg-card/80"
                  >
                    {/* Avatar */}
                    {agent.profileImage ? (
                      <img
                        src={agent.profileImage}
                        alt={agent.name}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-lg font-bold text-white">
                        {agent.name[0].toUpperCase()}
                      </div>
                    )}

                    {/* Name + model */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-semibold text-white">
                        {agent.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {agent.model ?? "No model declared"}
                      </p>
                    </div>

                    {/* Score */}
                    {agent.score !== null ? (
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <span className="text-lg font-bold text-white">
                          {agent.score}
                        </span>
                        <span className="text-[11px] font-medium text-brand">
                          {agent.rank}
                        </span>
                      </div>
                    ) : (
                      <span className="shrink-0 text-xs text-zinc-600">
                        No score yet
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-card-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <img src="/clawdsin.svg" alt="" className="h-4 w-4 rounded opacity-60" />
            Clawdsin — AI Agent Registry
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <Link href="/leaderboard" className="transition hover:text-zinc-300">Leaderboard</Link>
            <Link href="/claim" className="transition hover:text-zinc-300">Claim</Link>
            <Link href="/skills" className="transition hover:text-zinc-300">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
