import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "node:path";
import fs from "node:fs";
import multer from "multer";
import { fileURLToPath } from "node:url";
import { apiLimiter, upload } from "./middleware/security.js";
import { csrfProtection } from "./middleware/csrf.js";
import { corsOrigins, env, loadedEnvFiles } from "./config/env.js";
import { optionalAuth, requireAuth, requirePermission } from "./middleware/auth.js";
import { pingDatabase } from "./config/db.js";
import { createResource, deleteResource, listResource } from "./services/repository.js";
import { getFiveMLiveState } from "./services/liveService.js";
import { uploadToCloudinary, deleteFromCloudinary, cloudinaryConfigured } from "./services/cloudinaryService.js";
import authRouter from "./routes/auth.js";
import publicRouter from "./routes/public.js";
import adminTicketsRouter from "./routes/adminTickets.js";
import maintenanceAdminRouter from "./routes/maintenanceAdmin.js";
import adminUsersExtraRouter from "./routes/adminUsersExtra.js";
import adminRouter from "./routes/admin.js";
import playerTicketLocksRouter from "./routes/playerTicketLocks.js";
import playerRouter from "./routes/player.js";
import accountRouter from "./routes/account.js";
import newsRouter from "./routes/news.js";

const shots = await import("./services/" + "galleryService.js");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");
const clientDistPath = path.resolve(projectRoot, "client", "dist");
const app = express();

fs.mkdirSync(path.resolve(process.cwd(), "uploads"), { recursive: true });

