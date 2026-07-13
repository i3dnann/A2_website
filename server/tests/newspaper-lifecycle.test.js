import test from "node:test";
import assert from "node:assert/strict";
import {
  addPage,
  createIssue,
  deletePage,
  getIssue,
  listIssues,
  reorderPages,
  updateIssue,
  updatePage,
} from "../src/services/newspaperService.js";
import { requirePermission } from "../src/middleware/auth.js";

test("newspaper administration rejects users without manage_news", () => {
  let statusCode = 200;
  let payload;
  let continued = false;
  requirePermission("manage_news")(
    { user: { permissions: ["view_player_portal"], admin_status: "active" } },
    {
      status(code) {
        statusCode = code;
        return this;
      },
      json(value) {
        payload = value;
        return this;
      },
    },
    () => {
      continued = true;
    },
  );
  assert.equal(continued, false);
  assert.equal(statusCode, 403);
  assert.equal(payload.error, "missing_permission");
});

test("newspaper issue lifecycle preserves draft privacy and page ordering", async () => {
  const actor = { id: "newspaper-test-admin" };
  const created = await createIssue(
    { name: `Test Edition ${Date.now()}`, issue_number: "T-1" },
    actor,
  );
  assert.equal(created.issue.status, "draft");
  assert.equal(created.pages.length, 2);
  assert.equal(
    (await listIssues({ publicOnly: true })).some(
      (issue) => issue.id === created.issue.id,
    ),
    false,
  );
  const added = await addPage(
    created.issue.id,
    { template_key: "classifieds", internal_label: "Classifieds" },
    actor,
  );
  await updatePage(
    added.id,
    {
      blocks: [
        {
          type: "article",
          headline: "<script>alert(1)</script>Safe headline",
          body: "City story",
        },
      ],
    },
    actor,
  );
  const beforeOrder = (await getIssue(created.issue.id)).pages.map(
    (page) => page.id,
  );
  await reorderPages(
    created.issue.id,
    [beforeOrder[2], beforeOrder[0], beforeOrder[1]],
    actor,
  );
  const reordered = await getIssue(created.issue.id);
  assert.equal(reordered.pages[0].id, added.id);
  assert.equal(
    reordered.pages[0].blocks[0].headline.includes("<script>"),
    false,
  );
  await updateIssue(
    created.issue.id,
    { status: "published", publication_date: new Date().toISOString() },
    actor,
  );
  assert.equal(
    (await listIssues({ publicOnly: true })).some(
      (issue) => issue.id === created.issue.id,
    ),
    true,
  );
  await deletePage(added.id, actor);
  assert.equal(
    (await getIssue(created.issue.id)).pages.some(
      (page) => page.id === added.id,
    ),
    false,
  );
});
