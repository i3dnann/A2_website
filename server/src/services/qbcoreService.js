import { query } from "../config/db.js";
import { databaseEnabled } from "../config/env.js";
import { safeJson } from "../utils/sanitize.js";

const UNKNOWN = "Unknown";
const tableColumns = new Map();

function valueOrUnknown(value) {
  return value === undefined || value === null || value === "" ? UNKNOWN : value;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function safeTableName(table) {
  if (!/^[a-zA-Z0-9_]+$/.test(String(table || ""))) throw new Error("Unsafe table name");
  return table;
}

async function getTableColumns(table) {
  if (!databaseEnabled) return null;
  const safeTable = safeTableName(table);
  if (tableColumns.has(safeTable)) return tableColumns.get(safeTable);
  const rows = await query(`SHOW COLUMNS FROM ${safeTable}`);
  if (!rows) return null;
  const columns = new Set(rows.map((row) => row.Field));
  tableColumns.set(safeTable, columns);
  return columns;
}

function steam64ToHexIdentifier(steamId) {
  const raw = String(steamId || "").replace(/^steam:/, "").trim();
  if (!/^\d{15,20}$/.test(raw)) return "";
  try {
    return `steam:${BigInt(raw).toString(16)}`;
  } catch {
    return "";
  }
}

function normalizeIdentifier(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("steam:") || raw.startsWith("license:") || raw.startsWith("discord:") || raw.startsWith("fivem:")) return raw;
  if (/^\d{15,20}$/.test(raw)) return `steam:${raw}`;
  return raw;
}

function identifierVariants(value = "") {
  const normalized = normalizeIdentifier(value);
  if (!normalized) return [];
  const variants = [normalized];
  const hexSteam = steam64ToHexIdentifier(normalized);
  if (hexSteam) variants.push(hexSteam, hexSteam.replace(/^steam:/, ""));
  if (normalized.startsWith("steam:")) variants.push(normalized.replace(/^steam:/, ""));
  if (normalized.startsWith("discord:")) variants.push(normalized.replace(/^discord:/, ""));
  if (normalized.startsWith("citizenid:")) variants.push(normalized.replace(/^citizenid:/, ""));
  return unique(variants);
}

export function identifiersForAccount(account = {}) {
  return unique([
    account.steam_id ? `steam:${account.steam_id}` : "",
    account.discord_id ? `discord:${account.discord_id}` : "",
    ...(account.linked_identifiers || [])
  ].flatMap(identifierVariants));
}

export function parseQbcoreCharacter(row = {}) {
  const charinfo = safeJson(row.charinfo, {});
  const money = safeJson(row.money, {});
  const job = safeJson(row.job, {});
  const gang = safeJson(row.gang, {});
  const metadata = safeJson(row.metadata, {});

  const firstname = charinfo.firstname || "";
  const lastname = charinfo.lastname || "";
  const dirtyMoney = money.dirty || money.crypto || money.black_money || metadata.dirty_money || 0;

  return {
    citizenid: valueOrUnknown(row.citizenid),
    cid: valueOrUnknown(row.cid),
    license: valueOrUnknown(row.license),
    fullName: valueOrUnknown(`${firstname} ${lastname}`.trim() || row.name),
    firstName: valueOrUnknown(firstname),
    lastName: valueOrUnknown(lastname),
    gender: valueOrUnknown(charinfo.gender ?? charinfo.sex),
    phone: valueOrUnknown(charinfo.phone || charinfo.phone_number),
    birthdate: valueOrUnknown(charinfo.birthdate),
    nationality: valueOrUnknown(charinfo.nationality),
    jobName: valueOrUnknown(job.label || job.name),
    jobGrade: valueOrUnknown(job.grade?.name || job.grade?.level || job.grade),
    gang: valueOrUnknown(gang.label || gang.name || "None"),
    cash: Number(money.cash || 0),
    bank: Number(money.bank || 0),
    dirtyMoney: Number(dirtyMoney || 0),
    warnings: metadata.warnings || metadata.warns || [],
    lastUpdated: row.last_updated || row.updated_at || row.last_login || null,
    raw: { charinfo, money, job, gang, metadata }
  };
}

