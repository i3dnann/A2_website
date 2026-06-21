import { useEffect, useMemo, useState } from "react";
import { Check, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

const sectionResources = {
  partners: "partners",
  journey: "journey",
  famous: "famous",
  roster: "streamers",
  team: "team",
  careers: "careerJobs",
  tickets: "tickets",
  news: "news",
  map: "mapZones",
  faq: "faqItems",
  terms: "terms",
  events: "events",
  "audit-logs": "auditLogs"
};

const careerResources = ["careerJobs", "careerSections", "careerQuestions", "careerApplications", "careerAnswers"];
const faqResources = ["faqCategories", "faqItems"];

export function AdminWorkspace({ section = "dashboard", resourceOverride }) {
  if (section === "dashboard") return <AdminDashboard />;
  if (["settings", "home", "theme", "live"].includes(section)) return <SettingsEditor mode={section} />;
  if (section === "users") return <UsersManager />;
  if (section === "admins") return <AdminsManager />;
  if (section === "permissions") return <PermissionsPage />;
  if (section === "webhooks") return <WebhooksManager />;
  if (section === "careers") return <ResourceTabs title="Careers" resources={careerResources} initial={resourceOverride || "careerJobs"} />;
  if (section === "faq") return <ResourceTabs title="FAQ" resources={faqResources} initial="faqItems" />;
  const resource = resourceOverride || sectionResources[section] || "partners";
  return <ResourceManager resource={resource} title={labelFor(resource)} />;
}

function AdminDashboard() {
  const { data, loading } = useApi(() => api.get("/api/admin/dashboard"), [], { cards: [], recentTickets: [], recentApplications: [], recentLogs: [] });
  return (
    <div className="grid gap-5">
      <Header eyebrow="Admin panel" title="A2 Studio control center" />
      <div className="grid gap-4 md:grid-cols-4">
        {(loading ? Array.from({ length: 4 }) : data?.cards || []).map((card, index) => (
          <Card key={card?.label || index}>
            {loading ? <div className="h-20 rounded skeleton" /> : (
              <>
                <p className="text-sm text-white/50">{card.label}</p>
                <p className="mt-2 text-3xl font-black">{card.value}</p>
              </>
            )}
          </Card>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <MiniList title="Recent tickets" rows={data?.recentTickets || []} />
        <MiniList title="Recent applications" rows={data?.recentApplications || []} />
      </div>
    </div>
  );
}

function MiniList({ title, rows }) {
  return (
    <Card>
      <h2 className="text-xl font-black">{title}</h2>
      <div className="mt-4 grid gap-2">
        {rows.map((row) => (
          <div key={row.id} className="rounded-lg border border-a2-border bg-white/[0.03] p-3">
            <p className="font-bold">{row.subject || row.title || row.job_id || row.action || row.id}</p>
            <p className="text-xs text-white/45">{row.status || row.created_at}</p>
          </div>
        ))}
        {!rows.length && <p className="text-sm text-white/45">No rows yet.</p>}
      </div>
    </Card>
  );
}

function ResourceTabs({ title, resources, initial }) {
  const [active, setActive] = useState(initial);
  return (
    <div className="grid gap-5">
      <Header eyebrow="CMS" title={title} />
      <div className="flex flex-wrap gap-2">
        {resources.map((resource) => (
          <button key={resource} onClick={() => setActive(resource)} className={`rounded-lg px-3 py-2 text-sm font-bold ${active === resource ? "bg-a2-green text-black" : "border border-a2-border text-white/60"}`}>
            {labelFor(resource)}
          </button>
        ))}
      </div>
      <ResourceManager resource={active} title={labelFor(active)} embedded />
    </div>
  );
}

function ResourceManager({ resource, title, embedded = false }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState({});
  const [refresh, setRefresh] = useState(0);
  const { data, loading, setData } = useApi(() => api.get(`/api/admin/${resource}?q=${encodeURIComponent(q)}`), [resource, q, refresh], { rows: [], config: null });
  const rows = data?.rows || [];
  const fields = data?.config?.fields || [];

  useEffect(() => {
    setSelected(null);
    setDraft({});
  }, [resource]);

  const selectRow = (row) => {
    setSelected(row);
    setDraft(row || {});
  };

  const save = async (event) => {
    event.preventDefault();
    const payload = normalizeDraft(draft, fields);
    const response = selected?.id ? await api.patch(`/api/admin/${resource}/${selected.id}`, payload) : await api.post(`/api/admin/${resource}`, payload);
    setSelected(response.row);
    setDraft(response.row);
    setRefresh((value) => value + 1);
  };

  const remove = async () => {
    if (!selected?.id || !confirm(`Delete ${selected.id}?`)) return;
    await api.delete(`/api/admin/${resource}/${selected.id}`, {});
    setSelected(null);
    setDraft({});
    setRefresh((value) => value + 1);
  };

  return (
    <div className="grid gap-5">
      {!embedded && <Header eyebrow="CMS" title={title} />}
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <input className="form-input" placeholder="Search..." value={q} onChange={(event) => setQ(event.target.value)} />
            <Button type="button" variant="ghost" onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={15} /></Button>
          </div>
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-white/35">
                <tr><th className="py-2">Title</th><th>Status</th><th>Updated</th></tr>
              </thead>
              <tbody>
                {(loading ? Array.from({ length: 8 }) : rows).map((row, index) => (
                  <tr key={row?.id || index} onClick={() => row && selectRow(row)} className="cursor-pointer border-t border-a2-border hover:bg-white/[0.04]">
                    <td className="py-3 font-bold">{loading ? <div className="h-4 rounded skeleton" /> : rowTitle(row)}</td>
                    <td className="py-3 text-white/50">{row ? row.status || String(row.is_visible ?? "") : ""}</td>
                    <td className="py-3 text-white/35">{row?.updated_at?.slice?.(0, 10) || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !rows.length && <p className="py-6 text-center text-sm text-white/45">No rows yet.</p>}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">{selected ? "Edit item" : "Create item"}</h2>
            <Button type="button" variant="ghost" onClick={() => selectRow(null)}><Plus size={15} /> New</Button>
          </div>
          <form className="grid gap-3" onSubmit={save}>
            {fields.map((field) => (
              <FieldInput key={field} field={field} value={draft[field]} onChange={(value) => setDraft((current) => ({ ...current, [field]: value }))} />
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit"><Save size={15} /> Save</Button>
              {selected?.id && <Button type="button" variant="danger" onClick={remove}><Trash2 size={15} /> Delete</Button>}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }) {
  const label = field.replaceAll("_", " ");
  const booleanFields = new Set(["performanceMode", "maintenanceMode", "partnerGrayscale", "partnerPauseOnHover", "webhookStreamerGoLive", "webhookStreamerGoOffline"]);
  if (field.endsWith("_json") || field === "navLinks" || ["content", "description", "bio", "requirements", "internal_notes", "message_preview"].includes(field)) {
    const textValue = typeof value === "object" ? JSON.stringify(value, null, 2) : value || "";
    return <label className="grid gap-2 text-sm font-bold capitalize">{label}<textarea className="form-input min-h-24" value={textValue} onChange={(event) => onChange(event.target.value)} /></label>;
  }
  if (field.startsWith("is_") || field.startsWith("show") || field.endsWith("_enabled") || booleanFields.has(field)) {
    return <label className="flex items-center gap-3 rounded-lg border border-a2-border bg-white/[0.03] p-3 text-sm font-bold capitalize"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
  }
  if (field.includes("date") || field.endsWith("_at")) {
    return <label className="grid gap-2 text-sm font-bold capitalize">{label}<input className="form-input" type="datetime-local" value={dateInputValue(value)} onChange={(event) => onChange(event.target.value)} /></label>;
  }
  if (field.includes("color")) {
    return <label className="grid gap-2 text-sm font-bold capitalize">{label}<input className="form-input h-12" type="color" value={value || "#b7fe1a"} onChange={(event) => onChange(event.target.value)} /></label>;
  }
  return <label className="grid gap-2 text-sm font-bold capitalize">{label}<input className="form-input" value={value || ""} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SettingsEditor({ mode }) {
  const { setSettings } = useApp();
  const [draft, setDraft] = useState({});
  const [status, setStatus] = useState("");
  const { data, loading } = useApi(() => api.get("/api/admin/settings"), [mode], { settings: {} });
  const fields = settingsFields(mode);

  useEffect(() => {
    setDraft(data?.settings || {});
  }, [data]);

  const save = async (event) => {
    event.preventDefault();
    const payload = normalizeDraft(draft, fields);
    const response = await api.patch(mode === "theme" ? "/api/admin/theme" : "/api/admin/settings", payload);
    setSettings((current) => ({ ...current, ...(response.settings || payload) }));
    setStatus("Saved.");
  };

  return (
    <div className="grid gap-5">
      <Header eyebrow="Website settings" title={settingsTitle(mode)} />
      <Card>
        {loading ? <div className="h-80 rounded skeleton" /> : (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
            {fields.map((field) => <FieldInput key={field} field={field} value={draft[field]} onChange={(value) => setDraft((current) => ({ ...current, [field]: value }))} />)}
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit"><Save size={15} /> Save settings</Button>
              {status && <span className="text-sm text-a2-success">{status}</span>}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

function UsersManager() {
  return <UserTable endpoint="/api/admin/users" title="Users" defaultRole="Player" />;
}

function AdminsManager() {
  return <UserTable endpoint="/api/admin/admins" title="Admins" defaultRole="Admin" adminActions />;
}

function UserTable({ endpoint, title, defaultRole, adminActions = false }) {
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState({ roles: [defaultRole], permissions: [] });
  const [refresh, setRefresh] = useState(0);
  const { data } = useApi(() => api.get(`${endpoint}?q=${encodeURIComponent(q)}`), [endpoint, q, refresh], { rows: [] });

  const save = async (event) => {
    event.preventDefault();
    const payload = {
      ...draft,
      roles: parseList(draft.roles),
      permissions: parseList(draft.permissions)
    };
    await api.post(endpoint, payload);
    setDraft({ roles: [defaultRole], permissions: [] });
    setRefresh((value) => value + 1);
  };

  const adminStatus = async (id, action) => {
    await api.post(`/api/admin/admins/${id}/${action}`, {});
    setRefresh((value) => value + 1);
  };

  return (
    <div className="grid gap-5">
      <Header eyebrow="Management" title={title} />
      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <input className="form-input mb-4" placeholder="Search..." value={q} onChange={(event) => setQ(event.target.value)} />
          <div className="grid gap-3">
            {(data?.rows || []).map((user) => (
              <div key={user.id} className="rounded-lg border border-a2-border bg-white/[0.03] p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{user.username || user.email}</p>
                    <p className="text-xs text-white/45">{user.email || "No email"} / Discord {user.discord_id || "none"} / Steam {user.steam_id || "none"}</p>
                    <p className="mt-1 text-xs text-a2-green">{user.roles?.join(", ")}</p>
                  </div>
                  <span className="rounded-full border border-a2-border px-3 py-1 text-xs font-bold text-white/60">{user.admin_status || user.account_status}</span>
                </div>
                {adminActions && (
                  <div className="mt-3 flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => adminStatus(user.id, "freeze")}>Freeze</Button>
                    <Button type="button" variant="ghost" onClick={() => adminStatus(user.id, "unfreeze")}>Unfreeze</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Add / update {title.toLowerCase()}</h2>
          <form className="mt-4 grid gap-3" onSubmit={save}>
            {["email", "username", "discord_id", "steam_id", "roles", "permissions"].map((field) => (
              <FieldInput key={field} field={field} value={Array.isArray(draft[field]) ? draft[field].join(",") : draft[field]} onChange={(value) => setDraft((current) => ({ ...current, [field]: value }))} />
            ))}
            <Button type="submit"><Check size={15} /> Save</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function PermissionsPage() {
  const { data } = useApi(() => api.get("/api/admin/permissions"), [], { roles: [], permissions: [], defaults: {} });
  return (
    <div className="grid gap-5">
      <Header eyebrow="Security" title="Roles and permissions" />
      <div className="grid gap-4 lg:grid-cols-2">
        {(data?.roles || []).map((role) => (
          <Card key={role}>
            <h2 className="font-black">{role}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(data?.defaults?.[role] || []).map((permission) => <span key={permission} className="rounded-full border border-a2-border px-2 py-1 text-xs text-a2-green">{permission}</span>)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WebhooksManager() {
  const [draft, setDraft] = useState({});
  const [status, setStatus] = useState("");
  const { data, setData } = useApi(() => api.get("/api/admin/webhooks"), [], { webhooks: {} });
  const keys = Object.keys(data?.webhooks || {});
  const save = async (event) => {
    event.preventDefault();
    await api.patch("/api/admin/webhooks", draft);
    setStatus("Webhook settings saved.");
    const fresh = await api.get("/api/admin/webhooks");
    setData(fresh);
  };
  return (
    <div className="grid gap-5">
      <Header eyebrow="Discord embeds" title="Webhook settings" />
      <Card>
        <form className="grid gap-4" onSubmit={save}>
          {keys.map((key) => (
            <label key={key} className="grid gap-2 text-sm font-bold">
              {key} {data.webhooks[key]?.configured && <span className="text-a2-success">configured</span>}
              <input className="form-input" type="password" placeholder="Paste new webhook URL to update" value={draft[key] || ""} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} />
            </label>
          ))}
          <Button type="submit"><Save size={15} /> Save webhooks</Button>
          {status && <p className="text-sm text-a2-success">{status}</p>}
        </form>
      </Card>
    </div>
  );
}

function normalizeDraft(draft, fields) {
  const booleanFields = new Set(["performanceMode", "maintenanceMode", "partnerGrayscale", "partnerPauseOnHover", "webhookStreamerGoLive", "webhookStreamerGoOffline"]);
  return Object.fromEntries(
    fields.map((field) => {
      const value = draft[field];
      if (field.startsWith("is_") || field.startsWith("show") || field.endsWith("_enabled") || booleanFields.has(field)) return [field, Boolean(value)];
      if (field.endsWith("_json") || field === "navLinks") return [field, parseJsonField(value)];
      return [field, value ?? ""];
    })
  );
}

function parseJsonField(value) {
  if (typeof value !== "string") return value ?? "";
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function rowTitle(row) {
  return row.title || row.name || row.partner_name || row.display_name || row.character_name || row.zone_name || row.question || row.subject || row.id;
}

function labelFor(resource) {
  return resource
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .replace("Faq", "FAQ");
}

function dateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  return date.toISOString().slice(0, 16);
}

function settingsTitle(mode) {
  if (mode === "home") return "Homepage content";
  if (mode === "theme") return "Theme and colors";
  if (mode === "live") return "Live stream settings";
  return "Website settings";
}

function settingsFields(mode) {
  if (mode === "theme") return ["primaryColor", "backgroundColor", "textColor", "secondaryColor", "cardBackground", "borderColor", "mutedTextColor", "dangerColor", "warningColor", "successColor", "performanceMode"];
  if (mode === "home") return ["websiteName", "logoUrl", "faviconUrl", "heroTitle", "heroSubtitle", "heroDescription", "heroBackgroundImage", "heroBackgroundVideo", "heroOverlayOpacity", "heroPrimaryButtonText", "heroPrimaryButtonLink", "heroSecondaryButtonText", "heroSecondaryButtonLink", "storeButtonText", "storeButtonLink"];
  if (mode === "live") return ["livePageEnabled", "showOfflineStreamers", "showViewerCount", "showThumbnails", "liveStatusCheckIntervalSeconds", "featuredLiveLimit", "webhookStreamerGoLive", "webhookStreamerGoOffline"];
  return ["websiteName", "logoUrl", "faviconUrl", "maintenanceMode", "performanceMode", "navLinks", "termsVersion", "partnersEnabled", "partnerAnimationSpeed", "partnerDirection", "partnerGrayscale", "partnerPauseOnHover"];
}

function Header({ eyebrow, title }) {
  return (
    <header>
      <p className="text-sm font-black uppercase tracking-widest text-a2-green">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black md:text-4xl">{title}</h1>
    </header>
  );
}
