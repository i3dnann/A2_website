import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyFirebaseToken } from "../services/firebaseAuth.js";
import {
  adminTransition,
  createContract,
  declineContract,
  generatePdf,
  getAuthorizedContract,
  listContracts,
  sendContract,
  signContract,
  updateDraft,
  verification,
} from "../services/contractService.js";

const router = Router();
const signatureLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
});
const isContractAdmin = (req) =>
  req.user?.permissions?.includes("master_access") ||
  req.user?.permissions?.includes("manage_contracts");

export async function verifySigningReauthentication(req) {
  if (req.body?.reauthToken) {
    const firebase = await verifyFirebaseToken(req.body.reauthToken);
    if (
      !firebase?.email ||
      String(firebase.email).toLowerCase() !==
        String(req.user?.email || "").toLowerCase()
    ) {
      throw Object.assign(new Error("reauthentication_identity_mismatch"), {
        status: 403,
      });
    }
    return "firebase";
  }

  // Discord and Steam accounts do not create a Firebase browser user. Their
  // signed Gotham session has already been resolved server-side to req.user.
  if (
    req.body?.reauthProvider === "gotham_session" &&
    (req.user?.discord_id || req.user?.steam_id)
  ) {
    return req.user.discord_id ? "discord_session" : "steam_session";
  }

  throw Object.assign(new Error("reauthentication_required"), { status: 401 });
}

router.get(
  "/verify/:code",
  asyncHandler(async (req, res) => {
    const result = await verification(req.params.code);
    if (!result)
      return res.status(404).json({ error: "invalid_verification_code" });
    res.json({ contract: result });
  }),
);

router.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) =>
    res.json(await listContracts(req.user, { ...req.query, admin: false })),
  ),
);
router.get(
  "/admin",
  requirePermission("manage_contracts"),
  asyncHandler(async (req, res) =>
    res.json(await listContracts(req.user, { ...req.query, admin: true })),
  ),
);
router.post(
  "/admin",
  requirePermission("manage_contracts"),
  asyncHandler(async (req, res) =>
    res
      .status(201)
      .json({ contract: await createContract(req.body, req.user) }),
  ),
);
router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const contract = await getAuthorizedContract(
      req.params.id,
      req.user,
      isContractAdmin(req),
    );
    if (!contract) return res.status(404).json({ error: "contract_not_found" });
    res.json({ contract });
  }),
);
router.patch(
  "/admin/:id",
  requirePermission("manage_contracts"),
  asyncHandler(async (req, res) =>
    res.json({
      contract: await updateDraft(req.params.id, req.body, req.user),
    }),
  ),
);
router.post(
  "/admin/:id/send",
  requirePermission("manage_contracts"),
  asyncHandler(async (req, res) =>
    res.json({ contract: await sendContract(req.params.id, req.user) }),
  ),
);
router.post(
  "/admin/:id/:action(cancel|void|archive)",
  requirePermission("manage_contracts"),
  asyncHandler(async (req, res) =>
    res.json({
      contract: await adminTransition(
        req.params.id,
        req.params.action,
        req.body?.reason,
        req.user,
      ),
    }),
  ),
);
router.post(
  "/:id/sign",
  requireAuth,
  signatureLimiter,
  asyncHandler(async (req, res) => {
    if (!req.body?.reviewed || !req.body?.agreed)
      return res.status(422).json({ error: "review_and_consent_required" });
    await verifySigningReauthentication(req);
    res.json({
      contract: await signContract(req.params.id, req.body, req.user),
    });
  }),
);
router.post(
  "/:id/decline",
  requireAuth,
  signatureLimiter,
  asyncHandler(async (req, res) =>
    res.json({
      contract: await declineContract(
        req.params.id,
        req.body?.reason,
        req.user,
      ),
    }),
  ),
);
router.get(
  "/:id/pdf",
  requireAuth,
  asyncHandler(async (req, res) => {
    const contract = await getAuthorizedContract(
      req.params.id,
      req.user,
      isContractAdmin(req),
    );
    if (!contract) return res.status(404).json({ error: "contract_not_found" });
    // This also upgrades legacy stored PDFs on their next authorized download.
    const pdf = await generatePdf(req.params.id, req.user.id);
    const upstream = await fetch(pdf.file_url);
    if (!upstream.ok)
      return res.status(502).json({ error: "pdf_storage_unavailable" });
    const data = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="gotham-city-contract-${contract.contract_number}.pdf"`,
    );
    res.setHeader("Cache-Control", "private, no-store");
    res.send(data);
  }),
);

export default router;
