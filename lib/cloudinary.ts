import { v2 as cloudinary } from "cloudinary";

// ============================================================
// Cloudinary config
// ============================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

// ============================================================
// Folder constants
// ============================================================
export const CLOUDINARY_FOLDERS = {
  avatars: "urban_cruise/avatars",
  vehicles: "urban_cruise/vehicles",
  banners: "urban_cruise/banners",
  partners: "urban_cruise/partners",
  editor: "urban_cruise/editor",
  website: "urban_cruise/website",
  websiteVehicles: "urban_cruise/website/vehicles",
} as const;

export type CloudinaryFolder = keyof typeof CLOUDINARY_FOLDERS;

// ============================================================
// Upload result type
// ============================================================
export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  folder: string;
}

// ============================================================
// Upload buffer to Cloudinary
// ✅ FIX: Object-based transformation (not string)
// ============================================================
export async function uploadImage(
  buffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    transformation?: any;
  } = {}
): Promise<UploadResult> {
  const {
    folder = process.env.CLOUDINARY_UPLOAD_FOLDER || CLOUDINARY_FOLDERS.avatars,
    publicId,
    // ✅ Object array — Cloudinary SDK properly parses this
    transformation = [
      { crop: "fill", gravity: "face", width: 400, height: 400 },
      { quality: "auto", fetch_format: "auto" },
    ],
  } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        transformation,
        resource_type: "image",
        overwrite: true,
        invalidate: true,
      },
      (error, result) => {
        if (error || !result) {
          console.error("[cloudinary] upload error:", error);
          reject(error || new Error("Upload failed"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          folder,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

// ============================================================
// Delete image from Cloudinary by public_id
// ============================================================
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
    return result.result === "ok";
  } catch (err) {
    console.error("[cloudinary] deleteImage error:", err);
    return false;
  }
}

// ============================================================
// Extract public_id from a Cloudinary URL
// ============================================================
export function extractPublicId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[\w]+)?$/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}
