import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function cloudinaryConfigured() {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET,
  );
}

function cloudinaryError(error) {
  const status = Number(
    error?.http_code || error?.statusCode || error?.status || 502,
  );
  const message = String(error?.message || "Cloudinary upload failed.");
  return Object.assign(new Error(message), {
    status: status >= 400 && status < 600 ? status : 502,
    code: error?.code || "cloudinary_upload_failed",
  });
}

async function uploadStream(filePath, options) {
  let result;
  const uploadPromise = new Promise((resolve, reject) => {
    const cloudinaryStream = cloudinary.uploader.upload_stream(
      options,
      (error, uploaded) => {
        if (error) return reject(error);
        result = uploaded;
        return resolve(uploaded);
      },
    );
    pipeline(createReadStream(filePath), cloudinaryStream).catch(reject);
  });

  await uploadPromise;
  return result;
}

export async function uploadToCloudinary(file, folder = "gotham-city/uploads") {
  if (!file?.path)
    throw Object.assign(new Error("file_required"), { status: 422 });

  try {
    if (!cloudinaryConfigured())
      throw Object.assign(new Error("cloudinary_not_configured"), {
        status: 503,
      });
    const result = await uploadStream(file.path, {
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
  } catch (error) {
    if (error?.message === "cloudinary_not_configured") throw error;
    throw cloudinaryError(error);
  } finally {
    await fs.unlink(file.path).catch(() => {});
  }
}

export async function uploadBufferToCloudinary(buffer, options = {}) {
  if (!Buffer.isBuffer(buffer) || !buffer.length)
    throw Object.assign(new Error("file_required"), { status: 422 });
  if (!cloudinaryConfigured())
    throw Object.assign(new Error("cloudinary_not_configured"), {
      status: 503,
    });
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || "gotham-city/contracts",
          public_id: options.publicId,
          resource_type: options.resourceType || "raw",
          overwrite: Boolean(options.overwrite),
          unique_filename: !options.publicId,
          use_filename: false,
        },
        (error, uploaded) => (error ? reject(error) : resolve(uploaded)),
      );
      stream.end(buffer);
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes || buffer.length,
      format: result.format || "",
    };
  } catch (error) {
    throw cloudinaryError(error);
  }
}

export async function deleteFromCloudinary(publicId, mimeType = "") {
  if (!publicId || !cloudinaryConfigured()) return;
  const resourceType = String(mimeType).startsWith("video/")
    ? "video"
    : String(mimeType).startsWith("audio/")
      ? "video"
      : "image";
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
}
