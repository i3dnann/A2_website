import { useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Settings, ShieldAlert } from "lucide-react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { staffResources } from "../data/modules.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card, StatCard } from "../components/Card.jsx";
import { DataTable } from "../components/DataTable.jsx";

const streamerFields = ["display_name", "discord_id", "discord_username", "main_platform", "twitch_username", "kick_username", "youtube_url", "tiktok_url", "character_name", "category", "bio"];

export function StaffDashboard() {
  const { data } = useApi(() => api.get("/api/admin/dashboard"), [], { cards: [], recentLogs: [] });
  return (
    <WorkspaceHeader title="Staff Dashboard" description="Tickets, whitelist, appeals, streamers, logs, and website operations.">
      <div className="grid gap-4 md:grid-cols-4">
        {(data?.cards || []).map((card) => <StatCard key={card.label} label={card.label} value={card.value} icon={Settings} />)}
      </div>
      <Card className="mt-5">
        <h2 className="mb-4 text-xl font-black">Recent audit logs</h2>
        <DataTable rows={data?.recentLogs || []} columns={[
          { key: "action", label: "Action" },
          { key: "staff_name", label: "Staff" },
          { key: "target_type", label: "Target" },
          { key: "created_at", label: "Time" }
        ]} />
      </Card>
    </WorkspaceHeader>
  );
}

export function StaffResourcePage({ resource }) {
  const config = staffResources[resource] || staffResources.tickets;
  const [q, setQ] = useState("");
  const { data, loading, setData } = useApi(() => api.get(`/api/admin/${config.api}?q=${encodeURIComponent(q)}`), [config.api, q], { rows: [] });

  const createQuick = async () => {
    const row = await api.post(`/api/admin/${config.api}`, {
      title: `New ${config.title}`,
      name: `New ${config.title}`,
      status: "Draft",
      reason: "Created from admin workspace"
    });
    setData((current) => ({ ...current, rows: [row.row, ...(current?.rows || [])] }));
  };

  return (
    <WorkspaceHeader title={config.title} description={config.action}>
      <div className="mb-4 flex flex-wrap gap-3">
        <Button onClick={createQuick}><Plus size={16} /> New record</Button>
        {resource === "streamers" && <Button variant="ghost" onClick={() => api.post("/api/admin/streamers/check", {})}><RefreshCw size={16} /> Refresh live status</Button>}
      </div>
      <DataTable rows={loading ? [] : data?.rows || []} search={q} onSearch={setQ} columns={[
        { key: "title", label: "Name", render: (row) => row.title || row.name || row.display_name || row.character_name || row.ban_id || row.case_number || row.id },
        { key: "category", label: "Category", render: (row) => row.category || row.ticket_type || row.business_type || row.main_platform },
        { key: "status", label: "Status", status: true, render: (row) => row.status || (row.is_live ? "LIVE" : row.is_approved ? "Approved" : "Draft") },
        { key: "updated_at", label: "Updated" }
      ]} />
    </WorkspaceHeader>
  );
}

export function StreamerEditor({ mode = "create" }) {
  const [form, setForm] = useState({ main_platform: "Twitch", category: "Civilian", is_approved: true, is_hidden: false, is_featured: false });
  const [status, setStatus] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      await api.post("/api/admin/streamers", { ...form, reason: `${mode} streamer` });
      setStatus("Streamer saved. It will appear publicly only when approved and not hidden.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <WorkspaceHeader title={mode === "create" ? "Create Streamer" : "Edit Streamer"} description="Manage streamer display name, channels, profile images, category, approval, featured status, and public visibility.">
      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          {streamerFields.map((field) => (
            <label key={field} className="grid gap-2 text-sm font-bold text-white/70 md:col-span-1">
              {field.replaceAll("_", " ")}
              {field === "bio" ? (
                <textarea className="form-input min-h-28" value={form[field] || ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
              ) : (
                <input className="form-input" value={form[field] || ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
              )}
            </label>
          ))}
          <div className="grid gap-3 md:col-span-2 md:grid-cols-3">
            {["is_featured", "is_approved", "is_hidden"].map((field) => (
              <label key={field} className="flex items-center gap-3 rounded-lg border border-a2-border p-3 text-sm text-white/62">
                <input type="checkbox" checked={Boolean(form[field])} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.checked }))} />
                {field.replaceAll("_", " ")}
              </label>
            ))}
          </div>
          <Button className="md:col-span-2"><Save size={16} /> Save streamer</Button>
          {status && <p className="md:col-span-2 text-sm text-white/60">{status}</p>}
        </form>
      </Card>
    </WorkspaceHeader>
  );
}

