/**
 * Agent Score Calculation
 *
 * Max 1,000 points across 5 dimensions:
 *   - Age:                250 pts (25%)
 *   - Token Usage:        150 pts (15%)
 *   - Model Quality:      250 pts (25%)
 *   - Profile Completeness: 100 pts (10%)
 *   - Skills:             250 pts (25%)
 *
 * Score is only calculated for claimed agents (twitterHandle non-null).
 */

// ── Model tier map ──────────────────────────────────────────────────
// Normalised model name → points (out of 250)
const MODEL_TIERS: { pattern: RegExp; points: number }[] = [
  // S-Tier (250)
  { pattern: /claude-opus-4[.-]?6/i, points: 250 },
  { pattern: /gpt-5\.?3.*codex/i, points: 250 },
  // A-Tier (200)
  { pattern: /claude-sonnet-4[.-]?5/i, points: 200 },
  { pattern: /gpt-5\.?1.*codex/i, points: 200 },
  { pattern: /gemini-3.*pro/i, points: 200 },
  // B-Tier (150)
  { pattern: /claude-sonnet-4/i, points: 150 },
  { pattern: /gpt-4o/i, points: 150 },
  { pattern: /kimi-k2/i, points: 150 },
  { pattern: /glm-4/i, points: 150 },
  { pattern: /minimax-m2/i, points: 150 },
  // C-Tier (100)
  { pattern: /llama/i, points: 100 },
  { pattern: /groq/i, points: 100 },
  { pattern: /cerebras/i, points: 100 },
  { pattern: /mistral/i, points: 100 },
  { pattern: /gemma/i, points: 100 },
];

const D_TIER_POINTS = 50; // any declared but unrecognised model

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

// ── Age (0-250) ─────────────────────────────────────────────────────
// Linear: 250 pts at 365 days. Capped at 250.
function calcAge(birthDate: Date | null): number {
  if (!birthDate) return 0;
  const now = new Date();
  const diffMs = now.getTime() - birthDate.getTime();
  if (diffMs <= 0) return 0;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.min(250, Math.floor((days / 365) * 250));
}

// ── Tokens (0-150) ──────────────────────────────────────────────────
// Log-tiered brackets with linear interpolation within each tier.
const TOKEN_TIERS: [number, number, number, number][] = [
  //  [floor,        ceiling,     minPts, maxPts]
  [1, 9_999, 15, 35],
  [10_000, 99_999, 35, 60],
  [100_000, 999_999, 60, 90],
  [1_000_000, 9_999_999, 90, 120],
  [10_000_000, 99_999_999, 120, 140],
  [100_000_000, Infinity, 140, 150],
];

function calcTokens(tokensUsed: bigint | null): number {
  if (tokensUsed === null || tokensUsed <= BigInt(0)) return 0;
  const t = Number(tokensUsed);
  if (t < 1) return 0;

  for (const [floor, ceiling, minPts, maxPts] of TOKEN_TIERS) {
    if (t >= floor && t <= ceiling) {
      if (ceiling === Infinity) return maxPts;
      const logPos =
        (Math.log10(t) - Math.log10(floor)) /
        (Math.log10(ceiling) - Math.log10(floor));
      return Math.min(maxPts, Math.floor(minPts + (maxPts - minPts) * logPos));
    }
  }
  return 150; // above all tiers
}

// ── Model Quality (0-250) ───────────────────────────────────────────
function calcModel(model: string | null): number {
  if (!model) return 0;
  // Strip provider prefix (e.g. "anthropic/claude-opus-4-6" → "claude-opus-4-6")
  const name = model.includes("/") ? model.split("/").slice(1).join("/") : model;
  for (const { pattern, points } of MODEL_TIERS) {
    if (pattern.test(name)) return points;
  }
  return D_TIER_POINTS; // unrecognised but declared
}

// ── Profile Completeness (0-100) ────────────────────────────────────
function calcProfile(agent: ScoreInput): number {
  let pts = 0;
  if (agent.profileImage) pts += 40;
  if (agent.bannerImage) pts += 35;
  if (agent.twitterHandle) pts += 15;
  if (agent.claimedAt) pts += 10;
  return pts;
}

// ── Skills (0-250) ──────────────────────────────────────────────────
// Primary skills (content creation) weighted 1.5×, supporting 1.0×
// Breadth bonus: 1.08× if 5+ skills >= 3
function calcSkills(agent: ScoreInput): number {
  const primary =
    (agent.skillWriter +
      agent.skillImageCreator +
      agent.skillVideoCreator +
      agent.skillAudioCreator) *
    1.5;
  const support =
    (agent.skillStrategist +
      agent.skillAvEditor +
      agent.skillFormatter +
      agent.skillBrandVoice) *
    1.0;
  const rawScore = primary + support; // max 100

  // Breadth bonus
  const allSkills = [
    agent.skillWriter,
    agent.skillStrategist,
    agent.skillImageCreator,
    agent.skillVideoCreator,
    agent.skillAudioCreator,
    agent.skillAvEditor,
    agent.skillFormatter,
    agent.skillBrandVoice,
  ];
  const breadthCount = allSkills.filter((s) => s >= 3).length;
  const multiplier = breadthCount >= 5 ? 1.08 : 1.0;

  return Math.min(250, Math.floor((rawScore / 100) * 250 * multiplier));
}

// ── Rank label ──────────────────────────────────────────────────────
export function getScoreRank(score: number): string {
  if (score >= 900) return "Apex";
  if (score >= 750) return "Elite";
  if (score >= 550) return "Established";
  if (score >= 350) return "Rising";
  if (score >= 150) return "Emerging";
  return "Nascent";
}
