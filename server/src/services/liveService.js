import { fetch } from "undici";
import { env } from "../config/env.js";

const FIVE_SECONDS = 5000;
const LIVE_CACHE_MS = 10000;
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

async function fetchJson(url) {
  if (!url) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FIVE_SECONDS);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: "application/json" } });
    if (!response.ok) return null;
    return await response.json();
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
