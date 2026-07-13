import { randomUUID } from "node:crypto";
import { query } from "../config/db.js";
import { databaseEnabled } from "../config/env.js";
import { listResource } from "./repository.js";
import { safeJson } from "../utils/sanitize.js";

const memory = {
  settings: null,
  issues: new Map(),
  pages: new Map(),
  ads: new Map(),
};
let schemaReady = false;
const defaultStyle = {
  paperColor: "#e8ddc4",
  inkColor: "#171512",
  accentColor: "#6b2525",
  headlineFont: "Georgia",
  bodyFont: "Georgia",
  aging: 0.34,
  pageTurnSpeed: 720,
  imageFilter: "grayscale",
};

function now() {
  return new Date().toISOString();
}
function cleanText(value, length = 5000) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001f]/g, " ")
    .trim()
    .slice(0, length);
}
function slugify(value) {
  return (
    cleanText(value, 190)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || randomUUID()
  );
}
function sanitizeBlocks(blocks = []) {
  return blocks.map((block) =>
    Object.fromEntries(
      Object.entries(block).map(([key, value]) => [
        key,
        typeof value === "string"
          ? cleanText(value, key === "body" ? 20000 : 2000)
          : value,
      ]),
    ),
  );
}
function json(value, fallback) {
  return typeof value === "string"
    ? safeJson(value, fallback)
    : (value ?? fallback);
}
function mapIssue(row) {
  return {
    ...row,
    id: String(row.id),
    settings: json(row.settings_json, {}),
    settings_json: undefined,
  };
}
function mapPage(row) {
  return {
    ...row,
    id: String(row.id),
    issue_id: String(row.issue_id),
    page_number: Number(row.page_number),
    blocks: json(row.blocks_json, []),
    style: json(row.style_json, {}),
    blocks_json: undefined,
    style_json: undefined,
  };
}

