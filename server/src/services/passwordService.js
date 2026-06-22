import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import { databaseEnabled } from "../config/env.js";

export async function changeOwnPassword({ userId, currentPassword = "", newPassword }) {
  if (!userId) throw Object.assign(new Error("login_required"), { status: 401 });
  if (!newPassword || String(newPassword).length < 8) throw Object.assign(new Error("new_password_too_short"), { status: 422 });

  if (!databaseEnabled) {
    throw Object.assign(new Error("password_change_requires_database"), { status: 503 });
  }

  const rows = await query("SELECT id, password_hash FROM web_users WHERE id = :id AND deleted_at IS NULL LIMIT 1", { id: userId });
  const user = rows?.[0];
  if (!user) throw Object.assign(new Error("user_not_found"), { status: 404 });

  if (user.password_hash) {
    const ok = await bcrypt.compare(String(currentPassword || ""), user.password_hash);
    if (!ok) throw Object.assign(new Error("current_password_invalid"), { status: 401 });
  }

  const password_hash = await bcrypt.hash(String(newPassword), 12);
  await query("UPDATE web_users SET password_hash = :password_hash, updated_at = CURRENT_TIMESTAMP WHERE id = :id", {
    id: userId,
    password_hash
  });

  return { ok: true };
}
