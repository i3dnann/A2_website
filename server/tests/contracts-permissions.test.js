import test from "node:test";
import assert from "node:assert/strict";
import { requirePermission } from "../src/middleware/auth.js";
import { verifySigningReauthentication } from "../src/routes/contracts.js";

function run(user) {
  let statusCode = 200;
  let payload = null;
  let continued = false;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      payload = value;
      return this;
    },
  };
  requirePermission("manage_contracts")({ user }, response, () => {
    continued = true;
  });
  return { statusCode, payload, continued };
}

test("a regular user cannot access contract administration", () => {
  const result = run({
    permissions: ["view_player_portal"],
    admin_status: "active",
  });
  assert.equal(result.continued, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.payload.error, "missing_permission");
});

test("an authorized contract administrator passes server authorization", () => {
  const result = run({
    permissions: ["manage_contracts"],
    admin_status: "active",
  });
  assert.equal(result.continued, true);
});

test("a frozen administrator cannot administer contracts", () => {
  const result = run({
    permissions: ["manage_contracts"],
    admin_status: "frozen",
  });
  assert.equal(result.continued, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.payload.error, "admin_account_frozen_or_disabled");
});

test("a Discord-authenticated Gotham session can reauthenticate a signer", async () => {
  const method = await verifySigningReauthentication({
    user: { id: "user-1", discord_id: "123456789" },
    body: { reauthProvider: "gotham_session" },
  });
  assert.equal(method, "discord_session");
});

test("an unlinked session cannot bypass signing reauthentication", async () => {
  await assert.rejects(
    verifySigningReauthentication({
      user: { id: "user-1" },
      body: { reauthProvider: "gotham_session" },
    }),
    (error) =>
      error.status === 401 && error.message === "reauthentication_required",
  );
});