async function findPlayerLinksByIdentifiers(identifiers = []) {
  if (!databaseEnabled || !identifiers.length) return [];
  const columns = await getTableColumns("player_links");
  if (!columns) return [];
  const searchColumns = ["steam_id", "discord_id", "license", "fivem_id", "citizenid", "identifiers_json"].filter((column) => columns.has(column));
  if (!searchColumns.length) return [];
  const variants = unique(identifiers.flatMap(identifierVariants));
  const clauses = [];
  const params = {};

  variants.forEach((identifier, index) => {
    params[`link${index}`] = identifier;
    params[`linkLike${index}`] = `%${identifier}%`;
    const fieldClauses = searchColumns.map((column) => (column === "identifiers_json" ? `${column} LIKE :linkLike${index}` : `${column} = :link${index}`));
    clauses.push(`(${fieldClauses.join(" OR ")})`);
  });

  const deletedClause = columns.has("deleted_at") ? "AND deleted_at IS NULL" : "";
  const rows = await query(
    `SELECT * FROM player_links
     WHERE (${clauses.join(" OR ")}) ${deletedClause}
     ORDER BY ${columns.has("updated_at") ? "updated_at DESC" : "id DESC"}
     LIMIT 50`,
    params
  );
  return rows || [];
}

async function findPlayersByIdentifiers(identifiers = []) {
  if (!databaseEnabled) {
    if (!identifiers.length) return [];
    return [
      parseQbcoreCharacter({
        citizenid: "A2DEMO1",
        cid: 1,
        license: "license:demo",
        name: "Maya Knox",
        charinfo: JSON.stringify({ firstname: "Maya", lastname: "Knox", gender: "Female", phone: "555-0101", birthdate: "1998-06-21", nationality: "Swedish" }),
        money: JSON.stringify({ cash: 1800, bank: 32000, dirty: 0 }),
        job: JSON.stringify({ name: "police", label: "Police", grade: { name: "Cadet", level: 1 } }),
        gang: JSON.stringify({ name: "none", label: "None" }),
        metadata: JSON.stringify({ warnings: [] })
      })
    ];
  }

  if (!identifiers.length) return [];
  const columns = await getTableColumns("players");
  const selectFields = ["citizenid", "cid", "license", "name", "money", "charinfo", "job", "gang", "metadata", "last_updated", "updated_at", "last_login"]
    .filter((field) => !columns || columns.has(field));
  const searchable = ["license", "license2", "name", "metadata", "citizenid", "steam", "steam_id", "discord", "discord_id", "fivem"]
    .filter((field) => !columns || columns.has(field));
  if (!selectFields.length || !searchable.length) return [];

  const variants = unique(identifiers.flatMap(identifierVariants));
  const likeClauses = variants.map((_, index) => {
    const parts = searchable.map((field) => (field === "citizenid" ? `${field} = :citizen${index}` : `${field} LIKE :id${index}`));
    return `(${parts.join(" OR ")})`;
  });
  const params = Object.fromEntries(
    variants.flatMap((identifier, index) => [
      [`id${index}`, `%${identifier}%`],
      [`citizen${index}`, identifier.replace(/^citizenid:/, "")]
    ])
  );

  const rows = await query(
    `SELECT ${selectFields.join(", ")}
     FROM players
     WHERE ${likeClauses.join(" OR ")}
     LIMIT 25`,
    params
  );
  return (rows || []).map(parseQbcoreCharacter);
}

export async function findPlayerBySteamId(steamId) {
  return findPlayersByIdentifiers([`steam:${steamId}`, steamId]);
}

export async function findPlayerByDiscordId(discordId) {
  return findPlayersByIdentifiers([`discord:${discordId}`, discordId]);
}

export async function findPlayerByLicense(license) {
  return findPlayersByIdentifiers([license]);
}

