import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "..", "..");
const projectRoot = path.resolve(serverRoot, "..");

const envFiles = [];
function loadEnvFile(filePath, override = false) {
  if (!fs.existsSync(filePath)) return;
  dotenv.config({ path: filePath, override });
  envFiles.push(filePath);
}

loadEnvFile(path.resolve(serverRoot, ".env"));
loadEnvFile(path.resolve(process.cwd(), "..", ".env"));
loadEnvFile(path.resolve(process.cwd(), ".env"));
loadEnvFile(path.resolve(projectRoot, ".env"), true);

const schema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.string().default("development"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  CORS_ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
  CORS_ORIGINS: z.string().default(""),
  USE_DATABASE: z.string().default("false"),

  MYSQL_HOST: z.string().default("localhost"),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_USER: z.string().default("root"),
  MYSQL_PASSWORD: z.string().default(""),
  MYSQL_DATABASE: z.string().default("qbcore"),

  JWT_SECRET: z.string().default("change_me_to_a_long_random_secret"),
  SESSION_SECRET: z.string().default("change_me_to_a_long_random_session_secret"),
  OAUTH_STATE_SECRET: z.string().default(""),
  COOKIE_SECURE: z.string().default("false"),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  MASTER_ADMIN_EMAILS: z.string().default(""),
  MASTER_ADMIN_DISCORD_IDS: z.string().default(""),
  MASTER_ADMIN_STEAM_IDS: z.string().default(""),

  DISCORD_CLIENT_ID: z.string().default(""),
  DISCORD_CLIENT_SECRET: z.string().default(""),
  DISCORD_REDIRECT_URI: z.string().default(""),
  DISCORD_BOT_TOKEN: z.string().default(""),
  DISCORD_GUILD_ID: z.string().default(""),

  STEAM_API_KEY: z.string().default(""),
  STEAM_REALM: z.string().default("http://localhost:3001"),
  STEAM_RETURN_URL: z.string().default("http://localhost:3001/api/auth/steam/callback"),

  TWITCH_CLIENT_ID: z.string().default(""),
  TWITCH_CLIENT_SECRET: z.string().default(""),
  TWITCH_ACCESS_TOKEN: z.string().default(""),

  KICK_CLIENT_ID: z.string().default(""),
  KICK_CLIENT_SECRET: z.string().default(""),
  KICK_ACCESS_TOKEN: z.string().default(""),

  FIVEM_PLAYERS_URL: z.string().default(""),
  FIVEM_DYNAMIC_URL: z.string().default(""),
  FIVEM_INFO_URL: z.string().default(""),
  FIVEM_SERVER_NAME: z.string().default("Gotham City"),
  FIVEM_SERVER_IP: z.string().default(""),
  FIVEM_SERVER_PORT: z.string().default("30120"),
  FIVEM_MAX_PLAYERS: z.coerce.number().default(64),
  LIVE_ANNOUNCEMENT: z.string().default(""),

  WEBHOOK_TICKETS_OPEN: z.string().default(""),
  WEBHOOK_TICKETS_CLOSED: z.string().default(""),
  WEBHOOK_CAREERS: z.string().default(""),
  WEBHOOK_ADMIN_LOGS: z.string().default(""),
  WEBHOOK_SECURITY: z.string().default(""),
  WEBHOOK_USER_ACCOUNTS: z.string().default("")
});

export const env = schema.parse(process.env);
export const loadedEnvFiles = envFiles;

export const corsOrigins = [
  env.FRONTEND_URL,
  ...env.CORS_ALLOWED_ORIGINS.split(","),
  ...env.CORS_ORIGINS.split(",")
]
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

export const isProduction = env.NODE_ENV === "production";
export const databaseEnabled = env.USE_DATABASE === "true";
export const cookieSecure = env.COOKIE_SECURE === "true" || isProduction;
export const cookieSameSite = env.COOKIE_SAME_SITE;

export function envList(name) {
  return String(env[name] || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
