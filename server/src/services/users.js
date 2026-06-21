import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { permissionsForRoles } from "../data/permissions.js";
import { query } from "../config/db.js";
import { databaseEnabled } from "../config/env.js";

const users = new Map();

const masterUser = {
  id: "dev-master",
  discord_id: "000000000000000001",
  username: "A2 Master Admin",
  discord_username: "a2_master",
  avatar_url: "",
  email: "",
  roles: ["Master Admin"],
  discord_roles: [],
  permissions: permissionsForRoles(["Master Admin"]),
  preferred_language: "en",
  account_status: "active",
  first_login_at: new Date().toISOString(),
  last_login_at: new Date().toISOString(),
  linked_citizenids: ["A2DEMO1"]
};
users.set(masterUser.id, masterUser);

let roleMappingsMemory = [];

function parseJson(value, fallback) {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeUser(row) {
  const roles = Array.isArray(row.roles) ? row.roles : parseJson(row.roles_json, []);
  const permissions = Array.isArray(row.permissions) ? row.permissions : parseJson(row.permissions_json, []);
  return {
    id: String(row.id),
    discord_id: row.discord_id,
    username: row.username || row.discord_username,
    discord_username: row.discord_username || row.username,
    avatar_url: row.avatar_url || "",
    email: row.email || "",
    roles,
    discord_roles: Array.isArray(row.discord_roles) ? row.discord_roles : parseJson(row.discord_roles_json, []),
    permissions: permissions.length ? permissions : permissionsForRoles(roles),
    preferred_language: row.preferred_language || "en",
    account_status: row.account_status || "active",
    first_login_at: row.first_login_at,
    last_login_at: row.last_login_at,
    linked_citizenids: Array.isArray(row.linked_citizenids) ? row.linked_citizenids : parseJson(row.linked_citizenids_json, [])
  };
}

function masterDiscordIds() {
  return env.MASTER_ADMIN_DISCORD_IDS.split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function signUser(user) {
  return jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: "12h" });
}

