import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getUserById, listWebUsers, deactivateWebUser, resetUserPassword, upsertWebUserFromAdmin } from "../services/users.js";
import { blockUserIdentity, unblockUserIdentity } from "../services/accountBlocks.js";
import { auditAction } from "../services/audit.js";

const router = Router();

router.use(requireAuth, requirePermission("manage_users"));

router.get("/users", asyncHandler(async (req, res) => {
  const rows = await listWebUsers({ q: req.query.q || "", limit: req.query.limit || 200 });
  res.json({ rows, total: rows.length });
}));

router.post("/users/:id/ban", asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: "user_not_found" });
  const reason = req.body?.reason || "Banned by admin";
  await blockUserIdentity(user, req.user, reason);
  const banned = await upsertWebUserFromAdmin({ ...user, account_status: "banned", admin_status: "disabled" }, req.user);
  await auditAction({ req, action: "ban_web_user", targetType: "web_users", targetId: user.id, before: user, after: banned, reason, webhookCategory: "security" });
  res.json({ user: banned });
}));

router.post("/users/:id/unban", asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: "user_not_found" });
  await unblockUserIdentity(user);
  const active = await upsertWebUserFromAdmin({ ...user, account_status: "active", admin_status: "active" }, req.user);
  await auditAction({ req, action: "unban_web_user", targetType: "web_users", targetId: user.id, before: user, after: active, reason: req.body?.reason || "Unbanned by admin", webhookCategory: "security" });
  res.json({ user: active });
}));

router.post("/users/:id/activate", asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: "user_not_found" });
  const active = await upsertWebUserFromAdmin({ ...user, account_status: "active", admin_status: "active" }, req.user);
  await auditAction({ req, action: "activate_web_user", targetType: "web_users", targetId: user.id, before: user, after: active, reason: req.body?.reason || "Activated by admin", webhookCategory: "security" });
  res.json({ user: active });
}));

router.post("/users/:id/deactivate", asyncHandler(async (req, res) => {
  const before = await getUserById(req.params.id);
  const user = await deactivateWebUser(req.params.id, req.user);
  if (!user) return res.status(404).json({ error: "user_not_found" });
  await auditAction({ req, action: "deactivate_web_user", targetType: "web_users", targetId: user.id, before, after: user, reason: req.body?.reason || "Deactivated by admin", webhookCategory: "security" });
  res.json({ user });
}));

router.post("/users/:id/password", asyncHandler(async (req, res) => {
  const password = String(req.body?.password || "");
  if (password.length < 8) return res.status(422).json({ error: "weak_password", message: "Password must be at least 8 characters." });
  const before = await getUserById(req.params.id);
  const user = await resetUserPassword(req.params.id, password, req.user);
  if (!user) return res.status(404).json({ error: "user_not_found" });
  await auditAction({ req, action: "reset_user_password", targetType: "web_users", targetId: user.id, before, after: { id: user.id }, reason: req.body?.reason || "Password reset by admin", webhookCategory: "security" });
  res.json({ user });
}));

router.delete("/users/:id", asyncHandler(async (req, res) => {
  const before = await getUserById(req.params.id);
  const user = await deactivateWebUser(req.params.id, req.user);
  if (!user) return res.status(404).json({ error: "user_not_found" });
  await auditAction({ req, action: "delete_web_user", targetType: "web_users", targetId: user.id, before, after: user, reason: req.body?.reason || "Deleted by admin", webhookCategory: "security" });
  res.json({ user });
}));

export default router;
