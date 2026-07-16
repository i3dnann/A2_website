import test from "node:test";
import assert from "node:assert/strict";
import { env } from "../src/config/env.js";
import {
  __usersTest,
  getDevUser,
  isUserTokenCurrent,
  revokeUserSessions,
  signUser,
  verifyUserToken,
} from "../src/services/users.js";

test("unsafe default JWT secret is replaced at runtime", () => {
  assert.notEqual(env.JWT_SECRET, "change_me_to_a_long_random_secret");
});

test("revoking user sessions invalidates previously issued JWTs", async () => {
  const user = await getDevUser();
  const token = signUser(user);
  const payload = verifyUserToken(token);

  assert.equal(isUserTokenCurrent(user, payload), true);

  await revokeUserSessions(user.id);

  const stalePayload = verifyUserToken(token);
  assert.equal(isUserTokenCurrent(await getDevUser(), stalePayload), false);
});

test("allowlisted email authority requires verified email evidence", () => {
  assert.equal(
    __usersTest.isMasterCandidate({ email: "master@example.test", emailVerified: false }),
    false,
  );
  assert.equal(__usersTest.rolesForIdentity({ email: "master@example.test", emailVerified: false })[0], "Player");
});
