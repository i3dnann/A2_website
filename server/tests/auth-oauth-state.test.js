import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { __authTest } from "../src/routes/auth.js";

function responseRecorder() {
  return {
    statusCode: 200,
    redirectedTo: "",
    redirect(url) {
      this.redirectedTo = url;
      return this;
    }
  };
}

test("source-known legacy OAuth state secrets are not accepted", () => {
  const forged = jwt.sign(
    { provider: "discord", mode: "link", userId: "victim-user", nonce: "attacker-controlled" },
    "change_me_to_a_long_random_secret",
    { expiresIn: "15m" }
  );

  assert.equal(__authTest.readState(forged), null);
});

test("OAuth states are server-owned and single use", () => {
  const state = __authTest.createState({ provider: "discord", mode: "login", userId: null });
  assert.deepEqual(
    { ...__authTest.readState(state), expiresAt: "dynamic" },
    { provider: "discord", mode: "login", userId: null, expiresAt: "dynamic" }
  );
  assert.equal(__authTest.readState(state), null);
});

test("link-mode callbacks must match the logged-in account", () => {
  const state = __authTest.createState({ provider: "discord", mode: "link", userId: "owner-user" });
  const oauthState = __authTest.readState(state);
  const res = responseRecorder();

  const ok = __authTest.validateLinkState({ user: { id: "other-user" } }, res, oauthState, "discord");

  assert.equal(ok, false);
  assert.match(res.redirectedTo, /error=invalid_oauth_state/);
});

test("link-mode callbacks allow the initiating logged-in account", () => {
  const state = __authTest.createState({ provider: "steam", mode: "link", userId: "owner-user" });
  const oauthState = __authTest.readState(state);
  const res = responseRecorder();

  const ok = __authTest.validateLinkState({ user: { id: "owner-user" } }, res, oauthState, "steam");

  assert.equal(ok, true);
  assert.equal(res.redirectedTo, "");
});
