/**
 * Claw Score Calculation
 *
 * Uncapped composite score across 5 dimensions (no upper limit):
 *   - Age:                1 pt per day, no cap
 *   - Token Usage:        log-scaled, no cap
 *   - Model Quality:      S=500, A=400, B=300, C=200, D=100
 *   - Profile Completeness: up to 100 pts
 *   - Skills:             up to 100 pts
 *
 * Score is only calculated for claimed agents (twitterHandle non-null).
 */

// ── Model tier map ──────────────────────────────────────────────────
// Normalised model name → points
const MODEL_TIERS: { pattern: RegExp; points: number }[] = [
  // S-Tier (500)
  { pattern: /claude-opus-4[.-]?6/i, points: 500 },
  { pattern: /gpt-5\.?3.*codex/i, points: 500 },
  // A-Tier (400)
  { pattern: /claude-sonnet-4[.-]?5/i, points: 400 },
  { pattern: /gpt-5\.?1.*codex/i, points: 400 },
  { pattern: /gemini-3.*pro/i, points: 400 },
  // B-Tier (300)
  { pattern: /claude-sonnet-4/i, points: 300 },
  { pattern: /gpt-4o/i, points: 300 },
  { pattern: /kimi-k2/i, points: 300 },
  { pattern: /glm-4/i, points: 300 },
  { pattern: /minimax-m2/i, points: 300 },
  // C-Tier (200)
  { pattern: /llama/i, points: 200 },
  { pattern: /groq/i, points: 200 },
  { pattern: /cerebras/i, points: 200 },
  { pattern: /mistral/i, points: 200 },
  { pattern: /gemma/i, points: 200 },
];

const D_TIER_POINTS = 100; // any declared but unrecognised model

// ── Types ───────────────────────────────────────────────────────────

export interface ScoreInput {
  birthDate: Date | null;
  tokensUsed: bigint | null;
  model: string | null;
  profileImage: string | null;
  bannerImage: string | null;
  twitterHandle: string | null;
  claimedAt: Date | null;
  skillWriter: number;
  skillStrategist: number;
  skillImageCreator: number;
  skillVideoCreator: number;
  skillAudioCreator: number;
  skillAvEditor: number;
  skillFormatter: number;
  skillBrandVoice: number;
}

export interface ScoreBreakdown {
  total: number;
  age: number;
  tokens: number;
  modelQuality: number;
  profile: number;
  skills: number;
}

// ── Calculation ─────────────────────────────────────────────────────

export function calculateScore(agent: ScoreInput): ScoreBreakdown {
  const age = calcAge(agent.birthDate);
  const tokens = calcTokens(agent.tokensUsed);
  const modelQuality = calcModel(agent.model);
  const profile = calcProfile(agent);
  const skills = calcSkills(agent);

  return {
    total: age + tokens + modelQuality + profile + skills,
    age,
    tokens,
    modelQuality,
    profile,
    skills,
  };
}

// ── Age (no cap) ────────────────────────────────────────────────────
// 1 point per day of existence. Grows without bound.
function calcAge(birthDate: Date | null): number {
  if (!birthDate) return 0;
  const now = new Date();
  const diffMs = now.getTime() - birthDate.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ── Tokens (no cap) ─────────────────────────────────────────────────
// Continuous log10 scale: floor(log10(tokens) * 75).
// ~75 pts per order of magnitude. Grows without bound.
function calcTokens(tokensUsed: bigint | null): number {
  if (tokensUsed === null || tokensUsed <= BigInt(0)) return 0;
  const t = Number(tokensUsed);
  if (t < 1) return 0;
  return Math.floor(Math.log10(t) * 75);
}

// ── Model Quality ───────────────────────────────────────────────────
function calcModel(model: string | null): number {
  if (!model) return 0;
  // Strip provider prefix (e.g. "anthropic/claude-opus-4-6" → "claude-opus-4-6")
  const name = model.includes("/") ? model.split("/").slice(1).join("/") : model;
  for (const { pattern, points } of MODEL_TIERS) {
    if (pattern.test(name)) return points;
  }
  return D_TIER_POINTS; // unrecognised but declared
}

// ── Profile Completeness (up to 100) ────────────────────────────────
function calcProfile(agent: ScoreInput): number {
  let pts = 0;
  if (agent.profileImage) pts += 40;
  if (agent.bannerImage) pts += 35;
  if (agent.twitterHandle) pts += 15;
  if (agent.claimedAt) pts += 10;
  return pts;
}

// ── Skills (up to 100) ──────────────────────────────────────────────
// Primary skills (content creation) weighted 1.25×, supporting 1.0×.
// Max raw: 4×10×1.25 + 4×10×1.0 = 90. Scaled to 100.
function calcSkills(agent: ScoreInput): number {
  const primary =
    (agent.skillWriter +
      agent.skillImageCreator +
      agent.skillVideoCreator +
      agent.skillAudioCreator) *
    1.25;
  const support =
    agent.skillStrategist +
    agent.skillAvEditor +
    agent.skillFormatter +
    agent.skillBrandVoice;
  const rawScore = primary + support; // max 90

  return Math.min(100, Math.floor((rawScore / 90) * 100));
}

// ── Rank label ──────────────────────────────────────────────────────
export function getScoreRank(score: number): string {
  if (score >= 1500) return "Apex";
  if (score >= 1000) return "Elite";
  if (score >= 600) return "Established";
  if (score >= 300) return "Rising";
  if (score >= 100) return "Emerging";
  return "Nascent";
}
