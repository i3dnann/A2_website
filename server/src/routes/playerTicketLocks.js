import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createResource, getResource, updateResource } from "../services/repository.js";
import { auditAction } from "../services/audit.js";
import { sendWebhook } from "../services/webhook.js";
import { ownsTicket } from "../services/playerTicketService.js";

const router = Router();
router.use(requireAuth, requirePermission("view_player_portal"));

function closed(ticket) {
  return String(ticket?.status || "").toLowerCase() === "closed";
}

function wordCount(value = "") {
  return String(value).trim().split(/\s+/).filter(Boolean).length;
}

function linkedCitizenId(user) {
  return user.linked_identifiers?.find((id) => String(id).startsWith("citizenid:"))?.replace("citizenid:", "") || "";
}

router.post("/tickets", asyncHandler(async (req, res) => {
  const body = req.body || {};
  const category = String(body.category || "").trim();
  const subject = String(body.subject || "").trim();
  const messageText = String(body.message || "").trim();

  if (category.length < 2 || category.length > 80) return res.status(422).json({ error: "invalid_category", message: "Choose a valid ticket category." });
  if (subject.length < 4 || subject.length > 190) return res.status(422).json({ error: "invalid_subject", message: "Write a ticket subject with at least 4 characters." });
  if (wordCount(messageText) < 10) return res.status(422).json({ error: "ticket_message_too_short", message: "Please write at least 10 words in the ticket message." });
  if (messageText.length > 5000) return res.status(422).json({ error: "ticket_message_too_long", message: "Ticket message must be under 5000 characters." });

  const ticketNumber = `A2-${Date.now().toString(36).toUpperCase()}`;
  const ticket = await createResource("tickets", {
    ticket_number: ticketNumber,
    user_id: req.user.id,
    category,
    subject,
    message_preview: messageText.slice(0, 300),
    status: "Open",
    priority: "Normal",
    discord_id: req.user.discord_id,
    steam_id: req.user.steam_id,
    citizenid: linkedCitizenId(req.user)
  }, req.user);

  const message = await createResource("ticketMessages", { ticket_id: ticket.id, author_id: req.user.id, author_type: "player", message: messageText, internal_only: false }, req.user);
  await auditAction({ req, action: "open_ticket", targetType: "tickets", targetId: ticket.id, after: ticket, reason: "player ticket opened", webhookCategory: "tickets_open" });
  await sendWebhook("tickets_open", {
    title: `Ticket opened: ${ticketNumber}`,
    Ticket: ticketNumber,
    Category: category,
    Subject: subject,
    Player: `${req.user.username} (${req.user.id})`,
    Discord: req.user.discord_id || "Not linked",
    Steam: req.user.steam_id || "Not linked",
    Message: messageText.slice(0, 900)
  });
  res.status(201).json({ ticket, message });
}));

router.post("/tickets/:id/messages", asyncHandler(async (req, res) => {
  const ticket = await getResource("tickets", req.params.id);
  if (!ticket || !ownsTicket(req.user, ticket)) return res.status(404).json({ error: "ticket_not_found" });
  if (closed(ticket)) return res.status(409).json({ error: "ticket_closed", message: "This ticket is closed. You cannot send more replies." });
  const text = String(req.body?.message || "").trim();
  if (!text) return res.status(422).json({ error: "message_required", message: "Write a reply before sending." });
  const message = await createResource("ticketMessages", { ticket_id: ticket.id, author_id: req.user.id, author_type: "player", message: text, internal_only: false }, req.user);
  await updateResource("tickets", ticket.id, { status: "Waiting for staff", message_preview: text.slice(0, 300) }, req.user);
  res.status(201).json({ message });
}));

router.post("/tickets/:id/close", asyncHandler(async (req, res) => {
  const ticket = await getResource("tickets", req.params.id);
  if (!ticket || !ownsTicket(req.user, ticket)) return res.status(404).json({ error: "ticket_not_found" });
  if (closed(ticket)) return res.json({ ticket });
  const result = await updateResource("tickets", ticket.id, { status: "Closed", closed_by: req.user.id, closed_at: new Date().toISOString() }, req.user);
  res.json({ ticket: result.after });
}));

export default router;
