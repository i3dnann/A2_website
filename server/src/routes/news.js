import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createResource, getResource, listResource, updateResource } from "../services/repository.js";
import { resolveUserIdentity } from "../services/users.js";
import { query } from "../config/db.js";
import { userIsVerified } from "../services/verificationService.js";

const router = Router();
const memoryVotes = new Map();
let votesTableReady = false;

function truthy(value) {
  return value === true || value === 1 || value === "1";
}

function published(row = {}) {
  const status = String(row.status || "Published").toLowerCase();
  return !row.deleted_at && !["hidden", "draft", "deleted", "unpublished"].includes(status);
}

async function mapPost(row = {}) {
  const authorIdentity = row.author_name ? null : await resolveUserIdentity({ user_id: row.created_by || "" });
  const counts = await voteCounts(row.id, row);
  return {
    id: String(row.id),
    title: row.title || "Untitled",
    excerpt: row.subtitle || row.excerpt || String(row.content || "").slice(0, 180),
    content: row.content || "",
    image: row.image_url || row.image || "",
    video_url: row.video_url || row.video || "",
    category: row.category || "News",
    tags: row.tags || "",
    author: row.author_name || authorIdentity?.label || "Gotham City",
    pinned: truthy(row.is_featured || row.pinned),
    likes: counts.likes,
    dislikes: counts.dislikes,
    comment_count: Number(row.comment_count || 0),
    published_at: row.published_at || row.created_at || new Date().toISOString(),
    status: row.status || "Published"
  };
}

async function ensureVotesTable() {
  if (votesTableReady) return true;
  const result = await query(`
    CREATE TABLE IF NOT EXISTS news_votes (
      id VARCHAR(96) PRIMARY KEY,
      news_id VARCHAR(64) NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      vote_type VARCHAR(16) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_news_vote_user (news_id, user_id),
      INDEX idx_news_votes_news (news_id),
      INDEX idx_news_votes_user (user_id),
      INDEX idx_news_votes_type (vote_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  votesTableReady = Boolean(result);
  return votesTableReady;
}

async function getUserVote(newsId, userId) {
  if (!newsId || !userId) return null;
  if (await ensureVotesTable()) {
    const rows = await query(
      "SELECT vote_type FROM news_votes WHERE news_id = :news_id AND user_id = :user_id LIMIT 1",
      { news_id: newsId, user_id: userId }
    );
    if (rows?.[0]?.vote_type) return rows[0].vote_type;
  }
  return memoryVotes.get(`${newsId}:${userId}`) || null;
}

async function voteCounts(newsId, fallbackPost = {}) {
  if (await ensureVotesTable()) {
    const rows = await query(
      `SELECT
         SUM(vote_type = 'like') AS likes,
         SUM(vote_type = 'dislike') AS dislikes
       FROM news_votes
       WHERE news_id = :news_id`,
      { news_id: newsId }
    );
    if (rows?.[0]) return { likes: Number(rows[0].likes || 0), dislikes: Number(rows[0].dislikes || 0) };
  }

  let likes = 0;
  let dislikes = 0;
  for (const [key, vote] of memoryVotes.entries()) {
    if (!key.startsWith(`${newsId}:`)) continue;
    if (vote === "like") likes += 1;
    if (vote === "dislike") dislikes += 1;
  }
  if (likes || dislikes) return { likes, dislikes };
  return { likes: Number(fallbackPost.likes || 0), dislikes: Number(fallbackPost.dislikes || 0) };
}

async function saveUserVote(newsId, userId, voteType) {
  const existing = await getUserVote(newsId, userId);
  if (existing === voteType) return existing;

  if (await ensureVotesTable()) {
    await query(
      `INSERT INTO news_votes (id, news_id, user_id, vote_type)
       VALUES (:id, :news_id, :user_id, :vote_type)
       ON DUPLICATE KEY UPDATE vote_type = VALUES(vote_type), updated_at = CURRENT_TIMESTAMP`,
      { id: `${newsId}:${userId}`.slice(0, 96), news_id: newsId, user_id: userId, vote_type: voteType }
    );
  } else {
    memoryVotes.set(`${newsId}:${userId}`, voteType);
  }
  return voteType;
}

function commentVisible(row = {}) {
  const status = String(row.status || (truthy(row.approved) ? "approved" : "pending")).toLowerCase();
  return !row.deleted_at && !truthy(row.is_hidden) && status === "approved";
}

function mapComment(row = {}) {
  return {
    id: String(row.id),
    news_id: row.news_id,
    user_id: row.user_id || "",
    author_name: row.author_name || "Community Member",
    author_verified: truthy(row.author_verified),
    body: row.body || "",
    status: row.status || (truthy(row.approved) ? "approved" : "pending"),
    approved: truthy(row.approved) ? 1 : 0,
    created_at: row.created_at || new Date().toISOString()
  };
}

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [news, comments] = await Promise.all([
      listResource("news", { limit: 100, publicOnly: true }),
      listResource("newsComments", { limit: 100 })
    ]);
    const counts = new Map();
    comments.rows.filter(commentVisible).forEach((comment) => counts.set(String(comment.news_id), (counts.get(String(comment.news_id)) || 0) + 1));
    const data = await Promise.all(news.rows.filter(published).map(async (row) => ({ ...(await mapPost(row)), comment_count: counts.get(String(row.id)) || 0 })));
    res.json({ data });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await getResource("news", req.params.id);
    if (!row || !published(row)) return res.status(404).json({ error: "news_not_found", message: "News post not found." });
    const comments = await listResource("newsComments", { q: req.params.id, limit: 100 });
    res.json({
      post: { ...(await mapPost(row)), user_vote: req.user ? await getUserVote(row.id, req.user.id) : null },
      comments: comments.rows.filter((comment) => String(comment.news_id) === String(row.id) && commentVisible(comment)).map(mapComment)
    });
  })
);

router.post(
  "/:id/comments",
  asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "login_required", message: "Login to comment." });
    const post = await getResource("news", req.params.id);
    if (!post || !published(post)) return res.status(404).json({ error: "news_not_found", message: "News post not found." });
    const body = String(req.body?.body || "").trim();
    if (body.length < 2) return res.status(422).json({ error: "comment_required", message: "Write a comment first." });
    const verified = userIsVerified(req.user);
    const comment = await createResource(
      "newsComments",
      {
        news_id: post.id,
        user_id: req.user.id,
        author_name: String(req.body?.author_name || req.user.username || "Community Member").slice(0, 80),
        author_verified: verified ? 1 : 0,
        body: body.slice(0, 1000),
        status: verified ? "approved" : "pending",
        approved: verified ? 1 : 0,
        is_hidden: 0
      },
      req.user
    );
    res.status(201).json({ pending: !verified, comment: mapComment(comment) });
  })
);

router.post(
  "/:id/:kind(like|dislike)",
  asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "login_required", message: "Login to vote." });
    const post = await getResource("news", req.params.id);
    if (!post) return res.status(404).json({ error: "news_not_found", message: "News post not found." });
    const voteType = req.params.kind === "like" ? "like" : "dislike";
    const savedVote = await saveUserVote(post.id, req.user.id, voteType);
    const counts = await voteCounts(post.id, post);
    await updateResource("news", post.id, counts, req.user);
    res.json({
      liked: savedVote === "like",
      disliked: savedVote === "dislike",
      user_vote: savedVote,
      likes: counts.likes,
      dislikes: counts.dislikes
    });
  })
);

export default router;
