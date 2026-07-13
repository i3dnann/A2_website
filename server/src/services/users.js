import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool, query } from "../config/db.js";
import { databaseEnabled, env, envList } from "../config/env.js";
import {
  DEFAULT_ROLE_PERMISSIONS,
  permissionsForRoles,
} from "../data/permissions.js";
import { safeJson } from "../utils/sanitize.js";

const users = new Map();
const providers = new Map();

export async function listCommunityAvatars(limit = 6) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 6, 6));
  const rows = await query(`
    SELECT COALESCE(NULLIF(u.avatar_url, ''), NULLIF(p.avatar_url, '')) AS avatar_url
    FROM web_users u
    LEFT JOIN web_auth_providers p ON p.user_id = u.id AND p.provider = 'discord'
    WHERE u.account_status = 'active'
      AND u.deleted_at IS NULL
      AND COALESCE(NULLIF(u.avatar_url, ''), NULLIF(p.avatar_url, '')) IS NOT NULL
    ORDER BY u.last_login_at DESC
    LIMIT ${safeLimit}
  `);
  if (rows) return rows.map((row) => row.avatar_url).filter(Boolean);
  return [...users.values()]
    .filter((user) => user.account_status === "active" && user.avatar_url)
    .sort((a, b) =>
      String(b.last_login_at || "").localeCompare(
        String(a.last_login_at || ""),
      ),
    )
    .slice(0, safeLimit)
    .map((user) => user.avatar_url);
}

