import { randomUUID } from "node:crypto";
import { query } from "../config/db.js";
import { databaseEnabled } from "../config/env.js";

const memoryGallery = [];
let tableChecked = false;

async function ensureGalleryTable() {
  if (!databaseEnabled || tableChecked) return;
  await query(`CREATE TABLE IF NOT EXISTS gallery_photos (
    id VARCHAR(64) PRIMARY KEY,
    image_url TEXT NOT NULL,
    storage_public_id VARCHAR(255) NULL,
    storage_resource_type VARCHAR(32) NULL,
    status VARCHAR(32) DEFAULT 'Pending',
    submitted_by VARCHAR(64) NULL,
    uploader_username VARCHAR(255) NULL,
    uploader_discord_id VARCHAR(64) NULL,
    reviewed_by VARCHAR(64) NULL,
    reviewed_at DATETIME NULL,
    created_by VARCHAR(64) NULL,
    updated_by VARCHAR(64) NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL
  )`);
  await query("ALTER TABLE gallery_photos ADD COLUMN IF NOT EXISTS storage_public_id VARCHAR(255) NULL").catch(() => null);
  await query("ALTER TABLE gallery_photos ADD COLUMN IF NOT EXISTS storage_resource_type VARCHAR(32) NULL").catch(() => null);
  tableChecked = true;
}

function now() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function normalize(row) {
  if (!row) return row;
  return { ...row, id: String(row.id) };
}

export function publicGalleryPhoto(row = {}) {
  return {
    id: String(row.id),
    image_url: row.image_url || "",
    status: row.status || "Approved",
    created_at: row.created_at || null
  };
}

function userMeta(user = {}) {
  return {
    submitted_by: user.id || null,
    uploader_username: user.username || user.email || user.discord_username || "Unknown user",
    uploader_discord_id: user.discord_id || ""
  };
}

export async function listGalleryPhotos({ status = "", q = "", limit = 200 } = {}) {
  await ensureGalleryTable();
  if (databaseEnabled) {
    const clauses = ["deleted_at IS NULL"];
    const params = { limit: Number(limit) || 200 };
    if (status) {
      clauses.push("status = :status");
      params.status = status;
    }
    if (q) {
      clauses.push("(uploader_username LIKE :q OR uploader_discord_id LIKE :q OR status LIKE :q)");
      params.q = `%${q}%`;
    }
    const rows = await query(`SELECT * FROM gallery_photos WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC LIMIT :limit`, params);
    if (rows) return rows.map(normalize);
  }
  const needle = String(q || "").toLowerCase();
  return memoryGallery
    .filter((row) => !row.deleted_at)
    .filter((row) => !status || row.status === status)
    .filter((row) => !needle || `${row.uploader_username} ${row.uploader_discord_id} ${row.status}`.toLowerCase().includes(needle))
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, Number(limit) || 200);
}

export async function getGalleryPhoto(id) {
  await ensureGalleryTable();
  if (databaseEnabled) {
    const rows = await query("SELECT * FROM gallery_photos WHERE id = :id AND deleted_at IS NULL LIMIT 1", { id });
    if (rows?.[0]) return normalize(rows[0]);
  }
  return memoryGallery.find((row) => String(row.id) === String(id) && !row.deleted_at) || null;
}

export async function createGalleryPhoto(payload, actor, forcedStatus = "Approved") {
  await ensureGalleryTable();
  const row = {
    id: randomUUID(),
    image_url: payload.image_url,
    storage_public_id: payload.storage_public_id || null,
    storage_resource_type: payload.storage_resource_type || "image",
    status: forcedStatus,
    ...userMeta(payload.user || actor),
    reviewed_by: forcedStatus === "Pending" ? null : actor?.id || null,
    reviewed_at: forcedStatus === "Pending" ? null : now(),
    created_by: actor?.id || null,
    updated_by: actor?.id || null,
    created_at: now(),
    updated_at: now(),
    deleted_at: null
  };
  if (databaseEnabled) {
    const result = await query(
      `INSERT INTO gallery_photos (id, image_url, storage_public_id, storage_resource_type, status, submitted_by, uploader_username, uploader_discord_id, reviewed_by, reviewed_at, created_by, updated_by, created_at, updated_at, deleted_at)
       VALUES (:id, :image_url, :storage_public_id, :storage_resource_type, :status, :submitted_by, :uploader_username, :uploader_discord_id, :reviewed_by, :reviewed_at, :created_by, :updated_by, :created_at, :updated_at, :deleted_at)`,
      row
    );
    if (result) return row;
  }
  memoryGallery.push(row);
  return row;
}

export async function reviewGalleryPhoto(id, status, actor) {
  const before = await getGalleryPhoto(id);
  if (!before) return null;
  const patch = { status, reviewed_by: actor?.id || null, reviewed_at: now(), updated_by: actor?.id || null, updated_at: now() };
  if (databaseEnabled) {
    const result = await query(
      "UPDATE gallery_photos SET status = :status, reviewed_by = :reviewed_by, reviewed_at = :reviewed_at, updated_by = :updated_by, updated_at = :updated_at WHERE id = :id",
      { ...patch, id }
    );
    if (result) return { before, after: { ...before, ...patch } };
  }
  const index = memoryGallery.findIndex((row) => String(row.id) === String(id));
  memoryGallery[index] = { ...memoryGallery[index], ...patch };
  return { before, after: memoryGallery[index] };
}

export async function deleteGalleryPhoto(id, actor) {
  const before = await getGalleryPhoto(id);
  if (!before) return null;
  const patch = { deleted_at: now(), updated_by: actor?.id || null, updated_at: now() };
  if (databaseEnabled) {
    const result = await query("UPDATE gallery_photos SET deleted_at = :deleted_at, updated_by = :updated_by, updated_at = :updated_at WHERE id = :id", { ...patch, id });
    if (result) return before;
  }
  const index = memoryGallery.findIndex((row) => String(row.id) === String(id));
  memoryGallery[index] = { ...memoryGallery[index], ...patch };
  return before;
}
