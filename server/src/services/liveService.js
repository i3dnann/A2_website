import { fetch } from "undici";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { env } from "../config/env.js";

const FIVE_SECONDS = 5000;
const LIVE_CACHE_MS = 10000;
const MAX_JSON_BYTES = 256 * 1024;
let cachedLiveState = null;
let cachedUntil = 0;
let liveRequest = null;

function baseEndpoint() {
  if (!env.FIVEM_SERVER_IP) return "";
  const host = env.FIVEM_SERVER_IP.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return `http://${host}:${env.FIVEM_SERVER_PORT}`;
}

function endpoint(kind) {
  const explicit = {
    players: env.FIVEM_PLAYERS_URL,
    dynamic: env.FIVEM_DYNAMIC_URL,
    info: env.FIVEM_INFO_URL
  }[kind];
  if (explicit) return explicit;
  const base = baseEndpoint();
  return base ? `${base}/${kind}.json` : "";
}

function hasEndpointConfig() {
  return Boolean(
    env.FIVEM_PLAYERS_URL ||
    env.FIVEM_DYNAMIC_URL ||
    env.FIVEM_INFO_URL ||
    (env.FIVEM_SERVER_IP && env.FIVEM_SERVER_PORT)
  );
}

function privateHostname(hostname) {
  const host = String(hostname || "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (isIP(host)) {
    return /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host) || host === "::1";
  }
  return false;
}

function privateAddress(address) {
  const host = String(address || "").toLowerCase();
  return /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host) || host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:");
}

function safeStatusUrl(value) {
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    if (privateHostname(parsed.hostname)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

async function assertPublicStatusUrl(value) {
  const safeUrl = safeStatusUrl(value);
  if (!safeUrl) return "";
  const parsed = new URL(safeUrl);
  try {
    const addresses = await lookup(parsed.hostname, { all: true, verbatim: true });
    if (addresses.some((entry) => privateAddress(entry.address))) return "";
  } catch {
    return "";
  }
  return safeUrl;
}

async function fetchJson(url) {
  const safeUrl = await assertPublicStatusUrl(url);
  if (!safeUrl) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FIVE_SECONDS);
  try {
    const response = await fetch(safeUrl, { signal: controller.signal, redirect: "error", headers: { accept: "application/json" } });
    if (!response.ok) return null;
    const reader = response.body?.getReader?.();
    if (!reader) return await response.json();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_JSON_BYTES) return null;
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function loadFiveMLiveState() {
  if (!hasEndpointConfig()) {
    return {
      players: [],
      count: 0,
      maxplayers: Number(env.FIVEM_MAX_PLAYERS || 0),
      status: "not_configured",
      configured: false,
      serverName: env.FIVEM_SERVER_NAME || "Gotham City",
      latency: null,
      queue: 0,
      announcement: env.LIVE_ANNOUNCEMENT || "",
      lastUpdate: Date.now(),
      error: "fivem_status_not_configured"
    };
  }

  const started = Date.now();
  const [playersRaw, dynamicRaw, infoRaw] = await Promise.all([
    fetchJson(endpoint("players")),
    fetchJson(endpoint("dynamic")),
    fetchJson(endpoint("info"))
  ]);

  const count = Number(dynamicRaw?.clients ?? (Array.isArray(playersRaw) ? playersRaw.length : 0) ?? 0);
  const maxplayers = Number(dynamicRaw?.sv_maxclients || infoRaw?.vars?.sv_maxClients || env.FIVEM_MAX_PLAYERS || 0);
  const online = Boolean(playersRaw || dynamicRaw || infoRaw);
  const serverName = String(
    dynamicRaw?.hostname ||
    infoRaw?.vars?.sv_projectName ||
    infoRaw?.vars?.sv_projectDesc ||
    env.FIVEM_SERVER_NAME ||
    "Gotham City"
  );

  return {
    players: [],
    count,
    maxplayers,
    status: online ? "online" : "offline",
    configured: true,
    serverName,
    latency: online ? Date.now() - started : null,
    queue: Number(dynamicRaw?.queue || 0),
    announcement: env.LIVE_ANNOUNCEMENT || infoRaw?.vars?.sv_projectDesc || "",
    lastUpdate: Date.now(),
    error: online ? "" : "fivem_status_unavailable"
  };
}

export async function getFiveMLiveState() {
  const now = Date.now();
  if (cachedLiveState && now < cachedUntil) return cachedLiveState;
  if (liveRequest) return liveRequest;

  liveRequest = loadFiveMLiveState()
    .catch(() => ({
      players: [],
      count: 0,
      maxplayers: Number(env.FIVEM_MAX_PLAYERS || 0),
      status: "offline",
      configured: true,
      serverName: env.FIVEM_SERVER_NAME || "Gotham City",
      latency: null,
      queue: 0,
      announcement: env.LIVE_ANNOUNCEMENT || "",
      lastUpdate: Date.now(),
      error: "fivem_status_unavailable"
    }))
    .then((state) => {
      cachedLiveState = state;
      cachedUntil = Date.now() + LIVE_CACHE_MS;
      return state;
    })
    .finally(() => {
      liveRequest = null;
    });

  return liveRequest;
}

export const __liveServiceTest = { safeStatusUrl };
