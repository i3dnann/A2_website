import { Router } from "express";
import { PUBLIC_COLLECTIONS, RESOURCE_MAP } from "../data/catalog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getResource, getSettings, listResource } from "../services/repository.js";
import { listGalleryPhotos } from "../services/galleryService.js";
import { checkAllStreamers, withLiveStatus } from "../services/streamerService.js";

const router = Router();

function eventStatus(event) {
  if (event.status_override) return event.status_override;
  const now = Date.now();
  const starts = event.starts_at ? new Date(event.starts_at).getTime() : null;
  const ends = event.ends_at ? new Date(event.ends_at).getTime() : null;
  if (starts && starts > now) return "Future";
  if (starts && ends && starts <= now && ends >= now) return "Live";
  if (ends && ends < now) return "Passed";
  return "Future";
}

function publicSummary(row) {
  return { ...row, event_status: row?.starts_at || row?.ends_at ? eventStatus(row) : row?.status };
}

router.get("/settings", asyncHandler(async (_req, res) => {
  res.json({ settings: await getSettings() });
}));

router.get("/home", asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  const [partners, journey, famous, news, events, team, streamers, gallery] = await Promise.all([
    listResource("partners", { limit: 20, publicOnly: true }),
    listResource("journey", { limit: 4, publicOnly: true }),
    listResource("famous", { limit: 4, publicOnly: true }),
    listResource("news", { limit: 4, publicOnly: true }),
    listResource("events", { limit: 4, publicOnly: true }),
    listResource("team", { limit: 6, publicOnly: true }),
    listResource("streamers", { limit: 8, publicOnly: true }),
    listGalleryPhotos({ status: "Approved", limit: 4 })
  ]);

  res.json({
    settings,
    partners: partners.rows,
    journey: journey.rows,
    famous: famous.rows,
    news: news.rows,
    events: events.rows.map(publicSummary).sort((a, b) => {
      const order = { Live: 0, Future: 1, Passed: 2 };
      return (order[a.event_status] ?? 9) - (order[b.event_status] ?? 9);
    }),
    team: team.rows,
    gallery,
    streamers: await withLiveStatus(streamers.rows)
  });
}));

router.get("/live", asyncHandler(async (req, res) => {
  const settings = await getSettings();
  if (!settings.livePageEnabled) return res.status(404).json({ error: "live_page_disabled" });
  if (req.query.refresh === "1") await checkAllStreamers();
  const { q = "", platform = "" } = req.query;
  const { rows } = await listResource("streamers", { q, limit: 100, publicOnly: true });
  let streamers = await withLiveStatus(rows);
  if (platform) {
    streamers = streamers.filter((streamer) => {
      const selected = String(platform).toLowerCase();
      return (selected === "twitch" && streamer.twitch_username) || (selected === "kick" && streamer.kick_username);
    });
  }
  if (!settings.showOfflineStreamers) streamers = streamers.filter((streamer) => streamer.is_live);
  streamers = streamers.sort((a, b) => Number(b.is_live) - Number(a.is_live) || Number(b.is_featured) - Number(a.is_featured) || Number(a.sort_order || 9999) - Number(b.sort_order || 9999));
  res.json({ streamers, totalLiveChannels: streamers.filter((streamer) => streamer.is_live).length, totalLiveViewers: streamers.reduce((sum, streamer) => sum + Number(streamer.viewer_count || 0), 0), settings });
}));

router.get("/streamers", asyncHandler(async (req, res) => {
  const { q = "", category = "" } = req.query;
  const { rows, total } = await listResource("streamers", { q, limit: 100, publicOnly: true });
  let streamers = await withLiveStatus(rows);
  if (category) streamers = streamers.filter((streamer) => String(streamer.category || "").toLowerCase() === String(category).toLowerCase());
  res.json({ streamers, total });
}));

router.get("/streamers/:id", asyncHandler(async (req, res) => {
  const streamer = await getResource("streamers", req.params.id);
  if (!streamer || streamer.is_hidden || !streamer.is_approved) return res.status(404).json({ error: "streamer_not_found" });
  const [withStatus] = await withLiveStatus([streamer]);
  res.json({ streamer: withStatus });
}));

router.get("/faq", asyncHandler(async (_req, res) => {
  const [categories, items] = await Promise.all([listResource("faqCategories", { limit: 100, publicOnly: true }), listResource("faqItems", { limit: 200, publicOnly: true })]);
  res.json({ categories: categories.rows, items: items.rows });
}));

router.get("/terms", asyncHandler(async (_req, res) => {
  const { rows } = await listResource("terms", { limit: 10, publicOnly: true });
  const terms = rows.sort((a, b) => String(b.effective_date || "").localeCompare(String(a.effective_date || "")))[0] || null;
  res.json({ terms });
}));

router.get("/careers/:id", asyncHandler(async (req, res) => {
  const job = await getResource("careerJobs", req.params.id);
  if (!job || job.deleted_at || job.is_visible === false || job.is_visible === 0) return res.status(404).json({ error: "career_not_found" });
  const [sections, questions] = await Promise.all([listResource("careerSections", { q: req.params.id, limit: 100 }), listResource("careerQuestions", { q: req.params.id, limit: 200 })]);
  res.json({ job, sections: sections.rows.filter((section) => section.job_id === req.params.id && section.is_visible !== false && section.is_visible !== 0), questions: questions.rows.filter((question) => question.job_id === req.params.id && question.is_visible !== false && question.is_visible !== 0) });
}));

router.get("/:collection", asyncHandler(async (req, res) => {
  const resourceKey = PUBLIC_COLLECTIONS[req.params.collection];
  const config = resourceKey ? RESOURCE_MAP[resourceKey] : null;
  if (!config?.public) return res.status(404).json({ error: "public_resource_not_found" });
  const result = await listResource(resourceKey, { q: req.query.q || "", limit: req.query.limit || 24, offset: req.query.offset || 0, publicOnly: true });
  const rows = resourceKey === "events" ? result.rows.map(publicSummary) : result.rows;
  res.json({ rows, total: result.total, label: config.label, resourceKey });
}));

router.get("/:collection/:id", asyncHandler(async (req, res) => {
  const resourceKey = PUBLIC_COLLECTIONS[req.params.collection];
  const config = resourceKey ? RESOURCE_MAP[resourceKey] : null;
  if (!config?.public) return res.status(404).json({ error: "public_resource_not_found" });
  const row = await getResource(resourceKey, req.params.id);
  if (!row || row.deleted_at || row.is_hidden || row.is_visible === false || row.is_visible === 0) return res.status(404).json({ error: "not_found" });
  res.json({ row: resourceKey === "events" ? publicSummary(row) : row, label: config.label, resourceKey });
}));

export default router;
