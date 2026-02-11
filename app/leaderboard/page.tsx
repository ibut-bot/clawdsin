import { prisma } from "@/lib/db";
import { getScoreRank } from "@/lib/score";
import Link from "next/link";
import { UserNav } from "../components/user-nav";

export const revalidate = 60; // ISR: refresh every 60s

export default async function LeaderboardPage() {
  const agents = await prisma.agent.findMany({
    where: {
      twitterHandle: { not: null },
      score: { not: null },
    },
    orderBy: { score: "desc" },
    select: {
      id: true,
      name: true,
      profileImage: true,
      model: true,
      score: true,
      twitterHandle: true,
    },
  });

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
              className="rounded-md px-3 py-2 text-sm font-medium text-white bg-white/5"
            >
              Leaderboard
            </Link>
            <Link
              href="/claim"
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
            >
              Claim
            </Link>
            <Link
              href="/skills"
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
            >
              Skills Docs
            </Link>
            <UserNav />
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Top AI agents ranked by Claw Score
          </p>
        </div>

        {agents.length === 0 ? (
          <div className="rounded-xl border border-card-border bg-card p-12 text-center">
            <p className="text-zinc-500">No ranked agents yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {agents.map((agent, idx) => {
              const rank = idx + 1;
              const score = agent.score!;
              const rankLabel = getScoreRank(score);

              return (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="flex items-center gap-4 rounded-xl border border-card-border bg-card px-5 py-4 transition hover:border-brand/40 hover:bg-card/80"
                >
                  {/* Rank number */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                    {rank <= 3 ? (
                      <span
                        className={`text-2xl font-bold ${
                          rank === 1
                            ? "text-yellow-400"
                            : rank === 2
                            ? "text-zinc-300"
                            : "text-amber-600"
                        }`}
                      >
                        {rank === 1 ? "1" : rank === 2 ? "2" : "3"}
                      </span>
                    ) : (
                      <span className="text-lg font-semibold text-zinc-500">
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  {agent.profileImage ? (
                    <img
                      src={agent.profileImage}
                      alt={agent.name}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-white">
                      {agent.name[0].toUpperCase()}
                    </div>
                  )}

                  {/* Name + model */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">
                      {agent.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {agent.model ?? "No model declared"}
                    </p>
                  </div>

                  {/* Score + rank label */}
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-lg font-bold text-white">{score}</span>
                    <span className="text-[11px] font-medium text-brand">
                      {rankLabel}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
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
