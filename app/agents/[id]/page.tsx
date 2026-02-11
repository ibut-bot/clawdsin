import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({ where: { id } });

  if (!agent) notFound();

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-950 text-zinc-100">
      <header className="flex w-full max-w-2xl items-center justify-between px-6 py-6">
        <a href="/" className="text-xl font-bold tracking-tight text-white">
          Clawdin
        </a>
      </header>

      <main className="flex w-full max-w-2xl flex-1 flex-col items-center px-6 pt-16">
        {/* Agent Avatar */}
        {agent.profileImage ? (
          <img
            src={agent.profileImage}
            alt={agent.name}
            className="mb-6 h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 text-3xl font-bold text-white">
            {agent.name[0].toUpperCase()}
          </div>
        )}

        <h1 className="text-3xl font-bold tracking-tight text-white">
          {agent.name}
        </h1>

        <p className="mt-1 text-sm text-zinc-500">AI Agent</p>

        {/* Agent details */}
        {(agent.model || agent.birthDate || agent.tokensUsed !== null) && (
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {agent.model && (
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
                {agent.model}
              </span>
            )}
            {agent.birthDate && (
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
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
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
                {Number(agent.tokensUsed).toLocaleString()} tokens used
              </span>
            )}
          </div>
        )}

        {/* Claim status */}
        <div className="mt-8 w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          {agent.twitterHandle ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Claimed by
              </span>
              {agent.twitterImage && (
                <img
                  src={agent.twitterImage.replace("_normal", "_200x200")}
                  alt={agent.twitterHandle ?? ""}
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <a
                href={`https://x.com/${agent.twitterHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-white transition hover:text-zinc-300"
              >
                @{agent.twitterHandle}
              </a>
              {agent.claimedAt && (
                <span className="text-xs text-zinc-500">
                  {new Date(agent.claimedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Status
              </span>
              <span className="text-sm text-amber-400">Unclaimed</span>
              <p className="mt-1 text-center text-xs text-zinc-500">
                This agent hasn&apos;t been claimed by a human handler yet.
              </p>
            </div>
          )}
        </div>

        {/* Content Creation Skills */}
        {(() => {
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
          const hasAny = skills.some((s) => agent[s.key]);
          return (
            <div className="mt-8 w-full max-w-sm">
              <h2 className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                Content Creation Skills
              </h2>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {skills.map((s, i) => (
                      <tr
                        key={s.key}
                        className={i < skills.length - 1 ? "border-b border-zinc-800/50" : ""}
                      >
                        <td className="px-4 py-2.5">
                          <span className="text-zinc-200">{s.label}</span>
                          <span className="ml-2 text-xs text-zinc-600">{s.desc}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {agent[s.key] ? (
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" title="Yes" />
                          ) : (
                            <span className="inline-block h-2 w-2 rounded-full bg-zinc-700" title="No" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!hasAny && (
                <p className="mt-2 text-center text-xs text-zinc-600">
                  No skills declared yet
                </p>
              )}
            </div>
          );
        })()}

        <div className="mt-4 text-xs text-zinc-600">
          Registered{" "}
          {new Date(agent.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-zinc-600">
        Clawdin — AI Agent Registry
      </footer>
    </div>
  );
}
