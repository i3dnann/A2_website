import { Router } from "express";
import { env } from "../config/env.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { drainFiveMActions, enqueueFiveMAction, getFiveMStatus, updateFiveMStatus } from "../services/repository.js";
import { auditAction } from "../services/audit.js";

const router = Router();

function requireFiveMToken(req, res, next) {
  const token = req.headers["x-a2-token"] || req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!env.FIVEM_API_TOKEN || token !== env.FIVEM_API_TOKEN) return res.status(401).json({ error: "invalid_fivem_token" });
  return next();
}

router.get("/status", (_req, res) => {
  res.json({ status: getFiveMStatus() });
});

router.post("/status", requireFiveMToken, (req, res) => {
  res.json({ status: updateFiveMStatus(req.body || {}) });
});

router.get("/actions", requireFiveMToken, (req, res) => {
  res.json({ actions: drainFiveMActions(Number(req.query.limit) || 20) });
});

router.post("/action-result", requireFiveMToken, (req, res) => {
  res.json({ ok: true, received: req.body || {} });
});

router.post(
  "/admin/actions",
  requireAuth,
  requirePermission("use_staff_panel"),
  asyncHandler(async (req, res) => {
    const { actionType, target, payload = {}, reason } = req.body || {};
    if (!reason && ["ban", "permanent_ban", "blacklist", "remove_blacklist", "change_money", "change_job", "change_gang", "change_whitelist"].includes(actionType)) {
      return res.status(400).json({ error: "reason_required" });
    }
    const action = enqueueFiveMAction({
      actionType,
      target,
      payload,
      reason,
      staff: {
        id: req.user.id,
        username: req.user.username,
        discord_id: req.user.discord_id
      }
    });
    await auditAction({ req, action: `queue_fivem_${actionType}`, targetType: "fivem_action", targetId: action.id, after: action, reason, webhookCategory: "admin" });
    res.status(201).json({ action });
  })
);

export default router;
