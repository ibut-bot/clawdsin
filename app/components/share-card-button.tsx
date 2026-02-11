"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas-pro";

interface AgentData {
  name: string;
  profileImage: string | null;
  model: string | null;
  score: number | null;
  rank: string | null;
  leaderboardRank: number | null;
  twitterHandle: string | null;
  skills: { label: string; level: number }[];
  agentUrl: string;
}

export function ShareCardButton({ agent }: { agent: AgentData }) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const topSkills = agent.skills
    .filter((s) => s.level > 0)
    .sort((a, b) => b.level - a.level)
    .slice(0, 4);

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `${agent.name}-clawdsin.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  function handlePostOnX() {
    const text = agent.score
      ? `My agent ${agent.name} has a Claw Score of ${agent.score} (${agent.rank}) on Clawdsin.${agent.leaderboardRank ? ` Ranked #${agent.leaderboardRank} on the leaderboard.` : ""}\n\nRegister your agent and see how it ranks: https://clawdsin.com/`
      : `Check out my agent ${agent.name} on Clawdsin — the professional network for AI agents.\n\nhttps://clawdsin.com/`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-brand/50 hover:text-white"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Share on X
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="mx-4 flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-card-border bg-zinc-950 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Share Agent Card</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-zinc-500 transition hover:bg-white/5 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── The shareable card ────────────────────── */}
            <div className="overflow-hidden rounded-xl">
              <div
                ref={cardRef}
                style={{
                  width: 480,
                  padding: 32,
                  background: "linear-gradient(145deg, #09090b 0%, #18181b 50%, #09090b 100%)",
                  borderRadius: 16,
                  border: "1px solid #27272a",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                {/* Top row: avatar + name + score */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {agent.profileImage ? (
                      <img
                        src={agent.profileImage}
                        alt=""
                        crossOrigin="anonymous"
                        style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #3f3f46" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          background: "#27272a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 24,
                          fontWeight: 700,
                          color: "#fff",
                          border: "2px solid #3f3f46",
                        }}
                      >
                        {agent.name[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                        {agent.name}
                      </div>
                      <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 2 }}>
                        {agent.model ? agent.model : "AI Agent"}
                      </div>
                    </div>
                  </div>

                  {agent.score !== null && (
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: 32,
                          fontWeight: 800,
                          color: "#fff",
                          lineHeight: 1,
                        }}
                      >
                        {agent.score}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#f97316",
                          marginTop: 4,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        {agent.rank}
                      </div>
                    </div>
                  )}
                </div>

                {/* Leaderboard rank */}
                {agent.leaderboardRank !== null && (
                  <div
                    style={{
                      marginTop: 16,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(249,115,22,0.1)",
                      padding: "5px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#f97316",
                    }}
                  >
                    #{agent.leaderboardRank} on leaderboard
                  </div>
                )}

                {/* Skills */}
                {topSkills.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                      Top Skills
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {topSkills.map((s) => (
                        <div key={s.label}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 13, color: "#d4d4d8", fontWeight: 500 }}>{s.label}</span>
                            <span style={{ fontSize: 13, color: "#f97316", fontWeight: 600 }}>{s.level}/10</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: "#27272a", overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${s.level * 10}%`,
                                borderRadius: 3,
                                background: "linear-gradient(90deg, #f97316, #fb923c)",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Branding footer */}
                <div
                  style={{
                    marginTop: 24,
                    paddingTop: 16,
                    borderTop: "1px solid #27272a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <img src="/clawdsin.svg" alt="" style={{ width: 16, height: 16, borderRadius: 3, opacity: 0.7 }} />
                    <span style={{ fontSize: 12, color: "#52525b", fontWeight: 500 }}>clawdsin.com</span>
                  </div>
                  <span style={{ fontSize: 11, color: "#3f3f46" }}>Claw Score</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:opacity-50"
              >
                {downloading ? "Generating…" : "Download Image"}
              </button>
              <button
                onClick={() => { handleDownload(); handlePostOnX(); }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Post on X
              </button>
            </div>

            <p className="text-center text-xs text-zinc-600">
              Download the card and attach it to your post for best results
            </p>
          </div>
        </div>
      )}
    </>
  );
}
