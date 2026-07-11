import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createResource, deleteResource, getResource, listResource, updateResource } from "../services/repository.js";
import { auditAction } from "../services/audit.js";
import { sendWebhook } from "../services/webhook.js";
import { findUserByIdentifiers, getUserById, resolveUserIdentity, userIdentity } from "../services/users.js";

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

async function enrichTicket(ticket) {
  const identity = await resolveUserIdentity({
    user_id: ticket?.user_id || ticket?.created_by || "",
    discord_id: ticket?.discord_id || "",
    steam_id: ticket?.steam_id || ""
  });
  return {
    ...ticket,
    user_identity: identity,
    user_label: identity.label,
    user_secondary: identity.secondary
  };
}

async function enrichMessage(message) {
  const identity = await resolveUserIdentity({ user_id: message?.author_id || "" });
  return {
    ...message,
    author_identity: identity,
    author_label: identity.label
  };
}

async function enrichParticipant(participant) {
  const identity = await resolveUserIdentity({
    user_id: participant?.user_id || "",
    discord_id: participant?.discord_id || "",
    steam_id: participant?.steam_id || ""
  });
  return {
    ...participant,
    user_identity: identity,
    user_label: identity.label,
    user_secondary: identity.secondary
  };
}

async function enrichNote(note) {
  const identity = await resolveUserIdentity({ user_id: note?.admin_id || note?.created_by || "" });
  return {
    ...note,
    admin_identity: identity,
    admin_label: identity.label
  };
}

router.get("/tickets", requirePermission("manage_tickets"), asyncHandler(async (req, res) => {
  const status = ["open", "closed", "all"].includes(req.query.status) ? req.query.status : "open";
  const { rows } = await listResource("tickets", { q: req.query.q || "", limit: 100 });
  const filtered = rows.filter((ticket) => status === "all" || (status === "closed" ? closed(ticket) : !closed(ticket)));
  const enriched = await Promise.all(filtered.map(enrichTicket));
  res.json({ rows: enriched, total: enriched.length, status });
}));

router.get("/tickets/:id", requirePermission("manage_tickets"), asyncHandler(async (req, res) => {
  const ticket = await getResource("tickets", req.params.id);
  if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
  const player = await playerFor(ticket);
  const [messages, notes, participants] = await Promise.all([
    listResource("ticketMessages", { q: ticket.id, limit: 100 }),
    listResource("ticketNotes", { q: ticket.id, limit: 100 }),
    listResource("ticketParticipants", { q: ticket.id, limit: 100 }).catch(() => ({ rows: [] }))
  ]);
  const enrichedMessages = await Promise.all(messages.rows.filter((message) => String(message.ticket_id) === String(ticket.id)).map(enrichMessage));
  const enrichedNotes = await Promise.all(notes.rows.filter((note) => String(note.ticket_id) === String(ticket.id)).map(enrichNote));
  const enrichedParticipants = await Promise.all(participants.rows
    .filter((participant) => String(participant.ticket_id) === String(ticket.id) && participant.is_active !== false && participant.is_active !== 0)
    .map(enrichParticipant));
  res.json({
    ticket: await enrichTicket(ticket),
    player,
    identifiers: { ...snapshot(ticket, player), display: userIdentity(player, snapshot(ticket, player)) },
    messages: enrichedMessages,
    notes: enrichedNotes,
    participants: enrichedParticipants
  });
}));

router.post("/tickets/:id/status", requirePermission("manage_tickets"), asyncHandler(async (req, res) => {
  const ticket = await getResource("tickets", req.params.id);
  if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
  const allowed = new Set(["Waiting for Support", "Waiting for staff", "Waiting for player", "Claimed", "On Hold", "Closed", "Open"]);
  const status = String(req.body?.status || "").trim();
  if (!allowed.has(status)) return res.status(422).json({ error: "invalid_ticket_status", message: "Choose a valid ticket status." });
  const patch = { status };
  if (status === "Claimed") patch.assigned_to = req.user.id;
  if (status === "Closed") {
    patch.closed_by = req.user.id;
    patch.closed_at = new Date().toISOString();
  }
  if (status !== "Closed" && closed(ticket)) {
    patch.closed_by = "";
    patch.closed_at = null;
  }
  const result = await updateResource("tickets", ticket.id, patch, req.user);
  await auditAction({ req, action: "update_ticket_status", targetType: "tickets", targetId: ticket.id, before: result.before, after: result.after, reason: req.body?.reason || status, webhookCategory: "admin" });
  res.json({ ticket: result.after });
}));

