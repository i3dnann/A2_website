import { Router } from "express";
import { RESOURCE_MAP, SEED_DATA } from "../data/catalog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getFiveMStatus, getResource, getSettings, listResource } from "../services/repository.js";
import { withLiveStatus } from "../services/streamerService.js";

const router = Router();

function isPublicSeedRow(resourceKey, row) {
  if (!row || row.deleted_at || row.is_hidden === true || row.is_hidden === 1 || row.status === "Hidden") return false;
  if (resourceKey === "streamers") return Boolean(row.is_approved) && !row.is_hidden;
  return true;
}

function findSeedRows(resourceKey, options = {}) {
  const config = RESOURCE_MAP[resourceKey];
  const limit = Math.min(Number(options.limit) || 25, 100);
  const offset = Math.max(Number(options.offset) || 0, 0);
  const q = String(options.q || "").trim().toLowerCase();
  let rows = (SEED_DATA[resourceKey] || [])
    .filter((row) => isPublicSeedRow(resourceKey, row))
    .map((row) => ({ ...row, is_seed: true }));

  if (q && config?.searchFields?.length) {
    rows = rows.filter((row) => config.searchFields.some((field) => String(row[field] || "").toLowerCase().includes(q)));
  }

  rows = rows.sort((a, b) => Number(a.sort_order || 9999) - Number(b.sort_order || 9999) || String(b.created_at || "").localeCompare(String(a.created_at || "")));
  return { rows: rows.slice(offset, offset + limit), total: rows.length };
}

async function listPublicResource(resourceKey, options = {}) {
  const result = await listResource(resourceKey, options);
  if (result.rows?.length) return result;

  const seed = findSeedRows(resourceKey, options);
  if (!seed.rows.length) return result;

  return {
    ...result,
    rows: seed.rows,
    total: seed.total,
    seeded: true
  };
}

function findSeedRow(resourceKey, id) {
  return (SEED_DATA[resourceKey] || []).find((row) => String(row.id) === String(id) && isPublicSeedRow(resourceKey, row));
}

router.get("/settings", (req, res) => {
  res.json({ settings: getSettings() });
});

router.get(
  "/home",
  asyncHandler(async (_req, res) => {
    const settings = getSettings();
    const [news, events, businesses, characters, streamers] = await Promise.all([
      listPublicResource("news", { limit: 4, publicOnly: true }),
      listPublicResource("events", { limit: 4, publicOnly: true }),
      listPublicResource("businesses", { limit: 4, publicOnly: true }),
      listPublicResource("characterProfiles", { limit: 1, publicOnly: true }),
      listPublicResource("streamers", { limit: 8, publicOnly: true })
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
    const { rows, total } = await listPublicResource("streamers", { q, limit: 100, publicOnly: true });
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
    const fallbackStreamer = findSeedRow("streamers", req.params.id);
    const row = streamer || fallbackStreamer;
    if (!row || !row.is_approved || row.is_hidden) return res.status(404).json({ error: "streamer_not_found" });
    const [withStatus] = await withLiveStatus([row]);
    res.json({ streamer: withStatus });
  })
);

router.get(
  "/:resource",
  asyncHandler(async (req, res) => {
    const config = RESOURCE_MAP[req.params.resource];
    if (!config?.public) return res.status(404).json({ error: "public_resource_not_found" });
    const { rows, total, seeded } = await listPublicResource(req.params.resource, {
      q: req.query.q || "",
      limit: req.query.limit || 24,
      offset: req.query.offset || 0,
      publicOnly: true
    });
    res.json({ rows, total, label: config.label, seeded: Boolean(seeded) });
  })
);

router.get(
  "/:resource/:id",
  asyncHandler(async (req, res) => {
    const config = RESOURCE_MAP[req.params.resource];
    if (!config?.public) return res.status(404).json({ error: "public_resource_not_found" });
    const row = (await getResource(req.params.resource, req.params.id)) || findSeedRow(req.params.resource, req.params.id);
    if (!row || row.deleted_at || row.is_hidden) return res.status(404).json({ error: "not_found" });
    res.json({ row, label: config.label });
  })
);

export default router;
