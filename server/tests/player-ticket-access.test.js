import test from "node:test";
import assert from "node:assert/strict";
import { ownsTicket } from "../src/services/playerTicketService.js";

test("ticket ownership does not trust updated_by", () => {
  assert.equal(
    ownsTicket(
      { id: "removed-participant", discord_id: "", steam_id: "" },
      { id: "ticket-1", user_id: "owner", created_by: "owner", updated_by: "removed-participant" },
    ),
    false,
  );
});

test("ticket ownership still accepts explicit owner identifiers", () => {
  assert.equal(
    ownsTicket(
      { id: "owner", discord_id: "discord-1", steam_id: "" },
      { id: "ticket-1", user_id: "owner", created_by: "staff", updated_by: "staff" },
    ),
    true,
  );
});
