import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import {
  uploadImage,
  deleteImage,
  extractPublicId,
  CLOUDINARY_FOLDERS,
} from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";

// 300 KB max
const MAX_FILE_SIZE = 300 * 1024;
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
// POST — upload website image (max 300KB)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 40 });
    if (!rl.ok) return rl.response!;

    await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const oldPublicId = formData.get("oldPublicId") as string | null;
    const scope = (formData.get("scope") as string) || "general";
    // scope: 'hero' | 'about' | 'vehicle' | 'partner' | 'editor' | 'general'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed: JPG, PNG, WEBP`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is 300 KB. Your file is ${Math.round(
            file.size / 1024
          )} KB.`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Choose folder based on scope
    const folderByScope: Record<string, string> = {
      hero: CLOUDINARY_FOLDERS.banners,
      about: CLOUDINARY_FOLDERS.website,
      vehicle: CLOUDINARY_FOLDERS.websiteVehicles,
      partner: CLOUDINARY_FOLDERS.partners,
      editor: CLOUDINARY_FOLDERS.editor,
      general: CLOUDINARY_FOLDERS.website,
    };
    const folder = folderByScope[scope] || CLOUDINARY_FOLDERS.website;

    // Do NOT apply a fixed crop/size transformation
    // (image dimensions vary widely across website content).
    // Just compress and auto-convert.
    const result = await uploadImage(buffer, {
      folder,
      transformation: [{ quality: "auto:good", fetch_format: "auto" }],
    });

    // Clean up old image if replacing
    if (oldPublicId) {
      await deleteImage(oldPublicId).catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        url: result.url,
        publicId: result.publicId,
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
    console.error("[upload/website-image] error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}

// ============================================================
// DELETE — remove an uploaded image
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 60 });
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
    console.error("[upload/website-image DELETE] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
