import { Router } from "express";
import { PUBLIC_COLLECTIONS, RESOURCE_MAP } from "../data/catalog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getResource, getSettings, listResource } from "../services/repository.js";
import { listGalleryPhotos, publicGalleryPhoto } from "../services/galleryService.js";
import { enrichStreamers } from "../services/streamStatusService.js";
import { listCommunityAvatars } from "../services/users.js";

const router = Router();

router.get("/community-avatars", asyncHandler(async (_req, res) => {
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  res.json({ avatars: await listCommunityAvatars(6) });
}));

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

function publicVisible(row = {}) {
  const status = String(row.status || "Published").toLowerCase();
  return !row.deleted_at &&
    !row.is_hidden &&
    row.is_visible !== false &&
    row.is_visible !== 0 &&
    !["hidden", "draft", "deleted", "unpublished"].includes(status);
}

router.get("/settings", asyncHandler(async (_req, res) => {
  res.json({ settings: await getSettings() });
}));

router.get("/home", asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  const [partners, journey, famous, news, events, team, gallery, careers] = await Promise.all([
    listResource("partners", { limit: 100, publicOnly: true }),
    listResource("journey", { limit: 4, publicOnly: true }),
    listResource("famous", { limit: 4, publicOnly: true }),
    listResource("news", { limit: 4, publicOnly: true }),
    listResource("events", { limit: 4, publicOnly: true }),
    listResource("team", { limit: 6, publicOnly: true }),
    listGalleryPhotos({ status: "Approved", limit: 4 }),
    listResource("careerJobs", { limit: 6, publicOnly: true })
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
    gallery: gallery.map(publicGalleryPhoto),
    careers: careers.rows
  });
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

router.get("/streamers/live", asyncHandler(async (_req, res) => {
  const { rows } = await listResource("streamers", { limit: 100, publicOnly: true });
  const result = await enrichStreamers(rows);
  res.json({ rows: result.streamers, totalViewers: result.totalViewers, liveCount: result.liveCount });
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
  if (!row || !publicVisible(row)) return res.status(404).json({ error: "not_found" });
  res.json({ row: resourceKey === "events" ? publicSummary(row) : row, label: config.label, resourceKey });
}));

export default router;