export function verifyUserToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getUserById(id) {
  if (databaseEnabled) {
    const rows = await query("SELECT * FROM web_users WHERE id = :id LIMIT 1", { id });
    if (rows?.[0]) return normalizeUser(rows[0]);
  }
  return users.get(String(id)) || null;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export async function getDiscordRoleMappings() {
  if (databaseEnabled) {
    const rows = await query("SELECT setting_value FROM web_settings WHERE setting_key = 'discord_role_mappings' LIMIT 1");
    const mappings = parseJson(rows?.[0]?.setting_value, null);
    if (Array.isArray(mappings)) return mappings;
  }
  return roleMappingsMemory;
}

export async function saveDiscordRoleMappings(mappings = []) {
  const normalized = mappings
    .filter((mapping) => String(mapping.discord_role_id || "").trim())
    .map((mapping) => ({
      discord_role_id: String(mapping.discord_role_id).trim(),
      label: String(mapping.label || mapping.discord_role_id).trim(),
      roles: unique(mapping.roles || []),
      permissions: unique(mapping.permissions || [])
    }));

  if (databaseEnabled) {
    await query(
      `INSERT INTO web_settings (id, setting_key, setting_value, is_secret)
       VALUES ('discord-role-mappings', 'discord_role_mappings', :setting_value, 0)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
      { setting_value: JSON.stringify(normalized) }
    );
  }

  roleMappingsMemory = normalized;
  return normalized;
}

async function permissionsFromDiscordRoles(discordRoles = []) {
  const mappings = await getDiscordRoleMappings();
  const matched = mappings.filter((mapping) => discordRoles.includes(mapping.discord_role_id));
  const mappedRoles = unique(matched.flatMap((mapping) => mapping.roles || []));
  const mappedPermissions = unique([
    ...permissionsForRoles(mappedRoles),
    ...matched.flatMap((mapping) => mapping.permissions || [])
  ]);
  return { mappedRoles, mappedPermissions };
}

export async function listWebUsers({ q = "", limit = 100 } = {}) {
  if (databaseEnabled) {
    const rows = await query(
      `SELECT * FROM web_users
       WHERE deleted_at IS NULL
         AND (:q = '' OR discord_id LIKE :like OR username LIKE :like OR discord_username LIKE :like)
       ORDER BY last_login_at DESC, created_at DESC
       LIMIT :limit`,
      { q, like: `%${q}%`, limit: Math.min(Number(limit) || 100, 200) }
    );
    if (rows) return rows.map(normalizeUser);
  }
  return [...users.values()].filter((user) => {
    const haystack = `${user.discord_id} ${user.username} ${user.discord_username}`.toLowerCase();
    return haystack.includes(String(q || "").toLowerCase());
  });
}

export async function upsertWebUserFromAdmin(payload, actor) {
  const now = new Date().toISOString();
  const existingRows = databaseEnabled && payload.discord_id
    ? await query("SELECT * FROM web_users WHERE discord_id = :discord_id LIMIT 1", { discord_id: payload.discord_id })
    : null;
  const existing = existingRows?.[0] ? normalizeUser(existingRows[0]) : [...users.values()].find((user) => user.discord_id === payload.discord_id);
  const roles = unique(payload.roles || existing?.roles || ["Player"]);
  const permissions = unique(payload.permissions || permissionsForRoles(roles));
  const user = {
    id: existing?.id || payload.id || randomUUID(),
    discord_id: String(payload.discord_id || existing?.discord_id || "").trim(),
    username: payload.username || existing?.username || payload.discord_username || "Pending Discord user",
    discord_username: payload.discord_username || existing?.discord_username || payload.username || "pending",
    avatar_url: existing?.avatar_url || "",
    email: existing?.email || "",
    roles,
    discord_roles: existing?.discord_roles || [],
    permissions,
    preferred_language: existing?.preferred_language || "en",
    account_status: payload.account_status || existing?.account_status || "active",
    first_login_at: existing?.first_login_at || now,
    last_login_at: existing?.last_login_at || null,
    linked_citizenids: existing?.linked_citizenids || [],
    updated_by: actor?.id || null
  };

  if (!user.discord_id) throw new Error("discord_id_required");

  if (databaseEnabled) {
    await query(
      `INSERT INTO web_users
        (id, discord_id, username, discord_username, avatar_url, email, roles_json, discord_roles_json, permissions_json, preferred_language, account_status, first_login_at, last_login_at, linked_citizenids_json)
       VALUES
        (:id, :discord_id, :username, :discord_username, :avatar_url, :email, :roles_json, :discord_roles_json, :permissions_json, :preferred_language, :account_status, :first_login_at, :last_login_at, :linked_citizenids_json)
       ON DUPLICATE KEY UPDATE
        username = VALUES(username),
        discord_username = VALUES(discord_username),
        roles_json = VALUES(roles_json),
        permissions_json = VALUES(permissions_json),
        account_status = VALUES(account_status),
        updated_at = CURRENT_TIMESTAMP`,
      {
        ...user,
        roles_json: JSON.stringify(user.roles),
        discord_roles_json: JSON.stringify(user.discord_roles),
        permissions_json: JSON.stringify(user.permissions),
        linked_citizenids_json: JSON.stringify(user.linked_citizenids)
      }
    );
  }

  users.set(user.id, user);
  return user;
}

export async function deactivateWebUser(id, actor) {
  const rows = databaseEnabled ? await query("SELECT * FROM web_users WHERE id = :id OR discord_id = :id LIMIT 1", { id }) : null;
  const existing = rows?.[0]
    ? normalizeUser(rows[0])
    : [...users.values()].find((user) => user.id === id || user.discord_id === id);
  if (!existing) return null;

  const updated = { ...existing, account_status: "disabled", permissions: [], roles: ["Guest"], updated_by: actor?.id || null };
  if (databaseEnabled) {
    await query(
      `UPDATE web_users
       SET account_status = 'disabled',
           roles_json = :roles_json,
           permissions_json = :permissions_json,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = :id OR discord_id = :id`,
      { id, roles_json: JSON.stringify(updated.roles), permissions_json: JSON.stringify(updated.permissions) }
    );
  }
  users.set(updated.id, updated);
  return updated;
}

export async function upsertDiscordUser(discordUser, discordRoles = [], preferredLanguage = "en") {
  const now = new Date().toISOString();
  const dbRows = databaseEnabled ? await query("SELECT * FROM web_users WHERE discord_id = :discord_id LIMIT 1", { discord_id: discordUser.id }) : null;
  const existing = dbRows?.[0] ? normalizeUser(dbRows[0]) : [...users.values()].find((user) => user.discord_id === discordUser.id);
  const isMasterAdmin = masterDiscordIds().includes(discordUser.id);
  const { mappedRoles, mappedPermissions } = await permissionsFromDiscordRoles(discordRoles);
  const roleNames = isMasterAdmin ? ["Master Admin"] : unique([...(existing?.roles?.length ? existing.roles : ["Player"]), ...mappedRoles]);
  const permissions = isMasterAdmin
    ? permissionsForRoles(["Master Admin"])
    : unique([...permissionsForRoles(roleNames), ...(existing?.permissions || []), ...mappedPermissions]);
  const user = {
    id: existing?.id || randomUUID(),
    discord_id: discordUser.id,
    username: discordUser.global_name || discordUser.username,
    discord_username: discordUser.username,
    avatar_url: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : "",
    email: discordUser.email || "",
    roles: roleNames,
    discord_roles: discordRoles,
    permissions,
    preferred_language: preferredLanguage,
    account_status: isMasterAdmin ? "active" : existing?.account_status || "active",
    first_login_at: existing?.first_login_at || now,
    last_login_at: now,
    linked_citizenids: existing?.linked_citizenids || []
  };

  if (databaseEnabled) {
    await query(
      `INSERT INTO web_users
        (id, discord_id, username, discord_username, avatar_url, email, roles_json, discord_roles_json, permissions_json, preferred_language, account_status, first_login_at, last_login_at, linked_citizenids_json)
       VALUES
        (:id, :discord_id, :username, :discord_username, :avatar_url, :email, :roles_json, :discord_roles_json, :permissions_json, :preferred_language, :account_status, :first_login_at, :last_login_at, :linked_citizenids_json)
       ON DUPLICATE KEY UPDATE
        username = VALUES(username),
        discord_username = VALUES(discord_username),
        avatar_url = VALUES(avatar_url),
        email = VALUES(email),
        roles_json = VALUES(roles_json),
        discord_roles_json = VALUES(discord_roles_json),
        permissions_json = VALUES(permissions_json),
        preferred_language = VALUES(preferred_language),
        account_status = VALUES(account_status),
        last_login_at = VALUES(last_login_at)`,
      {
        ...user,
        roles_json: JSON.stringify(user.roles),
        discord_roles_json: JSON.stringify(user.discord_roles),
        permissions_json: JSON.stringify(user.permissions),
        linked_citizenids_json: JSON.stringify(user.linked_citizenids)
      }
    );
  }

  users.set(user.id, user);
  return user;
}

export async function getDevUser() {
  return masterUser;
}
