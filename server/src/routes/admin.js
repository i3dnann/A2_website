import { Router } from "express";
import { z } from "zod";
import { RESOURCE_DEFINITIONS, RESOURCE_MAP } from "../data/catalog.js";
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS, ROLES } from "../data/permissions.js";
import { requireAuth, requireMaster, requirePermission } from "../middleware/auth.js";
import { upload } from "../middleware/security.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createResource, deleteResource, getResource, getSettings, listResource, updateResource, updateSettings } from "../services/repository.js";
import { auditAction } from "../services/audit.js";
import { checkAllStreamers, checkStreamerLiveStatus, withLiveStatus } from "../services/streamerService.js";
import { publicFileUrl } from "../utils/sanitize.js";

const router = Router();
const settingsSchema = z.record(z.any());

router.use(requireAuth, requirePermission("use_staff_panel"));

router.get("/dashboard", asyncHandler(async (_req, res) => {
  const [tickets, whitelist, appeals, streamers, logs] = await Promise.all([
    listResource("tickets", { limit: 5 }),
    listResource("whitelistApplications", { limit: 5 }),
    listResource("banAppeals", { limit: 5 }),
    listResource("streamers", { limit: 5 }),
    listResource("auditLogs", { limit: 10 })
  ]);
  res.json({
    cards: [
      { label: "Open tickets", value: tickets.total },
      { label: "Whitelist reviews", value: whitelist.total },
      { label: "Ban appeals", value: appeals.total },
      { label: "Streamers", value: streamers.total }
    ],
    recentLogs: logs.rows
  });
}));

router.get("/settings", requirePermission("edit_website_settings"), (_req, res) => {
  res.json({ settings: getSettings() });
});

router.patch(
  "/settings",
  requirePermission("edit_website_settings"),
  asyncHandler(async (req, res) => {
    const patch = settingsSchema.parse(req.body || {});
    const { before, after } = updateSettings(patch, req.user);
    await auditAction({
      req,
      action: "update_website_settings",
      targetType: "web_settings",
      targetId: "global",
      before,
      after,
      reason: req.body?.reason || "settings update",
      webhookCategory: "admin"
    });
    res.json({ settings: after });
  })
);

router.get("/permissions", requirePermission("manage_admins"), (_req, res) => {
  res.json({ roles: ROLES, permissions: PERMISSIONS, defaults: DEFAULT_ROLE_PERMISSIONS });
});

router.patch("/dangerous/master-only", requireMaster, asyncHandler(async (req, res) => {
  await auditAction({
    req,
    action: "master_only_change",
    targetType: req.body?.targetType || "system",
    targetId: req.body?.targetId || "",
    reason: req.body?.reason || "master action",
    after: req.body || {},
    webhookCategory: "security"
  });
  res.json({ ok: true });
}));

router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return res.json({ results: [] });
    const results = [];
    for (const resource of RESOURCE_DEFINITIONS) {
      if (!req.user.permissions.includes("master_access") && !req.user.permissions.includes(resource.permission)) continue;
      const { rows } = await listResource(resource.key, { q, limit: 5 });
      rows.forEach((row) => results.push({ resource: resource.key, label: resource.label, id: row.id, title: row.title || row.name || row.display_name || row.character_name || row.id, row }));
    }
    res.json({ results });
  })
);

router.post("/uploads", requirePermission("edit_website_settings"), upload.single("file"), (req, res) => {
  res.json({ url: publicFileUrl(req, req.file), file: req.file });
});

router.get(
  "/streamers",
  requirePermission("manage_streamers"),
  asyncHandler(async (req, res) => {
    const { rows, total } = await listResource("streamers", { q: req.query.q || "", limit: req.query.limit || 50, offset: req.query.offset || 0 });
    res.json({ rows: await withLiveStatus(rows), total });
  })
);

router.post(
  "/streamers",
  requirePermission("manage_streamers"),
  asyncHandler(async (req, res) => {
    const row = await createResource("streamers", req.body, req.user);
    await auditAction({ req, action: "create_streamer", targetType: "streamers", targetId: row.id, after: row, reason: req.body?.reason || "streamer created", webhookCategory: "streamers" });
    res.status(201).json({ row });
  })
);

