import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createResource, getResource, updateResource } from "../services/repository.js";
import { ownsTicket } from "../services/playerTicketService.js";

const router = Router();
router.use(requireAuth, requirePermission("view_player_portal"));

function closed(ticket) {
  return String(ticket?.status || "").toLowerCase() === "closed";
}

router.post("/tickets/:id/messages", asyncHandler(async (req, res) => {
  const ticket = await getResource("tickets", req.params.id);
  if (!ticket || !ownsTicket(req.user, ticket)) return res.status(404).json({ error: "ticket_not_found" });
  if (closed(ticket)) return res.status(409).json({ error: "ticket_closed" });
  const text = String(req.body?.message || "").trim();
  if (!text) return res.status(422).json({ error: "message_required" });
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
