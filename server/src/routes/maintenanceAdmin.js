import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { upload } from "../middleware/security.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createResource, getSettings, updateSettings } from "../services/repository.js";
import { auditAction } from "../services/audit.js";
import { uploadToCloudinary } from "../services/cloudinaryService.js";

const router = Router();

router.use(requireAuth, requirePermission("manage_home"));

async function saveUploadedMaintenanceMedia(req, res, { type, settingKeys, action }) {
  if (!req.file) return res.status(422).json({ error: "file_required", message: `Upload a ${type} file first.` });
  const mime = String(req.file.mimetype || "");
  if (!mime.startsWith(`${type}/`)) return res.status(400).json({ error: `only_${type}_allowed`, message: `Upload a valid ${type} file.` });

  const uploaded = await uploadToCloudinary(req.file, `gotham-city/maintenance/${type}`);
  const url = uploaded.url;
  const file = await createResource("files", {
    owner_user_id: req.user.id,
    original_name: req.file.originalname,
    stored_name: uploaded.publicId,
    mime_type: req.file.mimetype,
    size_bytes: uploaded.bytes,
    url,
    storage_driver: "cloudinary"
  }, req.user);

  const patch = Object.fromEntries(settingKeys.map((key) => [key, url]));
  const { before, after } = await updateSettings(patch, req.user);
  await auditAction({ req, action, targetType: "web_settings", targetId: settingKeys[0], before, after, reason: `maintenance ${type} uploaded`, webhookCategory: "admin" });

  res.json({ ok: true, url, file, settings: await getSettings() });
}

router.post("/sound", upload.single("file"), asyncHandler(async (req, res) => {
  await saveUploadedMaintenanceMedia(req, res, {
    type: "audio",
    settingKeys: ["maintenanceSoundUrl", "maintenanceAudioUrl"],
    action: "upload_maintenance_sound"
  });
}));

router.post("/video", upload.single("file"), asyncHandler(async (req, res) => {
  await saveUploadedMaintenanceMedia(req, res, {
    type: "video",
    settingKeys: ["maintenanceVideoUrl", "maintenanceYoutubeUrl"],
    action: "upload_maintenance_video"
  });
}));

export default router;
