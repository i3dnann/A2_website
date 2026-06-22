import { Router } from "express";
import { z } from "zod";
import { RESOURCE_DEFINITIONS, RESOURCE_MAP } from "../data/catalog.js";
import { ADMIN_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, PERMISSIONS, ROLES, hasPermission } from "../data/permissions.js";
import { requireAuth, requireMaster, requirePermission } from "../middleware/auth.js";
import { upload } from "../middleware/security.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createResource, deleteResource, getResource, getSettings, listResource, updateResource, updateSettings } from "../services/repository.js";
import { auditAction } from "../services/audit.js";
import { checkAllStreamers, checkStreamerLiveStatus, withLiveStatus } from "../services/streamerService.js";
import { deactivateWebUser, listWebUsers, updateAdminStatus, upsertWebUserFromAdmin } from "../services/users.js";
import { publicFileUrl } from "../utils/sanitize.js";
import { sendWebhook } from "../services/webhook.js";
import { cleanKickSlug } from "../services/kickService.js";

const router = Router();
const settingsSchema = z.record(z.any());
const webhookKeys = [
  "WEBHOOK_TICKETS_OPEN",
  "WEBHOOK_TICKETS_CLOSED",
  "WEBHOOK_CAREERS",
  "WEBHOOK_ADMIN_LOGS",
  "WEBHOOK_SECURITY",
  "WEBHOOK_STREAMERS",
  "WEBHOOK_USER_ACCOUNTS"
];

function requireAnyAdmin(req, res, next) {
  if (ADMIN_PERMISSIONS.some((permission) => hasPermission(req.user, permission))) return next();
  return res.status(403).json({ error: "admin_permission_required" });
}

function normalizeAdminResourcePayload(resource, payload = {}) {
  if (resource !== "streamers") return payload;
  return {
    ...payload,
    kick_username: cleanKickSlug(payload.kick_username || "")
  };
}

router.use(requireAuth, requireAnyAdmin);

router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const [tickets, applications, streamers, news, audit] = await Promise.all([
      listResource("tickets", { limit: 5 }),
      listResource("careerApplications", { limit: 5 }),
      listResource("streamers", { limit: 5 }),
      listResource("news", { limit: 5 }),
      listResource("auditLogs", { limit: 8 })
    ]);
    res.json({
      cards: [
        { label: "Open tickets", value: tickets.rows.filter((ticket) => ticket.status !== "Closed").length || tickets.total },
        { label: "Career applications", value: applications.total },
        { label: "Roster members", value: streamers.total },
        { label: "News articles", value: news.total }
      ],
      recentTickets: tickets.rows,
      recentApplications: applications.rows,
      recentLogs: audit.rows
    });
  })
);

router.get("/settings", requirePermission("manage_home"), asyncHandler(async (_req, res) => {
  res.json({ settings: await getSettings() });
}));

router.patch(
  "/settings",
  requirePermission("manage_home"),
  asyncHandler(async (req, res) => {
    const patch = settingsSchema.parse(req.body || {});
    const { before, after } = await updateSettings(patch, req.user);
    await auditAction({ req, action: "update_settings", targetType: "web_settings", targetId: "global", before, after, reason: req.body?.reason || "settings update", webhookCategory: "admin" });
    res.json({ settings: await getSettings() });
  })
);

router.patch(
  "/theme",
  requirePermission("manage_theme"),
  asyncHandler(async (req, res) => {
    const patch = settingsSchema.parse(req.body || {});
    const { before, after } = await updateSettings(patch, req.user);
    await auditAction({ req, action: "update_theme", targetType: "web_theme_settings", targetId: "global", before, after, reason: req.body?.reason || "theme update", webhookCategory: "admin" });
    res.json({ settings: await getSettings() });
  })
);

router.get("/webhooks", requirePermission("manage_webhooks"), asyncHandler(async (_req, res) => {
  const settings = await getSettings({ includeSecrets: true });
  res.json({
    webhooks: Object.fromEntries(
      webhookKeys.map((key) => [
        key,
        {
          configured: Boolean(settings[key] || process.env[key]),
          value: settings[key] || process.env[key] ? "configured" : ""
        }
      ])
    )
  });
}));

router.patch(
  "/webhooks",
  requirePermission("manage_webhooks"),
  asyncHandler(async (req, res) => {
    const patch = Object.fromEntries(Object.entries(req.body || {}).filter(([key, value]) => webhookKeys.includes(key) && typeof value === "string"));
    const { before, after } = await updateSettings(patch, req.user, { secretKeys: Object.keys(patch) });
    await auditAction({ req, action: "update_webhooks", targetType: "webhook_settings", targetId: "global", before: Object.keys(before), after: Object.keys(after), reason: "webhook settings update", webhookCategory: "security" });
    res.json({ ok: true });
  })
);

