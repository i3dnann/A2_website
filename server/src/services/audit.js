import { addAuditLog } from "./repository.js";
import { sendWebhook } from "./webhook.js";

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
  const entry = await addAuditLog({
    action,
    staff,
    targetType,
    targetId,
    before,
    after,
    reason,
    ip,
    status
  });

  await sendWebhook(webhookCategory, {
    Action: action,
    Staff: staff.username || staff.discord_username || staff.id,
    Target: `${targetType || "unknown"}:${targetId || ""}`,
    Reason: reason || "",
    Time: new Date().toISOString(),
    IP: ip,
    Before: before ? JSON.stringify(before).slice(0, 950) : "",
    After: after ? JSON.stringify(after).slice(0, 950) : "",
    Status: status
  });

  return entry;
}
