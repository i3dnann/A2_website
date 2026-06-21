import { randomUUID } from "node:crypto";
import { query } from "../config/db.js";
import { databaseEnabled } from "../config/env.js";
import { DEFAULT_SETTINGS, RESOURCE_MAP, SEED_DATA } from "../data/catalog.js";
import { pickAllowed, safeJson, toBoolean } from "../utils/sanitize.js";

const state = {
  settings: { ...DEFAULT_SETTINGS },
  settingsLoaded: false,
  secretSettingsLoaded: false,
  resources: new Map(Object.entries(SEED_DATA).map(([key, rows]) => [key, rows.map((row) => addTimestamps(row))])),
  liveStatus: new Map()
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
  if (value === undefined) return null;
  if (value && typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

function normalizeDbValue(value) {
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  return value;
}

function normalizeDbRow(row) {
  if (!row) return row;
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalizeDbValue(value)]));
  return {
    ...normalized,
    id: String(normalized.id)
  };
}

function resourceSearchWhere(config, q, publicOnly) {
  const clauses = ["deleted_at IS NULL"];
  const params = {};

  if (q && config.searchFields?.length) {
    const searchClauses = config.searchFields.map((field, index) => {
      params[`q${index}`] = `%${q}%`;
      return `${field} LIKE :q${index}`;
    });
    clauses.push(`(${searchClauses.join(" OR ")})`);
  }

  if (publicOnly) {
    if (config.fields.includes("is_visible")) clauses.push("(is_visible = 1 OR is_visible IS NULL)");
    if (config.fields.includes("is_hidden")) clauses.push("(is_hidden = 0 OR is_hidden IS NULL)");
    if (config.fields.includes("is_approved")) clauses.push("(is_approved = 1 OR is_approved IS NULL)");
    if (config.fields.includes("status")) clauses.push("(status IS NULL OR status NOT IN ('Hidden', 'Draft', 'Deleted'))");
  }

  return { clause: clauses.join(" AND "), params };
}

function isPublicRow(config, row) {
  if (!row || row.deleted_at) return false;
  if ("is_visible" in row && !toBoolean(row.is_visible)) return false;
  if ("is_hidden" in row && toBoolean(row.is_hidden)) return false;
  if ("is_approved" in row && !toBoolean(row.is_approved)) return false;
  if (["Hidden", "Deleted", "Draft"].includes(String(row.status || ""))) return false;
  return true;
}

function sortRows(a, b) {
  return Number(a.sort_order || 9999) - Number(b.sort_order || 9999) || String(b.created_at || "").localeCompare(String(a.created_at || ""));
}

export function getResourceConfig(resourceKey) {
  return RESOURCE_MAP[resourceKey] || null;
}

export async function getSettings({ includeSecrets = false } = {}) {
  if (databaseEnabled && (!state.settingsLoaded || (includeSecrets && !state.secretSettingsLoaded))) {
    const rows = await query("SELECT setting_key, setting_value, is_secret FROM web_settings");
    if (rows) {
      const dbSettings = {};
      rows.forEach((row) => {
        if (row.is_secret && !includeSecrets) return;
        dbSettings[row.setting_key] = safeJson(row.setting_value, row.setting_value);
      });
      state.settings = { ...state.settings, ...dbSettings };
      state.settingsLoaded = true;
      if (includeSecrets) state.secretSettingsLoaded = true;
    }
  }

  if (!includeSecrets) {
    return Object.fromEntries(Object.entries(state.settings).filter(([key]) => !key.toLowerCase().includes("webhookurl")));
  }
  return { ...state.settings };
}

export async function updateSettings(patch, actor, { secretKeys = [] } = {}) {
  const before = await getSettings({ includeSecrets: true });
  const safePatch = { ...(patch || {}) };
  state.settings = {
    ...state.settings,
    ...safePatch,
    updated_by: actor?.id || null,
    updated_at: new Date().toISOString()
  };

  if (databaseEnabled) {
    await Promise.all(
      Object.entries(safePatch).map(([key, value]) =>
        query(
          `INSERT INTO web_settings (id, setting_key, setting_value, is_secret, updated_by)
           VALUES (:id, :setting_key, :setting_value, :is_secret, :updated_by)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), is_secret = VALUES(is_secret), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP`,
          {
            id: `setting-${key}`,
            setting_key: key,
            setting_value: JSON.stringify(value),
            is_secret: secretKeys.includes(key) ? 1 : 0,
            updated_by: actor?.id || null
          }
        )
      )
    );
  }

  return { before, after: await getSettings({ includeSecrets: true }) };
}

export async function listResource(resourceKey, options = {}) {
  const config = getResourceConfig(resourceKey);
  if (!config) return { rows: [], total: 0, config: null };

  const limit = Math.min(Number(options.limit) || 25, 100);
  const offset = Math.max(Number(options.offset) || 0, 0);
  const q = String(options.q || "").trim();

  if (databaseEnabled) {
    const { clause, params } = resourceSearchWhere(config, q, Boolean(options.publicOnly));
    const rows = await query(
      `SELECT * FROM ${config.table} WHERE ${clause} ORDER BY COALESCE(sort_order, 9999), created_at DESC LIMIT :limit OFFSET :offset`,
      { ...params, limit, offset }
    );
    const countRows = await query(`SELECT COUNT(*) AS total FROM ${config.table} WHERE ${clause}`, params);
    if (rows) return { rows: rows.map(normalizeDbRow), total: countRows?.[0]?.total || rows.length, config };
  }

  let rows = getStore(resourceKey).filter((row) => !row.deleted_at);
  if (q && config.searchFields?.length) {
    const needle = q.toLowerCase();
    rows = rows.filter((row) => config.searchFields.some((field) => String(row[field] || "").toLowerCase().includes(needle)));
  }
  if (options.publicOnly) rows = rows.filter((row) => isPublicRow(config, row));
  rows = rows.sort(sortRows);
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
    const result = await query(
      `INSERT INTO ${config.table} (${keys.join(", ")}) VALUES (${keys.map((key) => `:${key}`).join(", ")})`,
      Object.fromEntries(keys.map((key) => [key, sqlValue(data[key])]))
    );
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
    const result = await query(
      `UPDATE ${config.table} SET ${keys.map((key) => `${key} = :${key}`).join(", ")} WHERE id = :id`,
      { ...Object.fromEntries(keys.map((key) => [key, sqlValue(patch[key])])), id }
    );
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
    const result = await query(
      `UPDATE ${config.table} SET deleted_at = :deleted_at, updated_by = :updated_by, updated_at = :updated_at WHERE id = :id`,
      { ...patch, id }
    );
    if (result) return before;
  }

  const rows = getStore(resourceKey);
  const index = rows.findIndex((row) => String(row.id) === String(id));
  rows[index] = { ...rows[index], ...patch };
  return before;
}

export async function addAuditLog(entry) {
  return createResource(
    "auditLogs",
    {
      action: entry.action,
      staff_id: entry.staff?.id || null,
      staff_name: entry.staff?.username || entry.staff?.email || "system",
      target_type: entry.targetType,
      target_id: entry.targetId,
      reason: entry.reason || "",
      ip: entry.ip || "",
      before_json: entry.before ? JSON.stringify(entry.before).slice(0, 6000) : null,
      after_json: entry.after ? JSON.stringify(entry.after).slice(0, 6000) : null,
      status: entry.status || "success"
    },
    entry.staff
  );
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
