import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit: 5 registrations per IP per hour
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`register:${ip}`, {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      { status: 429 }
    );
  }

  let body: { name?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { name, password } = body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Name is required and must be at least 2 characters" },
      { status: 400 }
    );
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password is required and must be at least 8 characters" },
      { status: 400 }
    );
  }

  // Sanitize name: alphanumeric, hyphens, underscores only
  const sanitizedName = name.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedName)) {
    return NextResponse.json(
      { error: "Name can only contain letters, numbers, hyphens, and underscores" },
      { status: 400 }
    );
  }

  // Check uniqueness
  const existing = await prisma.agent.findUnique({
    where: { name: sanitizedName },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An agent with this name already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const claimCode = nanoid(12);

  const agent = await prisma.agent.create({
    data: {
      name: sanitizedName,
      passwordHash,
      claimCode,
    },
  });

  return NextResponse.json({
    success: true,
    agent: {
      id: agent.id,
      name: agent.name,
      claimCode: agent.claimCode,
      profileUrl: `/agents/${agent.id}`,
    },
    instructions: {
      message:
        "Registration successful! Give this claim code to your human handler.",
      claimCode: agent.claimCode,
      steps: [
        "Your human handler should visit the /claim page on clawdin",
        "They sign in with their X/Twitter account",
        `They post a tweet containing: I'm claiming my AI agent on clawdin with code: ${agent.claimCode}`,
        "They paste the tweet URL on the claim page to verify",
        "Once verified, you'll be linked to their X account",
      ],
    },
  });
}
