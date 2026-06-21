import { randomUUID } from "node:crypto";
import { query } from "../config/db.js";
import { DEFAULT_SETTINGS, RESOURCE_MAP, SEED_DATA } from "../data/catalog.js";
import { databaseEnabled } from "../config/env.js";
import { pickAllowed } from "../utils/sanitize.js";

const state = {
  settings: { ...DEFAULT_SETTINGS },
  resources: new Map(Object.entries(SEED_DATA).map(([key, rows]) => [key, rows.map((row) => addTimestamps(row))])),
  liveStatus: new Map(),
  fivem: {
    status: {
      online: false,
      players: 0,
      maxPlayers: 0,
      queue: 0,
      ping: null,
      lastRestart: null,
      nextRestart: null,
      endpointStatus: "unknown",
      databaseStatus: "unknown",
      discordBotStatus: "unknown",
      websiteApiStatus: "online",
      firebaseStatus: "disabled",
      streamerCheckerStatus: "idle",
      updatedAt: null
    },
    players: [],
    actionQueue: []
  }
};

function addTimestamps(row) {
  const now = new Date().toISOString();
  return {
    created_at: row.created_at || now,
    updated_at: row.updated_at || now,
    deleted_at: row.deleted_at || null,
    ...row
  };
}

function getStore(resourceKey) {
  if (!state.resources.has(resourceKey)) state.resources.set(resourceKey, []);
  return state.resources.get(resourceKey);
}

function sqlValue(value) {
  if (value && typeof value === "object") return JSON.stringify(value);
  return value ?? null;
}

function normalizeDbRow(row) {
  if (!row) return row;
  return {
    ...row,
    id: String(row.id)
  };
}

function whereSearch(config, q) {
  if (!q || !config.searchFields?.length) return { clause: "deleted_at IS NULL", params: {} };
  const clauses = config.searchFields.map((field, index) => `${field} LIKE :q${index}`);
  const params = Object.fromEntries(config.searchFields.map((_, index) => [`q${index}`, `%${q}%`]));
  return { clause: `deleted_at IS NULL AND (${clauses.join(" OR ")})`, params };
}

export function getResourceConfig(resourceKey) {
  return RESOURCE_MAP[resourceKey] || null;
}

export function getSettings() {
  return { ...state.settings };
}

export function updateSettings(patch, actor) {
  const before = { ...state.settings };
  state.settings = {
    ...state.settings,
    ...patch,
    updated_by: actor?.id || null,
    updated_at: new Date().toISOString()
  };
  return { before, after: { ...state.settings } };
}

export async function listResource(resourceKey, options = {}) {
  const config = getResourceConfig(resourceKey);
  if (!config) return { rows: [], total: 0, config: null };

  const limit = Math.min(Number(options.limit) || 25, 100);
  const offset = Math.max(Number(options.offset) || 0, 0);
  const q = String(options.q || "").trim();

  if (databaseEnabled) {
    const { clause, params } = whereSearch(config, q);
    const rows = await query(
      `SELECT * FROM ${config.table} WHERE ${clause} ORDER BY COALESCE(sort_order, 9999), created_at DESC LIMIT :limit OFFSET :offset`,
      { ...params, limit, offset }
    );
    const countRows = await query(`SELECT COUNT(*) AS total FROM ${config.table} WHERE ${clause}`, params);
    if (rows) return { rows: rows.map(normalizeDbRow), total: countRows?.[0]?.total || rows.length, config };
  }

  let rows = getStore(resourceKey).filter((row) => !row.deleted_at);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((row) => config.searchFields?.some((field) => String(row[field] || "").toLowerCase().includes(needle)));
  }
  if (options.publicOnly) {
    rows = rows.filter((row) => row.is_hidden !== true && row.is_hidden !== 1 && row.status !== "Hidden");
    if (resourceKey === "streamers") rows = rows.filter((row) => row.is_approved && !row.is_hidden);
  }
  rows = rows.sort((a, b) => Number(a.sort_order || 9999) - Number(b.sort_order || 9999) || String(b.created_at).localeCompare(String(a.created_at)));
  return { rows: rows.slice(offset, offset + limit), total: rows.length, config };
}

export async function getResource(resourceKey, id) {
  const config = getResourceConfig(resourceKey);
  if (!config) return null;

  if (databaseEnabled) {
    const rows = await query(`SELECT * FROM ${config.table} WHERE id = :id AND deleted_at IS NULL LIMIT 1`, { id });
    if (rows?.[0]) return normalizeDbRow(rows[0]);
  }

  return getStore(resourceKey).find((row) => String(row.id) === String(id) && !row.deleted_at) || null;
}

