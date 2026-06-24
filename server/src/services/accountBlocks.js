import { randomUUID } from "node:crypto";
import { query } from "../config/db.js";
import { databaseEnabled } from "../config/env.js";

const memoryBlocks = [];
const memoryIps = new Map();
let ensured = false;

function nowIso() {
  return new Date().toISOString();
}

function normalizeIp(value = "") {
  return String(value || "").split(",")[0].trim();
}

async function ensureTables() {
  if (!databaseEnabled || ensured) return;
  ensured = true;
  await query(`CREATE TABLE IF NOT EXISTS web_account_blocks (
    id VARCHAR(64) PRIMARY KEY,
    blocked_user_id VARCHAR(64) NULL,
    email VARCHAR(190) NULL,
    discord_id VARCHAR(80) NULL,
    steam_id VARCHAR(80) NULL,
    ip_address VARCHAR(80) NULL,
    reason TEXT NULL,
    created_by VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active TINYINT(1) DEFAULT 1,
    INDEX idx_web_account_blocks_email (email),
    INDEX idx_web_account_blocks_discord (discord_id),
    INDEX idx_web_account_blocks_steam (steam_id),
    INDEX idx_web_account_blocks_ip (ip_address),
    INDEX idx_web_account_blocks_user (blocked_user_id)
  )`);
  await query(`CREATE TABLE IF NOT EXISTS web_user_ips (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    ip_address VARCHAR(80) NOT NULL,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_web_user_ip (user_id, ip_address),
    INDEX idx_web_user_ips_user (user_id),
    INDEX idx_web_user_ips_ip (ip_address)
  )`);
}

export async function recordUserIp(userId, ipAddress) {
  const ip = normalizeIp(ipAddress);
  if (!userId || !ip) return;
  if (databaseEnabled) {
    await ensureTables();
    await query(
      `INSERT INTO web_user_ips (id, user_id, ip_address) VALUES (:id, :user_id, :ip_address)
       ON DUPLICATE KEY UPDATE last_seen = CURRENT_TIMESTAMP`,
      { id: randomUUID(), user_id: userId, ip_address: ip }
    );
  }
  const list = memoryIps.get(String(userId)) || new Set();
  list.add(ip);
  memoryIps.set(String(userId), list);
}

async function knownIpsForUser(userId) {
  if (!userId) return [];
  const ips = new Set(memoryIps.get(String(userId)) || []);
  if (databaseEnabled) {
    await ensureTables();
    const rows = await query("SELECT ip_address FROM web_user_ips WHERE user_id = :user_id", { user_id: userId });
    (rows || []).forEach((row) => row.ip_address && ips.add(row.ip_address));
    const termsRows = await query("SELECT ip_address FROM user_terms_agreements WHERE user_id = :user_id AND ip_address <> ''", { user_id: userId });
    (termsRows || []).forEach((row) => row.ip_address && ips.add(row.ip_address));
  }
  return [...ips];
}

export async function blockUserIdentity(user = {}, actor = {}, reason = "Account banned") {
  await ensureTables();
  const ips = await knownIpsForUser(user.id);
  const entries = [
    { blocked_user_id: user.id, email: user.email || "", discord_id: "", steam_id: "", ip_address: "" },
    { blocked_user_id: user.id, email: "", discord_id: user.discord_id || "", steam_id: "", ip_address: "" },
    { blocked_user_id: user.id, email: "", discord_id: "", steam_id: user.steam_id || "", ip_address: "" },
    ...ips.map((ip) => ({ blocked_user_id: user.id, email: "", discord_id: "", steam_id: "", ip_address: ip }))
  ].filter((entry) => entry.email || entry.discord_id || entry.steam_id || entry.ip_address || entry.blocked_user_id);

  for (const entry of entries) {
    const row = { id: randomUUID(), reason, created_by: actor?.id || "", ...entry };
    if (databaseEnabled) {
      await query(
        `INSERT INTO web_account_blocks (id, blocked_user_id, email, discord_id, steam_id, ip_address, reason, created_by, active)
         VALUES (:id, :blocked_user_id, :email, :discord_id, :steam_id, :ip_address, :reason, :created_by, 1)`,
        row
      );
    }
    memoryBlocks.push({ ...row, active: 1, created_at: nowIso() });
  }
  return { entries: entries.length, ips };
}

export async function unblockUserIdentity(user = {}) {
  await ensureTables();
  const email = String(user.email || "").trim().toLowerCase();
  const discordId = String(user.discord_id || "");
  const steamId = String(user.steam_id || "");
  const ips = await knownIpsForUser(user.id);
  if (databaseEnabled) {
    await query(
      `UPDATE web_account_blocks SET active = 0 WHERE active = 1 AND (
        (:user_id <> '' AND blocked_user_id = :user_id) OR
        (:email <> '' AND LOWER(email) = :email) OR
        (:discord_id <> '' AND discord_id = :discord_id) OR
        (:steam_id <> '' AND steam_id = :steam_id) OR
        (ip_address IN (:ips))
      )`,
      { user_id: user.id || "", email, discord_id: discordId, steam_id: steamId, ips: ips.length ? ips : ["__no_ip__"] }
    );
  }
  memoryBlocks.forEach((entry) => {
    if ((user.id && entry.blocked_user_id === user.id) || (email && String(entry.email || "").toLowerCase() === email) || (discordId && entry.discord_id === discordId) || (steamId && entry.steam_id === steamId) || (entry.ip_address && ips.includes(entry.ip_address))) entry.active = 0;
  });
  return { ok: true };
}

export async function isAccountBlocked({ email = "", provider = "", providerUserId = "", ipAddress = "" } = {}) {
  await ensureTables();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const ip = normalizeIp(ipAddress);
  const discordId = provider === "discord" ? String(providerUserId || "") : "";
  const steamId = provider === "steam" ? String(providerUserId || "") : "";

  if (databaseEnabled) {
    const rows = await query(
      `SELECT * FROM web_account_blocks
       WHERE active = 1 AND (
         (:email <> '' AND LOWER(email) = :email) OR
         (:discord_id <> '' AND discord_id = :discord_id) OR
         (:steam_id <> '' AND steam_id = :steam_id) OR
         (:ip_address <> '' AND ip_address = :ip_address)
       )
       LIMIT 1`,
      { email: normalizedEmail, discord_id: discordId, steam_id: steamId, ip_address: ip }
    );
    if (rows?.[0]) return rows[0];
  }

  return memoryBlocks.find((entry) => entry.active && (
    (normalizedEmail && String(entry.email || "").toLowerCase() === normalizedEmail) ||
    (discordId && String(entry.discord_id || "") === discordId) ||
    (steamId && String(entry.steam_id || "") === steamId) ||
    (ip && String(entry.ip_address || "") === ip)
  )) || null;
}

export async function assertAccountNotBlocked(input = {}) {
  const block = await isAccountBlocked(input);
  if (block) throw Object.assign(new Error("account_or_ip_banned"), { status: 403 });
}
