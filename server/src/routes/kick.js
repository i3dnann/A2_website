import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cleanKickSlug, getKickStatus, kickErrorResponse } from "../services/kickService.js";

const router = Router();

router.get(
  "/status/:slug(*)",
  asyncHandler(async (req, res) => {
    const slug = cleanKickSlug(req.params.slug);
    if (!slug) {
      return res.json({
        slug: "",
        online: false,
        channel: null,
        stream: null,
        checkedAt: new Date().toISOString(),
        skipped: "missing_kick_username"
      });
    }

    try {
      res.json(await getKickStatus(slug));
    } catch (error) {
      console.warn("[kick] status route failed:", slug, error.message);
      res.json(kickErrorResponse(error, slug));
    }
  })
);

export default router;