async function ensureNewspaperSchema() {
  if (!databaseEnabled || schemaReady) return;
  await query(
    `CREATE TABLE IF NOT EXISTS newspaper_settings (id VARCHAR(64) PRIMARY KEY,newspaper_name VARCHAR(160) NOT NULL,motto VARCHAR(255),logo_url TEXT,sound_url TEXT,style_json JSON,created_by VARCHAR(64),updated_by VARCHAR(64),created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );
  await query(
    `CREATE TABLE IF NOT EXISTS newspaper_issues (id VARCHAR(64) PRIMARY KEY,issue_number VARCHAR(40) NOT NULL,name VARCHAR(190) NOT NULL,slug VARCHAR(190) NOT NULL,status VARCHAR(32) NOT NULL DEFAULT 'draft',publication_date DATETIME NULL,scheduled_at DATETIME NULL,cover_image_url TEXT,settings_json JSON,created_by VARCHAR(64),updated_by VARCHAR(64),created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,deleted_at DATETIME NULL,UNIQUE KEY uniq_newspaper_issue_slug(slug),INDEX idx_newspaper_issue_status_date(status,publication_date)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );
  await query(
    `CREATE TABLE IF NOT EXISTS newspaper_pages (id VARCHAR(64) PRIMARY KEY,issue_id VARCHAR(64) NOT NULL,page_number INT NOT NULL,internal_label VARCHAR(120),section_name VARCHAR(100),template_key VARCHAR(80) NOT NULL DEFAULT 'standard',blocks_json JSON,style_json JSON,is_hidden TINYINT(1) DEFAULT 0,created_by VARCHAR(64),updated_by VARCHAR(64),created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,deleted_at DATETIME NULL,UNIQUE KEY uniq_newspaper_issue_page(issue_id,page_number),INDEX idx_newspaper_page_issue(issue_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );
  await query(
    `CREATE TABLE IF NOT EXISTS newspaper_revisions (id VARCHAR(64) PRIMARY KEY,issue_id VARCHAR(64) NOT NULL,action VARCHAR(80) NOT NULL,snapshot_json JSON NOT NULL,created_by VARCHAR(64),created_at DATETIME DEFAULT CURRENT_TIMESTAMP,INDEX idx_newspaper_revision_issue(issue_id,created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );
  schemaReady = true;
}

export async function getNewspaperSettings() {
  await ensureNewspaperSchema();
  if (databaseEnabled) {
    const rows = await query(
      "SELECT * FROM newspaper_settings WHERE id='default' LIMIT 1",
    );
    if (rows?.[0])
      return {
        ...rows[0],
        style: { ...defaultStyle, ...json(rows[0].style_json, {}) },
      };
  }
  return (
    memory.settings || {
      id: "default",
      newspaper_name: "The Gotham Gazette",
      motto: "Truth in every edition",
      logo_url: "",
      sound_url: "",
      style: defaultStyle,
    }
  );
}

export async function saveNewspaperSettings(input, actor) {
  const current = await getNewspaperSettings();
  const next = {
    ...current,
    newspaper_name: cleanText(
      input.newspaper_name || current.newspaper_name,
      160,
    ),
    motto: cleanText(input.motto ?? current.motto, 255),
    logo_url: cleanText(input.logo_url ?? current.logo_url, 1000),
    sound_url: cleanText(input.sound_url ?? current.sound_url, 1000),
    style: { ...current.style, ...(input.style || {}) },
    updated_by: actor?.id || null,
  };
  if (databaseEnabled)
    await query(
      `INSERT INTO newspaper_settings (id,newspaper_name,motto,logo_url,sound_url,style_json,updated_by) VALUES ('default',:newspaper_name,:motto,:logo_url,:sound_url,:style_json,:updated_by) ON DUPLICATE KEY UPDATE newspaper_name=VALUES(newspaper_name),motto=VALUES(motto),logo_url=VALUES(logo_url),sound_url=VALUES(sound_url),style_json=VALUES(style_json),updated_by=VALUES(updated_by)`,
      { ...next, style_json: JSON.stringify(next.style) },
    );
  memory.settings = next;
  return next;
}

export async function listIssues({ publicOnly = false } = {}) {
  await ensureNewspaperSchema();
  if (databaseEnabled) {
    const rows = await query(
      `SELECT i.*, (SELECT COUNT(*) FROM newspaper_pages p WHERE p.issue_id=i.id AND p.deleted_at IS NULL AND p.is_hidden=0) page_count FROM newspaper_issues i WHERE i.deleted_at IS NULL ${publicOnly ? "AND i.status='published' AND (i.publication_date IS NULL OR i.publication_date<=NOW())" : ""} ORDER BY COALESCE(i.publication_date,i.created_at) DESC`,
    );
    if (rows) return rows.map(mapIssue);
  }
  return [...memory.issues.values()].filter(
    (issue) => !publicOnly || issue.status === "published",
  );
}

async function legacyPages() {
  const result = await listResource("news", { limit: 100, publicOnly: true });
  const articles = result.rows.filter(
    (row) =>
      !row.deleted_at &&
      !["draft", "hidden"].includes(
        String(row.status || "published").toLowerCase(),
      ),
  );
  const pages = [];
  for (
    let index = 0;
    index < Math.max(2, Math.ceil(articles.length / 3));
    index += 1
  ) {
    const chunk = articles.slice(index * 3, index * 3 + 3);
    pages.push({
      id: `legacy-${index + 1}`,
      issue_id: "legacy-latest",
      page_number: index + 1,
      template_key: index === 0 ? "front-page" : "three-column",
      section_name:
        index === 0 ? "Front Page" : chunk[0]?.category || "City News",
      blocks: chunk.map((article, articleIndex) => ({
        type: "article",
        article_id: String(article.id),
        headline: cleanText(article.title, 220),
        deck: cleanText(article.subtitle || article.description, 400),
        body: cleanText(article.content, 8000),
        image: article.image_url || "",
        category: article.category || "News",
        author: article.author_name || "Gotham City",
        lead: index === 0 && articleIndex === 0,
      })),
    });
  }
  return pages;
}

export async function getIssue(idOrSlug, { publicOnly = false } = {}) {
  await ensureNewspaperSchema();
  let issue = null;
  if (databaseEnabled) {
    const rows = await query(
      `SELECT * FROM newspaper_issues WHERE (id=:value OR slug=:value) AND deleted_at IS NULL ${publicOnly ? "AND status='published'" : ""} LIMIT 1`,
      { value: idOrSlug },
    );
    if (rows?.[0]) issue = mapIssue(rows[0]);
  } else
    issue =
      [...memory.issues.values()].find(
        (row) => row.id === idOrSlug || row.slug === idOrSlug,
      ) || null;
  if (!issue && idOrSlug !== "legacy-latest") return null;
  if (!issue)
    issue = {
      id: "legacy-latest",
      issue_number: "CURRENT",
      name: "Latest Edition",
      slug: "latest",
      status: "published",
      publication_date: now(),
      settings: {},
    };
  let pages;
  if (issue.id === "legacy-latest") pages = await legacyPages();
  else if (databaseEnabled) {
    const rows = await query(
      `SELECT * FROM newspaper_pages WHERE issue_id=:id AND deleted_at IS NULL ${publicOnly ? "AND is_hidden=0" : ""} ORDER BY page_number`,
      { id: issue.id },
    );
    pages = (rows || []).map(mapPage);
  } else
    pages = [...memory.pages.values()]
      .filter(
        (page) =>
          page.issue_id === issue.id && (!publicOnly || !page.is_hidden),
      )
      .sort((a, b) => a.page_number - b.page_number);
  return { issue, pages, settings: await getNewspaperSettings() };
}

export async function latestIssue() {
  const issues = await listIssues({ publicOnly: true });
  return getIssue(issues[0]?.id || "legacy-latest", { publicOnly: true });
}

export async function createIssue(input, actor) {
  await ensureNewspaperSchema();
  const id = randomUUID();
  const created = {
    id,
    issue_number: cleanText(input.issue_number || `ISS-${Date.now()}`, 40),
    name: cleanText(input.name || "Untitled Edition", 190),
    slug: slugify(input.slug || input.name),
    status: "draft",
    publication_date: input.publication_date || null,
    scheduled_at: null,
    cover_image_url: "",
    settings: input.settings || {},
    created_by: actor.id,
    updated_by: actor.id,
    created_at: now(),
    updated_at: now(),
  };
  if (databaseEnabled)
    await query(
      `INSERT INTO newspaper_issues (id,issue_number,name,slug,status,publication_date,settings_json,created_by,updated_by) VALUES (:id,:issue_number,:name,:slug,:status,:publication_date,:settings_json,:created_by,:updated_by)`,
      { ...created, settings_json: JSON.stringify(created.settings) },
    );
  memory.issues.set(id, created);
  await addPage(
    id,
    { template_key: "front-page", internal_label: "Front Page" },
    actor,
  );
  await addPage(
    id,
    { template_key: "three-column", internal_label: "City News" },
    actor,
  );
  return getIssue(id);
}

export async function updateIssue(id, input, actor) {
  const bundle = await getIssue(id);
  if (!bundle) return null;
  const before = bundle.issue;
  const next = {
    ...before,
    name: cleanText(input.name ?? before.name, 190),
    issue_number: cleanText(input.issue_number ?? before.issue_number, 40),
    slug: slugify(input.slug || before.slug),
    status: ["draft", "published", "archived", "scheduled"].includes(
      input.status,
    )
      ? input.status
      : before.status,
    publication_date: input.publication_date ?? before.publication_date,
    scheduled_at: input.scheduled_at ?? before.scheduled_at,
    settings: { ...before.settings, ...(input.settings || {}) },
    updated_by: actor.id,
  };
  if (databaseEnabled)
    await query(
      `UPDATE newspaper_issues SET name=:name,issue_number=:issue_number,slug=:slug,status=:status,publication_date=:publication_date,scheduled_at=:scheduled_at,settings_json=:settings_json,updated_by=:updated_by WHERE id=:id`,
      { ...next, settings_json: JSON.stringify(next.settings) },
    );
  memory.issues.set(id, next);
  await revision(
    id,
    "update_issue",
    { issue: before, pages: bundle.pages },
    actor,
  );
  return getIssue(id);
}

export async function deleteIssue(id, actor) {
  const bundle = await getIssue(id);
  if (!bundle) return null;
  if (databaseEnabled)
    await query(
      "UPDATE newspaper_issues SET deleted_at=NOW(),updated_by=:actor WHERE id=:id",
      { id, actor: actor.id },
    );
  memory.issues.delete(id);
  await revision(id, "delete_issue", bundle, actor);
  return bundle.issue;
}

export async function addPage(issueId, input, actor) {
  const bundle = await getIssue(issueId);
  if (!bundle) return null;
  const id = randomUUID();
  const page = {
    id,
    issue_id: issueId,
    page_number: Number(input.page_number || bundle.pages.length + 1),
    internal_label: cleanText(
      input.internal_label || `Page ${bundle.pages.length + 1}`,
      120,
    ),
    section_name: cleanText(input.section_name || "City News", 100),
    template_key: cleanText(input.template_key || "standard", 80),
    blocks: sanitizeBlocks(Array.isArray(input.blocks) ? input.blocks : []),
    style: input.style || {},
    is_hidden: 0,
    created_by: actor.id,
    updated_by: actor.id,
  };
  if (databaseEnabled)
    await query(
      `INSERT INTO newspaper_pages (id,issue_id,page_number,internal_label,section_name,template_key,blocks_json,style_json,is_hidden,created_by,updated_by) VALUES (:id,:issue_id,:page_number,:internal_label,:section_name,:template_key,:blocks_json,:style_json,:is_hidden,:created_by,:updated_by)`,
      {
        ...page,
        blocks_json: JSON.stringify(page.blocks),
        style_json: JSON.stringify(page.style),
      },
    );
  memory.pages.set(id, page);
  return page;
}

export async function updatePage(id, input, actor) {
  let page;
  if (databaseEnabled) {
    const rows = await query(
      "SELECT * FROM newspaper_pages WHERE id=:id AND deleted_at IS NULL LIMIT 1",
      { id },
    );
    page = rows?.[0] ? mapPage(rows[0]) : null;
  } else page = memory.pages.get(id);
  if (!page) return null;
  const next = {
    ...page,
    internal_label: cleanText(input.internal_label ?? page.internal_label, 120),
    section_name: cleanText(input.section_name ?? page.section_name, 100),
    template_key: cleanText(input.template_key ?? page.template_key, 80),
    blocks: Array.isArray(input.blocks)
      ? sanitizeBlocks(input.blocks)
      : page.blocks,
    style: input.style || page.style,
    is_hidden: input.is_hidden ? 1 : 0,
    updated_by: actor.id,
  };
  if (databaseEnabled)
    await query(
      `UPDATE newspaper_pages SET internal_label=:internal_label,section_name=:section_name,template_key=:template_key,blocks_json=:blocks_json,style_json=:style_json,is_hidden=:is_hidden,updated_by=:updated_by WHERE id=:id`,
      {
        ...next,
        blocks_json: JSON.stringify(next.blocks),
        style_json: JSON.stringify(next.style),
      },
    );
  memory.pages.set(id, next);
  return next;
}
export async function deletePage(id, actor) {
  if (databaseEnabled)
    await query(
      "UPDATE newspaper_pages SET deleted_at=NOW(),updated_by=:actor WHERE id=:id",
      { id, actor: actor.id },
    );
  return memory.pages.delete(id) || true;
}
export async function reorderPages(issueId, ids, actor) {
  if (databaseEnabled) {
    for (let i = 0; i < ids.length; i += 1) {
      await query(
        "UPDATE newspaper_pages SET page_number=:page WHERE id=:id AND issue_id=:issue",
        { page: 10000 + i, id: ids[i], issue: issueId },
      );
    }
  }
  for (let i = 0; i < ids.length; i += 1) {
    if (databaseEnabled)
      await query(
        "UPDATE newspaper_pages SET page_number=:page,updated_by=:actor WHERE id=:id AND issue_id=:issue",
        { page: i + 1, actor: actor.id, id: ids[i], issue: issueId },
      );
    const row = memory.pages.get(ids[i]);
    if (row) memory.pages.set(ids[i], { ...row, page_number: i + 1 });
  }
  return getIssue(issueId);
}
async function revision(issueId, action, snapshot, actor) {
  if (databaseEnabled)
    await query(
      "INSERT INTO newspaper_revisions (id,issue_id,action,snapshot_json,created_by) VALUES (:id,:issue,:action,:snapshot,:actor)",
      {
        id: randomUUID(),
        issue: issueId,
        action,
        snapshot: JSON.stringify(snapshot),
        actor: actor.id,
      },
    );
}