router.get("/permissions", requirePermission("manage_permissions"), (_req, res) => {
  res.json({ roles: ROLES, permissions: PERMISSIONS, defaults: DEFAULT_ROLE_PERMISSIONS });
});

router.get(
  "/users",
  requirePermission("manage_users"),
  asyncHandler(async (req, res) => {
    const rows = await listWebUsers({ q: req.query.q || "", limit: req.query.limit || 100 });
    res.json({ rows, total: rows.length });
  })
);

router.post(
  "/users",
  requirePermission("manage_users"),
  asyncHandler(async (req, res) => {
    const user = await upsertWebUserFromAdmin(req.body || {}, req.user);
    await auditAction({ req, action: "upsert_user", targetType: "web_users", targetId: user.id, after: user, reason: req.body?.reason || "user upsert", webhookCategory: "security" });
    res.status(201).json({ user });
  })
);

router.patch(
  "/users/:id",
  requirePermission("manage_users"),
  asyncHandler(async (req, res) => {
    const user = await upsertWebUserFromAdmin({ ...req.body, id: req.params.id }, req.user);
    await auditAction({ req, action: "update_user", targetType: "web_users", targetId: user.id, after: user, reason: req.body?.reason || "user update", webhookCategory: "security" });
    res.json({ user });
  })
);

router.delete(
  "/users/:id",
  requireMaster,
  asyncHandler(async (req, res) => {
    const user = await deactivateWebUser(req.params.id, req.user);
    if (!user) return res.status(404).json({ error: "user_not_found" });
    await auditAction({ req, action: "disable_user", targetType: "web_users", targetId: user.id, after: user, reason: "master disabled user", webhookCategory: "security" });
    res.json({ user });
  })
);

router.get(
  "/admins",
  requirePermission("manage_admins"),
  asyncHandler(async (req, res) => {
    const users = await listWebUsers({ q: req.query.q || "", limit: 200 });
    const admins = users.filter((user) => (user.permissions || []).some((permission) => permission !== "view_player_portal"));
    res.json({ rows: admins, total: admins.length });
  })
);

router.post(
  "/admins",
  requirePermission("manage_admins"),
  asyncHandler(async (req, res) => {
    const roles = req.body?.roles?.length ? req.body.roles : ["Admin"];
    const user = await upsertWebUserFromAdmin({ ...req.body, roles, permissions: req.body?.permissions || DEFAULT_ROLE_PERMISSIONS.Admin }, req.user);
    await auditAction({ req, action: "add_admin", targetType: "web_users", targetId: user.id, after: user, reason: req.body?.reason || "admin added", webhookCategory: "security" });
    res.status(201).json({ user });
  })
);

router.patch(
  "/admins/:id",
  requirePermission("manage_admins"),
  asyncHandler(async (req, res) => {
    const user = await upsertWebUserFromAdmin({ ...req.body, id: req.params.id }, req.user);
    await auditAction({ req, action: "update_admin", targetType: "web_users", targetId: user.id, after: user, reason: req.body?.reason || "admin update", webhookCategory: "security" });
    res.json({ user });
  })
);

router.post(
  "/admins/:id/freeze",
  requireMaster,
  asyncHandler(async (req, res) => {
    const user = await updateAdminStatus(req.params.id, "frozen", req.user);
    if (!user) return res.status(404).json({ error: "admin_not_found" });
    await auditAction({ req, action: "freeze_admin", targetType: "web_users", targetId: user.id, after: user, reason: req.body?.reason || "admin frozen", webhookCategory: "security" });
    res.json({ user });
  })
);

router.post(
  "/admins/:id/unfreeze",
  requireMaster,
  asyncHandler(async (req, res) => {
    const user = await updateAdminStatus(req.params.id, "active", req.user);
    if (!user) return res.status(404).json({ error: "admin_not_found" });
    await auditAction({ req, action: "unfreeze_admin", targetType: "web_users", targetId: user.id, after: user, reason: req.body?.reason || "admin unfrozen", webhookCategory: "security" });
    res.json({ user });
  })
);

router.delete(
  "/admins/:id",
  requireMaster,
  asyncHandler(async (req, res) => {
    const user = await deactivateWebUser(req.params.id, req.user);
    if (!user) return res.status(404).json({ error: "admin_not_found" });
    await auditAction({ req, action: "remove_admin", targetType: "web_users", targetId: user.id, after: user, reason: req.body?.reason || "admin removed", webhookCategory: "security" });
    res.json({ user });
  })
);

