import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  FilePlus2,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Send,
  Settings2,
  Trash2,
} from "lucide-react";
import { api } from "../../api/client";
import { useToast } from "../Toast";
import type {
  NewspaperBlock,
  NewspaperBundle,
  NewspaperIssue,
  NewspaperPage,
} from "./types";

const templates = [
  "front-page",
  "standard",
  "feature-story",
  "full-page-article",
  "two-article-split",
  "three-column",
  "photo-story",
  "classifieds",
  "advertisement",
  "announcements",
  "department-news",
  "crime-court",
  "business",
  "community-events",
  "sports",
  "memorials",
  "blank",
];
const field =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#8a7ac4]/60";

export default function AdminNewspaperBuilder() {
  const { push, confirm } = useToast();
  const [issues, setIssues] = useState<NewspaperIssue[]>([]);
  const [bundle, setBundle] = useState<NewspaperBundle | null>(null);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"content" | "templates" | "ads">("content");
  const selectedPage = useMemo(
    () =>
      bundle?.pages.find((page) => page.id === selectedPageId) ||
      bundle?.pages[0] ||
      null,
    [bundle, selectedPageId],
  );
  const loadIssues = async () => {
    setLoading(true);
    try {
      const [result, posts] = await Promise.all([
        api<{ rows: NewspaperIssue[] }>("/api/newspaper/admin/issues"),
        api<{ rows?: any[]; data?: any[] }>("/api/admin/news", {
          params: { limit: 100 },
        }),
      ]);
      setIssues(result.rows || []);
      setArticles(posts.rows || posts.data || []);
      if (!bundle && result.rows?.[0]) await openIssue(result.rows[0].id);
    } catch (e: any) {
      push({
        kind: "error",
        message: e?.message || "Could not load newspaper builder",
      });
    } finally {
      setLoading(false);
    }
  };
  const openIssue = async (id: string) => {
    const next = await api<NewspaperBundle>(
      `/api/newspaper/admin/issues/${id}`,
    );
    setBundle(next);
    setSelectedPageId(next.pages[0]?.id || "");
  };
  useEffect(() => {
    loadIssues();
  }, []);
  const create = async () => {
    try {
      const created = await api<NewspaperBundle>(
        "/api/newspaper/admin/issues",
        {
          method: "POST",
          body: {
            name: `Gotham Edition ${issues.length + 1}`,
            issue_number: String(issues.length + 1),
          },
        },
      );
      setBundle(created);
      setSelectedPageId(created.pages[0]?.id || "");
      await loadIssues();
      push({ kind: "success", message: "Draft issue created" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message });
    }
  };
  const patchIssue = (patch: Partial<NewspaperIssue>) =>
    setBundle((current) =>
      current ? { ...current, issue: { ...current.issue, ...patch } } : current,
    );
  const patchPage = (patch: Partial<NewspaperPage>) =>
    setBundle((current) =>
      current
        ? {
            ...current,
            pages: current.pages.map((page) =>
              page.id === selectedPage?.id ? { ...page, ...patch } : page,
            ),
          }
        : current,
    );
  const save = async (statusOverride?: "draft" | "published") => {
    if (!bundle) return;
    setSaving(true);
    try {
      if (selectedPage)
        await api(`/api/newspaper/admin/pages/${selectedPage.id}`, {
          method: "PATCH",
          body: selectedPage,
        });
      await api("/api/newspaper/admin/settings", {
        method: "PATCH",
        body: {
          newspaper_name: bundle.settings.newspaper_name,
          motto: bundle.settings.motto,
          style: bundle.settings.style,
        },
      });
      await api(`/api/newspaper/admin/issues/${bundle.issue.id}`, {
        method: "PATCH",
        body: {
          name: bundle.issue.name,
          issue_number: bundle.issue.issue_number,
          slug: bundle.issue.slug,
          status: statusOverride || bundle.issue.status,
          publication_date:
            statusOverride === "published"
              ? new Date().toISOString()
              : bundle.issue.publication_date,
          settings: bundle.issue.settings,
        },
      });
      const fresh = await api<NewspaperBundle>(
        `/api/newspaper/admin/issues/${bundle.issue.id}`,
      );
      setBundle(fresh);
      setSelectedPageId(selectedPage?.id || fresh.pages[0]?.id || "");
      await loadIssues();
      push({
        kind: "success",
        message:
          statusOverride === "published"
            ? "Newspaper published"
            : statusOverride === "draft"
              ? "Newspaper unpublished"
              : "Newspaper saved",
      });
    } catch (e: any) {
      push({ kind: "error", message: e?.message });
    } finally {
      setSaving(false);
    }
  };
  const addPage = async () => {
    if (!bundle) return;
    const result = await api<{ page: NewspaperPage }>(
      `/api/newspaper/admin/issues/${bundle.issue.id}/pages`,
      { method: "POST", body: { template_key: "standard" } },
    );
    setBundle({ ...bundle, pages: [...bundle.pages, result.page] });
    setSelectedPageId(result.page.id);
  };
  const removePage = async () => {
    if (!selectedPage || !bundle || bundle.pages.length <= 1) return;
    const ok = await confirm({
      title: "Delete newspaper page?",
      message: "The page and its placed content will be removed.",
      confirmText: "Delete",
    });
    if (!ok) return;
    await api(`/api/newspaper/admin/pages/${selectedPage.id}`, {
      method: "DELETE",
    });
    const pages = bundle.pages.filter((page) => page.id !== selectedPage.id);
    setBundle({ ...bundle, pages });
    setSelectedPageId(pages[0]?.id || "");
  };
  const movePage = async (direction: number) => {
    if (!bundle || !selectedPage) return;
    const from = bundle.pages.findIndex((page) => page.id === selectedPage.id);
    const to = from + direction;
    if (to < 0 || to >= bundle.pages.length) return;
    const pages = [...bundle.pages];
    [pages[from], pages[to]] = [pages[to], pages[from]];
    const renumbered = pages.map((page, index) => ({
      ...page,
      page_number: index + 1,
    }));
    setBundle({ ...bundle, pages: renumbered });
    await api(`/api/newspaper/admin/issues/${bundle.issue.id}/reorder`, {
      method: "POST",
      body: { ids: renumbered.map((page) => page.id) },
    });
  };
  const addArticle = (article: any) => {
    if (!selectedPage) return;
    const block: NewspaperBlock = {
      type: "article",
      article_id: String(article.id),
      headline: article.title,
      deck: article.subtitle || article.excerpt || "",
      body: article.content || "",
      image: article.image_url || article.image || "",
      category: article.category || "News",
      author: article.author_name || "Gotham City",
      lead: selectedPage.blocks.length === 0,
    };
    patchPage({ blocks: [...selectedPage.blocks, block] });
  };
  const addAd = () => {
    if (!selectedPage) return;
    patchPage({
      blocks: [
        ...selectedPage.blocks,
        {
          type: "advertisement",
          category: "Advertisement",
          headline: "Your advertisement",
          deck: "Promote a Gotham business or community event.",
          body: "Edit this block directly on the page properties panel.",
        },
      ],
    });
  };
  const removeBlock = (index: number) =>
    selectedPage &&
    patchPage({ blocks: selectedPage.blocks.filter((_, i) => i !== index) });
  const updateBlock = (index: number, patch: Partial<NewspaperBlock>) =>
    selectedPage &&
    patchPage({
      blocks: selectedPage.blocks.map((block, i) =>
        i === index ? { ...block, ...patch } : block,
      ),
    });
  if (loading)
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="animate-spin text-[#9d8bd6]" />
      </div>
    );
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-[#09080c]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <h3 className="font-serif text-lg text-white">Newspaper Builder</h3>
          <p className="text-xs text-white/40">
            Build printed editions from existing news articles.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className={`${field} !w-auto min-w-48`}
            value={bundle?.issue.id || ""}
            onChange={(e) => openIssue(e.target.value)}
          >
            <option value="">Select issue</option>
            {issues.map((issue) => (
              <option key={issue.id} value={issue.id}>
                {issue.name} · {issue.status}
              </option>
            ))}
          </select>
          <button onClick={create} className="builder-button">
            <Plus size={14} /> New Issue
          </button>
          <button
            onClick={() => save()}
            disabled={!bundle || saving}
            className="builder-button primary"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}{" "}
            Save
          </button>
          <button
            onClick={() =>
              save(bundle?.issue.status === "published" ? "draft" : "published")
            }
            disabled={!bundle}
            className="builder-button"
          >
            <Send size={14} />{" "}
            {bundle?.issue.status === "published" ? "Unpublish" : "Publish"}
          </button>
          <a href="/news" target="_blank" className="builder-button">
            <Eye size={14} /> Preview
          </a>
        </div>
      </header>
      {!bundle ? (
        <div className="grid min-h-72 place-items-center text-center">
          <div>
            <FilePlus2 className="mx-auto mb-3 text-white/25" />
            <p className="text-white/55">
              Create an issue to start designing pages.
            </p>
          </div>
        </div>
      ) : (
        <div className="newspaper-builder-grid">
          <aside className="builder-sidebar left">
            <div className="builder-tabs">
              <button
                className={tab === "content" ? "active" : ""}
                onClick={() => setTab("content")}
              >
                Articles
              </button>
              <button
                className={tab === "templates" ? "active" : ""}
                onClick={() => setTab("templates")}
              >
                Templates
              </button>
              <button
                className={tab === "ads" ? "active" : ""}
                onClick={() => setTab("ads")}
              >
                Ads
              </button>
            </div>
            {tab === "content" ? (
              <div className="builder-scroll">
                <p className="builder-label">Available news</p>
                {articles.map((article) => (
                  <button
                    draggable
                    onDragEnd={() => addArticle(article)}
                    onClick={() => addArticle(article)}
                    key={article.id}
                    className="content-block"
                  >
                    <GripVertical size={13} />
                    <span>
                      <strong>{article.title}</strong>
                      <small>{article.category || "News"}</small>
                    </span>
                    <Plus size={13} />
                  </button>
                ))}
              </div>
            ) : null}
            {tab === "templates" ? (
              <div className="builder-scroll">
                <p className="builder-label">Page templates</p>
                {templates.map((template) => (
                  <button
                    key={template}
                    onClick={() => patchPage({ template_key: template })}
                    className={`template-choice ${selectedPage?.template_key === template ? "active" : ""}`}
                  >
                    {template.replaceAll("-", " ")}
                  </button>
                ))}
              </div>
            ) : null}
            {tab === "ads" ? (
              <div className="builder-scroll">
                <p className="builder-label">Advertisement blocks</p>
                <button onClick={addAd} className="content-block">
                  <Archive size={14} />
                  <span>
                    <strong>Print advertisement</strong>
                    <small>Clearly labeled sponsored space</small>
                  </span>
                  <Plus size={13} />
                </button>
              </div>
            ) : null}
          </aside>
          <main className="builder-canvas">
            <div className="canvas-toolbar">
              <input
                className={field}
                value={bundle.issue.name}
                onChange={(e) => patchIssue({ name: e.target.value })}
              />
              <input
                className={`${field} max-w-28`}
                value={bundle.issue.issue_number}
                onChange={(e) => patchIssue({ issue_number: e.target.value })}
              />
              <span className={`issue-status ${bundle.issue.status}`}>
                {bundle.issue.status}
              </span>
            </div>
            {selectedPage ? (
              <div className="builder-paper">
                <div className="mini-masthead">
                  {bundle.settings.newspaper_name}
                </div>
                <div className="mini-rule">
                  <span>{selectedPage.section_name || "City Edition"}</span>
                  <span>Page {selectedPage.page_number}</span>
                </div>
                <div className="mini-columns">
                  {selectedPage.blocks.length ? (
                    selectedPage.blocks.map((block, index) => (
                      <article key={index} className={block.lead ? "lead" : ""}>
                        <button
                          aria-label="Remove block"
                          onClick={() => removeBlock(index)}
                        >
                          <Trash2 size={12} />
                        </button>
                        <p>{block.category}</p>
                        <h4>{block.headline}</h4>
                        {block.image ? <img src={block.image} alt="" /> : null}
                        <span>{block.deck || block.body}</span>
                      </article>
                    ))
                  ) : (
                    <div className="canvas-empty">
                      Choose an article, advertisement, or template from the
                      left panel.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </main>
          <aside className="builder-sidebar right">
            {selectedPage ? (
              <div className="builder-scroll">
                <p className="builder-label">Masthead settings</p>
                <label>
                  Newspaper name
                  <input
                    className={field}
                    value={bundle.settings.newspaper_name}
                    onChange={(event) =>
                      setBundle((current) =>
                        current
                          ? {
                              ...current,
                              settings: {
                                ...current.settings,
                                newspaper_name: event.target.value,
                              },
                            }
                          : current,
                      )
                    }
                  />
                </label>
                <label>
                  Motto
                  <input
                    className={field}
                    value={bundle.settings.motto || ""}
                    onChange={(event) =>
                      setBundle((current) =>
                        current
                          ? {
                              ...current,
                              settings: {
                                ...current.settings,
                                motto: event.target.value,
                              },
                            }
                          : current,
                      )
                    }
                  />
                </label>
                <p className="builder-label">Page properties</p>
                <label>
                  Internal label
                  <input
                    className={field}
                    value={selectedPage.internal_label || ""}
                    onChange={(e) =>
                      patchPage({ internal_label: e.target.value })
                    }
                  />
                </label>
                <label>
                  Section
                  <input
                    className={field}
                    value={selectedPage.section_name || ""}
                    onChange={(e) =>
                      patchPage({ section_name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Template
                  <select
                    className={field}
                    value={selectedPage.template_key}
                    onChange={(e) =>
                      patchPage({ template_key: e.target.value })
                    }
                  >
                    {templates.map((template) => (
                      <option key={template}>{template}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedPage.is_hidden)}
                    onChange={(e) =>
                      patchPage({ is_hidden: e.target.checked ? 1 : 0 })
                    }
                  />{" "}
                  Hide this page
                </label>
                {selectedPage.blocks.map((block, index) => (
                  <div key={index} className="block-properties">
                    <strong>
                      {block.type} {index + 1}
                    </strong>
                    <input
                      className={field}
                      value={block.headline || ""}
                      onChange={(e) =>
                        updateBlock(index, { headline: e.target.value })
                      }
                      placeholder="Headline"
                    />
                    <textarea
                      className={field}
                      rows={3}
                      value={block.deck || block.body || ""}
                      onChange={(e) =>
                        updateBlock(index, { deck: e.target.value })
                      }
                      placeholder="Deck or body"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </aside>
          <footer className="page-strip">
            <button onClick={addPage} className="page-thumb add">
              <Plus /> Add page
            </button>
            {bundle.pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setSelectedPageId(page.id)}
                className={`page-thumb ${page.id === selectedPageId ? "active" : ""}`}
              >
                <span>{page.page_number}</span>
                <strong>{page.internal_label || page.template_key}</strong>
              </button>
            ))}
            <div className="page-actions">
              <button onClick={() => movePage(-1)}>
                <ChevronUp />
              </button>
              <button onClick={() => movePage(1)}>
                <ChevronDown />
              </button>
              <button onClick={removePage}>
                <Trash2 />
              </button>
            </div>
          </footer>
        </div>
      )}
    </section>
  );
}
