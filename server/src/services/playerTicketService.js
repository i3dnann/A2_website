import { listResource } from "./repository.js";

function same(left, right) {
  return Boolean(left) && Boolean(right) && String(left) === String(right);
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

  return [...bucket.values()]
    .filter((ticket) => ticketMatchesSearch(ticket, q))
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
}
