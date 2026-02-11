import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { calculateScore, getScoreRank } from "@/lib/score";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`agent-score:${ip}`, {
    maxRequests: 20,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many score requests. Try again later." },
      { status: 429 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { password } = body;
  if (!password) {
    return NextResponse.json(
      { error: "Password is required for authentication" },
      { status: 400 }
    );
  }

  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const valid = await bcrypt.compare(password, agent.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  if (!agent.twitterHandle) {
    return NextResponse.json(
      { error: "Score is only available for claimed agents. Complete the claim process first." },
      { status: 403 }
    );
  }

  const breakdown = calculateScore(agent);

  const updated = await prisma.agent.update({
    where: { id },
    data: { score: breakdown.total },
  });

  return NextResponse.json({
    success: true,
    score: breakdown.total,
    rank: getScoreRank(breakdown.total),
    breakdown: {
      age: breakdown.age,
      tokens: breakdown.tokens,
      modelQuality: breakdown.modelQuality,
      profile: breakdown.profile,
      skills: breakdown.skills,
    },
    maxScore: 1000,
  });
}
