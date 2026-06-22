import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "node:path";
import fs from "node:fs";
import cron from "node-cron";
import { fileURLToPath } from "node:url";
import { apiLimiter } from "./middleware/security.js";
import { csrfProtection } from "./middleware/csrf.js";
import { corsOrigins, env } from "./config/env.js";
import { optionalAuth } from "./middleware/auth.js";
import { pingDatabase } from "./config/db.js";
import { getSettings } from "./services/repository.js";
import { checkAllStreamers } from "./services/streamerService.js";
import authRouter from "./routes/auth.js";
import publicRouter from "./routes/public.js";
import adminTicketsRouter from "./routes/adminTickets.js";
import maintenanceAdminRouter from "./routes/maintenanceAdmin.js";
import adminRouter from "./routes/admin.js";
import playerTicketLocksRouter from "./routes/playerTicketLocks.js";
import playerRouter from "./routes/player.js";
import accountRouter from "./routes/account.js";
import kickRouter from "./routes/kick.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");
const clientDistPath = path.resolve(projectRoot, "client", "dist");
const app = express();

fs.mkdirSync(path.resolve(process.cwd(), "uploads"), { recursive: true });

app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
  })
);
app.use(compression());
app.use(morgan("tiny"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin) || origin === env.FRONTEND_URL) return callback(null, true);
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true
  })
);
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
app.use(apiLimiter);
app.use(optionalAuth);
app.use(csrfProtection);
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

app.get("/health", async (_req, res) => {
  const dbOk = await pingDatabase();
  res.json({
    ok: true,
    service: "gotham-city-api",
    time: new Date().toISOString(),
    database: dbOk ? "online" : "disabled_or_unavailable",
    frontend: env.FRONTEND_URL
  });
});

app.use("/api/auth", authRouter);
app.use("/api/kick", kickRouter);
app.use("/api/public", publicRouter);
app.use("/api/player", playerTicketLocksRouter);
app.use("/api/player", playerRouter);
app.use("/api/account", accountRouter);
app.use("/api/admin", adminTicketsRouter);
app.use("/api/admin/maintenance", maintenanceAdminRouter);
app.use("/api/admin", adminRouter);

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path === "/health") return next();
    return res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});

app.use((error, _req, res, _next) => {
  console.error("[api]", error);
  if (error?.name === "ZodError") {
    return res.status(400).json({
      error: "validation_error",
      message: error.errors?.[0]?.message || "Please check the form fields.",
      issues: error.errors || []
    });
  }
  const status = error.status || 500;
  res.status(status).json({
    error: status === 500 ? "server_error" : error.message || "request_failed",
    message: status === 500 ? "Something went wrong. Please try again later." : error.message
  });
});

cron.schedule("*/2 * * * *", async () => {
  const settings = await getSettings();
  if (settings.livePageEnabled) await checkAllStreamers();
});

const port = env.PORT;
app.listen(port, () => {
  console.log(`Gotham City API listening on http://localhost:${port}`);
  console.log(`Static uploads served from ${path.resolve(__dirname, "..", "..", "uploads")}`);
});
