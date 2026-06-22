import { Router } from "express";
import { z } from "zod";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { auditAction } from "../services/audit.js";
import { changeOwnPassword } from "../services/passwordService.js";

const router = Router();
router.use(requireAuth, requirePermission("view_player_portal"));

const credentialSchema = z
  .object({
    currentCredential: z.string().max(200).optional().default(""),
    newCredential: z.string().min(8).max(200),
    confirmCredential: z.string().min(8).max(200)
  })
  .refine((body) => body.newCredential === body.confirmCredential, {
    message: "passwords_do_not_match",
    path: ["confirmCredential"]
  });

router.post(
  "/password",
  asyncHandler(async (req, res) => {
    const body = credentialSchema.parse(req.body || {});
    await changeOwnPassword({
      userId: req.user.id,
      currentPassword: body.currentCredential,
      newPassword: body.newCredential
    });
    await auditAction({ req, action: "change_password", targetType: "web_users", targetId: req.user.id, webhookCategory: "security" });
    res.json({ ok: true });
  })
);

export default router;
