import { Router } from "express";
import { z } from "zod";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  addPage,
  createIssue,
  deleteIssue,
  deletePage,
  getIssue,
  latestIssue,
  listIssues,
  reorderPages,
  saveNewspaperSettings,
  updateIssue,
  updatePage,
} from "../services/newspaperService.js";

const router = Router();
const issueSchema = z.object({
  name: z.string().min(1).max(190),
  issue_number: z.string().max(40).optional(),
  slug: z.string().max(190).optional(),
  status: z.enum(["draft", "published", "archived", "scheduled"]).optional(),
  publication_date: z.string().nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
  settings: z.record(z.any()).optional(),
});
const pageSchema = z.object({
  internal_label: z.string().max(120).optional(),
  section_name: z.string().max(100).optional(),
  template_key: z.string().max(80).optional(),
  blocks: z.array(z.record(z.any())).max(100).optional(),
  style: z.record(z.any()).optional(),
  is_hidden: z.union([z.boolean(), z.number()]).optional(),
});
const parse = (schema, body) => schema.parse(body || {});

router.get(
  "/latest",
  asyncHandler(async (_req, res) => res.json(await latestIssue())),
);
router.get(
  "/issues",
  asyncHandler(async (_req, res) =>
    res.json({ rows: await listIssues({ publicOnly: true }) }),
  ),
);
router.get(
  "/issues/:slug",
  asyncHandler(async (req, res) => {
    const bundle = await getIssue(req.params.slug, { publicOnly: true });
    if (!bundle) return res.status(404).json({ error: "issue_not_found" });
    res.json(bundle);
  }),
);

router.use("/admin", requireAuth, requirePermission("manage_news"));
router.get(
  "/admin/issues",
  asyncHandler(async (_req, res) => res.json({ rows: await listIssues() })),
);
router.get(
  "/admin/issues/:id",
  asyncHandler(async (req, res) => {
    const bundle = await getIssue(req.params.id);
    if (!bundle) return res.status(404).json({ error: "issue_not_found" });
    res.json(bundle);
  }),
);
router.post(
  "/admin/issues",
  asyncHandler(async (req, res) =>
    res
      .status(201)
      .json(await createIssue(parse(issueSchema, req.body), req.user)),
  ),
);
router.patch(
  "/admin/issues/:id",
  asyncHandler(async (req, res) => {
    const result = await updateIssue(
      req.params.id,
      parse(issueSchema.partial(), req.body),
      req.user,
    );
    if (!result) return res.status(404).json({ error: "issue_not_found" });
    res.json(result);
  }),
);
router.delete(
  "/admin/issues/:id",
  asyncHandler(async (req, res) => {
    const result = await deleteIssue(req.params.id, req.user);
    if (!result) return res.status(404).json({ error: "issue_not_found" });
    res.json({ ok: true });
  }),
);
router.post(
  "/admin/issues/:id/pages",
  asyncHandler(async (req, res) =>
    res
      .status(201)
      .json({
        page: await addPage(
          req.params.id,
          parse(pageSchema, req.body),
          req.user,
        ),
      }),
  ),
);
router.post(
  "/admin/issues/:id/reorder",
  asyncHandler(async (req, res) =>
    res.json(
      await reorderPages(
        req.params.id,
        z.array(z.string()).max(100).parse(req.body?.ids),
        req.user,
      ),
    ),
  ),
);
router.patch(
  "/admin/pages/:id",
  asyncHandler(async (req, res) => {
    const page = await updatePage(
      req.params.id,
      parse(pageSchema, req.body),
      req.user,
    );
    if (!page) return res.status(404).json({ error: "page_not_found" });
    res.json({ page });
  }),
);
router.delete(
  "/admin/pages/:id",
  asyncHandler(async (req, res) => {
    await deletePage(req.params.id, req.user);
    res.json({ ok: true });
  }),
);
router.patch(
  "/admin/settings",
  asyncHandler(async (req, res) =>
    res.json({ settings: await saveNewspaperSettings(req.body, req.user) }),
  ),
);
export default router;
