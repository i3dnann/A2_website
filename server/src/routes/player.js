import { Router } from "express";
import { z } from "zod";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createResource, getResource, listResource, updateResource } from "../services/repository.js";
import { getBanStatus, getCharacterStats, getCharactersForAccount, getPlayerInventory, getPlayerVehicles, identifiersForAccount } from "../services/qbcoreService.js";
import { auditAction } from "../services/audit.js";
import { sendWebhook } from "../services/webhook.js";
import { saveTermsAgreement } from "../services/users.js";
import { canAccessTicket, listOwnedTickets } from "../services/playerTicketService.js";

const router = Router();
router.use(requireAuth, requirePermission("view_player_portal"));

const ticketSchema = z.object({
  category: z.string().min(2).max(80),
  subject: z.string().min(4).max(190),
  message: z.string().min(10)
});

const ticketReplySchema = z.object({
  message: z.string().min(1)
});

async function ownedApplications(user) {
  const searches = [user?.id, user?.discord_id, user?.steam_id, ""].filter((value, index, list) => value !== undefined && list.indexOf(value) === index);
  const bucket = new Map();
  for (const value of searches) {
    const { rows } = await listResource("careerApplications", { q: String(value || ""), limit: 100 });
    rows
      .filter((application) => (
        String(application.user_id || "") === String(user?.id || "") ||
        String(application.created_by || "") === String(user?.id || "") ||
        (user?.discord_id && String(application.discord_id || "") === String(user.discord_id)) ||
        (user?.steam_id && String(application.steam_id || "") === String(user.steam_id))
      ))
      .forEach((application) => bucket.set(String(application.id), application));
  }
  const applications = [...bucket.values()];
  const enriched = [];
  for (const application of applications) {
    const [job, notes] = await Promise.all([
      getResource("careerJobs", application.job_id),
      listResource("careerApplicationNotes", { q: application.id, limit: 100 })
    ]);
    enriched.push({
      ...application,
      job_title: job?.title || application.job_id,
      public_notes: notes.rows.filter((note) => String(note.application_id) === String(application.id) && Number(note.is_internal || 0) !== 1)
    });
  }
  return enriched;
}

async function getAccessibleTicket(user, idOrNumber) {
  let ticket = await getResource("tickets", idOrNumber);
  if (!ticket) {
    const { rows } = await listResource("tickets", { q: String(idOrNumber || ""), limit: 50 });
    ticket = rows.find((row) => String(row.id) === String(idOrNumber) || String(row.ticket_number) === String(idOrNumber));
  }
  if (!ticket || !(await canAccessTicket(user, ticket))) return null;
  return ticket;
}

async function accountPayload(req) {
  const characterResult = await getCharactersForAccount(req.user);
  const banStatus = await getBanStatus(characterResult.identifiers || identifiersForAccount(req.user));
  const tickets = await listOwnedTickets(req.user);
  const applications = await ownedApplications(req.user);
  return {
    user: req.user,
    providers: {
      email: Boolean(req.user.email),
      discord: Boolean(req.user.discord_id),
      steam: Boolean(req.user.steam_id)
    },
    steamRequiredMessage: characterResult.requiresSteam ? characterResult.message : "",
    characters: characterResult.characters,
    charactersNotFoundMessage: characterResult.notFound ? characterResult.message : "",
    linkedIdentifiers: characterResult.identifiers,
    banStatus,
    tickets,
    applications
  };
}

router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    res.json(await accountPayload(req));
  })
);

router.get(
  "/characters",
  asyncHandler(async (req, res) => {
    const characterResult = await getCharactersForAccount(req.user);
    const banStatus = await getBanStatus(characterResult.identifiers || identifiersForAccount(req.user));
    res.json({ ...characterResult, banStatus });
  })
);

router.get(
  "/characters/:citizenid",
  asyncHandler(async (req, res) => {
    const characterResult = await getCharactersForAccount(req.user);
    const owned = characterResult.characters.find((character) => String(character.citizenid) === String(req.params.citizenid));
    if (!owned) return res.status(404).json({ error: "character_not_found" });
    const [character, inventory, vehicles] = await Promise.all([
      getCharacterStats(req.params.citizenid),
      getPlayerInventory(req.params.citizenid),
      getPlayerVehicles(req.params.citizenid)
    ]);
    res.json({ character: character || owned, inventory, vehicles });
  })
);

router.get(
  "/tickets",
  asyncHandler(async (req, res) => {
    const tickets = await listOwnedTickets(req.user, req.query.q || "");
    res.json({ tickets });
  })
);

router.post(
  "/tickets",
  asyncHandler(async (req, res) => {
    const body = ticketSchema.parse(req.body || {});
    const ticketNumber = `A2-${Date.now().toString(36).toUpperCase()}`;
    const ticket = await createResource(
      "tickets",
      {
        ticket_number: ticketNumber,
        user_id: req.user.id,
        category: body.category,
        subject: body.subject,
        message_preview: body.message.slice(0, 300),
        status: "Open",
        priority: "Normal",
        discord_id: req.user.discord_id,
        steam_id: req.user.steam_id,
        citizenid: req.user.linked_identifiers?.find((id) => String(id).startsWith("citizenid:"))?.replace("citizenid:", "") || ""
      },
      req.user
    );
    const message = await createResource("ticketMessages", { ticket_id: ticket.id, author_id: req.user.id, author_type: "player", message: body.message, internal_only: false }, req.user);
    await auditAction({ req, action: "open_ticket", targetType: "tickets", targetId: ticket.id, after: ticket, reason: "player ticket opened", webhookCategory: "tickets_open" });
    await sendWebhook("tickets_open", {
      title: `Ticket opened: ${ticketNumber}`,
      Ticket: ticketNumber,
      Category: body.category,
      Subject: body.subject,
      Player: `${req.user.username} (${req.user.id})`,
      Discord: req.user.discord_id || "Not linked",
      Steam: req.user.steam_id || "Not linked",
      Message: body.message.slice(0, 900)
    });
    res.status(201).json({ ticket, message });
  })
);

