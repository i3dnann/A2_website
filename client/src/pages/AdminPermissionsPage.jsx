import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Save, Search } from "lucide-react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

export default function AdminPermissionsPage() {
  const [q, setQ] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const { data: permData } = useApi(() => api.get("/api/admin/permissions"), [], { roles: [], permissions: [], defaults: {} });
  const { data: usersData, loading } = useApi(() => api.get(`/api/admin/users?q=${encodeURIComponent(q)}&limit=200`), [q, refresh], { rows: [] });
  const users = usersData?.rows || [];
  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId) || users[0] || null, [users, selectedUserId]);

  useEffect(() => { if (!selectedUserId && users[0]) setSelectedUserId(users[0].id); }, [users, selectedUserId]);
  useEffect(() => { if (selectedUser) { setRoles(selectedUser.roles || ["Player"]); setPermissions(selectedUser.permissions || []); } }, [selectedUser?.id]);

  const toggle = (value, list, setter) => setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  const save = async () => {
    if (!selectedUser) return;
    const result = await api.patch(`/api/admin/users/${selectedUser.id}`, { roles, permissions, reason: "Permission update" });
    setNotice(`Saved ${result.user?.username || selectedUser.username}.`);
    setRefresh((value) => value + 1);
  };

  return <div className="grid gap-5"><header><p className="text-sm font-black uppercase tracking-widest text-a2-green">Permissions</p><h1 className="mt-2 text-3xl font-black md:text-4xl">Permission editor</h1><p className="mt-2 text-sm text-white/55">Select a website user, then add or remove roles and permissions.</p></header>{notice && <p className="rounded-lg border border-a2-green/35 bg-a2-green/10 p-3 text-sm text-a2-green">{notice}</p>}<div className="grid gap-5 xl:grid-cols-[360px_1fr]"><Card><div className="mb-4 flex items-center gap-2 rounded-lg border border-a2-border bg-white/[0.04] px-3 py-2"><Search size={16} className="text-white/35" /><input className="w-full bg-transparent text-sm outline-none placeholder:text-white/35" placeholder="Search users..." value={q} onChange={(event) => setQ(event.target.value)} /></div><div className="grid max-h-[650px] gap-2 overflow-auto pr-1">{(loading ? Array.from({ length: 8 }) : users).map((user, index) => loading ? <div key={index} className="h-14 rounded skeleton" /> : <button key={user.id} type="button" onClick={() => setSelectedUserId(user.id)} className={`rounded-lg border p-3 text-left transition ${selectedUser?.id === user.id ? "border-a2-green bg-a2-green/10" : "border-a2-border bg-white/[0.03] hover:border-a2-green/40"}`}><p className="font-black">{user.username || user.email || "Unknown"}</p><p className="text-xs text-white/45">{user.email || user.discord_id || user.id}</p></button>)}</div></Card><Card>{!selectedUser ? <p className="text-white/50">Select a user first.</p> : <div className="grid gap-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-black">{selectedUser.username || selectedUser.email}</h2><p className="text-sm text-white/45">{selectedUser.email || "No email"} · {selectedUser.account_status}</p></div><div className="flex gap-2"><Button type="button" variant="ghost" onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={15} /> Reload</Button><Button type="button" onClick={save}><Save size={15} /> Save changes</Button></div></div><section><h3 className="mb-3 font-black">Roles</h3><div className="grid gap-2 md:grid-cols-3">{(permData?.roles || []).map((role) => <label key={role} className="flex cursor-pointer items-center gap-2 rounded-lg border border-a2-border bg-white/[0.04] p-3 text-sm"><input type="checkbox" checked={roles.includes(role)} onChange={() => toggle(role, roles, setRoles)} /> {role}</label>)}</div></section><section><h3 className="mb-3 font-black">All permissions</h3><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{(permData?.permissions || []).map((permission) => <label key={permission} className="flex cursor-pointer items-center gap-2 rounded-lg border border-a2-border bg-white/[0.04] p-3 text-sm"><input type="checkbox" checked={permissions.includes(permission)} onChange={() => toggle(permission, permissions, setPermissions)} /> <span className="break-all">{permission}</span></label>)}</div></section></div>}</Card></div></div>;
}
