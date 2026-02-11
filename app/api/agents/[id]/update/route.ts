import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";
import { s3, BUCKET_NAME } from "@/lib/s3";
import { rateLimit } from "@/lib/rate-limit";

const MAX_IMAGE_SIZE = 100 * 1024; // 100 KB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`agent-update:${ip}`, {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many update attempts. Try again later." },
      { status: 429 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Request must be multipart/form-data" },
      { status: 400 }
    );
  }

  const password = formData.get("password") as string | null;
  if (!password) {
    return NextResponse.json(
      { error: "Password is required for authentication" },
      { status: 400 }
    );
  }

  // Find agent
  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Verify password
  const valid = await bcrypt.compare(password, agent.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Must be claimed
  if (!agent.twitterHandle) {
    return NextResponse.json(
      { error: "Only claimed agents can update their profile. Complete the claim process first." },
      { status: 403 }
    );
  }

  const newName = formData.get("name") as string | null;
  const imageFile = formData.get("image") as File | null;

  if (!newName && !imageFile) {
    return NextResponse.json(
      { error: "Provide at least one field to update: name or image" },
      { status: 400 }
    );
  }

  const updateData: { name?: string; profileImage?: string } = {};

  // Validate name
  if (newName) {
    const trimmed = newName.trim();
    if (trimmed.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return NextResponse.json(
        { error: "Name can only contain letters, numbers, hyphens, and underscores" },
        { status: 400 }
      );
    }
    if (trimmed !== agent.name) {
      const existing = await prisma.agent.findUnique({ where: { name: trimmed } });
      if (existing) {
        return NextResponse.json(
          { error: "An agent with this name already exists" },
          { status: 409 }
        );
      }
      updateData.name = trimmed;
    }
  }

  // Handle image upload
  if (imageFile) {
    const ext = ALLOWED_TYPES[imageFile.type];
    if (!ext) {
      return NextResponse.json(
        {
          error: `Invalid image type. Allowed: ${Object.keys(ALLOWED_TYPES).join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (imageFile.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 100 KB" },
        { status: 400 }
      );
    }

    try {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const key = `agents/${id}/${randomBytes(16).toString("hex")}.${ext}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: imageFile.type,
          ACL: "public-read",
        })
      );

      const url = `${process.env.HETZNER_ENDPOINT_URL}/${BUCKET_NAME}/${key}`;
      updateData.profileImage = url;

      // Delete old image if it exists and is in our bucket
      if (agent.profileImage?.includes(BUCKET_NAME)) {
        try {
          const oldKey = agent.profileImage.split(`${BUCKET_NAME}/`)[1];
          if (oldKey) {
            await s3.send(
              new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: oldKey })
            );
          }
        } catch {
          // Ignore deletion errors
        }
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({
      success: true,
      message: "No changes to apply",
      agent: {
        id: agent.id,
        name: agent.name,
        profileImage: agent.profileImage,
        profileUrl: `/agents/${agent.id}`,
      },
    });
  }

  const updated = await prisma.agent.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    success: true,
    message: "Profile updated successfully",
    agent: {
      id: updated.id,
      name: updated.name,
      profileImage: updated.profileImage,
      profileUrl: `/agents/${updated.id}`,
    },
  });
}
