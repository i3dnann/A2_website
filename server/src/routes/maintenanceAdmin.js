import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { upload } from "../middleware/security.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createResource, getSettings, updateSettings } from "../services/repository.js";
import { auditAction } from "../services/audit.js";
import { publicFileUrl } from "../utils/sanitize.js";

const router = Router();

router.use(requireAuth, requirePermission("manage_home"));

router.post("/sound", upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(422).json({ error: "file_required", message: "Upload an audio file first." });

  const url = publicFileUrl(req, req.file);
  const file = await createResource("files", {
    owner_user_id: req.user.id,
    original_name: req.file.originalname,
    stored_name: req.file.filename,
    mime_type: req.file.mimetype,
    size_bytes: req.file.size,
    url,
    storage_driver: "local"
  }, req.user);

  const { before, after } = await updateSettings({ maintenanceSoundUrl: url }, req.user);
  await auditAction({ req, action: "upload_maintenance_sound", targetType: "web_settings", targetId: "maintenanceSoundUrl", before, after, reason: "maintenance sound uploaded", webhookCategory: "admin" });

  res.json({ ok: true, url, file, settings: await getSettings() });
}));

export default router;
