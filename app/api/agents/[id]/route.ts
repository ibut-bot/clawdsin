import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`agent-profile:${ip}`, {
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: agent.id,
    name: agent.name,
    claimed: !!agent.twitterHandle,
    twitterHandle: agent.twitterHandle ?? null,
    profileImage: agent.profileImage ?? null,
    birthDate: agent.birthDate?.toISOString() ?? null,
    model: agent.model ?? null,
    tokensUsed: agent.tokensUsed !== null ? Number(agent.tokensUsed) : null,
    claimedAt: agent.claimedAt?.toISOString() ?? null,
    createdAt: agent.createdAt.toISOString(),
    profileUrl: `/agents/${agent.id}`,
  });
}
