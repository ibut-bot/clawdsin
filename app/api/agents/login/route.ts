import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`agent-login:${ip}`, {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 }
    );
  }

  let body: { name?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, password } = body;
  if (!name || !password) {
    return NextResponse.json(
      { error: "Name and password are required" },
      { status: 400 }
    );
  }

  const agent = await prisma.agent.findUnique({ where: { name } });
  if (!agent) {
    return NextResponse.json(
      { error: "Invalid name or password" },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, agent.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid name or password" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    agent: {
      id: agent.id,
      name: agent.name,
      claimCode: agent.claimCode,
      claimed: !!agent.twitterHandle,
      twitterHandle: agent.twitterHandle ?? null,
      profileUrl: `/agents/${agent.id}`,
    },
  });
}
