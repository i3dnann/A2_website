import { fetch } from "undici";
import { env } from "../config/env.js";
import { getSettings } from "./repository.js";

const webhookEnvByCategory = {
  tickets_open: "WEBHOOK_TICKETS_OPEN",
  tickets_closed: "WEBHOOK_TICKETS_CLOSED",
  careers: "WEBHOOK_CAREERS",
  admin: "WEBHOOK_ADMIN_LOGS",
  security: "WEBHOOK_SECURITY",
  streamers: "WEBHOOK_STREAMERS",
  accounts: "WEBHOOK_USER_ACCOUNTS"
};

function truncate(value, length = 1024) {
  const text = String(value ?? "");
  return text.length > length ? `${text.slice(0, length - 3)}...` : text;
}

export async function sendWebhook(category, payload = {}) {
  const envName = webhookEnvByCategory[category] || category;
  const settings = await getSettings({ includeSecrets: true });
  const url = settings[envName] || env[envName];
  if (!url) {
    console.warn(`[webhook] ${envName} is not configured; event saved without Discord delivery.`);
    return { skipped: true, reason: "webhook_not_configured" };
  }

  const fields = Object.entries(payload.fields || payload)
    .filter(([key]) => !["title", "description", "color", "url"].includes(key))
    .map(([name, value]) => ({
      name: truncate(name, 256),
      value: truncate(value || "None", 1024),
      inline: String(value || "").length < 80
    }))
    .slice(0, 25);

  const body = {
    username: "A2 Studio",
    embeds: [
      {
        title: truncate(payload.title || "A2 Studio event", 256),
        description: truncate(payload.description || "", 4096),
        color: payload.color || 12058138,
        url: payload.url || undefined,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: "A2 Studio Website" }
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Discord webhook returned ${response.status}`);
    return { ok: true };
  } catch (error) {
    console.warn("[webhook] failed:", error.message);
    return { ok: false, error: error.message };
  }
}
