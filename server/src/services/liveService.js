import { fetch } from "undici";
import { env } from "../config/env.js";

const FIVE_SECONDS = 5000;

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

export async function getFiveMLiveState() {
  const [playersRaw, dynamicRaw, infoRaw] = await Promise.all([
    fetchJson(endpoint("players")),
    fetchJson(endpoint("dynamic")),
    fetchJson(endpoint("info"))
  ]);

  const players = Array.isArray(playersRaw)
    ? playersRaw.map((player) => ({ id: Number(player.id ?? player.endpoint ?? 0), name: String(player.name || "Unknown") }))
    : [];
  const count = Number(dynamicRaw?.clients ?? players.length ?? 0);
  const maxplayers = Number(dynamicRaw?.sv_maxclients || infoRaw?.vars?.sv_maxClients || env.FIVEM_MAX_PLAYERS || 0);
  const online = Boolean(playersRaw || dynamicRaw || infoRaw);

  return {
    players,
    count,
    maxplayers,
    status: online ? "online" : "offline",
    queue: Number(dynamicRaw?.queue || 0),
    announcement: env.LIVE_ANNOUNCEMENT || infoRaw?.vars?.sv_projectDesc || "",
    lastUpdate: Date.now()
  };
}
