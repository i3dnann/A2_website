import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mysql from "mysql2/promise";
import { z } from "zod";

const required = z.object({
  API_KEY: z.string().min(24),
  DB_HOST: z.string().default("127.0.0.1"),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string().min(1),
  PORT: z.coerce.number().default(3015),
  ALLOWED_WORDPRESS_ORIGIN: z.string().url().optional()
});

const env = required.parse(process.env);
const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  namedPlaceholders: true
});

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "64kb" }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || !env.ALLOWED_WORDPRESS_ORIGIN || origin === env.ALLOWED_WORDPRESS_ORIGIN) return callback(null, true);
    return callback(new Error("Origin not allowed"));
  }
}));
app.use(rateLimit({ windowMs: 60_000, limit: 90 }));

app.use((req, res, next) => {
  const key = req.get("x-api-key") || "";
  if (key.length !== env.API_KEY.length || !cryptoSafeEqual(key, env.API_KEY)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  next();
});

function cryptoSafeEqual(a, b) {
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return mismatch === 0;
}

function cleanIdentifier(value = "") {
  const raw = String(value).trim();
  if (!/^[a-zA-Z0-9:_-]{3,96}$/.test(raw)) return "";
  return raw;
}

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function characterFromRow(row = {}) {
  const charinfo = parseJson(row.charinfo, {});
  const money = parseJson(row.money, {});
  const job = parseJson(row.job, {});
  const gang = parseJson(row.gang, {});
  const metadata = parseJson(row.metadata, {});
  return {
    citizenid: row.citizenid,
    cid: row.cid,
    characterName: [charinfo.firstname, charinfo.lastname].filter(Boolean).join(" ") || row.name,
    job: job.label || job.name || "Unknown",
    jobGrade: job.grade?.name || job.grade?.level || "Unknown",
    gang: gang.label || gang.name || "None",
    cash: Number(money.cash || 0),
    bank: Number(money.bank || 0),
    phone: charinfo.phone || charinfo.phone_number || "",
    gender: charinfo.gender ?? charinfo.sex ?? "",
    lastOnline: row.last_updated || row.updated_at || row.last_login || null,
    warnings: metadata.warnings || metadata.warns || []
  };
}

async function findCharactersBy(field, value) {
  const identifier = cleanIdentifier(value);
  if (!identifier) return [];
  const like = `%${identifier}%`;
  const allowedFields = {
    discord: ["metadata", "license", "name"],
    steam: ["license", "name", "metadata"],
    license: ["license"],
    citizenid: ["citizenid"]
  };
  const fields = allowedFields[field] || [];
  const clauses = fields.map((column) => column === "citizenid" ? `${column} = :identifier` : `${column} LIKE :like`);
  const [rows] = await pool.execute(
    `SELECT citizenid, cid, license, name, money, charinfo, job, gang, metadata, last_updated, updated_at, last_login
     FROM players
     WHERE ${clauses.join(" OR ")}
     LIMIT 25`,
    { identifier, like }
  );
  return rows.map(characterFromRow);
}

async function banStatus(identifier) {
  const clean = cleanIdentifier(identifier);
  if (!clean) return { status: "Unknown", reason: "" };
  const like = `%${clean}%`;
  const [rows] = await pool.execute(
    `SELECT id, reason, expire, expires_at, name
     FROM bans
     WHERE license LIKE :like OR discord LIKE :like OR steam LIKE :like OR ids LIKE :like OR citizenid LIKE :like
     ORDER BY id DESC LIMIT 1`,
    { like }
  );
  if (!rows[0]) return { status: "Not banned", banId: null, reason: "", expiresAt: null };
  const expiresAt = rows[0].expires_at || rows[0].expire || null;
  return {
    status: !expiresAt || Number(expiresAt) === 2147483647 ? "Permanently banned" : "Temporarily banned",
    banId: rows[0].id,
    reason: rows[0].reason || "Unknown",
    expiresAt
  };
}

app.get("/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true, service: "gotham-fivem-bridge" });
});

app.get("/player/search", async (req, res) => {
  const field = ["discord", "steam", "license", "citizenid"].find((key) => req.query[key]);
  if (!field) return res.status(400).json({ ok: false, error: "missing_identifier" });
  const characters = await findCharactersBy(field, req.query[field]);
  res.json({ ok: true, characters });
});

app.get("/player/:identifier/characters", async (req, res) => {
  const characters = await findCharactersBy("license", req.params.identifier);
  res.json({ ok: true, characters });
});

app.get("/player/:identifier/ban-status", async (req, res) => {
  res.json({ ok: true, ban: await banStatus(req.params.identifier) });
});

app.get("/player/:identifier/profile", async (req, res) => {
  const characters = await findCharactersBy("license", req.params.identifier);
  const ban = await banStatus(req.params.identifier);
  res.json({ ok: true, profile: { characters, ban } });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "internal_error" });
});

app.listen(env.PORT, () => {
  console.log(`Gotham FiveM bridge listening on ${env.PORT}`);
});
