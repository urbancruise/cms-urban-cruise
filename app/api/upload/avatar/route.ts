import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import {
  uploadImage,
  deleteImage,
  extractPublicId,
  CLOUDINARY_FOLDERS,
} from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

async function requireAuth(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) throw { status: 401, message: "Not authenticated" };

  return jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as {
    userId: number;
    role: string;
    username?: string;
  };
}

// ============================================================
// POST — upload avatar to urban_cruise/avatars
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 20 });
    if (!rl.ok) return rl.response!;

    await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const oldPublicId = formData.get("oldPublicId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Upload to urban_cruise/avatars
    const result = await uploadImage(buffer, {
      folder: CLOUDINARY_FOLDERS.avatars,
    });

    if (oldPublicId) {
      await deleteImage(oldPublicId);
    }

    return NextResponse.json(
      {
        success: true,
        url: result.url,
        publicId: result.publicId,
        folder: result.folder,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Avatar upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}

// ============================================================
// DELETE — remove image from Cloudinary
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 30 });
    if (!rl.ok) return rl.response!;

    await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const publicId = searchParams.get("publicId");

    const id = publicId || extractPublicId(url);
    if (!id) {
      return NextResponse.json({ error: "publicId or url required" }, { status: 400 });
    }

    const ok = await deleteImage(id);

    return NextResponse.json({
      success: ok,
      message: ok ? "Image deleted" : "Failed to delete image",
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Delete avatar error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
