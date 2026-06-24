import { addAuditLog } from "./repository.js";
import { sendWebhook } from "./webhook.js";

const accountEvents = {
  email_login: "User Login",
  discord_login: "User Login",
  steam_login: "User Login",
  logout: "User Logout"
};

export async function auditAction({
  req,
  action,
  targetType,
  targetId,
  before,
  after,
  reason,
  webhookCategory = "admin",
  status = "success"
}) {
  const staff = req?.user || { id: "system", username: "system" };
  const ip = req?.ip || req?.headers?.["x-forwarded-for"] || "";
  const entry = await addAuditLog({ action, staff, targetType, targetId, before, after, reason, ip, status });
  const isAccountEvent = Boolean(accountEvents[action]);

  await sendWebhook(isAccountEvent ? "accounts" : webhookCategory, {
    title: accountEvents[action] || `Admin action: ${action}`,
    color: status === "success" ? 0xb7fe1a : 0xff3333,
    Staff: staff.username || staff.email || staff.discord_username || staff.id,
    Target: `${targetType || "unknown"}:${targetId || ""}`,
    Reason: reason || "",
    IP: ip,
    Status: status,
    Before: before ? JSON.stringify(before).slice(0, 900) : "None",
    After: after ? JSON.stringify(after).slice(0, 900) : "None"
  });

  return entry;
}
