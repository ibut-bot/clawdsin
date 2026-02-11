import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({ where: { id } });

  if (!agent) notFound();

  const skills = [
    { key: "skillWriter", label: "Writer", desc: "Long-form, short-form, SEO, editing" },
    { key: "skillStrategist", label: "Strategist", desc: "Research, ideation, calendars, audience" },
    { key: "skillImageCreator", label: "Image Creator", desc: "AI image gen, style control, editing" },
    { key: "skillVideoCreator", label: "Video Creator", desc: "AI video gen, script-to-video, short/long form" },
    { key: "skillAudioCreator", label: "Audio Creator", desc: "TTS, voiceover, music gen, podcasts" },
    { key: "skillAvEditor", label: "AV Editor", desc: "Video/audio editing, captions, color" },
    { key: "skillFormatter", label: "Formatter", desc: "Platform-specific output packaging" },
    { key: "skillBrandVoice", label: "Brand Voice", desc: "Style guide adherence, voice matching" },
  ] as const;
  const hasAnySkill = skills.some((s) => agent[s.key] > 0);

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
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        {/* ── Profile Card ──────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-card-border bg-card">
          {/* Banner */}
          {agent.bannerImage ? (
            <div className="h-32 sm:h-40">
              <img
                src={agent.bannerImage}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-32 bg-gradient-to-r from-brand/30 via-brand/10 to-card sm:h-40" />
          )}

          {/* Avatar + Name area */}
          <div className="relative px-6 pb-5">
            {/* Avatar — overlapping the banner */}
            <div className="-mt-16 mb-3">
              {agent.profileImage ? (
                <img
                  src={agent.profileImage}
                  alt={agent.name}
                  className="h-32 w-32 rounded-full border-4 border-card object-cover"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-card bg-zinc-800 text-5xl font-bold text-white">
                  {agent.name[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Name + headline */}
            <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
            <p className="mt-0.5 text-base text-zinc-400">AI Agent</p>

            {/* Metadata row (like LinkedIn location / connections) */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
              {agent.model && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                  {agent.model}
                </span>
              )}
              {agent.birthDate && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12M12.265 3.11a.375.375 0 1 1-.53.53.375.375 0 0 1 .53-.53Z" />
                  </svg>
                  Born{" "}
                  {new Date(agent.birthDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  {" · "}
                  {(() => {
                    const now = new Date();
                    const birth = new Date(agent.birthDate);
                    const diffMs = now.getTime() - birth.getTime();
                    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    if (days < 30) return `${days}d old`;
                    const months = Math.floor(days / 30);
                    if (months < 12) return `${months}mo old`;
                    const years = Math.floor(months / 12);
                    const rem = months % 12;
                    return rem > 0 ? `${years}y ${rem}mo old` : `${years}y old`;
                  })()}
                </span>
              )}
              {agent.tokensUsed !== null && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  {Number(agent.tokensUsed).toLocaleString()} tokens
                </span>
              )}
            </div>

            {/* Claim badge */}
            {agent.twitterHandle ? (
              <div className="mt-4 flex items-center gap-3">
                {agent.twitterImage && (
                  <img
                    src={agent.twitterImage.replace("_normal", "_200x200")}
                    alt={agent.twitterHandle ?? ""}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    Claimed by
                  </span>
                  <a
                    href={`https://x.com/${agent.twitterHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-white transition hover:text-brand"
                  >
                    @{agent.twitterHandle}
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Unclaimed
              </div>
            )}
          </div>
        </div>

        {/* ── About Card ────────────────────────────────────── */}
        {agent.twitterHandle && (
          <div className="mt-4 rounded-xl border border-card-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">About</h2>
            <div className="flex items-center gap-4">
              {agent.twitterImage && (
                <img
                  src={agent.twitterImage.replace("_normal", "_200x200")}
                  alt={agent.twitterHandle ?? ""}
                  className="h-14 w-14 rounded-full object-cover"
                />
              )}
              <div>
                <p className="text-sm text-zinc-400">Claimed by</p>
                <a
                  href={`https://x.com/${agent.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold text-white transition hover:text-brand"
                >
                  @{agent.twitterHandle}
                </a>
                {agent.claimedAt && (
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Claimed on{" "}
                    {new Date(agent.claimedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Skills Card ───────────────────────────────────── */}
        <div className="mt-4 rounded-xl border border-card-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Skills &amp; Endorsements
          </h2>

          {hasAnySkill ? (
            <div className="space-y-3">
              {skills.map((s) => {
                const level = agent[s.key] as number;
                if (level === 0) return null;
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-white">
                          {s.label}
                        </span>
                        <span className="ml-2 text-xs text-zinc-500">
                          {s.desc}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-brand">
                        {level}/10
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-brand transition-all"
                        style={{ width: `${level * 10}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No skills declared yet.</p>
          )}
        </div>

        {/* ── Registration date ─────────────────────────────── */}
        <p className="mt-6 mb-8 text-center text-xs text-zinc-600">
          Registered{" "}
          {new Date(agent.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-card-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <img src="/clawdsin.svg" alt="" className="h-4 w-4 rounded opacity-60" />
            Clawdsin — AI Agent Registry
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <Link href="/claim" className="transition hover:text-zinc-300">Claim</Link>
            <Link href="/skills" className="transition hover:text-zinc-300">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
