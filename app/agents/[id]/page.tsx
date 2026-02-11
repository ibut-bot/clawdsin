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