router.patch(
  "/streamers/:id",
  requirePermission("manage_streamers"),
  asyncHandler(async (req, res) => {
    const result = await updateResource("streamers", req.params.id, req.body, req.user);
    if (!result) return res.status(404).json({ error: "streamer_not_found" });
    await auditAction({ req, action: "update_streamer", targetType: "streamers", targetId: req.params.id, before: result.before, after: result.after, reason: req.body?.reason || "streamer updated", webhookCategory: "streamers" });
    res.json({ row: result.after });
  })
);

router.delete(
  "/streamers/:id",
  requirePermission("manage_streamers"),
  asyncHandler(async (req, res) => {
    const before = await deleteResource("streamers", req.params.id, req.user);
    if (!before) return res.status(404).json({ error: "streamer_not_found" });
    await auditAction({ req, action: "remove_streamer", targetType: "streamers", targetId: req.params.id, before, reason: req.body?.reason || "streamer removed", webhookCategory: "streamers" });
    res.json({ ok: true });
  })
);

router.post("/streamers/check", requirePermission("manage_streamers"), asyncHandler(async (_req, res) => {
  await checkAllStreamers();
  res.json({ ok: true });
}));

router.post("/streamers/:id/check", requirePermission("manage_streamers"), asyncHandler(async (req, res) => {
  const streamer = await getResource("streamers", req.params.id);
  if (!streamer) return res.status(404).json({ error: "streamer_not_found" });
  const statuses = await checkStreamerLiveStatus(streamer);
  res.json({ statuses });
}));

router.get(
  "/:resource",
  asyncHandler(async (req, res) => {
    const config = RESOURCE_MAP[req.params.resource];
    if (!config) return res.status(404).json({ error: "resource_not_found" });
    if (!req.user.permissions.includes("master_access") && !req.user.permissions.includes(config.permission)) return res.status(403).json({ error: "missing_permission", permission: config.permission });
    const { rows, total } = await listResource(req.params.resource, { q: req.query.q || "", limit: req.query.limit || 25, offset: req.query.offset || 0 });
    res.json({ rows, total, config });
  })
);

router.post(
  "/:resource",
  asyncHandler(async (req, res) => {
    const config = RESOURCE_MAP[req.params.resource];
    if (!config) return res.status(404).json({ error: "resource_not_found" });
    if (!req.user.permissions.includes("master_access") && !req.user.permissions.includes(config.permission)) return res.status(403).json({ error: "missing_permission", permission: config.permission });
    const row = await createResource(req.params.resource, req.body, req.user);
    await auditAction({ req, action: `create_${req.params.resource}`, targetType: req.params.resource, targetId: row.id, after: row, reason: req.body?.reason || "created", webhookCategory: "admin" });
    res.status(201).json({ row });
  })
);

router.patch(
  "/:resource/:id",
  asyncHandler(async (req, res) => {
    const config = RESOURCE_MAP[req.params.resource];
    if (!config) return res.status(404).json({ error: "resource_not_found" });
    if (!req.user.permissions.includes("master_access") && !req.user.permissions.includes(config.permission)) return res.status(403).json({ error: "missing_permission", permission: config.permission });
    const result = await updateResource(req.params.resource, req.params.id, req.body, req.user);
    if (!result) return res.status(404).json({ error: "not_found" });
    await auditAction({ req, action: `update_${req.params.resource}`, targetType: req.params.resource, targetId: req.params.id, before: result.before, after: result.after, reason: req.body?.reason || "updated", webhookCategory: "admin" });
    res.json({ row: result.after });
  })
);

router.delete(
  "/:resource/:id",
  asyncHandler(async (req, res) => {
    const config = RESOURCE_MAP[req.params.resource];
    if (!config) return res.status(404).json({ error: "resource_not_found" });
    if (!req.user.permissions.includes("master_access") && !req.user.permissions.includes(config.permission)) return res.status(403).json({ error: "missing_permission", permission: config.permission });
    const before = await deleteResource(req.params.resource, req.params.id, req.user);
    if (!before) return res.status(404).json({ error: "not_found" });
    await auditAction({ req, action: `delete_${req.params.resource}`, targetType: req.params.resource, targetId: req.params.id, before, reason: req.body?.reason || "deleted", webhookCategory: "admin" });
    res.json({ ok: true });
  })
);

export default router;
