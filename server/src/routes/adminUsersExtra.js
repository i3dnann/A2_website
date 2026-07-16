import { Router } from "express";
import { highestRoleRank, isMasterAdmin } from "../data/permissions.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getUserById,
  listWebUsers,
  deactivateWebUser,
  deleteWebUser,
  resetUserPassword,
  unlinkProviderForUser,
  upsertWebUserFromAdmin,
} from "../services/users.js";
import {
  blockUserIdentity,
  unblockUserIdentity,
} from "../services/accountBlocks.js";
import { auditAction } from "../services/audit.js";
import {
  listVerificationRequests,
  setUserVerified,
} from "../services/verificationService.js";

const router = Router();

router.use(requireAuth, requirePermission("manage_users"));

function canManageTargetUser(actor, target) {
  if (!target) return true;
  if (isMasterAdmin(actor)) return true;
  return highestRoleRank(target) === 0;
}

function rejectProtectedTarget(res) {
  return res.status(403).json({ error: "target_admin_rank_too_high" });
}

async function requireManageableTarget(req, res) {
  const user = await getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: "user_not_found" });
    return null;
  }
  if (!canManageTargetUser(req.user, user)) {
    rejectProtectedTarget(res);
    return null;
  }
  return user;
}

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const rows = await listWebUsers({
      q: req.query.q || "",
      limit: req.query.limit || 200,
    });
    res.json({ rows, total: rows.length });
  }),
);

router.get(
  "/verification-requests",
  asyncHandler(async (req, res) => {
    const rows = await listVerificationRequests({
      status: req.query.status || "pending",
      q: req.query.q || "",
      limit: req.query.limit || 200,
    });
    res.json({ rows, total: rows.length });
  }),
);

router.post(
  "/verification-requests/:id/approve",
  asyncHandler(async (req, res) => {
    const rows = await listVerificationRequests({ status: "all", limit: 300 });
    const request = rows.find(
      (row) => String(row.id) === String(req.params.id),
    );
    if (!request)
      return res.status(404).json({ error: "verification_request_not_found" });
    const result = await setUserVerified(request.user_id, true, req.user, {
      requestId: request.id,
      note: req.body?.note || "",
      status: "approved",
    });
    await auditAction({
      req,
      action: "approve_account_verification",
      targetType: "web_users",
      targetId: request.user_id,
      before: result.before,
      after: result.after,
      reason: req.body?.note || "verification approved",
      webhookCategory: "security",
    });
    res.json({ user: result.after });
  }),
);

router.post(
  "/verification-requests/:id/reject",
  asyncHandler(async (req, res) => {
    const rows = await listVerificationRequests({ status: "all", limit: 300 });
    const request = rows.find(
      (row) => String(row.id) === String(req.params.id),
    );
    if (!request)
      return res.status(404).json({ error: "verification_request_not_found" });
    const result = await setUserVerified(request.user_id, false, req.user, {
      requestId: request.id,
      note: req.body?.note || "",
      status: "rejected",
    });
    await auditAction({
      req,
      action: "reject_account_verification",
      targetType: "web_users",
      targetId: request.user_id,
      before: result.before,
      after: result.after,
      reason: req.body?.note || "verification rejected",
      webhookCategory: "security",
    });
    res.json({ user: result.after });
  }),
);

router.post(
  "/users/:id/verify",
  asyncHandler(async (req, res) => {
    const result = await setUserVerified(req.params.id, true, req.user, {
      note: req.body?.note || "manual verification",
      status: "approved",
    });
    await auditAction({
      req,
      action: "grant_verified_badge",
      targetType: "web_users",
      targetId: req.params.id,
      before: result.before,
      after: result.after,
      reason: req.body?.note || "manual verification",
      webhookCategory: "security",
    });
    res.json({ user: result.after });
  }),
);

router.post(
  "/users/:id/unverify",
  asyncHandler(async (req, res) => {
    const result = await setUserVerified(req.params.id, false, req.user, {
      note: req.body?.note || "verified badge removed",
      status: "removed",
    });
    await auditAction({
      req,
      action: "remove_verified_badge",
      targetType: "web_users",
      targetId: req.params.id,
      before: result.before,
      after: result.after,
      reason: req.body?.note || "verified badge removed",
      webhookCategory: "security",
    });
    res.json({ user: result.after });
  }),
);