router.post("/uploads", requirePermission("manage_files"), upload.single("file"), asyncHandler(async (req, res) => {
  const url = publicFileUrl(req, req.file);
  const file = await createResource(
    "files",
    {
      owner_user_id: req.user.id,
      original_name: req.file?.originalname,
      stored_name: req.file?.filename,
      mime_type: req.file?.mimetype,
      size_bytes: req.file?.size,
      url,
      storage_driver: "local"
    },
    req.user
  );
  res.json({ url, file });
}));

router.post("/streamers/check", requirePermission("manage_live"), asyncHandler(async (_req, res) => {
  await checkAllStreamers();
  res.json({ ok: true });
}));

router.post("/streamers/:id/check", requirePermission("manage_live"), asyncHandler(async (req, res) => {
  const streamer = await getResource("streamers", req.params.id);
  if (!streamer) return res.status(404).json({ error: "streamer_not_found" });
  const statuses = await checkStreamerLiveStatus(streamer);
  res.json({ statuses });
}));

router.post(
  "/tickets/:id/reply",
  requirePermission("manage_tickets"),
  asyncHandler(async (req, res) => {
    const ticket = await getResource("tickets", req.params.id);
    if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
    const message = await createResource("ticketMessages", { ticket_id: ticket.id, author_id: req.user.id, author_type: "admin", message: req.body?.message || "", internal_only: Boolean(req.body?.internal_only) }, req.user);
    const result = await updateResource("tickets", ticket.id, { status: req.body?.internal_only ? ticket.status : "Waiting for player", assigned_to: req.user.id }, req.user);
    await auditAction({ req, action: "admin_reply_ticket", targetType: "tickets", targetId: ticket.id, after: message, reason: "admin ticket reply", webhookCategory: "admin" });
    res.status(201).json({ ticket: result.after, message });
  })
);

router.get(
  "/tickets/:id",
  requirePermission("manage_tickets"),
  asyncHandler(async (req, res) => {
    const ticket = await getResource("tickets", req.params.id);
    if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
    const [messages, notes] = await Promise.all([
      listResource("ticketMessages", { q: ticket.id, limit: 100 }),
      listResource("ticketNotes", { q: ticket.id, limit: 100 })
    ]);
    res.json({
      ticket,
      messages: messages.rows.filter((message) => String(message.ticket_id) === String(ticket.id)),
      notes: notes.rows.filter((note) => String(note.ticket_id) === String(ticket.id))
    });
  })
);

router.post(
  "/tickets/:id/note",
  requirePermission("manage_tickets"),
  asyncHandler(async (req, res) => {
    const ticket = await getResource("tickets", req.params.id);
    if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
    const note = await createResource("ticketNotes", { ticket_id: ticket.id, admin_id: req.user.id, note: req.body?.note || "" }, req.user);
    await auditAction({ req, action: "add_ticket_note", targetType: "tickets", targetId: ticket.id, after: note, reason: "internal ticket note", webhookCategory: "admin" });
    res.status(201).json({ note });
  })
);

router.post(
  "/tickets/:id/close",
  requirePermission("close_tickets"),
  asyncHandler(async (req, res) => {
    const ticket = await getResource("tickets", req.params.id);
    if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
    const result = await updateResource("tickets", ticket.id, { status: "Closed", closed_by: req.user.id, closed_at: new Date().toISOString() }, req.user);
    const { rows: messages } = await listResource("ticketMessages", { q: ticket.id, limit: 100 });
    const { rows: notes } = await listResource("ticketNotes", { q: ticket.id, limit: 100 });
    await sendWebhook("tickets_closed", {
      title: `Ticket closed: ${ticket.ticket_number || ticket.id}`,
      Ticket: ticket.ticket_number || ticket.id,
      OpenedBy: ticket.user_id,
      ClosedBy: req.user.username,
      Category: ticket.category,
      Subject: ticket.subject,
      Created: ticket.created_at,
      Closed: result.after.closed_at,
      FinalStatus: "Closed",
      Transcript: messages.filter((message) => message.ticket_id === ticket.id).map((message) => `${message.author_type}: ${message.message}`).join("\n").slice(0, 3000),
      InternalNotes: notes.filter((note) => note.ticket_id === ticket.id).map((note) => note.note).join("\n").slice(0, 1000)
    });
    await auditAction({ req, action: "close_ticket", targetType: "tickets", targetId: ticket.id, after: result.after, reason: req.body?.reason || "ticket closed", webhookCategory: "admin" });
    res.json({ ticket: result.after });
  })
);

