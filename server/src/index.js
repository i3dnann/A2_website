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
import { corsOrigins, env } from "./config/env.js";
import { optionalAuth } from "./middleware/auth.js";
import { pingDatabase } from "./config/db.js";
import { getSettings } from "./services/repository.js";
import { checkAllStreamers } from "./services/streamerService.js";
import authRouter from "./routes/auth.js";
import publicRouter from "./routes/public.js";
import adminRouter from "./routes/admin.js";
import playerRouter from "./routes/player.js";
import fivemRouter from "./routes/fivem.js";
import { createDomainRouter } from "./routes/domain.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

fs.mkdirSync(path.resolve(process.cwd(), "uploads"), { recursive: true });

app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
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
    service: "a2-website-api",
    time: new Date().toISOString(),
    database: dbOk ? "online" : "disabled_or_unavailable",
    firebase: env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? "configured" : "disabled"
  });
});

app.use("/api/auth", authRouter);
app.use("/api/public", publicRouter);
app.use("/api/player", playerRouter);
app.use("/api/admin", adminRouter);
app.use("/api/fivem", fivemRouter);
app.use(
  "/api/police",
  createDomainRouter({
    viewPermission: "view_police_panel",
    editPermission: "edit_police_records",
    resources: ["policeReports", "policeWarrants", "policeFines"],
    searchMode: "citizen"
  })
);
app.use(
  "/api/ems",
  createDomainRouter({
    viewPermission: "view_ems_panel",
    editPermission: "edit_medical_records",
    resources: ["emsRecords"],
    searchMode: "citizen"
  })
);
app.use(
  "/api/court",
  createDomainRouter({
    viewPermission: "view_court_panel",
    editPermission: "manage_court_cases",
    resources: ["courtCases"],
    searchMode: "citizen"
  })
);
app.use(
  "/api/business-owner",
  createDomainRouter({
    viewPermission: "manage_business",
    editPermission: "manage_business",
    resources: ["businesses", "businessApplications"],
    searchMode: "none"
  })
);
app.use(
  "/api/gang",
  createDomainRouter({
    viewPermission: "manage_gang",
    editPermission: "manage_gang",
    resources: ["gangs", "gangTerritories"],
    searchMode: "none"
  })
);

app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});

app.use((error, _req, res, _next) => {
  console.error("[api]", error);
  res.status(error.status || 500).json({
    error: "server_error",
    message: env.NODE_ENV === "production" ? "Something went wrong." : error.message
  });
});

cron.schedule("*/2 * * * *", async () => {
  const settings = getSettings();
  if (settings.streamerPageEnabled) await checkAllStreamers();
});

const port = env.PORT;
app.listen(port, () => {
  console.log(`A2 Studio API listening on http://localhost:${port}`);
  console.log(`Static uploads served from ${path.resolve(__dirname, "..", "..", "uploads")}`);
});