export function SettingsPage() {
  const { settings, setSettings } = useApp();
  const [form, setForm] = useState(settings);
  const [status, setStatus] = useState("");

  const fields = useMemo(() => [
    "websiteName",
    "logoUrl",
    "faviconUrl",
    "heroBackgroundUrl",
    "homepageDescription",
    "discordInviteUrl",
    "fivemConnectUrl",
    "primaryColor",
    "backgroundColor",
    "textColor",
    "secondaryDark",
    "borderColor",
    "dangerColor",
    "warningColor",
    "successColor",
    "termsText",
    "rulesText",
    "streamerStatusCheckIntervalSeconds",
    "featuredStreamersLimit",
    "liveStreamersLimit"
  ], []);

  const save = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      const data = await api.patch("/api/admin/settings", { ...form, reason: "Website settings updated from admin panel" });
      setSettings(data.settings);
      setStatus("Settings saved.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <WorkspaceHeader title="Website Settings" description="Control the global brand: name, logo, favicon, colors, backgrounds, Discord, FiveM link, rules, terms, streamers, and performance settings.">
      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
          {fields.map((field) => (
            <label key={field} className={`grid gap-2 text-sm font-bold text-white/70 ${field.includes("Text") || field === "homepageDescription" ? "md:col-span-2" : ""}`}>
              {field}
              {field.includes("Text") || field === "homepageDescription" ? (
                <textarea className="form-input min-h-28" value={form[field] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
              ) : (
                <input className="form-input" value={form[field] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
              )}
            </label>
          ))}
          {["maintenanceMode", "performanceMode", "streamerPageEnabled", "showOfflineStreamers", "showStreamerViewerCount", "showStreamThumbnails", "webhookStreamerGoLive", "webhookStreamerGoOffline"].map((field) => (
            <label key={field} className="flex items-center gap-3 rounded-lg border border-a2-border p-3 text-sm text-white/62">
              <input type="checkbox" checked={Boolean(form[field])} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.checked }))} />
              {field}
            </label>
          ))}
          <Button className="md:col-span-2"><Save size={16} /> Save settings</Button>
          {status && <p className="md:col-span-2 text-sm text-white/60">{status}</p>}
        </form>
      </Card>
    </WorkspaceHeader>
  );
}

export function PermissionsPage() {
  const { data } = useApi(() => api.get("/api/admin/permissions"), [], { roles: [], permissions: [], defaults: {} });
  return (
    <WorkspaceHeader title="Roles & Permissions" description="Role defaults are configurable in the backend and ready for an admin editing workflow. Master Admin keeps dangerous access.">
      <Card>
        <div className="mb-4 flex items-center gap-2 text-a2-warning"><ShieldAlert size={18} /> Dangerous settings should stay Master Admin only.</div>
        <div className="grid gap-4 md:grid-cols-2">
          {(data?.roles || []).map((role) => (
            <div key={role} className="rounded-lg border border-a2-border p-4">
              <p className="font-black">{role}</p>
              <p className="mt-2 text-xs leading-5 text-white/48">{(data?.defaults?.[role] || []).join(", ") || "No default permissions"}</p>
            </div>
          ))}
        </div>
      </Card>
    </WorkspaceHeader>
  );
}

export function WorkspaceHeader({ title, description, children }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-wide text-a2-green">Control center</p>
      <h1 className="mt-2 text-3xl font-black">{title}</h1>
      <p className="mt-2 max-w-3xl text-white/55">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
