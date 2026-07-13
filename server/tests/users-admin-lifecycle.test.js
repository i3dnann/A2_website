import test from "node:test";
import assert from "node:assert/strict";
import {
  deleteWebUser,
  linkProvider,
  listProvidersForUser,
  listWebUsers,
  removeAdminAccess,
  unlinkProviderForUser,
  upsertWebUserFromAdmin,
} from "../src/services/users.js";

test("admin user lifecycle keeps providers, roles, status, and deletion consistent", async () => {
  const actor = { id: "test-master" };
  const user = await upsertWebUserFromAdmin(
    {
      username: "Lifecycle User",
      email: `lifecycle-${Date.now()}@example.test`,
      roles: ["Admin"],
      permissions: ["manage_users"],
    },
    actor,
  );

  await linkProvider(user.id, "discord", "discord-lifecycle", {
    username: "discord-user",
  });
  await linkProvider(user.id, "steam", "steam-lifecycle", {
    username: "steam-user",
  });
  assert.equal((await listProvidersForUser(user.id)).length, 2);

  const linked = (await listWebUsers({ q: user.email })).find(
    (item) => item.id === user.id,
  );
  assert.equal(linked.discord_id, "discord-lifecycle");
  assert.equal(linked.steam_id, "steam-lifecycle");

  await unlinkProviderForUser(user.id, "discord", actor);
  assert.equal(
    (await listProvidersForUser(user.id)).some(
      (item) => item.provider === "discord",
    ),
    false,
  );

  const formerAdmin = await removeAdminAccess(user.id, actor);
  assert.deepEqual(formerAdmin.roles, ["Player"]);
  assert.deepEqual(formerAdmin.permissions, ["view_player_portal"]);
  assert.equal(formerAdmin.admin_status, "removed");

  await deleteWebUser(user.id, actor);
  assert.equal(
    (await listWebUsers({ q: user.email })).some((item) => item.id === user.id),
    false,
  );
});
