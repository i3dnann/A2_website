import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 180,
  standardHeaders: true,
  legacyHeaders: false
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false
});

const fileExtensions = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif",
  ".mp3", ".wav", ".ogg", ".oga", ".m4a", ".aac", ".flac",
  ".mp4", ".m4v", ".webm", ".mov",
  ".pdf", ".txt", ".json"
]);

const mimeTypes = new Set([
  "image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/avif",
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/mp4", "audio/aac", "audio/flac",
  "video/mp4", "video/x-m4v", "video/webm", "video/quicktime",
  "application/pdf", "text/plain", "application/json"
]);

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES || 512 * 1024 * 1024) },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!fileExtensions.has(ext)) return cb(new Error("Unsupported file extension."));
    if (!mimeTypes.has(file.mimetype)) return cb(new Error("Unsupported file MIME type."));
    return cb(null, true);
  }
});
