import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createResource, getResource, listResource, updateResource } from "../services/repository.js";

const router = Router();

function truthy(value) {
  return value === true || value === 1 || value === "1";
}

function published(row = {}) {
  const status = String(row.status || "Published").toLowerCase();
  return !row.deleted_at && !["hidden", "draft", "deleted", "unpublished"].includes(status);
}

function mapPost(row = {}) {
  return {
    id: String(row.id),
    title: row.title || "Untitled",
    excerpt: row.subtitle || row.excerpt || String(row.content || "").slice(0, 180),
    content: row.content || "",
    image: row.image_url || row.image || "",
    category: row.category || "News",
    tags: row.tags || "",
    author: row.author_name || row.created_by || "Gotham City",
    pinned: truthy(row.is_featured || row.pinned),
    likes: Number(row.likes || 0),
    dislikes: Number(row.dislikes || 0),
    comment_count: Number(row.comment_count || 0),
    published_at: row.published_at || row.created_at || new Date().toISOString(),
    status: row.status || "Published"
  };
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
    const data = news.rows.filter(published).map((row) => ({ ...mapPost(row), comment_count: counts.get(String(row.id)) || 0 }));
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
      post: mapPost(row),
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
    const comment = await createResource(
      "newsComments",
      {
        news_id: post.id,
        user_id: req.user.id,
        author_name: String(req.body?.author_name || req.user.username || "Community Member").slice(0, 80),
        body: body.slice(0, 1000),
        status: "pending",
        approved: 0,
        is_hidden: 0
      },
      req.user
    );
    res.status(201).json({ pending: true, comment: mapComment(comment) });
  })
);

router.post(
  "/:id/:kind(like|dislike)",
  asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "login_required", message: "Login to vote." });
    const post = await getResource("news", req.params.id);
    if (!post) return res.status(404).json({ error: "news_not_found", message: "News post not found." });
    const field = req.params.kind === "like" ? "likes" : "dislikes";
    await updateResource("news", post.id, { [field]: Number(post[field] || 0) + 1 }, req.user);
    res.json({ liked: req.params.kind === "like", disliked: req.params.kind === "dislike" });
  })
);

export default router;
