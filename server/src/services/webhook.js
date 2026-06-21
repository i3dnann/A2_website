import { fetch } from "undici";
import { env } from "../config/env.js";

const webhookNames = {
  admin: "WEBHOOK_ADMIN_LOGS",
  security: "WEBHOOK_SECURITY_LOGS",
  tickets: "WEBHOOK_TICKETS",
  banAppeals: "WEBHOOK_BAN_APPEALS",
  whitelist: "WEBHOOK_WHITELIST",
  streamers: "WEBHOOK_STREAMERS",
  police: "WEBHOOK_POLICE",
  ems: "WEBHOOK_EMS",
  court: "WEBHOOK_COURT",
  business: "WEBHOOK_BUSINESS",
  gang: "WEBHOOK_GANG"
};

export async function sendWebhook(category, fields) {
  const envName = webhookNames[category] || category;
  const url = env[envName];
  if (!url) return { skipped: true, reason: "webhook_not_configured" };

  const content = Object.entries(fields)
    .map(([key, value]) => `${key}:\n${value ?? ""}`)
    .join("\n\n");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content })
    });
    if (!response.ok) throw new Error(`Webhook returned ${response.status}`);
    return { ok: true };
  } catch (error) {
    console.warn("[webhook] failed:", error.message);
    return { ok: false, error: error.message };
  }
}