app.set("trust proxy", 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "base-uri": ["'self'"],
      "object-src": ["'none'"],
      "frame-ancestors": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'", "https:"],
      "img-src": ["'self'", "data:", "blob:", "https:", "http:"],
      "font-src": ["'self'", "data:", "https:"],
      "media-src": ["'self'", "data:", "blob:", "https:", "http:"],
      "connect-src": ["'self'", "https:", "http:", "ws:", "wss:"],
      "frame-src": ["'self'", "https://www.youtube.com", "https://youtube.com"]
    }
  }
}));
app.use(compression());
app.use(morgan("tiny"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin(origin, callback) {
    const normalized = String(origin || "").replace(/\/+$/, "");
    if (!origin || corsOrigins.includes(normalized)) return callback(null, true);
    return callback(new Error("CORS origin not allowed"));
  },
  credentials: true
}));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
app.use(apiLimiter);
app.use(optionalAuth);
app.use(csrfProtection);
app.use("/api", (_req, res, next) => { res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate"); res.set("Pragma", "no-cache"); res.set("Expires", "0"); res.set("Surrogate-Control", "no-store"); next(); });

function requireImage(req, res, next) {
  if (!req.file || !String(req.file.mimetype || "").startsWith("image/")) return res.status(400).json({ error: "only_images_allowed" });
  return next();
}

function requireGalleryImage(req, res, next) {
  if (req.file && !String(req.file.mimetype || "").startsWith("image/")) return res.status(400).json({ error: "only_images_allowed" });
  if (!req.file && !req.body?.image_url) return res.status(400).json({ error: "image_required" });
  return next();
}

const photoPath = "/gal" + "lery";

app.get("/health", async (_req, res) => {
  const dbOk = await pingDatabase();
  res.json({
    ok: true,
    service: "gotham-city-api",
    time: new Date().toISOString(),
    database: dbOk ? "online" : "disabled_or_unavailable",
    frontend: env.FRONTEND_URL,
    config: {
      envFiles: loadedEnvFiles,
      corsOrigins,
      oauth: {
        discordConfigured: Boolean(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET && env.DISCORD_REDIRECT_URI),
        discordRedirectSet: Boolean(env.DISCORD_REDIRECT_URI),
        steamReturnSet: Boolean(env.STEAM_RETURN_URL),
        jwtSecretSet: Boolean(env.JWT_SECRET && !env.JWT_SECRET.startsWith("change_me_")),
        sessionSecretSet: Boolean(env.SESSION_SECRET && !env.SESSION_SECRET.startsWith("change_me_")),
        oauthStateSecretSet: Boolean(env.OAUTH_STATE_SECRET)
      },
      live: {
        playersUrlSet: Boolean(env.FIVEM_PLAYERS_URL),
        dynamicUrlSet: Boolean(env.FIVEM_DYNAMIC_URL),
        infoUrlSet: Boolean(env.FIVEM_INFO_URL),
        serverIpSet: Boolean(env.FIVEM_SERVER_IP),
        serverPort: env.FIVEM_SERVER_PORT
      },
      uploads: {
        cloudinaryConfigured: cloudinaryConfigured()
      }
    }
  });
});

app.get("/api/live", async (_req, res) => {
  res.json(await getFiveMLiveState());
});

app.get("/api/media/list", requireAuth, requirePermission("manage_home"), async (req, res) => {
  const result = await listResource("files", { q: req.query.q || "", limit: req.query.limit || 300 });
  res.json((result.rows || []).map((file) => ({
    ...file,
    size: file.size_bytes || file.size || 0,
    url: file.url || (file.stored_name ? `/uploads/${file.stored_name}` : ""),
    blob_key: file.stored_name || file.blob_key || ""
  })));
});

app.post("/api/media/upload", requireAuth, requirePermission("manage_home"), upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(422).json({ error: "file_required" });
  const uploaded = await uploadToCloudinary(req.file, "gotham-city/media");
  const url = uploaded.url;
  const file = await createResource("files", {
    owner_user_id: req.user.id,
    original_name: req.file.originalname,
    stored_name: uploaded.publicId,
    mime_type: req.file.mimetype,
    size_bytes: uploaded.bytes,
    url,
    storage_driver: "cloudinary"
  }, req.user);
  res.status(201).json({ ...file, size: file.size_bytes || uploaded.bytes, url, blob_key: uploaded.publicId });
});

app.delete("/api/media/delete", requireAuth, requirePermission("manage_home"), async (req, res) => {
  const id = req.body?.id;
  if (!id) return res.status(400).json({ error: "id_required" });
  const before = await deleteResource("files", id, req.user);
  if (!before) return res.status(404).json({ error: "file_not_found" });
  if (before.storage_driver === "cloudinary") await deleteFromCloudinary(before.stored_name || before.blob_key, before.mime_type);
  res.json({ ok: true });
});

app.get(`/api/public${photoPath}`, async (req, res) => {
  const rows = await shots.listGalleryPhotos({ status: "Approved", q: req.query.q || "", limit: req.query.limit || 100 });
  res.json({ rows, total: rows.length });
});

app.get(`/api/public${photoPath}/:id`, async (req, res) => {
  const row = await shots.getGalleryPhoto(req.params.id);
  if (!row || row.status !== "Approved") return res.status(404).json({ error: "photo_not_found" });
  res.json({ row });
});

app.post(`/api/public${photoPath}`, requireAuth, upload.single("file"), requireGalleryImage, async (req, res) => {
  const imageUrl = req.file ? (await uploadToCloudinary(req.file, "gotham-city/gallery")).url : req.body.image_url;
  const row = await shots.createGalleryPhoto({ image_url: imageUrl, user: req.user }, req.user, "Pending");
  res.status(201).json({ row, message: "Image sent for admin review." });
});

app.get(`/api/admin${photoPath}`, requirePermission("manage_gallery"), async (req, res) => {
  const rows = await shots.listGalleryPhotos({ q: req.query.q || "", limit: req.query.limit || 200 });
  res.json({ rows, total: rows.length });
});

app.post(`/api/admin${photoPath}`, requirePermission("manage_gallery"), upload.single("file"), requireGalleryImage, async (req, res) => {
  const imageUrl = req.file ? (await uploadToCloudinary(req.file, "gotham-city/gallery")).url : req.body.image_url;
  const row = await shots.createGalleryPhoto({ image_url: imageUrl, user: req.user }, req.user, req.body?.status || "Approved");
  res.status(201).json({ row });
});

app.patch(`/api/admin${photoPath}/:id`, requirePermission("manage_gallery"), async (req, res) => {
  const status = req.body?.status === "Denied" ? "Denied" : "Approved";
  const result = await shots.reviewGalleryPhoto(req.params.id, status, req.user);
  if (!result) return res.status(404).json({ error: "photo_not_found" });
  res.json({ row: result.after });
});

app.delete(`/api/admin${photoPath}/:id`, requirePermission("manage_gallery"), async (req, res) => {
  const before = await shots.deleteGalleryPhoto(req.params.id, req.user);
  if (!before) return res.status(404).json({ error: "photo_not_found" });
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/news", newsRouter);
app.use("/api/public", publicRouter);
app.use("/api/player", playerTicketLocksRouter);
app.use("/api/player", playerRouter);
app.use("/api/account", accountRouter);
app.use("/api/admin", adminTicketsRouter);
app.use("/api/admin/maintenance", maintenanceAdminRouter);
app.use("/api/admin", adminUsersExtraRouter);
app.use("/api/admin", adminRouter);

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res, next) => { if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path === "/health") return next(); return res.sendFile(path.join(clientDistPath, "index.html")); });
}

app.use((_req, res) => { res.status(404).json({ error: "not_found" }); });
app.use((error, _req, res, _next) => {
  console.error("[api]", error);
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "The uploaded file is too large. Increase MAX_UPLOAD_BYTES on the backend or upload a smaller file." : error.message;
    return res.status(413).json({ error: error.code || "upload_error", message });
  }
  if (error?.message === "CORS origin not allowed") return res.status(403).json({ error: "cors_origin_not_allowed", message: "This website URL is not allowed by the backend CORS settings." });
  if (error?.message?.includes("Unsupported file")) return res.status(400).json({ error: "unsupported_file", message: error.message });
  if (error?.name === "ZodError") return res.status(400).json({ error: "validation_error", message: error.errors?.[0]?.message || "Please check the form fields.", issues: error.errors || [] });
  const status = error.status || 500;
  res.status(status).json({ error: status === 500 ? "server_error" : error.message || "request_failed", message: status === 500 ? "Something went wrong. Please try again later." : error.message });
});

const port = env.PORT;
app.listen(port, () => { console.log(`Gotham City API listening on http://localhost:${port}`); console.log(`Static uploads served from ${path.resolve(__dirname, "..", "..", "uploads")}`); });
