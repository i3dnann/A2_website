import { Router } from "express";
import { z } from "zod";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { auditAction } from "../services/audit.js";
import { changeOwnPassword } from "../services/passwordService.js";
import { revokeUserSessions, updateOwnEmail } from "../services/users.js";
import { createVerificationRequest, getVerificationEligibility } from "../services/verificationService.js";

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

const emailSchema = z.object({
  email: z.string().trim().email().max(190)
});

router.patch(
  "/email",
  asyncHandler(async (req, res) => {
    const body = emailSchema.parse(req.body || {});
    const before = { id: req.user.id, email: req.user.email || "" };
    const user = await updateOwnEmail(req.user.id, body.email, req.user);
    await auditAction({
      req: { ...req, user },
      action: "update_email",
      targetType: "web_users",
      targetId: req.user.id,
      before,
      after: { id: user.id, email: user.email || "" },
      webhookCategory: "security"
    });
    res.json({ user });
  })
);

router.get(
  "/verification",
  asyncHandler(async (req, res) => {
    res.json({ verification: await getVerificationEligibility(req.user) });
  })
);

router.post(
  "/verification",
  asyncHandler(async (req, res) => {
    const request = await createVerificationRequest(req.user, req.body?.reason || "");
    await auditAction({
      req,
      action: "request_account_verification",
      targetType: "verification_requests",
      targetId: request.id,
      after: request,
      webhookCategory: "security"
    });
    res.status(201).json({ request });
  })
);

router.post(
  "/password",
  asyncHandler(async (req, res) => {
    const body = credentialSchema.parse(req.body || {});
    const issuedAt = Number(req.authTokenPayload?.iat || 0);
    const sessionAge = issuedAt ? Math.floor(Date.now() / 1000) - issuedAt : Number.POSITIVE_INFINITY;
    await changeOwnPassword({
      userId: req.user.id,
      currentPassword: body.currentCredential,
      newPassword: body.newCredential,
      allowInitialWithoutCurrent: sessionAge >= 0 && sessionAge <= 10 * 60
    });
    await revokeUserSessions(req.user.id);
    await auditAction({ req, action: "change_password", targetType: "web_users", targetId: req.user.id, webhookCategory: "security" });
    res.json({ ok: true });
  })
);

export default router;
