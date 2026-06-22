import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createResource, getResource, listResource, updateResource } from "../services/repository.js";
import { auditAction } from "../services/audit.js";
import { sendWebhook } from "../services/webhook.js";
import { getUserById } from "../services/users.js";

const router = Router();
router.use(requireAuth);

function closed(ticket) {
  return String(ticket?.status || "").toLowerCase() === "closed";
}

async function playerFor(ticket) {
  const id = ticket?.user_id || ticket?.created_by || "";
  return id ? getUserById(id).catch(() => null) : null;
}

function snapshot(ticket, player) {
  return {
    user_id: ticket?.user_id || ticket?.created_by || "",
    username: player?.username || "",
    email: player?.email || "",
    discord_id: ticket?.discord_id || player?.discord_id || "",
    discord_username: player?.discord_username || "",
    steam_id: ticket?.steam_id || player?.steam_id || "",
    steam_persona: player?.steam_persona || "",
    citizenid: ticket?.citizenid || "",
    linked_identifiers: player?.linked_identifiers || []
  };
}

router.get("/tickets", requirePermission("manage_tickets"), asyncHandler(async (req, res) => {
  const status = ["open", "closed", "all"].includes(req.query.status) ? req.query.status : "open";
  const { rows } = await listResource("tickets", { q: req.query.q || "", limit: 100 });
  const filtered = rows.filter((ticket) => status === "all" || (status === "closed" ? closed(ticket) : !closed(ticket)));
  res.json({ rows: filtered, total: filtered.length, status });
}));

router.get("/tickets/:id", requirePermission("manage_tickets"), asyncHandler(async (req, res) => {
  const ticket = await getResource("tickets", req.params.id);
  if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
  const player = await playerFor(ticket);
  const [messages, notes] = await Promise.all([
    listResource("ticketMessages", { q: ticket.id, limit: 100 }),
    listResource("ticketNotes", { q: ticket.id, limit: 100 })
  ]);
  res.json({
    ticket,
    player,
    identifiers: snapshot(ticket, player),
    messages: messages.rows.filter((message) => String(message.ticket_id) === String(ticket.id)),
    notes: notes.rows.filter((note) => String(note.ticket_id) === String(ticket.id))
  });
}));

router.post("/tickets/:id/reply", requirePermission("manage_tickets"), asyncHandler(async (req, res) => {
  const ticket = await getResource("tickets", req.params.id);
  if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
  if (closed(ticket)) return res.status(409).json({ error: "ticket_closed" });
  const text = String(req.body?.message || "").trim();
  if (!text) return res.status(422).json({ error: "message_required" });
  const internalOnly = Boolean(req.body?.internal_only);
  const message = await createResource("ticketMessages", { ticket_id: ticket.id, author_id: req.user.id, author_type: "admin", message: text, internal_only: internalOnly }, req.user);
  const result = await updateResource("tickets", ticket.id, { status: internalOnly ? ticket.status : "Waiting for player", assigned_to: req.user.id }, req.user);
  await auditAction({ req, action: "admin_reply_ticket", targetType: "tickets", targetId: ticket.id, after: message, reason: "admin ticket reply", webhookCategory: "admin" });
  res.status(201).json({ ticket: result.after, message });
}));

router.post("/tickets/:id/note", requirePermission("manage_tickets"), asyncHandler(async (req, res) => {
  const ticket = await getResource("tickets", req.params.id);
  if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
  if (closed(ticket)) return res.status(409).json({ error: "ticket_closed" });
  const text = String(req.body?.note || "").trim();
  if (!text) return res.status(422).json({ error: "note_required" });
  const note = await createResource("ticketNotes", { ticket_id: ticket.id, admin_id: req.user.id, note: text }, req.user);
  await auditAction({ req, action: "add_ticket_note", targetType: "tickets", targetId: ticket.id, after: note, reason: "internal ticket note", webhookCategory: "admin" });
  res.status(201).json({ note });
}));

router.post("/tickets/:id/close", requirePermission("close_tickets"), asyncHandler(async (req, res) => {
  const ticket = await getResource("tickets", req.params.id);
  if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
  if (closed(ticket)) return res.json({ ticket });
  const result = await updateResource("tickets", ticket.id, { status: "Closed", closed_by: req.user.id, closed_at: new Date().toISOString() }, req.user);
  const { rows: messages } = await listResource("ticketMessages", { q: ticket.id, limit: 100 });
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
    Transcript: messages.filter((message) => String(message.ticket_id) === String(ticket.id)).map((message) => `${message.author_type}: ${message.message}`).join("\n").slice(0, 3000)
  });
  await auditAction({ req, action: "close_ticket", targetType: "tickets", targetId: ticket.id, after: result.after, reason: req.body?.reason || "ticket closed", webhookCategory: "admin" });
  res.json({ ticket: result.after });
}));

export default router;