export async function getCharactersForAccount(account) {
  if (!account?.steam_id) {
    return {
      requiresSteam: true,
      message: "Connect your Steam account to view your FiveM characters and stats.",
      characters: [],
      identifiers: identifiersForAccount(account)
    };
  }

  const identifiers = identifiersForAccount(account);
  const linkRows = await findPlayerLinksByIdentifiers(identifiers);
  const linkedIdentifiers = unique([
    ...identifiers,
    ...linkRows.flatMap((row) => {
      const savedIdentifiers = safeJson(row.identifiers_json, []);
      return [
        row.steam_id ? `steam:${String(row.steam_id).replace(/^steam:/, "")}` : "",
        row.discord_id ? `discord:${String(row.discord_id).replace(/^discord:/, "")}` : "",
        row.license,
        row.fivem_id ? `fivem:${String(row.fivem_id).replace(/^fivem:/, "")}` : "",
        row.citizenid ? `citizenid:${row.citizenid}` : "",
        ...(Array.isArray(savedIdentifiers) ? savedIdentifiers : [])
      ];
    })
  ]);
  const characters = await findPlayersByIdentifiers(linkedIdentifiers);
  return {
    requiresSteam: false,
    notFound: characters.length === 0,
    message:
      characters.length === 0
        ? "We could not find any FiveM character connected to this Steam/Discord account. Please make sure you joined the server at least once."
        : "",
    characters,
    identifiers: linkedIdentifiers
  };
}

export async function getCharacterStats(citizenid) {
  if (!citizenid) return null;
  const rows = databaseEnabled
    ? await query(
        `SELECT citizenid, cid, license, name, money, charinfo, job, gang, metadata, last_updated, updated_at, last_login
         FROM players WHERE citizenid = :citizenid LIMIT 1`,
        { citizenid }
      )
    : null;
  return rows?.[0] ? parseQbcoreCharacter(rows[0]) : null;
}

export async function getPlayerVehicles(citizenid) {
  if (!citizenid || !databaseEnabled) return [];
  const rows = await query("SELECT plate, vehicle, garage, state, mods FROM player_vehicles WHERE citizenid = :citizenid LIMIT 100", { citizenid });
  return rows || [];
}

async function checkWebsiteBanTables(identifiers = []) {
  if (!databaseEnabled || !identifiers.length) return null;
  const like = `%${identifiers.join("%")}%`;
  const params = { like };

  const blacklist = await query(
    `SELECT id, reason, created_at
     FROM player_blacklists
     WHERE active = 1 AND deleted_at IS NULL
       AND (license LIKE :like OR steam_id LIKE :like OR discord_id LIKE :like OR citizenid LIKE :like)
     ORDER BY created_at DESC LIMIT 1`,
    params
  );
  if (blacklist?.[0]) return { status: "Blacklisted", banId: blacklist[0].id, reason: blacklist[0].reason, expiresAt: null, type: "blacklist" };

  const ban = await query(
    `SELECT id, reason, expires_at, ban_type
     FROM player_bans
     WHERE active = 1 AND deleted_at IS NULL
       AND (license LIKE :like OR steam_id LIKE :like OR discord_id LIKE :like OR citizenid LIKE :like)
     ORDER BY created_at DESC LIMIT 1`,
    params
  );
  if (ban?.[0]) {
    const permanent = !ban[0].expires_at;
    return {
      status: permanent ? "Permanently banned" : "Temporarily banned",
      banId: ban[0].id,
      reason: ban[0].reason,
      expiresAt: ban[0].expires_at,
      type: ban[0].ban_type || (permanent ? "permanent" : "temporary")
    };
  }
  return null;
}

async function checkCommonBanTables(identifiers = []) {
  if (!databaseEnabled || !identifiers.length) return null;
  const needle = `%${identifiers.join("%")}%`;
  const rows = await query(
    `SELECT id, reason, expire, expires_at, name
     FROM bans
     WHERE (license LIKE :needle OR discord LIKE :needle OR steam LIKE :needle OR ids LIKE :needle OR citizenid LIKE :needle)
     ORDER BY id DESC LIMIT 1`,
    { needle }
  );
  if (!rows?.[0]) return null;
  const expiresAt = rows[0].expires_at || rows[0].expire || null;
  const permanent = !expiresAt || Number(expiresAt) === 2147483647;
  return {
    status: permanent ? "Permanently banned" : "Temporarily banned",
    banId: rows[0].id,
    reason: rows[0].reason || "Unknown",
    expiresAt,
    type: permanent ? "permanent" : "temporary"
  };
}

export async function getBanStatus(identifiers = []) {
  const safeIdentifiers = identifiers.map(normalizeIdentifier).filter(Boolean);
  const websiteBan = await checkWebsiteBanTables(safeIdentifiers);
  if (websiteBan) return websiteBan;
  const commonBan = await checkCommonBanTables(safeIdentifiers);
  if (commonBan) return commonBan;
  return { status: "Not banned", banId: null, reason: "", expiresAt: null, type: "none" };
}
