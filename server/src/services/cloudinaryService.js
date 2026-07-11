import fs from "node:fs/promises";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function cloudinaryConfigured() {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

export async function uploadToCloudinary(file, folder = "gotham-city/uploads") {
  if (!file?.path) throw Object.assign(new Error("file_required"), { status: 422 });

  try {
    if (!cloudinaryConfigured()) throw Object.assign(new Error("cloudinary_not_configured"), { status: 503 });
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      bytes: result.bytes || file.size || 0,
      format: result.format || "",
    };
  } finally {
    await fs.unlink(file.path).catch(() => {});
  }
}

export async function deleteFromCloudinary(publicId, mimeType = "") {
  if (!publicId || !cloudinaryConfigured()) return;
  const resourceType = String(mimeType).startsWith("video/") ? "video" : String(mimeType).startsWith("audio/") ? "video" : "image";
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
}
