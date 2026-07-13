import test from "node:test";
import assert from "node:assert/strict";
import { requirePermission } from "../src/middleware/auth.js";

function run(user) {
  let statusCode = 200;
  let payload = null;
  let continued = false;
  const response = {
    status(code) { statusCode = code; return this; },
    json(value) { payload = value; return this; },
  };
  requirePermission("manage_contracts")({ user }, response, () => { continued = true; });
  return { statusCode, payload, continued };
}

test("a regular user cannot access contract administration", () => {
  const result = run({ permissions: ["view_player_portal"], admin_status: "active" });
  assert.equal(result.continued, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.payload.error, "missing_permission");
});

test("an authorized contract administrator passes server authorization", () => {
  const result = run({ permissions: ["manage_contracts"], admin_status: "active" });
  assert.equal(result.continued, true);
});

test("a frozen administrator cannot administer contracts", () => {
  const result = run({ permissions: ["manage_contracts"], admin_status: "frozen" });
  assert.equal(result.continued, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.payload.error, "admin_account_frozen_or_disabled");
});
