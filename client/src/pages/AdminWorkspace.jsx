import { useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Settings, ShieldAlert, Trash2, UserPlus } from "lucide-react";
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
  const users = useApi(() => api.get("/api/admin/users"), [], { rows: [] });
  const roleMappings = useApi(() => api.get("/api/admin/discord-role-mappings"), [], { mappings: [] });
  const [userForm, setUserForm] = useState({ discord_id: "", username: "", roles: ["Player"], permissions: [] });
  const [mappingForm, setMappingForm] = useState({ discord_role_id: "", label: "", roles: [], permissions: [] });
  const [status, setStatus] = useState("");
  const permissions = data?.permissions || [];
  const roles = data?.roles || [];

  const toggleList = (target, key, value) => {
    target((current) => {
      const list = current[key] || [];
      return {
        ...current,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
      };
    });
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      const saved = await api.post("/api/admin/users", {
        ...userForm,
        reason: "admin panel permission update"
      });
      users.setData((current) => ({
        ...current,
        rows: [saved.user, ...(current?.rows || []).filter((row) => row.discord_id !== saved.user.discord_id)]
      }));
      setUserForm({ discord_id: "", username: "", roles: ["Player"], permissions: [] });
      setStatus("User permissions saved.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const disableUser = async (id) => {
    setStatus("");
    try {
      const saved = await api.delete(`/api/admin/users/${encodeURIComponent(id)}`, { reason: "disabled from admin panel" });
      users.setData((current) => ({
        ...current,
        rows: (current?.rows || []).map((row) => (row.id === saved.user.id ? saved.user : row))
      }));
      setStatus("User disabled.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const addMapping = () => {
    if (!mappingForm.discord_role_id) return;
    const next = [
      ...(roleMappings.data?.mappings || []).filter((mapping) => mapping.discord_role_id !== mappingForm.discord_role_id),
      mappingForm
    ];
    roleMappings.setData({ mappings: next });
    setMappingForm({ discord_role_id: "", label: "", roles: [], permissions: [] });
  };

  const removeMapping = (roleId) => {
    roleMappings.setData({
      mappings: (roleMappings.data?.mappings || []).filter((mapping) => mapping.discord_role_id !== roleId)
    });
  };

  const saveMappings = async () => {
    setStatus("");
    try {
      const saved = await api.put("/api/admin/discord-role-mappings", {
        mappings: roleMappings.data?.mappings || [],
        reason: "discord role permission update"
      });
      roleMappings.setData(saved);
      setStatus("Discord role mappings saved.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <WorkspaceHeader title="Admins & Permissions" description="Add admins by Discord ID, choose exact access, or map Discord role IDs to website permissions. Master Admin keeps dangerous access.">
      {status && <div className="mb-4 rounded-lg border border-a2-border bg-white/[0.03] p-3 text-sm text-white/70">{status}</div>}
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <div className="mb-4 flex items-center gap-2 text-a2-warning"><ShieldAlert size={18} /> Only trusted owners should receive `master_access`.</div>
          <h2 className="text-xl font-black">Add / Update User By Discord ID</h2>
          <form className="mt-4 grid gap-4" onSubmit={saveUser}>
            <label className="grid gap-2 text-sm font-bold text-white/70">
              Discord user ID
              <input className="form-input" value={userForm.discord_id} onChange={(event) => setUserForm((current) => ({ ...current, discord_id: event.target.value }))} required />
            </label>
            <label className="grid gap-2 text-sm font-bold text-white/70">
              Display name optional
              <input className="form-input" value={userForm.username} onChange={(event) => setUserForm((current) => ({ ...current, username: event.target.value }))} />
            </label>
            <CheckGrid title="Roles" items={roles} selected={userForm.roles} onToggle={(value) => toggleList(setUserForm, "roles", value)} />
            <CheckGrid title="Extra permissions" items={permissions} selected={userForm.permissions} onToggle={(value) => toggleList(setUserForm, "permissions", value)} compact />
            <Button><UserPlus size={16} /> Save user access</Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Current Website Users</h2>
              <p className="mt-1 text-sm text-white/48">Disable removes access without deleting their history.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {(users.data?.rows || []).map((user) => (
              <div key={user.id} className="rounded-lg border border-a2-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{user.username || user.discord_username || user.discord_id}</p>
                    <p className="text-xs text-white/45">Discord ID: {user.discord_id}</p>
                    <p className="mt-2 text-xs text-white/52">Roles: {(user.roles || []).join(", ") || "None"}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-white/40">Permissions: {(user.permissions || []).join(", ") || "None"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-a2-border px-2 py-1 text-xs text-white/55">{user.account_status}</span>
                    <Button type="button" variant="danger" onClick={() => disableUser(user.id)}><Trash2 size={14} /></Button>
                  </div>
                </div>
              </div>
            ))}
            {(users.data?.rows || []).length === 0 && <p className="rounded-lg border border-a2-border p-4 text-sm text-white/50">No website users yet. Login once or add a Discord ID manually.</p>}
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <h2 className="text-xl font-black">Discord Role ID Mappings</h2>
        <p className="mt-1 text-sm text-white/50">When a Discord login includes one of these guild role IDs, these roles and permissions are added automatically.</p>
        <div className="mt-4 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-white/70">
              Discord role ID
              <input className="form-input" value={mappingForm.discord_role_id} onChange={(event) => setMappingForm((current) => ({ ...current, discord_role_id: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-white/70">
              Label
              <input className="form-input" value={mappingForm.label} onChange={(event) => setMappingForm((current) => ({ ...current, label: event.target.value }))} />
            </label>
            <CheckGrid title="Roles to grant" items={roles} selected={mappingForm.roles} onToggle={(value) => toggleList(setMappingForm, "roles", value)} />
            <CheckGrid title="Permissions to grant" items={permissions} selected={mappingForm.permissions} onToggle={(value) => toggleList(setMappingForm, "permissions", value)} compact />
            <Button type="button" variant="ghost" onClick={addMapping}><Plus size={16} /> Add mapping</Button>
          </div>
          <div className="grid gap-3">
            {(roleMappings.data?.mappings || []).map((mapping) => (
              <div key={mapping.discord_role_id} className="rounded-lg border border-a2-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{mapping.label || mapping.discord_role_id}</p>
                    <p className="text-xs text-white/45">Role ID: {mapping.discord_role_id}</p>
                    <p className="mt-2 text-xs text-white/52">Roles: {(mapping.roles || []).join(", ") || "None"}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-white/40">Permissions: {(mapping.permissions || []).join(", ") || "None"}</p>
                  </div>
                  <Button type="button" variant="danger" onClick={() => removeMapping(mapping.discord_role_id)}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))}
            {(roleMappings.data?.mappings || []).length === 0 && <p className="rounded-lg border border-a2-border p-4 text-sm text-white/50">No Discord role mappings yet.</p>}
            <Button type="button" onClick={saveMappings}><Save size={16} /> Save Discord role mappings</Button>
          </div>
        </div>
      </Card>
    </WorkspaceHeader>
  );
}

function CheckGrid({ title, items, selected = [], onToggle, compact = false }) {
  return (
    <div>
      <p className="mb-2 text-sm font-black text-white/72">{title}</p>
      <div className={`grid gap-2 ${compact ? "max-h-56 overflow-y-auto rounded-lg border border-a2-border p-2 md:grid-cols-2" : "md:grid-cols-2"}`}>
        {items.map((item) => (
          <label key={item} className="flex items-center gap-2 rounded-lg border border-a2-border bg-white/[0.03] p-2 text-xs text-white/62">
            <input type="checkbox" checked={selected.includes(item)} onChange={() => onToggle(item)} />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
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