router.get(
  "/career-applications/:id",
  requirePermission("review_career_applications"),
  asyncHandler(async (req, res) => {
    const application = await getResource("careerApplications", req.params.id);
    if (!application) return res.status(404).json({ error: "application_not_found" });
    const [answers, notes, job] = await Promise.all([
      listResource("careerAnswers", { q: application.id, limit: 200 }),
      listResource("careerApplicationNotes", { q: application.id, limit: 100 }),
      getResource("careerJobs", application.job_id)
    ]);
    res.json({
      application,
      job,
      answers: answers.rows.filter((answer) => String(answer.application_id) === String(application.id)),
      notes: notes.rows.filter((note) => String(note.application_id) === String(application.id))
    });
  })
);

router.post(
  "/career-applications/:id/status",
  requirePermission("review_career_applications"),
  asyncHandler(async (req, res) => {
    const status = req.body?.status || "Under review";
    const result = await updateResource(
      "careerApplications",
      req.params.id,
      {
        status,
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
        internal_notes: req.body?.private_note || req.body?.internal_notes || ""
      },
      req.user
    );
    if (!result) return res.status(404).json({ error: "application_not_found" });
    const notes = [];
    if (req.body?.public_note) {
      notes.push(
        await createResource(
          "careerApplicationNotes",
          { application_id: req.params.id, admin_id: req.user.id, note: req.body.public_note, is_internal: false },
          req.user
        )
      );
    }
    if (req.body?.private_note) {
      notes.push(
        await createResource(
          "careerApplicationNotes",
          { application_id: req.params.id, admin_id: req.user.id, note: req.body.private_note, is_internal: true },
          req.user
        )
      );
    }
    await auditAction({ req, action: "review_career_application", targetType: "career_applications", targetId: req.params.id, before: result.before, after: result.after, reason: req.body?.reason || "application review", webhookCategory: "admin" });
    res.json({ application: result.after, notes });
  })
);

router.get(
  "/:resource",
  asyncHandler(async (req, res) => {
    const config = RESOURCE_MAP[req.params.resource];
    if (!config) return res.status(404).json({ error: "resource_not_found" });
    if (!hasPermission(req.user, config.permission)) return res.status(403).json({ error: "missing_permission", permission: config.permission });
    const { rows, total } = await listResource(req.params.resource, { q: req.query.q || "", limit: req.query.limit || 25, offset: req.query.offset || 0 });
    const withStatus = req.params.resource === "streamers" ? await withLiveStatus(rows) : rows;
    res.json({ rows: withStatus, total, config, resources: RESOURCE_DEFINITIONS });
  })
);

router.post(
  "/:resource",
  asyncHandler(async (req, res) => {
    const config = RESOURCE_MAP[req.params.resource];
    if (!config) return res.status(404).json({ error: "resource_not_found" });
    if (!hasPermission(req.user, config.permission)) return res.status(403).json({ error: "missing_permission", permission: config.permission });
    const payload = normalizeAdminResourcePayload(req.params.resource, req.body || {});
    const row = await createResource(req.params.resource, payload, req.user);
    await auditAction({ req, action: `create_${req.params.resource}`, targetType: req.params.resource, targetId: row.id, after: row, reason: req.body?.reason || "created", webhookCategory: "admin" });
    res.status(201).json({ row });
  })
);

router.patch(
  "/:resource/:id",
  asyncHandler(async (req, res) => {
    const config = RESOURCE_MAP[req.params.resource];
    if (!config) return res.status(404).json({ error: "resource_not_found" });
    if (!hasPermission(req.user, config.permission)) return res.status(403).json({ error: "missing_permission", permission: config.permission });
    const payload = normalizeAdminResourcePayload(req.params.resource, req.body || {});
    const result = await updateResource(req.params.resource, req.params.id, payload, req.user);
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
    if (!hasPermission(req.user, config.permission)) return res.status(403).json({ error: "missing_permission", permission: config.permission });
    const before = await deleteResource(req.params.resource, req.params.id, req.user);
    if (!before) return res.status(404).json({ error: "not_found" });
    await auditAction({ req, action: `delete_${req.params.resource}`, targetType: req.params.resource, targetId: req.params.id, before, reason: req.body?.reason || "deleted", webhookCategory: "admin" });
    res.json({ ok: true });
  })
);

export default router;