router.post(
  "/users/:id/unlink/:provider",
  asyncHandler(async (req, res) => {
    const provider = String(req.params.provider || "").toLowerCase();
    if (!["discord", "steam"].includes(provider))
      return res.status(422).json({ error: "unsupported_provider" });
    const before = await requireManageableTarget(req, res);
    if (!before) return;
    const user = await unlinkProviderForUser(req.params.id, provider, req.user);
    await auditAction({
      req,
      action: `unlink_${provider}_account`,
      targetType: "web_users",
      targetId: req.params.id,
      before,
      after: user,
      reason: req.body?.reason || `${provider} disconnected by admin`,
      webhookCategory: "security",
    });
    res.json({ user });
  }),
);

router.post(
  "/users/:id/ban",
  asyncHandler(async (req, res) => {
    const user = await requireManageableTarget(req, res);
    if (!user) return;
    const reason = req.body?.reason || "Banned by admin";
    await blockUserIdentity(user, req.user, reason);
    const banned = await upsertWebUserFromAdmin(
      { ...user, account_status: "banned", admin_status: "disabled" },
      req.user,
    );
    await auditAction({
      req,
      action: "ban_web_user",
      targetType: "web_users",
      targetId: user.id,
      before: user,
      after: banned,
      reason,
      webhookCategory: "security",
    });
    res.json({ user: banned });
  }),
);

router.post(
  "/users/:id/unban",
  asyncHandler(async (req, res) => {
    const user = await requireManageableTarget(req, res);
    if (!user) return;
    await unblockUserIdentity(user);
    const active = await upsertWebUserFromAdmin(
      { ...user, account_status: "active", admin_status: "active" },
      req.user,
    );
    await auditAction({
      req,
      action: "unban_web_user",
      targetType: "web_users",
      targetId: user.id,
      before: user,
      after: active,
      reason: req.body?.reason || "Unbanned by admin",
      webhookCategory: "security",
    });
    res.json({ user: active });
  }),
);

router.post(
  "/users/:id/activate",
  asyncHandler(async (req, res) => {
    const user = await requireManageableTarget(req, res);
    if (!user) return;
    const active = await upsertWebUserFromAdmin(
      { ...user, account_status: "active", admin_status: "active" },
      req.user,
    );
    await auditAction({
      req,
      action: "activate_web_user",
      targetType: "web_users",
      targetId: user.id,
      before: user,
      after: active,
      reason: req.body?.reason || "Activated by admin",
      webhookCategory: "security",
    });
    res.json({ user: active });
  }),
);

router.post(
  "/users/:id/deactivate",
  asyncHandler(async (req, res) => {
    const before = await requireManageableTarget(req, res);
    if (!before) return;
    const user = await deactivateWebUser(req.params.id, req.user);
    if (!user) return res.status(404).json({ error: "user_not_found" });
    await auditAction({
      req,
      action: "deactivate_web_user",
      targetType: "web_users",
      targetId: user.id,
      before,
      after: user,
      reason: req.body?.reason || "Deactivated by admin",
      webhookCategory: "security",
    });
    res.json({ user });
  }),
);

router.post(
  "/users/:id/password",
  asyncHandler(async (req, res) => {
    const password = String(req.body?.password || "");
    if (password.length < 8)
      return res
        .status(422)
        .json({
          error: "weak_password",
          message: "Password must be at least 8 characters.",
        });
    const before = await requireManageableTarget(req, res);
    if (!before) return;
    const user = await resetUserPassword(req.params.id, password, req.user);
    if (!user) return res.status(404).json({ error: "user_not_found" });
    await auditAction({
      req,
      action: "reset_user_password",
      targetType: "web_users",
      targetId: user.id,
      before,
      after: { id: user.id },
      reason: req.body?.reason || "Password reset by admin",
      webhookCategory: "security",
    });
    res.json({ user });
  }),
);

router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    if (String(req.params.id) === String(req.user.id)) {
      return res
        .status(400)
        .json({
          error: "cannot_delete_self",
          message: "You cannot delete your own account while logged in.",
        });
    }
    const before = await requireManageableTarget(req, res);
    if (!before) return;
    await blockUserIdentity(
      before,
      req.user,
      req.body?.reason || "Deleted by admin",
    );
    const user = await deleteWebUser(req.params.id, req.user);
    if (!user) return res.status(404).json({ error: "user_not_found" });
    await auditAction({
      req,
      action: "delete_web_user",
      targetType: "web_users",
      targetId: user.id,
      before,
      after: user,
      reason: req.body?.reason || "Deleted by admin",
      webhookCategory: "security",
    });
    res.json({ user });
  }),
);

export default router;
export const __adminUsersExtraTest = { canManageTargetUser };
