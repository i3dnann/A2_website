import { randomUUID } from "node:crypto";
import { query } from "../config/db.js";
import { databaseEnabled } from "../config/env.js";
import { getCharactersForAccount } from "./qbcoreService.js";
import { getUserById } from "./users.js";
import { safeJson, toBoolean } from "../utils/sanitize.js";

const requests = new Map();
const verifiedOverrides = new Map();
const REQUIRED_ACCOUNT_AGE_DAYS = 7;

function nowIso() {
  return new Date().toISOString();
}

function ageDaysFrom(user = {}) {
  const raw = user.created_at || user.first_login_at || "";
  const created = raw ? new Date(raw) : null;
  if (!created || Number.isNaN(created.getTime())) return 0;
  return Math.floor((Date.now() - created.getTime()) / (24 * 60 * 60 * 1000));
}

function normalizeRequest(row = {}) {
  return {
    ...row,
    id: String(row.id),
    user_id: String(row.user_id || ""),
    eligibility: row.eligibility || safeJson(row.eligibility_json, {}),
    status: row.status || "pending"
  };
}

async function latestRequestForUser(userId) {
  if (!userId) return null;
  if (databaseEnabled) {
    const rows = await query(
      `SELECT * FROM verification_requests
       WHERE user_id = :user_id AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      { user_id: userId }
    );
    if (rows?.[0]) return normalizeRequest(rows[0]);
  }
  const found = [...requests.values()]
    .filter((row) => String(row.user_id) === String(userId) && !row.deleted_at)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
  return found ? normalizeRequest(found) : null;
}

export function userIsVerified(user = {}) {
  return toBoolean(user.verified_badge || user.verifiedBadge || user.is_verified) || verifiedOverrides.get(String(user.id)) === true;
}

export async function getVerificationEligibility(user) {
  const characterResult = await getCharactersForAccount(user);
  const accountAgeDays = ageDaysFrom(user);
  const checks = {
    discordLinked: Boolean(user?.discord_id),
    steamLinked: Boolean(user?.steam_id),
    hasCharacter: (characterResult.characters || []).length > 0,
    registeredSevenDays: accountAgeDays >= REQUIRED_ACCOUNT_AGE_DAYS
  };
  const missing = [
    !checks.discordLinked ? "Connect Discord" : "",
    !checks.steamLinked ? "Connect Steam" : "",
    !checks.hasCharacter ? "Create or link a server character" : "",
    !checks.registeredSevenDays ? `Wait ${Math.max(REQUIRED_ACCOUNT_AGE_DAYS - accountAgeDays, 0)} more day(s)` : ""
  ].filter(Boolean);

  return {
    eligible: missing.length === 0,
    checks,
    missing,
    accountAgeDays,
    requiredAccountAgeDays: REQUIRED_ACCOUNT_AGE_DAYS,
    characterCount: (characterResult.characters || []).length,
    charactersNotFoundMessage: characterResult.message || "",
    latestRequest: await latestRequestForUser(user.id),
    verified: userIsVerified(user)
  };
}

export async function createVerificationRequest(user, reason = "") {
  const eligibility = await getVerificationEligibility(user);
  if (eligibility.verified) {
    throw Object.assign(new Error("Your account is already verified."), { status: 409 });
  }
  if (!eligibility.eligible) {
    throw Object.assign(new Error("You do not meet the verification requirements yet."), {
      status: 422,
      details: eligibility
    });
  }
  if (eligibility.latestRequest?.status === "pending") {
    throw Object.assign(new Error("You already have a pending verification request."), { status: 409 });
  }

  const row = {
    id: randomUUID(),
    user_id: user.id,
    status: "pending",
    reason: String(reason || "").slice(0, 1000),
    eligibility_json: JSON.stringify({
      checks: eligibility.checks,
      accountAgeDays: eligibility.accountAgeDays,
      characterCount: eligibility.characterCount
    }),
    created_by: user.id,
    updated_by: user.id,
    created_at: nowIso(),
    updated_at: nowIso(),
    deleted_at: null
  };

  if (databaseEnabled) {
    await query(
      `INSERT INTO verification_requests
       (id, user_id, status, reason, eligibility_json, created_by, updated_by)
       VALUES (:id, :user_id, :status, :reason, :eligibility_json, :created_by, :updated_by)`,
      row
    );
    await query("UPDATE web_users SET verification_status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = :user_id", { user_id: user.id });
  }
  requests.set(row.id, row);
  return normalizeRequest(row);
}

export async function listVerificationRequests({ status = "pending", q = "", limit = 200 } = {}) {
  const safeLimit = Math.min(Number(limit) || 200, 300);
  const safeStatus = String(status || "pending").toLowerCase();
  const search = String(q || "").trim();
  if (databaseEnabled) {
    const rows = await query(
      `SELECT r.*, u.username, u.email, u.discord_id, u.discord_username, u.steam_id, u.avatar_url, u.verified_badge
       FROM verification_requests r
       LEFT JOIN web_users u ON u.id = r.user_id
       WHERE r.deleted_at IS NULL
         AND (:status = 'all' OR r.status = :status)
         AND (:q = '' OR u.username LIKE :like OR u.email LIKE :like OR u.discord_id LIKE :like OR u.steam_id LIKE :like)
       ORDER BY FIELD(r.status, 'pending', 'approved', 'rejected'), r.created_at DESC
       LIMIT ${safeLimit}`,
      { status: safeStatus, q: search, like: `%${search}%` }
    );
    if (rows) return rows.map(normalizeRequest);
  }
  return [...requests.values()]
    .filter((row) => !row.deleted_at && (safeStatus === "all" || row.status === safeStatus))
    .map(normalizeRequest)
    .slice(0, safeLimit);
}

export async function setUserVerified(userId, verified, actor, { requestId = "", note = "", status = verified ? "approved" : "removed" } = {}) {
  const before = await getUserById(userId);
  if (!before) throw Object.assign(new Error("user_not_found"), { status: 404 });
  const nextStatus = verified ? "approved" : "none";
  if (databaseEnabled) {
    await query(
      `UPDATE web_users
       SET verified_badge = :verified_badge,
           verified_at = ${verified ? "COALESCE(verified_at, CURRENT_TIMESTAMP)" : "NULL"},
           verified_by = :verified_by,
           verification_status = :verification_status,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = :user_id`,
      {
        verified_badge: verified ? 1 : 0,
        verified_by: verified ? actor?.id || null : null,
        verification_status: nextStatus,
        user_id: userId
      }
    );
    if (requestId) {
      await query(
        `UPDATE verification_requests
         SET status = :status,
             reviewed_by = :reviewed_by,
             reviewed_at = CURRENT_TIMESTAMP,
             review_note = :review_note,
             updated_by = :reviewed_by
         WHERE id = :id`,
        { status, reviewed_by: actor?.id || null, review_note: String(note || "").slice(0, 1000), id: requestId }
      );
    }
  }
  verifiedOverrides.set(String(userId), Boolean(verified));
  if (requestId && requests.has(requestId)) {
    requests.set(requestId, { ...requests.get(requestId), status, reviewed_by: actor?.id || null, reviewed_at: nowIso(), review_note: note });
  }
  return { before, after: await getUserById(userId) || { ...before, verified_badge: verified ? 1 : 0, verification_status: nextStatus } };
}
