import { useState } from "react";
import { Ban, RefreshCw, Search, Trash2 } from "lucide-react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

function badgeClass(value) {
  if (value === "active") return "border-a2-green/50 text-a2-green";
  if (value === "banned") return "border-a2-danger/50 text-a2-danger";
  return "border-a2-warning/50 text-a2-warning";
}

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [status, setStatus] = useState("");
  const { data, loading } = useApi(() => api.get(`/api/admin/users?q=${encodeURIComponent(q)}&limit=200`), [q, refresh], { rows: [] });
  const rows = data?.rows || [];
  const reload = () => setRefresh((value) => value + 1);

  const banUser = async (user) => {
    const reason = prompt(`Reason for banning ${user.username || user.email}?`, "Banned by admin") || "Banned by admin";
    await api.post(`/api/admin/users/${user.id}/ban`, { reason });
    setStatus(`Banned ${user.username || user.email}. Their account identifiers and known IPs are blocked.`);
    reload();
  };

  const deleteUser = async (user) => {
    if (!confirm(`Delete/disable account for ${user.username || user.email}?`)) return;
    await api.delete(`/api/admin/users/${user.id}`, { reason: "Deleted by admin" });
    setStatus(`Deleted/disabled ${user.username || user.email}.`);
    reload();
  };

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-black uppercase tracking-widest text-a2-green">Website users</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">User accounts</h1>
        <p className="mt-2 text-sm text-white/55">View all registered website users, delete accounts, or ban accounts and known IPs.</p>
      </header>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-a2-border bg-white/[0.04] px-3 py-2">
            <Search size={16} className="text-white/35" />
            <input className="w-full bg-transparent text-sm outline-none placeholder:text-white/35" placeholder="Search username, email, Discord ID, Steam ID..." value={q} onChange={(event) => setQ(event.target.value)} />
          </div>
          <Button type="button" variant="ghost" onClick={reload}><RefreshCw size={15} /></Button>
        </div>
        {status && <p className="mb-4 rounded-lg border border-a2-green/35 bg-a2-green/10 p-3 text-sm text-a2-green">{status}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase text-white/35">
              <tr>
                <th className="py-2">User</th>
                <th>Email</th>
                <th>Discord</th>
                <th>Steam</th>
                <th>Status</th>
                <th>Roles</th>
                <th>Last login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(loading ? Array.from({ length: 8 }) : rows).map((user, index) => loading ? (
                <tr key={index} className="border-t border-a2-border"><td className="py-4" colSpan={8}><div className="h-8 rounded skeleton" /></td></tr>
              ) : (
                <tr key={user.id} className="border-t border-a2-border align-top">
                  <td className="py-3 font-bold">{user.username || "Unknown"}</td>
                  <td className="py-3 text-white/60">{user.email || "-"}</td>
                  <td className="py-3 text-white/60">{user.discord_username || user.discord_id || "-"}<br />{user.discord_id && <span className="text-xs text-white/35">{user.discord_id}</span>}</td>
                  <td className="py-3 text-white/60">{user.steam_persona || user.steam_id || "-"}</td>
                  <td className="py-3"><span className={`rounded-full border px-2 py-1 text-xs font-black ${badgeClass(user.account_status)}`}>{user.account_status}</span></td>
                  <td className="py-3 text-white/50">{(user.roles || []).join(", ") || "Player"}</td>
                  <td className="py-3 text-white/40">{user.last_login_at?.slice?.(0, 16) || "-"}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {user.account_status !== "banned" && <Button type="button" variant="danger" onClick={() => banUser(user)}><Ban size={14} /> Ban</Button>}
                      <Button type="button" variant="ghost" onClick={() => deleteUser(user)}><Trash2 size={14} /> Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !rows.length && <p className="py-8 text-center text-sm text-white/45">No users found.</p>}
      </Card>
    </div>
  );
}