router.get(
  "/tickets/:id",
  asyncHandler(async (req, res) => {
    const ticket = await getAccessibleTicket(req.user, req.params.id);
    if (!ticket) return res.status(404).json({ error: "ticket_not_found", message: "Ticket not found or you do not have access to it." });
    const { rows } = await listResource("ticketMessages", { q: ticket.id, limit: 100 });
    res.json({ ticket, messages: rows.filter((message) => String(message.ticket_id) === String(ticket.id) && Number(message.internal_only || 0) !== 1) });
  })
);

router.post(
  "/tickets/:id/messages",
  asyncHandler(async (req, res) => {
    const body = ticketReplySchema.parse(req.body || {});
    const ticket = await getAccessibleTicket(req.user, req.params.id);
    if (!ticket) return res.status(404).json({ error: "ticket_not_found", message: "Ticket not found or you do not have access to it." });
    if (String(ticket.status || "").toLowerCase() === "closed") return res.status(409).json({ error: "ticket_closed" });
    const message = await createResource("ticketMessages", { ticket_id: ticket.id, author_id: req.user.id, author_type: "player", message: body.message, internal_only: false }, req.user);
    await updateResource("tickets", ticket.id, { status: "Waiting for staff", message_preview: body.message.slice(0, 300) }, req.user);
    res.status(201).json({ message });
  })
);

router.post(
  "/tickets/:id/close",
  asyncHandler(async (req, res) => {
    const ticket = await getAccessibleTicket(req.user, req.params.id);
    if (!ticket) return res.status(404).json({ error: "ticket_not_found", message: "Ticket not found or you do not have access to it." });
    const result = await updateResource("tickets", ticket.id, { status: "Closed", closed_by: req.user.id, closed_at: new Date().toISOString() }, req.user);
    const { rows: messages } = await listResource("ticketMessages", { q: ticket.id, limit: 100 });
    await sendWebhook("tickets_closed", {
      title: `Ticket closed: ${ticket.ticket_number || ticket.id}`,
      Ticket: ticket.ticket_number || ticket.id,
      OpenedBy: req.user.username,
      ClosedBy: req.user.username,
      Category: ticket.category,
      Subject: ticket.subject,
      Created: ticket.created_at,
      Closed: result.after.closed_at,
      FinalStatus: "Closed",
      Transcript: messages
        .filter((message) => String(message.ticket_id) === String(ticket.id) && Number(message.internal_only || 0) !== 1)
        .map((message) => `${message.author_type}: ${message.message}`)
        .join("\n")
        .slice(0, 3000)
    });
    res.json({ ticket: result.after });
  })
);

router.get(
  "/career-applications",
  asyncHandler(async (req, res) => {
    res.json({ applications: await ownedApplications(req.user) });
  })
);

router.post(
  "/careers/:id/apply",
  asyncHandler(async (req, res) => {
    const job = await getResource("careerJobs", req.params.id);
    if (!job || job.is_open === false || job.is_visible === false) return res.status(404).json({ error: "career_not_open" });
    if (Array.isArray(req.body?.answers) && req.body.answers.length > 75) {
      return res.status(422).json({ error: "too_many_answers", message: "Submit 75 answers or fewer." });
    }
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const application = await createResource(
      "careerApplications",
      {
        job_id: job.id,
        user_id: req.user.id,
        discord_id: req.user.discord_id,
        steam_id: req.user.steam_id,
        citizenid: req.user.linked_identifiers?.find((id) => String(id).startsWith("citizenid:"))?.replace("citizenid:", "") || "",
        status: "Pending"
      },
      req.user
    );
    const savedAnswers = [];
    for (const answer of answers) {
      savedAnswers.push(
        await createResource(
          "careerAnswers",
          {
            application_id: application.id,
            section_id: answer.section_id,
            question_id: answer.question_id,
            question_snapshot: answer.question || "",
            answer_text: Array.isArray(answer.answer) ? answer.answer.join(", ") : String(answer.answer || ""),
            file_url: answer.file_url || ""
          },
          req.user
        )
      );
    }
    if (req.body?.termsVersion) await saveTermsAgreement({ userId: req.user.id, termsVersion: req.body.termsVersion, ipAddress: req.ip });
    await sendWebhook("careers", {
      title: `Career application: ${job.title}`,
      Applicant: `${req.user.username} (${req.user.id})`,
      Discord: req.user.discord_id || "Not linked",
      Steam: req.user.steam_id || "Not linked",
      Job: job.title,
      Status: "Pending",
      Answers: savedAnswers.map((answer) => `${answer.question_snapshot}: ${answer.answer_text}`).join("\n").slice(0, 2500)
    });
    res.status(201).json({ application, answers: savedAnswers });
  })
);

export default router;