function nowIso() {
  return new Date().toISOString();
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function isMasterCandidate({
  email = "",
  discord_id = "",
  steam_id = "",
} = {}) {
  return (
    envList("MASTER_ADMIN_EMAILS")
      .map((value) => value.toLowerCase())
      .includes(String(email).toLowerCase()) ||
    envList("MASTER_ADMIN_DISCORD_IDS").includes(String(discord_id)) ||
    envList("MASTER_ADMIN_STEAM_IDS").includes(String(steam_id))
  );
}

function rolesForIdentity(identity = {}) {
  return isMasterCandidate(identity) ? ["Master Admin"] : ["Player"];
}

function normalizeRoles(roles = ["Player"]) {
  return roles?.length ? roles : ["Player"];
}

function normalizeUser(row) {
  const roles = normalizeRoles(
    Array.isArray(row.roles) ? row.roles : safeJson(row.roles_json, []),
  );
  const explicitPermissions = Array.isArray(row.permissions)
    ? row.permissions
    : safeJson(row.permissions_json, []);
  const permissions = unique([
    ...permissionsForRoles(roles),
    ...explicitPermissions,
  ]);
  return {
    id: String(row.id),
    username: row.username || row.email || row.discord_username || "A2 Player",
    email: row.email || "",
    email_verified_at: row.email_verified_at || null,
    avatar_url: row.avatar_url || "",
    verified_badge:
      row.verified_badge === true ||
      row.verified_badge === 1 ||
      row.verified_badge === "1",
    verified_at: row.verified_at || null,
    verified_by: row.verified_by || "",
    verification_status: row.verification_status || "none",
    roles,
    permissions,
    account_status: row.account_status || "active",
    admin_status: row.admin_status || "active",
    preferred_language: row.preferred_language || "en",
    discord_id: row.discord_id || "",
    discord_username: row.discord_username || "",
    steam_id: row.steam_id || "",
    steam_persona: row.steam_persona || "",
    linked_identifiers: Array.isArray(row.linked_identifiers)
      ? row.linked_identifiers
      : safeJson(row.linked_identifiers_json, []),
    first_login_at: row.first_login_at || null,
    last_login_at: row.last_login_at || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

function publicUser(row) {
  return normalizeUser(row);
}

function providerKey(provider, providerUserId) {
  return `${provider}:${providerUserId}`;
}

function saveMemoryUser(user) {
  users.set(user.id, {
    ...user,
    roles: normalizeRoles(user.roles),
    permissions: unique([
      ...(user.permissions || []),
      ...permissionsForRoles(normalizeRoles(user.roles)),
    ]),
  });
  return publicUser(users.get(user.id));
}

const masterUser = saveMemoryUser({
  id: "dev-master",
  username: "A2 Master Admin",
  email: "master@a2.local",
  password_hash: "",
  roles: ["Master Admin"],
  permissions: permissionsForRoles(["Master Admin"]),
  account_status: "active",
  admin_status: "active",
  preferred_language: "en",
  discord_id: "000000000000000001",
  discord_username: "a2_master",
  steam_id: "",
  linked_identifiers: ["steam:110000000000000", "discord:000000000000000001"],
  first_login_at: nowIso(),
  last_login_at: nowIso(),
  created_at: nowIso(),
  updated_at: nowIso(),
});

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

function accountCanLogin(user) {
  if (!user) return false;
  if (user.account_status !== "active") return false;
  if (
    (user.permissions || []).some(
      (permission) => permission !== "view_player_portal",
    ) &&
    ["frozen", "disabled", "removed"].includes(user.admin_status)
  )
    return false;
  return true;
}

export async function getUserById(id) {
  if (databaseEnabled) {
    const rows = await query(
      "SELECT * FROM web_users WHERE id = :id AND deleted_at IS NULL LIMIT 1",
      { id },
    );
    if (rows?.[0]) return publicUser(rows[0]);
  }
  const memoryUser = users.get(String(id));
  return memoryUser ? publicUser(memoryUser) : null;
}

export function userIdentity(user, fallback = {}) {
  const username =
    user?.username || fallback.username || fallback.author_name || "";
  const discordUsername =
    user?.discord_username || fallback.discord_username || "";
  const steamPersona = user?.steam_persona || fallback.steam_persona || "";
  const email = user?.email || fallback.email || "";
  const discordId = user?.discord_id || fallback.discord_id || "";
  const steamId = user?.steam_id || fallback.steam_id || "";
  const id = user?.id || fallback.user_id || fallback.id || "";
  const label =
    username ||
    discordUsername ||
    steamPersona ||
    email ||
    (discordId ? `Discord ${discordId}` : "") ||
    (steamId ? `Steam ${steamId}` : "") ||
    "Unknown user";
  const secondary = [
    discordUsername && discordId
      ? `Discord: ${discordUsername} (${discordId})`
      : discordId
        ? `Discord: ${discordId}`
        : "",
    steamPersona && steamId
      ? `Steam: ${steamPersona} (${steamId})`
      : steamId
        ? `Steam: ${steamId}`
        : "",
    email ? `Email: ${email}` : "",
  ].filter(Boolean);

  return {
    id: id ? String(id) : "",
    label,
    username,
    email,
    avatar_url: user?.avatar_url || fallback.avatar_url || "",
    discord_id: discordId,
    discord_username: discordUsername,
    steam_id: steamId,
    steam_persona: steamPersona,
    roles: user?.roles || [],
    secondary: secondary.join(" - "),
    website_id_short: id ? String(id).slice(0, 8) : "",
  };
}

export async function findUserByIdentifiers({
  user_id = "",
  id = "",
  discord_id = "",
  steam_id = "",
  email = "",
  username = "",
} = {}) {
  const directId = user_id || id;
  if (directId) {
    const byId = await getUserById(directId);
    if (byId) return byId;
  }

  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const normalizedUsername = String(username || "")
    .trim()
    .toLowerCase();
  if (
    databaseEnabled &&
    (discord_id || steam_id || normalizedEmail || normalizedUsername)
  ) {
    const rows = await query(
      `SELECT * FROM web_users
       WHERE deleted_at IS NULL
         AND (
           (:discord_id <> '' AND discord_id = :discord_id) OR
           (:steam_id <> '' AND steam_id = :steam_id) OR
           (:email <> '' AND email = :email) OR
           (:username <> '' AND LOWER(username) = :username)
         )
       LIMIT 1`,
      {
        discord_id: String(discord_id || ""),
        steam_id: String(steam_id || ""),
        email: normalizedEmail,
        username: normalizedUsername,
      },
    );
    if (rows?.[0]) return publicUser(rows[0]);
  }

  return (
    [...users.values()]
      .map(publicUser)
      .find(
        (user) =>
          (discord_id &&
            String(user.discord_id || "") === String(discord_id)) ||
          (steam_id && String(user.steam_id || "") === String(steam_id)) ||
          (normalizedEmail &&
            String(user.email || "").toLowerCase() === normalizedEmail) ||
          (normalizedUsername &&
            String(user.username || "").toLowerCase() === normalizedUsername),
      ) || null
  );
}

export async function resolveUserIdentity(reference = {}) {
  const user = await findUserByIdentifiers(reference).catch(() => null);
  return userIdentity(user, reference);
}

async function getInternalUserById(id) {
  if (!id) return null;
  if (databaseEnabled) {
    const rows = await query(
      "SELECT * FROM web_users WHERE id = :id AND deleted_at IS NULL LIMIT 1",
      { id },
    );
    if (rows?.[0]) return rows[0];
  }
  return users.get(String(id)) || null;
}

async function getInternalUserByEmail(email) {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  if (databaseEnabled) {
    const rows = await query(
      "SELECT * FROM web_users WHERE email = :email AND deleted_at IS NULL LIMIT 1",
      { email: normalized },
    );
    if (rows?.[0]) return rows[0];
  }
  return (
    [...users.values()].find(
      (user) => String(user.email || "").toLowerCase() === normalized,
    ) || null
  );
}

async function getInternalUserByProvider(provider, providerUserId) {
  if (!provider || !providerUserId) return null;
  if (databaseEnabled) {
    const rows = await query(
      `SELECT u.*
       FROM web_auth_providers p
       JOIN web_users u ON u.id = p.user_id
       WHERE p.provider = :provider AND p.provider_user_id = :provider_user_id AND u.deleted_at IS NULL
       LIMIT 1`,
      { provider, provider_user_id: String(providerUserId) },
    );
    if (rows?.[0]) return rows[0];
  }
  const linked = providers.get(providerKey(provider, providerUserId));
  return linked ? users.get(linked.user_id) : null;
}

export async function listProvidersForUser(userId) {
  if (databaseEnabled) {
    const rows = await query(
      "SELECT provider, provider_user_id, username, avatar_url, metadata_json, created_at, updated_at FROM web_auth_providers WHERE user_id = :user_id",
      { user_id: userId },
    );
    if (rows) return rows;
  }
  return [...providers.values()].filter(
    (provider) => provider.user_id === userId,
  );
}

async function upsertUser(row) {
  const normalizedEmail = String(row.email || "")
    .trim()
    .toLowerCase();
  const user = {
    id: row.id || randomUUID(),
    username:
      row.username ||
      row.email ||
      row.discord_username ||
      row.steam_persona ||
      "A2 Player",
    email: normalizedEmail || null,
    password_hash: row.password_hash || "",
    email_verified_at: row.email_verified_at || null,
    avatar_url: row.avatar_url || "",
    roles: normalizeRoles(row.roles || safeJson(row.roles_json, [])),
    permissions: unique(row.permissions || safeJson(row.permissions_json, [])),
    account_status: row.account_status || "active",
    admin_status: row.admin_status || "active",
    preferred_language: row.preferred_language || "en",
    discord_id: row.discord_id || "",
    discord_username: row.discord_username || "",
    steam_id: row.steam_id || "",
    steam_persona: row.steam_persona || "",
    linked_identifiers: unique(
      row.linked_identifiers || safeJson(row.linked_identifiers_json, []),
    ),
    first_login_at: row.first_login_at || nowIso(),
    last_login_at: row.last_login_at || null,
    created_at: row.created_at || nowIso(),
    updated_at: nowIso(),
  };

  if (databaseEnabled) {
    await query(
      `INSERT INTO web_users
        (id, username, email, password_hash, email_verified_at, avatar_url, roles_json, permissions_json, account_status, admin_status, preferred_language, discord_id, discord_username, steam_id, steam_persona, linked_identifiers_json, first_login_at, last_login_at)
       VALUES
        (:id, :username, :email, :password_hash, :email_verified_at, :avatar_url, :roles_json, :permissions_json, :account_status, :admin_status, :preferred_language, :discord_id, :discord_username, :steam_id, :steam_persona, :linked_identifiers_json, :first_login_at, :last_login_at)
       ON DUPLICATE KEY UPDATE
        username = VALUES(username),
        password_hash = COALESCE(NULLIF(VALUES(password_hash), ''), password_hash),
        avatar_url = VALUES(avatar_url),
        roles_json = VALUES(roles_json),
        permissions_json = VALUES(permissions_json),
        account_status = VALUES(account_status),
        admin_status = VALUES(admin_status),
        preferred_language = VALUES(preferred_language),
        discord_id = VALUES(discord_id),
        discord_username = VALUES(discord_username),
        steam_id = VALUES(steam_id),
        steam_persona = VALUES(steam_persona),
        linked_identifiers_json = VALUES(linked_identifiers_json),
        last_login_at = VALUES(last_login_at),
        updated_at = CURRENT_TIMESTAMP`,
      {
        ...user,
        roles_json: JSON.stringify(user.roles),
        permissions_json: JSON.stringify(user.permissions),
        linked_identifiers_json: JSON.stringify(user.linked_identifiers),
      },
    );
  }

  users.set(user.id, user);
  return publicUser(user);
}

export async function registerEmailUser({
  username,
  email,
  password,
  termsVersion,
  ipAddress,
}) {
  const existing = await getInternalUserByEmail(email);
  if (existing)
    throw Object.assign(new Error("email_already_registered"), { status: 409 });
  const password_hash = await bcrypt.hash(password, 12);
  const roles = rolesForIdentity({ email });
  const user = await upsertUser({
    id: randomUUID(),
    username,
    email,
    password_hash,
    roles,
    permissions: permissionsForRoles(roles),
    account_status: "active",
    admin_status: "active",
    first_login_at: nowIso(),
    last_login_at: nowIso(),
  });
  await linkProvider(user.id, "email", email, { username, email });
  await saveTermsAgreement({ userId: user.id, termsVersion, ipAddress });
  return user;
}

export async function loginEmailUser({ email, password }) {
  const row = await getInternalUserByEmail(email);
  if (!row?.password_hash)
    throw Object.assign(new Error("invalid_credentials"), { status: 401 });
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok)
    throw Object.assign(new Error("invalid_credentials"), { status: 401 });
  const user = await upsertUser({ ...row, last_login_at: nowIso() });
  if (!accountCanLogin(user))
    throw Object.assign(new Error("account_disabled_or_frozen"), {
      status: 403,
    });
  return user;
}

export async function loginOrCreateFirebaseUser({
  uid,
  email,
  username,
  create,
  termsVersion,
  ipAddress,
  emailVerified,
}) {
  const providerUser = await getInternalUserByProvider("firebase", uid);
  if (providerUser) {
    const user = await upsertUser({
      ...providerUser,
      email_verified_at: emailVerified
        ? providerUser.email_verified_at || nowIso()
        : providerUser.email_verified_at,
      last_login_at: nowIso(),
    });
    if (!accountCanLogin(user))
      throw Object.assign(new Error("account_disabled_or_frozen"), {
        status: 403,
      });
    return user;
  }

  const existing = await getInternalUserByEmail(email);
  if (existing)
    throw Object.assign(new Error("firebase_migration_required"), {
      status: 409,
    });
  if (!create)
    throw Object.assign(new Error("firebase_account_not_registered"), {
      status: 404,
    });

  const roles = rolesForIdentity({ email });
  const user = await upsertUser({
    id: randomUUID(),
    username: username || email.split("@")[0],
    email,
    password_hash: "",
    email_verified_at: emailVerified ? nowIso() : null,
    roles,
    permissions: permissionsForRoles(roles),
    account_status: "active",
    admin_status: "active",
    first_login_at: nowIso(),
    last_login_at: nowIso(),
  });
  await linkProvider(user.id, "firebase", uid, {
    username: user.username,
    email,
  });
  await saveTermsAgreement({
    userId: user.id,
    termsVersion: termsVersion || "1.0.0",
    ipAddress,
  });
  return user;
}

export async function linkProvider(
  userId,
  provider,
  providerUserId,
  profile = {},
) {
  const existing = await getInternalUserByProvider(provider, providerUserId);
  if (existing && String(existing.id) !== String(userId)) {
    throw Object.assign(new Error("provider_already_linked"), { status: 409 });
  }

  const user = users.get(String(userId)) || (await getUserById(userId));
  if (!user) throw Object.assign(new Error("user_not_found"), { status: 404 });

  const identifier =
    provider === "steam"
      ? `steam:${providerUserId}`
      : provider === "discord"
        ? `discord:${providerUserId}`
        : null;
  const patch = {
    ...user,
    discord_id:
      provider === "discord" ? String(providerUserId) : user.discord_id,
    discord_username:
      provider === "discord"
        ? profile.username || user.discord_username
        : user.discord_username,
    steam_id: provider === "steam" ? String(providerUserId) : user.steam_id,
    steam_persona:
      provider === "steam"
        ? profile.username || user.steam_persona
        : user.steam_persona,
    avatar_url: profile.avatar_url || user.avatar_url,
    linked_identifiers: unique(
      [...(user.linked_identifiers || []), identifier].filter(Boolean),
    ),
    roles:
      user.admin_status !== "removed" &&
      isMasterCandidate({
        email: user.email,
        discord_id: provider === "discord" ? providerUserId : user.discord_id,
        steam_id: provider === "steam" ? providerUserId : user.steam_id,
      })
        ? ["Master Admin"]
        : user.roles,
    permissions: [],
  };
  const updated = await upsertUser({
    ...patch,
    permissions: permissionsForRoles(patch.roles),
  });

  const providerRow = {
    id: `${provider}-${providerUserId}`,
    user_id: userId,
    provider,
    provider_user_id: String(providerUserId),
    username: profile.username || "",
    avatar_url: profile.avatar_url || "",
    metadata_json: JSON.stringify(profile || {}),
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  if (databaseEnabled) {
    await query(
      `INSERT INTO web_auth_providers
        (id, user_id, provider, provider_user_id, username, avatar_url, metadata_json)
       VALUES
        (:id, :user_id, :provider, :provider_user_id, :username, :avatar_url, :metadata_json)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), username = VALUES(username), avatar_url = VALUES(avatar_url), metadata_json = VALUES(metadata_json), updated_at = CURRENT_TIMESTAMP`,
      providerRow,
    );
  }

  providers.set(providerKey(provider, providerUserId), providerRow);
  return updated;
}

export async function unlinkProviderForUser(userId, provider, actor) {
  if (!["discord", "steam"].includes(provider)) {
    throw Object.assign(new Error("unsupported_provider"), { status: 422 });
  }

  const existing = await getInternalUserById(userId);
  if (!existing)
    throw Object.assign(new Error("user_not_found"), { status: 404 });
  const user = publicUser(existing);
  const linked_identifiers = (user.linked_identifiers || []).filter(
    (identifier) => !String(identifier).startsWith(`${provider}:`),
  );
  const patch = {
    ...existing,
    linked_identifiers,
    updated_by: actor?.id || null,
    ...(provider === "discord" ? { discord_id: "", discord_username: "" } : {}),
    ...(provider === "steam" ? { steam_id: "", steam_persona: "" } : {}),
  };

  if (databaseEnabled) {
    await query(
      "DELETE FROM web_auth_providers WHERE user_id = :user_id AND provider = :provider",
      { user_id: userId, provider },
    );
  }

  for (const [key, value] of providers.entries()) {
    if (value.user_id === userId && value.provider === provider)
      providers.delete(key);
  }

  return upsertUser(patch);
}

export async function loginOrCreateProviderUser(
  provider,
  providerUserId,
  profile = {},
  preferredLanguage = "en",
) {
  const existing = await getInternalUserByProvider(provider, providerUserId);
  if (existing) {
    const refreshed = await linkProvider(
      existing.id,
      provider,
      providerUserId,
      profile,
    );
    const user = await upsertUser({ ...refreshed, last_login_at: nowIso() });
    if (!accountCanLogin(user))
      throw Object.assign(new Error("account_disabled_or_frozen"), {
        status: 403,
      });
    return user;
  }

  const existingByDirectIdentifier = await findUserByIdentifiers({
    discord_id: provider === "discord" ? providerUserId : "",
    steam_id: provider === "steam" ? providerUserId : "",
  });
  if (existingByDirectIdentifier) {
    const refreshed = await linkProvider(
      existingByDirectIdentifier.id,
      provider,
      providerUserId,
      profile,
    );
    const user = await upsertUser({ ...refreshed, last_login_at: nowIso() });
    if (!accountCanLogin(user))
      throw Object.assign(new Error("account_disabled_or_frozen"), {
        status: 403,
      });
    return user;
  }

  const roles = rolesForIdentity({
    email: profile.email,
    discord_id: provider === "discord" ? providerUserId : "",
    steam_id: provider === "steam" ? providerUserId : "",
  });
  const user = await upsertUser({
    id: randomUUID(),
    username: profile.username || profile.email || `${provider} user`,
    email: profile.email || "",
    avatar_url: profile.avatar_url || "",
    roles,
    permissions: permissionsForRoles(roles),
    preferred_language: preferredLanguage,
    discord_id: provider === "discord" ? String(providerUserId) : "",
    discord_username: provider === "discord" ? profile.username || "" : "",
    steam_id: provider === "steam" ? String(providerUserId) : "",
    steam_persona: provider === "steam" ? profile.username || "" : "",
    linked_identifiers: [
      provider === "steam"
        ? `steam:${providerUserId}`
        : provider === "discord"
          ? `discord:${providerUserId}`
          : "",
    ].filter(Boolean),
    account_status: "active",
    admin_status: "active",
    first_login_at: nowIso(),
    last_login_at: nowIso(),
  });
  await linkProvider(user.id, provider, providerUserId, profile);
  return user;
}

export async function listWebUsers({ q = "", limit = 100 } = {}) {
  if (databaseEnabled) {
    const rows = await query(
      `SELECT u.*,
          COALESCE(NULLIF(u.discord_id, ''), (SELECT p.provider_user_id FROM web_auth_providers p WHERE p.user_id=u.id AND p.provider='discord' LIMIT 1), '') AS discord_id,
          COALESCE(NULLIF(u.discord_username, ''), (SELECT p.username FROM web_auth_providers p WHERE p.user_id=u.id AND p.provider='discord' LIMIT 1), '') AS discord_username,
          COALESCE(NULLIF(u.steam_id, ''), (SELECT p.provider_user_id FROM web_auth_providers p WHERE p.user_id=u.id AND p.provider='steam' LIMIT 1), '') AS steam_id,
          COALESCE(NULLIF(u.steam_persona, ''), (SELECT p.username FROM web_auth_providers p WHERE p.user_id=u.id AND p.provider='steam' LIMIT 1), '') AS steam_persona
       FROM web_users u
       WHERE u.deleted_at IS NULL
         AND (:q = '' OR u.email LIKE :like OR u.username LIKE :like OR u.discord_id LIKE :like OR u.steam_id LIKE :like
           OR EXISTS (SELECT 1 FROM web_auth_providers p WHERE p.user_id=u.id AND p.provider_user_id LIKE :like))
       ORDER BY u.updated_at DESC
       LIMIT :limit`,
      { q, like: `%${q}%`, limit: Math.min(Number(limit) || 100, 200) },
    );
    if (rows) return rows.map(publicUser);
  }
  return [...users.values()]
    .map(publicUser)
    .filter((user) =>
      `${user.email} ${user.username} ${user.discord_id} ${user.steam_id}`
        .toLowerCase()
        .includes(String(q || "").toLowerCase()),
    );
}

export async function upsertWebUserFromAdmin(payload, actor) {
  const existingByEmail = payload.email
    ? await getInternalUserByEmail(payload.email)
    : null;
  const existing = payload.id
    ? await getUserById(payload.id)
    : existingByEmail
      ? publicUser(existingByEmail)
      : null;
  const roles = normalizeRoles(payload.roles || existing?.roles || ["Player"]);
  const permissions = unique(payload.permissions || permissionsForRoles(roles));
  const user = await upsertUser({
    id: existing?.id || payload.id || randomUUID(),
    username:
      payload.username ||
      existing?.username ||
      payload.email ||
      payload.discord_username ||
      "A2 User",
    email: payload.email || existing?.email || "",
    roles,
    permissions,
    account_status: Object.hasOwn(payload, "account_status")
      ? payload.account_status
      : existing?.account_status || "active",
    admin_status: Object.hasOwn(payload, "admin_status")
      ? payload.admin_status
      : existing?.admin_status || "active",
    discord_id: Object.hasOwn(payload, "discord_id")
      ? payload.discord_id
      : existing?.discord_id || "",
    discord_username: Object.hasOwn(payload, "discord_username")
      ? payload.discord_username
      : existing?.discord_username || "",
    steam_id: Object.hasOwn(payload, "steam_id")
      ? payload.steam_id
      : existing?.steam_id || "",
    steam_persona: Object.hasOwn(payload, "steam_persona")
      ? payload.steam_persona
      : existing?.steam_persona || "",
    linked_identifiers: existing?.linked_identifiers || [],
    updated_by: actor?.id || null,
  });

  if (payload.discord_id)
    await linkProvider(user.id, "discord", payload.discord_id, {
      username: payload.discord_username || "",
    }).catch(() => user);
  if (payload.steam_id)
    await linkProvider(user.id, "steam", payload.steam_id, {
      username: payload.steam_persona || "",
    }).catch(() => user);
  return user;
}

export async function updateAdminStatus(id, status, actor) {
  const existing = await getUserById(id);
  if (!existing) return null;
  return upsertUser({
    ...existing,
    admin_status: status,
    updated_by: actor?.id || null,
  });
}

export async function resetUserPassword(id, password, actor) {
  const existing = await getInternalUserById(id);
  if (!existing) return null;
  const password_hash = await bcrypt.hash(String(password || ""), 12);
  return upsertUser({
    ...existing,
    password_hash,
    updated_by: actor?.id || null,
  });
}

export async function updateOwnEmail(userId, email, actor) {
  const existing = await getInternalUserById(userId);
  if (!existing)
    throw Object.assign(new Error("user_not_found"), { status: 404 });
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalized)
    throw Object.assign(new Error("email_required"), { status: 422 });
  const taken = await getInternalUserByEmail(normalized);
  if (taken && String(taken.id) !== String(userId)) {
    throw Object.assign(new Error("email_already_registered"), { status: 409 });
  }
  return upsertUser({
    ...existing,
    email: normalized,
    email_verified_at: null,
    updated_by: actor?.id || userId,
  });
}

export async function deactivateWebUser(id, actor) {
  const existing = await getUserById(id);
  if (!existing) return null;
  return upsertUser({
    ...existing,
    account_status: "disabled",
    admin_status: "disabled",
    updated_by: actor?.id || null,
  });
}

export async function removeAdminAccess(id, actor) {
  const existing = await getInternalUserById(id);
  if (!existing) return null;
  return upsertUser({
    ...existing,
    roles: ["Player"],
    permissions: permissionsForRoles(["Player"]),
    admin_status: "removed",
    updated_by: actor?.id || null,
  });
}

export async function deleteWebUser(id, actor) {
  const existing = await getInternalUserById(id);
  if (!existing) return null;
  if (databaseEnabled) {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        "DELETE FROM web_auth_providers WHERE user_id = :id",
        { id },
      );
      await connection.execute(
        `UPDATE web_users SET account_status='disabled',admin_status='disabled',roles_json='[\"Player\"]',permissions_json='[]',discord_id='',discord_username='',steam_id='',steam_persona='',deleted_at=NOW(),updated_by=:actor WHERE id=:id`,
        { id, actor: actor?.id || null },
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  users.delete(String(id));
  for (const [key, value] of providers.entries())
    if (String(value.user_id) === String(id)) providers.delete(key);
  return {
    ...publicUser(existing),
    account_status: "disabled",
    admin_status: "disabled",
    roles: ["Player"],
    permissions: [],
    deleted: true,
  };
}

export async function saveTermsAgreement({ userId, termsVersion, ipAddress }) {
  if (!userId || !termsVersion) return null;
  const row = {
    id: randomUUID(),
    user_id: userId,
    terms_version: termsVersion,
    agreed_at: nowIso(),
    ip_address: ipAddress || "",
  };
  if (databaseEnabled) {
    await query(
      `INSERT INTO user_terms_agreements (id, user_id, terms_version, agreed_at, ip_address)
       VALUES (:id, :user_id, :terms_version, :agreed_at, :ip_address)`,
      row,
    );
  }
  return row;
}

export async function getDevUser() {
  return masterUser;
}
