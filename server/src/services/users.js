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

function normalizeUser(row) {
  const roles = Array.isArray(row.roles) ? row.roles : JSON.parse(row.roles_json || "[]");
  const permissions = Array.isArray(row.permissions) ? row.permissions : JSON.parse(row.permissions_json || "[]");
  return {
    id: String(row.id),
    discord_id: row.discord_id,
    username: row.username || row.discord_username,
    discord_username: row.discord_username || row.username,
    avatar_url: row.avatar_url || "",
    email: row.email || "",
    roles,
    discord_roles: Array.isArray(row.discord_roles) ? row.discord_roles : JSON.parse(row.discord_roles_json || "[]"),
    permissions: permissions.length ? permissions : permissionsForRoles(roles),
    preferred_language: row.preferred_language || "en",
    account_status: row.account_status || "active",
    first_login_at: row.first_login_at,
    last_login_at: row.last_login_at,
    linked_citizenids: Array.isArray(row.linked_citizenids) ? row.linked_citizenids : JSON.parse(row.linked_citizenids_json || "[]")
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

export async function upsertDiscordUser(discordUser, discordRoles = [], preferredLanguage = "en") {
  const now = new Date().toISOString();
  const dbRows = databaseEnabled ? await query("SELECT * FROM web_users WHERE discord_id = :discord_id LIMIT 1", { discord_id: discordUser.id }) : null;
  const existing = dbRows?.[0] ? normalizeUser(dbRows[0]) : [...users.values()].find((user) => user.discord_id === discordUser.id);
  const isMasterAdmin = masterDiscordIds().includes(discordUser.id);
  const roleNames = isMasterAdmin ? ["Master Admin"] : existing?.roles?.length ? existing.roles : ["Player"];
  const user = {
    id: existing?.id || randomUUID(),
    discord_id: discordUser.id,
    username: discordUser.global_name || discordUser.username,
    discord_username: discordUser.username,
    avatar_url: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : "",
    email: discordUser.email || "",
    roles: roleNames,
    discord_roles: discordRoles,
    permissions: permissionsForRoles(roleNames),
    preferred_language: preferredLanguage,
    account_status: "active",
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
