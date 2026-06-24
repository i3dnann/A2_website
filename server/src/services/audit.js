import { addAuditLog } from "./repository.js";
import { sendWebhook } from "./webhook.js";

const accountEvents = {
  email_login: "User Login",
  discord_login: "User Login",
  steam_login: "User Login",
  logout: "User Logout"
};

function humanAction(action = "") {
  return String(action || "event").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function compactUser(row = {}) {
  if (!row) return "Unknown";
  return row.username || row.email || row.discord_username || row.id || "Unknown";
}

export async function auditAction({ req, action, targetType, targetId, before, after, reason, webhookCategory = "admin", status = "success" }) {
  const staff = req?.user || { id: "system", username: "system" };
  const ip = req?.ip || req?.headers?.["x-forwarded-for"] || "";
  const entry = await addAuditLog({ action, staff, targetType, targetId, before, after, reason, ip, status });
  const isAccountEvent = Boolean(accountEvents[action]);
  const isUserAction = String(targetType || "") === "web_users";

  const fields = isAccountEvent
    ? {
        User: compactUser(staff),
        Email: staff.email || "None",
        Status: status,
        Address: ip || "Unknown"
      }
    : isUserAction
      ? {
          Action: humanAction(action),
          Staff: compactUser(staff),
          User: compactUser(after || before || { id: targetId }),
          Email: (after || before)?.email || "None",
          Status: (after || before)?.account_status || status,
          Reason: reason || "None"
        }
      : {
          Action: humanAction(action),
          Staff: compactUser(staff),
          Target: `${targetType || "unknown"}:${targetId || ""}`,
          Reason: reason || "None",
          Status: status
        };

  await sendWebhook(isAccountEvent ? "accounts" : webhookCategory, {
    title: accountEvents[action] || humanAction(action),
    description: isAccountEvent ? "Website account activity" : isUserAction ? "Website user management action" : "Admin panel action",
    color: status === "success" ? 0xb7fe1a : 0xff3333,
    fields
  });

  return entry;
}
