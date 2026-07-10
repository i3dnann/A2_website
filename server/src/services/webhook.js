import { fetch } from "undici";
import { env } from "../config/env.js";
import { getSettings } from "./repository.js";

const webhookEnvByCategory = {
  tickets_open: "WEBHOOK_TICKETS_OPEN",
  tickets_closed: "WEBHOOK_TICKETS_CLOSED",
  careers: "WEBHOOK_CAREERS",
  admin: "WEBHOOK_ADMIN_LOGS",
  security: "WEBHOOK_SECURITY",
  accounts: "WEBHOOK_USER_ACCOUNTS"
};

const categoryColors = {
  tickets_open: 0x3498db,
  tickets_closed: 0x95a5a6,
  careers: 0xf1c40f,
  admin: 0xb7fe1a,
  security: 0xff3333,
  accounts: 0xb7fe1a
};

function truncate(value, length = 1024) {
  const text = String(value ?? "").trim();
  return text.length > length ? `${text.slice(0, length - 3)}...` : text;
}

function prettyName(name = "") {
  return String(name).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (char) => char.toUpperCase()).slice(0, 256);
}

function compactObject(value = {}) {
  const keys = ["username", "email", "status", "account_status", "subject", "category", "ticket_number", "title", "name", "id"];
  const parts = keys.filter((key) => value[key]).map((key) => `${prettyName(key)}: ${value[key]}`).slice(0, 6);
  return parts.length ? parts.join("\n") : "Details saved in audit logs";
}

function formatValue(value) {
  if (value === undefined || value === null || value === "") return "None";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.slice(0, 10).map((item) => typeof item === "object" ? compactObject(item) : String(item)).join("\n") : "None";
  if (typeof value === "object") return compactObject(value);
  const text = String(value);
  if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) return "Details saved in audit logs";
  return text;
}

function buildFields(payload = {}) {
  return Object.entries(payload.fields || payload)
    .filter(([key]) => !["title", "description", "color", "url", "thumbnail", "image", "before", "after", "Before", "After"].includes(key))
    .map(([name, value]) => {
      const formatted = formatValue(value);
      return { name: truncate(prettyName(name), 256), value: truncate(formatted, 1024), inline: String(formatted).length < 70 };
    })
    .filter((field) => field.value && field.value !== "None")
    .slice(0, 18);
}

export async function sendWebhook(category, payload = {}) {
  const envName = webhookEnvByCategory[category] || category;
  const settings = await getSettings({ includeSecrets: true });
  const url = settings[envName] || env[envName];
  if (!url) {
    console.warn(`[webhook] ${envName} is not configured; event saved without Discord delivery.`);
    return { skipped: true, reason: "webhook_not_configured" };
  }

  const body = {
    username: "Gotham City",
    embeds: [
      {
        title: truncate(payload.title || "Gotham City Event", 256),
        description: truncate(payload.description || "Website event logged.", 4096),
        color: payload.color || categoryColors[category] || 0xb7fe1a,
        url: payload.url || undefined,
        thumbnail: payload.thumbnail ? { url: payload.thumbnail } : undefined,
        image: payload.image ? { url: payload.image } : undefined,
        fields: buildFields(payload),
        timestamp: new Date().toISOString(),
        footer: { text: "Gotham City Website" }
      }
    ]
  };

  try {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error(`Discord webhook returned ${response.status}`);
    return { ok: true };
  } catch (error) {
    console.warn("[webhook] failed:", error.message);
    return { ok: false, error: error.message };
  }
}
