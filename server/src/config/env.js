import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

const schema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.string().default("development"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  CORS_ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
  USE_DATABASE: z.string().default("false"),
  MYSQL_HOST: z.string().default("localhost"),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_USER: z.string().default("root"),
  MYSQL_PASSWORD: z.string().default(""),
  MYSQL_DATABASE: z.string().default("qbcore"),
  DISCORD_CLIENT_ID: z.string().default(""),
  DISCORD_CLIENT_SECRET: z.string().default(""),
  DISCORD_REDIRECT_URI: z.string().default(""),
  DISCORD_BOT_TOKEN: z.string().default(""),
  DISCORD_GUILD_ID: z.string().default(""),
  JWT_SECRET: z.string().default("change_me_to_a_long_random_secret"),
  SESSION_SECRET: z.string().default("change_me_to_a_long_random_session_secret"),
  COOKIE_SECURE: z.string().default("false"),
  FIVEM_API_TOKEN: z.string().default("CHANGE_ME_SECURE_TOKEN"),
  FIREBASE_SERVICE_ACCOUNT_BASE64: z.string().default(""),
  FIREBASE_DATABASE_URL: z.string().default(""),
  TWITCH_CLIENT_ID: z.string().default(""),
  TWITCH_CLIENT_SECRET: z.string().default(""),
  TWITCH_ACCESS_TOKEN: z.string().default(""),
  KICK_API_KEY: z.string().default(""),
  KICK_API_BASE_URL: z.string().default(""),
  WEBHOOK_ADMIN_LOGS: z.string().default(""),
  WEBHOOK_SECURITY_LOGS: z.string().default(""),
  WEBHOOK_TICKETS: z.string().default(""),
  WEBHOOK_BAN_APPEALS: z.string().default(""),
  WEBHOOK_WHITELIST: z.string().default(""),
  WEBHOOK_STREAMERS: z.string().default(""),
  WEBHOOK_POLICE: z.string().default(""),
  WEBHOOK_EMS: z.string().default(""),
  WEBHOOK_COURT: z.string().default(""),
  WEBHOOK_BUSINESS: z.string().default(""),
  WEBHOOK_GANG: z.string().default("")
});

export const env = schema.parse(process.env);

export const corsOrigins = env.CORS_ALLOWED_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const isProduction = env.NODE_ENV === "production";
export const databaseEnabled = env.USE_DATABASE === "true";
export const cookieSecure = env.COOKIE_SECURE === "true" || isProduction;
