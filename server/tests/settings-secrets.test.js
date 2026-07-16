import test from "node:test";
import assert from "node:assert/strict";
import {
  addAuditLog,
  getSettings,
  isSecretSettingKey,
  listResource,
  redactSecrets,
  updateSettings,
} from "../src/services/repository.js";

test("webhook setting keys are classified as secret", () => {
  assert.equal(isSecretSettingKey("WEBHOOK_SECURITY"), true);
  assert.equal(isSecretSettingKey("discordWebhookUrl"), true);
  assert.equal(isSecretSettingKey("websiteName"), false);
});

test("public settings do not expose cached webhook secrets", async () => {
  const fakeWebhook = "https://discord.com/api/webhooks/test/secret";
  await updateSettings({ WEBHOOK_SECURITY: fakeWebhook }, { id: "master" }, { secretKeys: ["WEBHOOK_SECURITY"] });

  const privateSettings = await getSettings({ includeSecrets: true });
  const publicSettings = await getSettings();

  assert.equal(privateSettings.WEBHOOK_SECURITY, fakeWebhook);
  assert.equal(publicSettings.WEBHOOK_SECURITY, undefined);
  assert.equal(JSON.stringify(publicSettings).includes(fakeWebhook), false);
});

test("audit snapshots redact webhook secrets before persistence", async () => {
  const fakeWebhook = "https://discord.com/api/webhooks/test/audit-secret";
  const before = { websiteName: "Gotham", WEBHOOK_SECURITY: fakeWebhook };
  const after = { websiteName: "Gotham City", nested: { discordWebhookUrl: fakeWebhook } };

  assert.deepEqual(redactSecrets(after).nested, { discordWebhookUrl: "[redacted]" });

  await addAuditLog({
    action: "test_secret_redaction",
    staff: { id: "master", username: "Master" },
    targetType: "web_settings",
    targetId: "global",
    before,
    after,
  });

  const { rows } = await listResource("auditLogs", { q: "test_secret_redaction", limit: 20 });
  const row = rows.find((item) => item.action === "test_secret_redaction");

  assert.ok(row);
  assert.equal(String(row.before_json || "").includes(fakeWebhook), false);
  assert.equal(String(row.after_json || "").includes(fakeWebhook), false);
  assert.equal(String(row.after_json || "").includes("[redacted]"), true);
});

test("settings URL fields strip scriptable schemes before public output", async () => {
  await updateSettings(
    {
      heroPrimaryButtonLink: "javascript:alert(1)",
      heroSecondaryButtonLink: "fivem://connect/127.0.0.1",
      siteContent: {
        stickyBannerLink: "data:text/html,<script>alert(1)</script>",
        navLinks: [{ label: "Safe", url: "/news" }, { label: "Bad", url: "javascript:alert(1)" }],
      },
    },
    { id: "admin" },
  );

  const settings = await getSettings();

  assert.equal(settings.heroPrimaryButtonLink, "");
  assert.equal(settings.heroSecondaryButtonLink, "fivem://connect/127.0.0.1");
  assert.equal(settings.siteContent.stickyBannerLink, "");
  assert.deepEqual(settings.siteContent.navLinks, [
    { label: "Safe", url: "/news" },
    { label: "Bad", url: "" },
  ]);
});
