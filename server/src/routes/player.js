import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createResource, listResource } from "../services/repository.js";
import { getQbPlayerByCitizenId } from "../services/qbcore.js";
import { auditAction } from "../services/audit.js";

const router = Router();
router.use(requireAuth, requirePermission("view_player_portal"));

router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const citizenids = req.user.linked_citizenids || [];
    const characters = await Promise.all(citizenids.map(getQbPlayerByCitizenId));
    const [tickets, appeals, applications] = await Promise.all([
      listResource("tickets", { q: req.user.discord_id, limit: 10 }),
      listResource("banAppeals", { q: req.user.discord_id, limit: 10 }),
      listResource("whitelistApplications", { q: req.user.discord_id, limit: 10 })
    ]);
    res.json({
      user: req.user,
      characters: characters.filter(Boolean),
      tickets: tickets.rows,
      banAppeals: appeals.rows,
      whitelistApplications: applications.rows,
      recentActivity: []
    });
  })
);

router.post(
  "/tickets",
  asyncHandler(async (req, res) => {
    const row = await createResource("tickets", { ...req.body, discord_id: req.user.discord_id, created_by_user_id: req.user.id, status: "Open" }, req.user);
    await auditAction({ req, action: "player_create_ticket", targetType: "tickets", targetId: row.id, after: row, reason: "player ticket", webhookCategory: "tickets" });
    res.status(201).json({ row });
  })
);

router.post(
  "/whitelist",
  requirePermission("submit_whitelist"),
  asyncHandler(async (req, res) => {
    const row = await createResource("whitelistApplications", {
      ...req.body,
      discord_id: req.user.discord_id,
      discord_username: req.user.discord_username,
      status: req.body?.status === "Draft" ? "Draft" : "Submitted"
    }, req.user);
    await auditAction({ req, action: "submit_whitelist", targetType: "whitelist_applications", targetId: row.id, after: row, reason: "player whitelist application", webhookCategory: "whitelist" });
    res.status(201).json({ row });
  })
);

router.post(
  "/ban-appeals",
  asyncHandler(async (req, res) => {
    const row = await createResource("banAppeals", { ...req.body, discord_id: req.user.discord_id, status: "Submitted" }, req.user);
    await auditAction({ req, action: "submit_ban_appeal", targetType: "ban_appeals", targetId: row.id, after: row, reason: "player ban appeal", webhookCategory: "banAppeals" });
    res.status(201).json({ row });
  })
);

export default router;
