import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getScoreRank } from "@/lib/score";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.username) {
    return NextResponse.json(
      { error: "Sign in with X to view your agents" },
      { status: 401 }
    );
  }

  const agents = await prisma.agent.findMany({
    where: { twitterHandle: session.username },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      profileImage: true,
      model: true,
      score: true,
    },
  });

  return NextResponse.json({
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      profileImage: a.profileImage,
      model: a.model,
      score: a.score,
      rank: a.score !== null ? getScoreRank(a.score) : null,
    })),
  });
}
