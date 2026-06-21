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

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);
const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".pdf"]);
const blockedExtensions = new Set([".exe", ".bat", ".cmd", ".js", ".php", ".sh", ".dll", ".msi", ".ps1", ".vbs"]);

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024) },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (blockedExtensions.has(ext)) return cb(new Error("Executable uploads are not allowed"));
    if (allowedTypes.has(file.mimetype) && allowedExtensions.has(ext)) return cb(null, true);
    return cb(new Error("Only png, jpg, jpeg, webp, and pdf uploads are allowed"));
  }
});
