import { Router } from "express";
import { RESOURCE_MAP } from "../data/catalog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getFiveMStatus, getResource, getSettings, listResource } from "../services/repository.js";
import { withLiveStatus } from "../services/streamerService.js";

const router = Router();

router.get("/settings", (req, res) => {
  res.json({ settings: getSettings() });
});

router.get(
  "/home",
  asyncHandler(async (_req, res) => {
    const settings = getSettings();
    const [news, events, businesses, characters, streamers] = await Promise.all([
      listResource("news", { limit: 4, publicOnly: true }),
      listResource("events", { limit: 4, publicOnly: true }),
      listResource("businesses", { limit: 4, publicOnly: true }),
      listResource("characterProfiles", { limit: 1, publicOnly: true }),
      listResource("streamers", { limit: 8, publicOnly: true })
    ]);
    const streamerRows = await withLiveStatus(streamers.rows);

    res.json({
      settings,
      status: getFiveMStatus(),
      latestNews: news.rows,
      latestEvents: events.rows,
      businessSpotlight: businesses.rows[0] || null,
      featuredCharacter: characters.rows[0] || null,
      streamers: streamerRows,
      weeklyHighlights: {
        police: "Best police officer can be selected in CMS",
        ems: "Best EMS can be selected in CMS",
        gang: "Best criminal/gang can be selected in CMS"
      }
    });
  })
);

router.get("/status", (_req, res) => {
  res.json({ status: getFiveMStatus(), settings: getSettings() });
});

router.get(
  "/streamers",
  asyncHandler(async (req, res) => {
    const settings = getSettings();
    if (!settings.streamerPageEnabled) return res.status(404).json({ error: "streamer_page_disabled" });
    const { q = "", platform = "", category = "" } = req.query;
    const { rows, total } = await listResource("streamers", { q, limit: 100, publicOnly: true });
    let streamers = await withLiveStatus(rows);
    streamers = streamers.filter((streamer) => {
      if (!settings.showOfflineStreamers && !streamer.is_live) return false;
      if (platform && String(streamer.main_platform || "").toLowerCase() !== String(platform).toLowerCase()) return false;
      if (category && String(streamer.category || "").toLowerCase() !== String(category).toLowerCase()) return false;
      return true;
    });
    streamers = streamers.sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || Number(b.is_live) - Number(a.is_live) || Number(a.sort_order || 9999) - Number(b.sort_order || 9999));
    res.json({ streamers, total, settings });
  })
);

router.get(
  "/streamers/:id",
  asyncHandler(async (req, res) => {
    const streamer = await getResource("streamers", req.params.id);
    if (!streamer || !streamer.is_approved || streamer.is_hidden) return res.status(404).json({ error: "streamer_not_found" });
    const [withStatus] = await withLiveStatus([streamer]);
    res.json({ streamer: withStatus });
  })
);

router.get(
  "/:resource",
  asyncHandler(async (req, res) => {
    const config = RESOURCE_MAP[req.params.resource];
    if (!config?.public) return res.status(404).json({ error: "public_resource_not_found" });
    const { rows, total } = await listResource(req.params.resource, {
      q: req.query.q || "",
      limit: req.query.limit || 24,
      offset: req.query.offset || 0,
      publicOnly: true
    });
    res.json({ rows, total, label: config.label });
  })
);

router.get(
  "/:resource/:id",
  asyncHandler(async (req, res) => {
    const config = RESOURCE_MAP[req.params.resource];
    if (!config?.public) return res.status(404).json({ error: "public_resource_not_found" });
    const row = await getResource(req.params.resource, req.params.id);
    if (!row || row.deleted_at || row.is_hidden) return res.status(404).json({ error: "not_found" });
    res.json({ row, label: config.label });
  })
);

export default router;