export async function createResource(resourceKey, payload, actor) {
  const config = getResourceConfig(resourceKey);
  if (!config) throw new Error("Unknown resource");
  const now = new Date().toISOString();
  const allowedFields = config.dbFields || config.fields;
  const data = {
    id: payload.id || randomUUID(),
    ...pickAllowed(payload, allowedFields),
    created_by: actor?.id || null,
    updated_by: actor?.id || null,
    created_at: now,
    updated_at: now,
    deleted_at: null
  };

  if (databaseEnabled) {
    const keys = Object.keys(data);
    const placeholders = keys.map((key) => `:${key}`).join(", ");
    const columns = keys.join(", ");
    const result = await query(`INSERT INTO ${config.table} (${columns}) VALUES (${placeholders})`, Object.fromEntries(keys.map((key) => [key, sqlValue(data[key])])));
    if (result) return data;
  }

  getStore(resourceKey).push(data);
  return data;
}

export async function updateResource(resourceKey, id, payload, actor) {
  const config = getResourceConfig(resourceKey);
  if (!config) throw new Error("Unknown resource");
  const before = await getResource(resourceKey, id);
  if (!before) return null;
  const allowedFields = config.dbFields || config.fields;
  const patch = {
    ...pickAllowed(payload, allowedFields),
    updated_by: actor?.id || null,
    updated_at: new Date().toISOString()
  };

  if (databaseEnabled) {
    const keys = Object.keys(patch);
    const assignments = keys.map((key) => `${key} = :${key}`).join(", ");
    const result = await query(`UPDATE ${config.table} SET ${assignments} WHERE id = :id`, {
      ...Object.fromEntries(keys.map((key) => [key, sqlValue(patch[key])])),
      id
    });
    if (result) return { before, after: { ...before, ...patch } };
  }

  const rows = getStore(resourceKey);
  const index = rows.findIndex((row) => String(row.id) === String(id));
  rows[index] = { ...rows[index], ...patch };
  return { before, after: rows[index] };
}

export async function deleteResource(resourceKey, id, actor) {
  const config = getResourceConfig(resourceKey);
  if (!config) throw new Error("Unknown resource");
  const before = await getResource(resourceKey, id);
  if (!before) return null;
  const patch = {
    deleted_at: new Date().toISOString(),
    updated_by: actor?.id || null,
    updated_at: new Date().toISOString()
  };

  if (databaseEnabled) {
    const result = await query(`UPDATE ${config.table} SET deleted_at = :deleted_at, updated_by = :updated_by, updated_at = :updated_at WHERE id = :id`, {
      ...patch,
      id
    });
    if (result) return before;
  }

  const rows = getStore(resourceKey);
  const index = rows.findIndex((row) => String(row.id) === String(id));
  rows[index] = { ...rows[index], ...patch };
  return before;
}

export async function addAuditLog(entry) {
  const row = await createResource(
    "auditLogs",
    {
      action: entry.action,
      staff_id: entry.staff?.id || null,
      staff_name: entry.staff?.username || entry.staff?.discord_username || "system",
      target_type: entry.targetType,
      target_id: entry.targetId,
      reason: entry.reason || "",
      ip: entry.ip || "",
      before_json: entry.before ? JSON.stringify(entry.before) : null,
      after_json: entry.after ? JSON.stringify(entry.after) : null,
      status: entry.status || "success"
    },
    entry.staff
  );
  return row;
}

export function getFiveMStatus() {
  return { ...state.fivem.status, players: state.fivem.players };
}

export function updateFiveMStatus(payload) {
  state.fivem.status = {
    ...state.fivem.status,
    ...payload,
    online: true,
    updatedAt: new Date().toISOString(),
    websiteApiStatus: "online"
  };
  if (Array.isArray(payload.players)) state.fivem.players = payload.players;
  return getFiveMStatus();
}

export function enqueueFiveMAction(action) {
  const row = {
    id: randomUUID(),
    status: "queued",
    created_at: new Date().toISOString(),
    ...action
  };
  state.fivem.actionQueue.push(row);
  return row;
}

export function drainFiveMActions(limit = 20) {
  return state.fivem.actionQueue.splice(0, limit);
}

export function setStreamerLiveStatus(streamerId, platform, status) {
  const key = `${streamerId}:${platform}`;
  const row = {
    id: key,
    streamer_id: streamerId,
    platform,
    is_live: false,
    stream_title: "",
    viewer_count: null,
    thumbnail_url: "",
    stream_url: "",
    started_at: null,
    last_checked_at: new Date().toISOString(),
    raw_response_json: null,
    ...status
  };
  state.liveStatus.set(key, row);
  return row;
}

export function getStreamerLiveStatuses(streamerId) {
  return [...state.liveStatus.values()].filter((row) => String(row.streamer_id) === String(streamerId));
}

export function getAllStreamerLiveStatuses() {
  return [...state.liveStatus.values()];
}
