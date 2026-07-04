import { fetch } from "undici";
import { env } from "../config/env.js";

let cachedToken = "";
let tokenExpiresAt = 0;

function trimSlash(value = "") {
  return String(value || "").replace(/\/+$/, "");
}

function apiBaseUrl() {
  const base = trimSlash(env.KICK_API_BASE_URL || "https://api.kick.com/public/v1");
  return base.endsWith("/public/v1") ? base : `${base}/public/v1`;
}

function oauthBaseUrl() {
  return trimSlash(env.KICK_OAUTH_BASE_URL || "https://id.kick.com");
}

export function cleanKickSlug(value = "") {
  let input = String(value || "").trim();
  if (!input) return "";

  try {
    if (/^https?:\/\//i.test(input)) {
      const url = new URL(input);
      input = url.pathname.split("/").filter(Boolean)[0] || "";
    }
  } catch {
    input = input.replace(/^https?:\/\//i, "");
  }

  input = input
    .replace(/^www\./i, "")
    .replace(/^kick\.com\//i, "")
    .replace(/^kick\.tv\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0]
    .trim()
    .toLowerCase();

  return input.replace(/[^a-z0-9_-]/g, "").slice(0, 25);
}

export function kickConfigured() {
  return Boolean(env.KICK_API_BASE_URL && (env.KICK_API_KEY || (env.KICK_OAUTH_BASE_URL && env.KICK_CLIENT_ID && env.KICK_CLIENT_SECRET)));
}

function missingConfig() {
  return ["KICK_API_BASE_URL", "KICK_OAUTH_BASE_URL", "KICK_CLIENT_ID", "KICK_CLIENT_SECRET"].filter((key) => !env[key]);
}

async function getKickAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) return cachedToken;

  const missing = missingConfig();
  if (missing.length) {
    const error = new Error(`Kick is not configured. Missing: ${missing.join(", ")}`);
    error.status = 503;
    error.code = "kick_not_configured";
    throw error;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.KICK_CLIENT_ID,
    client_secret: env.KICK_CLIENT_SECRET
  });

  const response = await fetch(`${oauthBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok || !data.access_token) {
    console.warn("[kick] token request failed", response.status, data?.error || data?.message || text?.slice?.(0, 200));
    const error = new Error(`Kick token request failed with ${response.status}`);
    error.status = response.status || 502;
    error.code = "kick_token_failed";
    throw error;
  }

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + Number(data.expires_in || 3600) * 1000;
  return cachedToken;
}

async function kickGet(path, params = {}) {
  const token = env.KICK_API_KEY || (await getKickAccessToken());
  const url = new URL(`${apiBaseUrl()}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.append(key, String(value));
  });

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    console.warn("[kick] api request failed", response.status, path, data?.message || data?.error || text?.slice?.(0, 200));
    const error = new Error(`Kick API request failed with ${response.status}`);
    error.status = response.status || 502;
    error.code = "kick_api_failed";
    error.details = data;
    throw error;
  }

  return data;
}

export async function getKickStatus(value) {
  const slug = cleanKickSlug(value);
  const checkedAt = new Date().toISOString();
  if (!slug) {
    return { slug: "", online: false, channel: null, stream: null, checkedAt, skipped: "missing_kick_username" };
  }

  const channels = await kickGet("/channels", { slug });
  const channel = channels?.data?.[0] || null;
  if (!channel) return { slug, online: false, channel: null, stream: null, checkedAt };

  const broadcasterUserId = channel.broadcaster_user_id || channel.user_id || channel.id;
  let stream = null;
  if (broadcasterUserId) {
    const livestreams = await kickGet("/livestreams", { broadcaster_user_id: broadcasterUserId, limit: 1 });
    stream = livestreams?.data?.[0] || null;
  }

  const embeddedStream = channel.stream?.is_live ? channel.stream : null;
  const activeStream = stream || embeddedStream;

  return {
    slug: channel.slug || slug,
    online: Boolean(activeStream),
    channel,
    stream: activeStream,
    checkedAt
  };
}

export function kickErrorResponse(error, slug = "") {
  return {
    slug,
    online: false,
    channel: null,
    stream: null,
    checkedAt: new Date().toISOString(),
    error: error.code || "kick_error",
    message: error.message
  };
}
