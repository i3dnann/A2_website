import { listResource } from "./repository.js";

function same(left, right) {
  return Boolean(left) && Boolean(right) && String(left) === String(right);
}

export async function participatesInTicket(user, ticket) {
  if (!user || !ticket) return false;
  const { rows } = await listResource("ticketParticipants", { q: ticket.id, limit: 100 }).catch(() => ({ rows: [] }));
  return rows.some((participant) => (
    String(participant.ticket_id) === String(ticket.id) &&
    participant.is_active !== false &&
    participant.is_active !== 0 &&
    (
      same(participant.user_id, user.id) ||
      same(participant.discord_id, user.discord_id) ||
      same(participant.steam_id, user.steam_id)
    )
  ));
}

export function ownsTicket(user, ticket) {
  if (!user || !ticket) return false;
  return (
    same(ticket.user_id, user.id) ||
    same(ticket.created_by, user.id) ||
    same(ticket.updated_by, user.id) ||
    same(ticket.discord_id, user.discord_id) ||
    same(ticket.steam_id, user.steam_id)
  );
}

export async function canAccessTicket(user, ticket) {
  return ownsTicket(user, ticket) || await participatesInTicket(user, ticket);
}

function ticketMatchesSearch(ticket, q = "") {
  const needle = String(q || "").trim().toLowerCase();
  if (!needle) return true;
  return [ticket.ticket_number, ticket.subject, ticket.category, ticket.status, ticket.message_preview]
    .some((value) => String(value || "").toLowerCase().includes(needle));
}

export async function listOwnedTickets(user, q = "") {
  const searches = [user?.id, user?.discord_id, user?.steam_id, q].filter(Boolean);
  const bucket = new Map();

  const addRows = (rows = []) => {
    rows.forEach((ticket) => {
      if (ownsTicket(user, ticket)) bucket.set(String(ticket.id), ticket);
    });
  };

  const recent = await listResource("tickets", { q: "", limit: 100 });
  addRows(recent.rows);

  for (const value of searches) {
    const result = await listResource("tickets", { q: String(value), limit: 100 });
    addRows(result.rows);
  }

  const participantRows = await Promise.all(searches.map((value) => listResource("ticketParticipants", { q: String(value), limit: 100 }).catch(() => ({ rows: [] }))));
  const participantTicketIds = new Set(
    participantRows.flatMap((result) => result.rows || [])
      .filter((participant) => participant.is_active !== false && participant.is_active !== 0)
      .filter((participant) => same(participant.user_id, user?.id) || same(participant.discord_id, user?.discord_id) || same(participant.steam_id, user?.steam_id))
      .map((participant) => String(participant.ticket_id))
  );
  if (participantTicketIds.size) {
    const allTickets = await listResource("tickets", { q: "", limit: 100 });
    allTickets.rows.forEach((ticket) => {
      if (participantTicketIds.has(String(ticket.id))) bucket.set(String(ticket.id), ticket);
    });
  }

  return [...bucket.values()]
    .filter((ticket) => ticketMatchesSearch(ticket, q))
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
}
