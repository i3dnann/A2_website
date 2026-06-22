import { useEffect, useMemo, useState } from "react";
import { Check, Edit3, RefreshCw, Shield, Trash2 } from "lucide-react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

const emptyDraft = {
  email: "",
  username: "",
  discord_id: "",
  steam_id: "",
  roles: ["Admin"],
  permissions: []
};

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export default function AdminsPage() {
  const [q, setQ] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [status, setStatus] = useState("");
  const { data } = useApi(() => api.get(`/api/admin/admins?q=${encodeURIComponent(q)}`), [q, refresh], { rows: [] });
  const { data: security } = useApi(() => api.get("/api/admin/permissions"), [], { roles: [], permissions: [], defaults: {} });

  const adminRoles = useMemo(() => (security?.roles || []).filter((role) => role !== "Player"), [security]);
  const permissions = security?.permissions || [];
  const defaults = security?.defaults || {};

  useEffect(() => {
    if (!draft.permissions?.length && draft.roles?.length) {
      setDraft((current) => ({ ...current, permissions: unique(current.roles.flatMap((role) => defaults[role] || [])) }));
    }
  }, [defaults, draft.permissions?.length, draft.roles]);

  const selectAdmin = (user) => {
    setSelected(user);
    setStatus("");
    setDraft({
      email: user.email || "",
      username: user.username || "",
      discord_id: user.discord_id || "",
      steam_id: user.steam_id || "",
      roles: (user.roles || []).filter((role) => role !== "Player"),
      permissions: user.permissions || []
    });
  };

  const toggleRole = (role) => {
    setDraft((current) => {
      const exists = current.roles.includes(role);
      const roles = exists ? current.roles.filter((item) => item !== role) : [...current.roles, role];
      const rolePermissions = unique(roles.flatMap((item) => defaults[item] || []));
      return { ...current, roles, permissions: rolePermissions };
    });
  };

  const togglePermission = (permission) => {
    setDraft((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission]
    }));
  };

  const save = async (event) => {
    event.preventDefault();
    setStatus("");
    const payload = {
      ...draft,
      roles: draft.roles.length ? draft.roles : ["Admin"],
      permissions: unique(["view_player_portal", ...draft.permissions])
    };
    try {
      if (selected?.id) {
        await api.patch(`/api/admin/admins/${selected.id}`, payload);
      } else {
        await api.post("/api/admin/admins", payload);
      }
      setSelected(null);
      setDraft(emptyDraft);
      setRefresh((value) => value + 1);
      setStatus("Admin saved.");
    } catch (error) {
      setStatus(error.data?.error || error.message || "Could not save admin.");
    }
  };

  const freeze = async (user, action) => {
    await api.post(`/api/admin/admins/${user.id}/${action}`, {});
    setRefresh((value) => value + 1);
  };

  const removeAdmin = async (user) => {
    if (!confirm(`Remove admin access from ${user.username || user.email}?`)) return;
    await api.patch(`/api/admin/admins/${user.id}`, {
      roles: ["Player"],
      permissions: ["view_player_portal"],
      admin_status: "disabled",
      account_status: "active"
    });
    if (selected?.id === user.id) {
      setSelected(null);
      setDraft(emptyDraft);
    }
    setRefresh((value) => value + 1);
    setStatus("Admin access removed.");
  };

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-black uppercase tracking-widest text-a2-green">Management</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">Admins</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
          Add, update, freeze, unfreeze, or remove admins. Roles and permissions are selected from lists; you do not need to type them manually.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <input className="form-input" placeholder="Search admins..." value={q} onChange={(event) => setQ(event.target.value)} />
            <Button type="button" variant="ghost" onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={15} /></Button>
          </div>
          <div className="grid max-h-[720px] gap-3 overflow-auto pr-1">
            {(data?.rows || []).map((user) => (
              <div key={user.id} className="rounded-xl border border-a2-border bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{user.username || user.email}</p>
                    <p className="mt-1 text-xs text-white/45">{user.email || "No email"}</p>
                    <p className="mt-1 text-xs text-white/45">Discord {user.discord_id || "none"} / Steam {user.steam_id || "none"}</p>
                    <p className="mt-2 text-xs font-bold text-a2-green">{(user.roles || []).join(", ")}</p>
                  </div>
                  <span className="rounded-full border border-a2-border px-3 py-1 text-xs font-bold text-white/60">{user.admin_status || user.account_status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" onClick={() => selectAdmin(user)}><Edit3 size={14} /> Edit</Button>
                  <Button type="button" variant="ghost" onClick={() => freeze(user, "freeze")}>Freeze</Button>
                  <Button type="button" variant="ghost" onClick={() => freeze(user, "unfreeze")}>Unfreeze</Button>
                  <Button type="button" variant="danger" onClick={() => removeAdmin(user)}><Trash2 size={14} /> Remove admin</Button>
                </div>
              </div>
            ))}
            {!(data?.rows || []).length && <p className="py-8 text-center text-sm text-white/45">No admins found.</p>}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black">{selected ? "Update admin" : "Add admin"}</h2>
          <form className="mt-4 grid gap-4" onSubmit={save}>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Email" value={draft.email} onChange={(value) => setDraft((current) => ({ ...current, email: value }))} />
              <Field label="Username" value={draft.username} onChange={(value) => setDraft((current) => ({ ...current, username: value }))} />
              <Field label="Discord ID" value={draft.discord_id} onChange={(value) => setDraft((current) => ({ ...current, discord_id: value }))} />
              <Field label="Steam ID" value={draft.steam_id} onChange={(value) => setDraft((current) => ({ ...current, steam_id: value }))} />
            </div>

            <Selector title="Roles" icon={Shield} values={adminRoles} selected={draft.roles} onToggle={toggleRole} />
            <Selector title="Permissions" values={permissions} selected={draft.permissions} onToggle={togglePermission} compact />

            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit"><Check size={15} /> Save admin</Button>
              <Button type="button" variant="ghost" onClick={() => { setSelected(null); setDraft(emptyDraft); }}>New admin</Button>
              {status && <span className={`text-sm ${status.includes("saved") || status.includes("removed") ? "text-a2-success" : "text-a2-warning"}`}>{status}</span>}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input className="form-input" value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Selector({ title, values, selected, onToggle, compact = false, icon: Icon }) {
  return (
    <div className="rounded-xl border border-a2-border bg-white/[0.03] p-4">
      <h3 className="mb-3 flex items-center gap-2 font-black">{Icon && <Icon size={16} />} {title}</h3>
      <div className={`grid gap-2 ${compact ? "md:grid-cols-2" : "sm:grid-cols-2"}`}>
        {values.map((value) => (
          <label key={value} className="flex items-center gap-2 rounded-lg border border-a2-border bg-black/35 p-2 text-sm text-white/70">
            <input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} />
            <span>{value}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