router.post("/tickets/:id/claim", requirePermission("manage_tickets"), asyncHandler(async (req, res) => {
  const ticket = await getResource("tickets", req.params.id);
  if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
  const result = await updateResource("tickets", ticket.id, { status: "Claimed", assigned_to: req.user.id }, req.user);
  await auditAction({ req, action: "claim_ticket", targetType: "tickets", targetId: ticket.id, before: result.before, after: result.after, reason: "ticket claimed", webhookCategory: "admin" });
  res.json({ ticket: result.after });
}));

router.post("/tickets/:id/participants", requirePermission("manage_tickets"), asyncHandler(async (req, res) => {
  const ticket = await getResource("tickets", req.params.id);
  if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
  const userId = String(req.body?.user_id || "").trim();
  const discordId = String(req.body?.discord_id || "").trim();
  const steamId = String(req.body?.steam_id || "").trim();
  const lookup = String(req.body?.lookup || "").trim();
  if (!userId && !discordId && !steamId && !lookup) return res.status(422).json({ error: "participant_identifier_required", message: "Enter a username, user ID, Discord ID, or Steam ID." });
  const matchedUser = lookup ? await findUserByIdentifiers({ user_id: lookup, discord_id: lookup, steam_id: lookup, email: lookup, username: lookup }) : null;
  const participant = await createResource("ticketParticipants", {
    ticket_id: ticket.id,
    user_id: userId || matchedUser?.id || "",
    discord_id: discordId || matchedUser?.discord_id || "",
    steam_id: steamId || matchedUser?.steam_id || "",
    added_by: req.user.id,
    role_name: req.body?.role_name || "Participant",
    is_active: true
  }, req.user);
  await auditAction({ req, action: "add_ticket_participant", targetType: "tickets", targetId: ticket.id, after: participant, reason: "ticket participant added", webhookCategory: "admin" });
  res.status(201).json({ participant: await enrichParticipant(participant) });
}));

router.delete("/tickets/:id/participants/:participantId", requirePermission("manage_tickets"), asyncHandler(async (req, res) => {
  const ticket = await getResource("tickets", req.params.id);
  if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
  const participant = await getResource("ticketParticipants", req.params.participantId);
  if (!participant || String(participant.ticket_id) !== String(ticket.id)) return res.status(404).json({ error: "participant_not_found" });
  const result = await updateResource("ticketParticipants", participant.id, { is_active: false }, req.user);
  await auditAction({ req, action: "remove_ticket_participant", targetType: "tickets", targetId: ticket.id, before: participant, after: result.after, reason: "ticket participant removed", webhookCategory: "admin" });
  res.json({ ok: true });
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
    OpenedBy: (await enrichTicket(ticket)).user_label,
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

router.delete("/tickets/:id", requirePermission("close_tickets"), asyncHandler(async (req, res) => {
  const ticket = await getResource("tickets", req.params.id);
  if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
  if (!closed(ticket)) return res.status(409).json({ error: "ticket_must_be_closed", message: "Close the ticket before deleting it." });
  const relatedResources = ["ticketMessages", "ticketNotes", "ticketParticipants", "ticketAttachments"];
  await Promise.all(relatedResources.map(async (resource) => {
    const { rows } = await listResource(resource, { q: ticket.id, limit: 500 }).catch(() => ({ rows: [] }));
    await Promise.all(rows
      .filter((row) => String(row.ticket_id) === String(ticket.id))
      .map((row) => deleteResource(resource, row.id, req.user)));
  }));
  const before = await deleteResource("tickets", ticket.id, req.user);
  await auditAction({ req, action: "delete_ticket", targetType: "tickets", targetId: ticket.id, before, reason: req.body?.reason || "ticket deleted", webhookCategory: "admin" });
  res.json({ ok: true });
}));

export default router;
