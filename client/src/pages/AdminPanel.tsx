import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Settings, Globe, Users, Play, Clock, FileText, Briefcase, HelpCircle, Palette,
  Home, Menu, X, LogOut, Save, Trash2, Plus, Loader2, LayoutDashboard,
  CheckCircle2, XCircle, MessageCircle, Shield, AlertTriangle, TrendingUp,
  Server, Eye, ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSite } from "../context/SiteContext";
import { api, MOCK } from "../api/client";
import { useToast, Skeleton } from "../components/Toast";

const ADMIN_TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "home", label: "Homepage", icon: Home },
  { id: "server", label: "Server / Features", icon: Globe },
  { id: "roster", label: "Roster", icon: Users },
  { id: "live", label: "Live Streams", icon: Play },
  { id: "journey", label: "Journey & Chars", icon: Clock },
  { id: "news", label: "News", icon: FileText },
  { id: "careers", label: "Careers", icon: Briefcase },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "comments", label: "Comments", icon: MessageCircle },
  { id: "theme", label: "Theme & Brand", icon: Palette },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "logs", label: "Audit Logs", icon: Shield },
];

const stClass = "mb-1 text-xs font-semibold uppercase tracking-wider text-white/40";
const inpClass = "w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-orange-400/50 transition";

type DashboardStats = {
  users: number; characters: number;
  news: { id: string; title: string; published_at: string }[];
  pendingComments: number;
  logs: { id: string; action: string; target: string | null; meta: any; created_at: string }[];
  live: any;
};

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const { content, updateContent } = useSite();
  const { push } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      if (MOCK) {
        setStats({
          users: 2847, characters: 9120,
          news: [
            { id: "1", title: "Season 4: Gotham Nights", published_at: new Date().toISOString() },
            { id: "2", title: "Community Awards", published_at: new Date().toISOString() },
          ],
          pendingComments: 4,
          logs: [
            { id: "1", action: "user_login", target: "abc123", meta: {}, created_at: new Date().toISOString() },
            { id: "2", action: "section_edit", target: "features", meta: {}, created_at: new Date().toISOString() },
            { id: "3", action: "comment_approve", target: "xyz", meta: {}, created_at: new Date().toISOString() },
          ],
          live: { count: 42, maxplayers: 100, status: "online" },
        });
        setStatsLoading(false);
        return;
      }
      try {
        const r = await api<DashboardStats>("/api/admin/dashboard");
        if (!cancel) setStats(r);
      } catch (e: any) {
        push({ kind: "error", message: e?.message || "Failed to load dashboard" });
      } finally { if (!cancel) setStatsLoading(false); }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => { cancel = true; clearInterval(t); };
  }, []);

  const handleLogout = () => { logout(); navigate("/"); };
  const handleSave = async () => { setSaving(true); await new Promise((r) => setTimeout(r, 600)); setSaving(false); push({ kind: "success", message: "All changes saved" }); };

  if (!user || (user.role !== "Master Admin" && user.role !== "Admin")) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 pt-28">
        <div className="text-center max-w-md">
          <AlertTriangle size={40} className="mx-auto text-orange-300" />
          <h1 className="mt-4 font-serif text-2xl text-white">Access Denied</h1>
          <p className="mt-2 text-white/50">You need admin permissions to view this page.</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80">← Back to site</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-24 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-white">Admin Panel</h1>
            <p className="mt-1 text-sm text-white/45">
              Welcome back, <span className="text-orange-300">{user.username}</span> ·{" "}
              <span className="text-orange-200">{user.role}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(96,81,155,0.3)] hover:shadow-[0_0_25px_rgba(96,81,155,0.5)] transition disabled:opacity-70">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving..." : "Save All Changes"}
            </button>
            <Link to="/" className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:text-white flex items-center gap-2">
              <Eye size={14} /> View Site
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 bg-[#080808]/95 backdrop-blur-xl p-6 flex flex-col lg:hidden">
              <button onClick={() => setSidebarOpen(false)} className="mb-4 self-end text-white/60 hover:text-white"><X size={20} /></button>
              <SidebarNav tab={tab} setTab={(id: string) => { setTab(id); setSidebarOpen(false); }} />
              <button onClick={handleLogout} className="mt-4 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-400 hover:bg-red-500/10 transition">
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}

          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 flex flex-col gap-1">
              <SidebarNav tab={tab} setTab={setTab} />
              <button onClick={handleLogout} className="mt-4 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/55 hover:bg-white/5 hover:text-white transition">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </aside>

          {/* Mobile tab selector */}
          <div className="lg:hidden">
            <button onClick={() => setSidebarOpen(true)} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
              <span className="flex items-center gap-2">
                {(() => { const t = ADMIN_TABS.find((x) => x.id === tab); return t ? <><t.icon size={16} /> {t.label}</> : "Select"; })()}
              </span>
              <Menu size={16} />
            </button>
          </div>

          {/* Editor Area */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                {tab === "dashboard" && <DashboardView stats={stats} loading={statsLoading} setTab={setTab} />}
                {tab === "home" && <HomeEditor content={content} update={updateContent} />}
                {tab === "server" && <ServerEditor content={content} update={updateContent} />}
                {tab === "roster" && <RosterEditor content={content} update={updateContent} />}
                {tab === "live" && <LiveEditor content={content} update={updateContent} />}
                {tab === "journey" && <JourneyEditor content={content} update={updateContent} />}
                {tab === "news" && <NewsAdmin />}
                {tab === "careers" && <CareersEditor content={content} update={updateContent} />}
                {tab === "faq" && <FaqEditor content={content} update={updateContent} />}
                {tab === "comments" && <CommentsAdmin />}
                {tab === "theme" && <ThemeEditor content={content} update={updateContent} />}
                {tab === "settings" && <SettingsEditor content={content} update={updateContent} />}
                {tab === "logs" && <LogsAdmin stats={stats} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarNav({ tab, setTab }: any) {
  return <>
    {ADMIN_TABS.map((t) => (
      <button key={t.id} onClick={() => setTab(t.id)}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
          tab === t.id ? "bg-orange-500/15 text-orange-200" : "text-white/55 hover:bg-white/5 hover:text-white"
        }`}>
        <t.icon size={16} /> {t.label}
      </button>
    ))}
  </>;
}

/* ─────────────────────────────────────────────────────────────── */
/* DASHBOARD VIEW */
/* ─────────────────────────────────────────────────────────────── */
function DashboardView({ stats, loading, setTab }: { stats: DashboardStats | null; loading: boolean; setTab: (id: string) => void }) {
  const cards = [
    { label: "Registered Users", value: stats?.users ?? 0, icon: Users, color: "text-emerald-300", trend: "+12% this week" },
    { label: "Total Characters", value: stats?.characters ?? 0, icon: Briefcase, color: "text-orange-300", trend: "+4% this week" },
    { label: "Pending Comments", value: stats?.pendingComments ?? 0, icon: MessageCircle, color: "text-orange-300", trend: "Needs review" },
    { label: "Server Online", value: stats?.live?.status === "online" ? `${stats.live.count}/${stats.live.maxplayers}` : "Offline", icon: Server, color: stats?.live?.status === "online" ? "text-emerald-300" : "text-red-300", trend: stats?.live?.status === "online" ? "Live now" : "Check status" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-orange-600/15 via-transparent to-orange-700/15 p-6">
        <h2 className="font-serif text-2xl text-white">Welcome to the Command Center</h2>
        <p className="mt-1 text-sm text-white/55">Monitor your FiveM server, review pending content, and manage every part of the website from one place.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><Skeleton className="h-8 w-16" /><Skeleton className="mt-3 h-3 w-20" /></div>)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20">
              <div className="flex items-center justify-between">
                <c.icon size={18} className={c.color} />
                <TrendingUp size={13} className="text-white/25" />
              </div>
              <p className={`mt-3 font-serif text-2xl ${c.color}`}>{typeof c.value === "number" ? c.value.toLocaleString() : c.value}</p>
              <p className="mt-0.5 text-xs uppercase tracking-wider text-white/40">{c.label}</p>
              <p className="mt-2 text-[11px] text-white/35">{c.trend}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Latest news */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base text-white">Latest News</h3>
            <button onClick={() => setTab("news")} className="flex items-center gap-1 text-xs text-orange-300 hover:text-orange-200">Manage <ArrowUpRight size={11} /></button>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {(!stats?.news || stats.news.length === 0) && <p className="text-xs text-white/40">No news posts yet.</p>}
            {stats?.news.slice(0, 5).map((n) => (
              <div key={n.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 p-3">
                <p className="truncate text-sm text-white/80">{n.title}</p>
                <p className="shrink-0 text-[11px] text-white/35">{new Date(n.published_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent admin actions */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base text-white">Recent Admin Actions</h3>
            <button onClick={() => setTab("logs")} className="flex items-center gap-1 text-xs text-orange-300 hover:text-orange-200">View all <ArrowUpRight size={11} /></button>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {(!stats?.logs || stats.logs.length === 0) && <p className="text-xs text-white/40">No activity yet.</p>}
            {stats?.logs.slice(0, 6).map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 p-3">
                <div className="flex items-center gap-2">
                  <Shield size={12} className="text-orange-300" />
                  <p className="text-sm text-white/80">{formatAction(l.action)}</p>
                  {l.target && <span className="text-xs text-white/40">· {l.target.slice(0, 12)}</span>}
                </div>
                <p className="shrink-0 text-[11px] text-white/35">{new Date(l.created_at).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick buttons */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="font-serif text-base text-white">Quick Actions</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Edit Homepage", tab: "home", icon: Home, color: "from-orange-600/20 to-orange-700/10" },
            { label: "Post News", tab: "news", icon: FileText, color: "from-orange-500/15 to-orange-700/5" },
            { label: "Review Comments", tab: "comments", icon: MessageCircle, color: "from-emerald-500/15 to-teal-500/5" },
            { label: "Live Streams", tab: "live", icon: Play, color: "from-orange-500/15 to-orange-700/5" },
            { label: "Features", tab: "server", icon: Globe, color: "from-cyan-500/15 to-blue-500/5" },
            { label: "Roster", tab: "roster", icon: Users, color: "from-indigo-500/15 to-purple-500/5" },
            { label: "Theme & Brand", tab: "theme", icon: Palette, color: "from-pink-500/15 to-rose-500/5" },
            { label: "Site Settings", tab: "settings", icon: Settings, color: "from-gray-500/15 to-zinc-500/5" },
          ].map((q) => (
            <button key={q.label} onClick={() => setTab(q.tab)}
              className={`flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-br ${q.color} p-4 text-left transition hover:border-white/20`}>
              <div>
                <q.icon size={16} className="text-white/70" />
                <p className="mt-2 text-sm font-medium text-white">{q.label}</p>
              </div>
              <ArrowUpRight size={14} className="text-white/40" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatAction(a: string) {
  return a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─────────────────────────────────────────────────────────────── */
/* COMMENTS ADMIN */
/* ─────────────────────────────────────────────────────────────── */
function CommentsAdmin() {
  const { push, confirm } = useToast();
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      if (MOCK) {
        setRows([
          { id: "1", news_id: "n1", author_name: "John", body: "Amazing update!", approved: 0, created_at: new Date().toISOString(), user_id: "u1" },
          { id: "2", news_id: "n1", author_name: "Alex", body: "When is the next event?", approved: 0, created_at: new Date().toISOString(), user_id: "u2" },
          { id: "3", news_id: "n2", author_name: "Mia", body: "Great work on the new map", approved: 1, created_at: new Date().toISOString(), user_id: "u3" },
        ]);
        return;
      }
      const r = await api<{ data: any[] }>(`/api/admin/comments?status=${filter}`);
      setRows(r.data);
    } catch (e: any) { push({ kind: "error", message: e?.message || "Failed" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const act = async (id: string, action: "approve" | "reject" | "delete") => {
    if (action === "delete") {
      const ok = await confirm({ title: "Delete Comment?", message: "This action is permanent.", confirmText: "Delete" });
      if (!ok) return;
    }
    try {
      if (MOCK) { push({ kind: "success", message: action + "d (demo)" }); load(); return; }
      if (action === "delete") await api(`/api/admin/comments/${id}`, { method: "DELETE" });
      else await api(`/api/admin/comments/${id}/${action}`, { method: "POST" });
      push({ kind: "success", message: `Comment ${action}d` });
      load();
    } catch (e: any) { push({ kind: "error", message: e?.message || "Failed" }); }
  };

  return (
    <div className="flex flex-col gap-1">
      <EditableSection title="Comments Moderation">
        <div className="flex items-center gap-2">
          <FilterPill active={filter === "pending"} onClick={() => setFilter("pending")}>Pending</FilterPill>
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>All</FilterPill>
        </div>
        {loading ? (
          <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">No comments found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((c) => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      c.approved === 0 ? "border-orange-400/30 bg-orange-400/10 text-orange-300" : c.approved === 1 ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-red-400/30 bg-red-400/10 text-red-300"
                    }`}>{c.approved === 0 ? "Pending" : c.approved === 1 ? "Approved" : "Rejected"}</span>
                    <span className="text-xs font-semibold text-white">{c.author_name}</span>
                    <span className="text-[11px] text-white/35">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {c.approved !== 1 && <button onClick={() => act(c.id, "approve")} className="flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-400/5 px-2.5 py-1.5 text-[11px] text-emerald-300 hover:bg-emerald-400/10"><CheckCircle2 size={11} /> Approve</button>}
                    {c.approved !== -1 && <button onClick={() => act(c.id, "reject")} className="flex items-center gap-1 rounded-lg border border-orange-400/30 bg-orange-400/5 px-2.5 py-1.5 text-[11px] text-orange-300 hover:bg-orange-400/10"><XCircle size={11} /> Reject</button>}
                    <button onClick={() => act(c.id, "delete")} className="flex items-center gap-1 rounded-lg border border-red-400/30 bg-red-400/5 px-2.5 py-1.5 text-[11px] text-red-300 hover:bg-red-400/10"><Trash2 size={11} /> Delete</button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-white/80 whitespace-pre-wrap">{c.body}</p>
                <p className="mt-1 text-[11px] text-white/35">User ID: {c.user_id}</p>
              </div>
            ))}
          </div>
        )}
      </EditableSection>
    </div>
  );
}

function FilterPill({ active, onClick, children }: any) {
  return <button onClick={onClick}
    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${active ? "border-orange-400/40 bg-orange-500/15 text-orange-200" : "border-white/10 bg-white/5 text-white/60 hover:text-white"}`}>
    {children}
  </button>;
}

/* ─────────────────────────────────────────────────────────────── */
/* LOGS */
/* ─────────────────────────────────────────────────────────────── */
function LogsAdmin({ stats }: { stats: DashboardStats | null }) {
  return (
    <EditableSection title="Audit Logs">
      {(!stats?.logs || stats.logs.length === 0) && <p className="text-xs text-white/40">No activity recorded yet.</p>}
      <div className="flex flex-col gap-2">
        {stats?.logs.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 p-3">
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-orange-300" />
              <p className="text-sm text-white/80">{formatAction(l.action)}</p>
              {l.target && <span className="text-xs text-white/40">· {String(l.target).slice(0, 24)}</span>}
            </div>
            <p className="text-[11px] text-white/35">{new Date(l.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </EditableSection>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* NEWS ADMIN (simplified) */
/* ─────────────────────────────────────────────────────────────── */
function NewsAdmin() {
  const { push, confirm } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      if (MOCK) {
        setRows([
          { id: "1", title: "Season 4: Gotham Nights Begins", active: 1, pinned: 1, category: "Announcement", published_at: new Date().toISOString() },
          { id: "2", title: "Community Awards Results", active: 1, pinned: 0, category: "Community", published_at: new Date().toISOString() },
        ]);
        return;
      }
      const r = await api<{ data: any[] }>("/api/news");
      setRows(r.data);
    } catch (e: any) { push({ kind: "error", message: e?.message }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    const ok = await confirm({ title: "Delete news post?", message: "This action is permanent.", confirmText: "Delete" });
    if (!ok) return;
    try {
      if (MOCK) { setRows((r) => r.filter((x) => x.id !== id)); push({ kind: "success", message: "Deleted (demo)" }); return; }
      await api(`/api/admin/news/${id}`, { method: "DELETE" });
      push({ kind: "success", message: "Post deleted" });
      load();
    } catch (e: any) { push({ kind: "error", message: e?.message }); }
  };

  return (
    <div className="flex flex-col gap-1">
      <EditableSection title="News Posts">
        <button onClick={() => setEditing({ id: null, title: "", excerpt: "", content: "", category: "Announcement", tags: "", pinned: false, active: true })}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-2.5 text-sm font-semibold text-white w-fit">
          <Plus size={14} /> New Post
        </button>
        {loading ? <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div> : (
          <div className="flex flex-col gap-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-serif text-base text-white">{r.title}</p>
                    {r.pinned ? <span className="rounded-full border border-orange-300/30 bg-orange-300/10 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-200">Pinned</span> : null}
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${r.active !== 0 ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/15 bg-white/5 text-white/50"}`}>
                      {r.active !== 0 ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/40">{r.category} · {new Date(r.published_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(r)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5">Edit</button>
                  <button onClick={() => del(r.id)} className="rounded-lg border border-red-400/30 bg-red-400/5 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </EditableSection>

      {editing && <NewsEditorModal post={editing} onClose={() => setEditing(null)} onSaved={() => { load(); setEditing(null); }} />}
    </div>
  );
}

function NewsEditorModal({ post, onClose, onSaved }: any) {
  const { push } = useToast();
  const [form, setForm] = useState(post);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (MOCK) { await new Promise((r) => setTimeout(r, 500)); push({ kind: "success", message: "Saved (demo)" }); onSaved(); return; }
      if (post.id) await api(`/api/admin/news/${post.id}`, { method: "PUT", body: form });
      else await api("/api/admin/news", { method: "POST", body: form });
      push({ kind: "success", message: "Post saved" });
      onSaved();
    } catch (e: any) { push({ kind: "error", message: e?.message }); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md sm:items-center" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0a0710] p-6 shadow-2xl">
        <h3 className="font-serif text-lg text-white">{post.id ? "Edit News Post" : "New News Post"}</h3>
        <div className="mt-4 flex flex-col gap-3">
          <div><label className={stClass}>Title</label><input className={inpClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={stClass}>Category</label><input className={inpClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div><label className={stClass}>Tags (comma-separated)</label><input className={inpClass} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
          </div>
          <div><label className={stClass}>Excerpt</label><textarea className={`${inpClass} resize-none`} rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
          <div><label className={stClass}>Content</label><textarea className={`${inpClass} resize-none`} rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="accent-orange-500" /> Pinned</label>
            <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={form.active !== 0} onChange={(e) => setForm({ ...form, active: e.target.checked ? 1 : 0 })} className="accent-orange-500" /> Active</label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving && <Loader2 size={13} className="animate-spin" />} {saving ? "Saving..." : "Save Post"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Reusable primitives */
/* ─────────────────────────────────────────────────────────────── */
function EditableSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 mb-5">
    <h3 className="mb-4 font-serif text-base text-white">{title}</h3>
    <div className="flex flex-col gap-3">{children}</div>
  </div>;
}
function EField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div><label className={stClass}>{label}</label><input className={inpClass} value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}
function EArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div><label className={stClass}>{label}</label><textarea className={`${inpClass} resize-none`} rows={2} value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}

/* ─────────────────────────────────────────────────────────────── */
/* Existing section editors (simplified — same as before) */
/* ─────────────────────────────────────────────────────────────── */
function HomeEditor({ content, update }: any) {
  return <div className="flex flex-col gap-1">
    <EditableSection title="Hero Section">
      <div className="grid gap-4 sm:grid-cols-2">
        <EField label="Hero Title Line 1" value={content.heroTitle1} onChange={(v) => update({ heroTitle1: v })} />
        <EField label="Hero Title Line 2" value={content.heroTitle2} onChange={(v) => update({ heroTitle2: v })} />
      </div>
      <EArea label="Hero Description" value={content.heroDescription} onChange={(v) => update({ heroDescription: v })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <EField label="Server IP" value={content.serverIp} onChange={(v) => update({ serverIp: v })} />
        <EField label="Discord Link" value={content.discordLink} onChange={(v) => update({ discordLink: v })} />
        <EField label="FiveM Connect Link" value={content.fivemLink} onChange={(v) => update({ fivemLink: v })} />
        <EField label="Store Link" value={content.storeLink} onChange={(v) => update({ storeLink: v })} />
      </div>
    </EditableSection>
    <EditableSection title="Stats">
      <div className="grid gap-4 sm:grid-cols-2">
        {content.stats.map((s: any, i: number) => (
          <div key={s.label} className="grid grid-cols-3 gap-2">
            <input className={inpClass} value={s.label} onChange={(e) => { const n = [...content.stats]; n[i] = { ...n[i], label: e.target.value }; update({ stats: n }); }} placeholder="Label" />
            <input className={inpClass} type="number" value={s.value} onChange={(e) => { const n = [...content.stats]; n[i] = { ...n[i], value: +e.target.value || 0 }; update({ stats: n }); }} placeholder="Value" />
            <input className={inpClass} value={s.suffix} onChange={(e) => { const n = [...content.stats]; n[i] = { ...n[i], suffix: e.target.value }; update({ stats: n }); }} placeholder="Suffix" />
          </div>
        ))}
      </div>
    </EditableSection>
  </div>;
}

function ServerEditor({ content, update }: any) {
  return <div className="flex flex-col gap-1">
    <EditableSection title="Header">
      <EField label="Subtitle" value={content.featuresSubtitle} onChange={(v) => update({ featuresSubtitle: v })} />
      <EField label="Title" value={content.featuresTitle} onChange={(v) => update({ featuresTitle: v })} />
      <EArea label="Description" value={content.featuresDesc} onChange={(v) => update({ featuresDesc: v })} />
    </EditableSection>
    <EditableSection title="Features">
      {content.features.map((f: any, i: number) => (
        <div key={i} className="rounded-xl border border-white/10 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/40">Feature #{i + 1}</span>
            <button onClick={() => update({ features: content.features.filter((_: any, j: number) => j !== i) })} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input className={inpClass} value={f.icon} onChange={(e) => { const n = [...content.features]; n[i] = { ...n[i], icon: e.target.value }; update({ features: n }); }} placeholder="Icon name" />
            <input className={`${inpClass} sm:col-span-2`} value={f.title} onChange={(e) => { const n = [...content.features]; n[i] = { ...n[i], title: e.target.value }; update({ features: n }); }} placeholder="Title" />
          </div>
          <textarea className={inpClass} rows={2} value={f.desc} onChange={(e) => { const n = [...content.features]; n[i] = { ...n[i], desc: e.target.value }; update({ features: n }); }} placeholder="Description" />
        </div>
      ))}
      <button onClick={() => update({ features: [...content.features, { icon: "ShieldHalf", title: "New Feature", desc: "Description here" }] })}
        className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-2.5 text-sm text-white/60 hover:border-orange-400/40 hover:text-white transition"><Plus size={14} /> Add Feature</button>
    </EditableSection>
  </div>;
}

function RosterEditor({ content, update }: any) {
  return <div className="flex flex-col gap-1">
    <EditableSection title="Header">
      <EField label="Subtitle" value={content.rosterSubtitle} onChange={(v) => update({ rosterSubtitle: v })} />
      <EField label="Title" value={content.rosterTitle} onChange={(v) => update({ rosterTitle: v })} />
      <EArea label="Description" value={content.rosterDesc} onChange={(v) => update({ rosterDesc: v })} />
    </EditableSection>
    <EditableSection title="Departments">
      {content.roster.map((r: any, i: number) => (
        <div key={i} className="rounded-xl border border-white/10 p-4 grid gap-3 sm:grid-cols-4 items-end">
          <div><label className={stClass}>Name</label><input className={inpClass} value={r.name} onChange={(e) => { const n = [...content.roster]; n[i] = { ...n[i], name: e.target.value }; update({ roster: n }); }} /></div>
          <div><label className={stClass}>Role</label><input className={inpClass} value={r.role} onChange={(e) => { const n = [...content.roster]; n[i] = { ...n[i], role: e.target.value }; update({ roster: n }); }} /></div>
          <div><label className={stClass}>Count</label><input className={inpClass} value={r.count} onChange={(e) => { const n = [...content.roster]; n[i] = { ...n[i], count: e.target.value }; update({ roster: n }); }} /></div>
          <div className="flex items-center gap-2">
            <input className={inpClass} value={r.icon} onChange={(e) => { const n = [...content.roster]; n[i] = { ...n[i], icon: e.target.value }; update({ roster: n }); }} placeholder="Icon" />
            <button onClick={() => update({ roster: content.roster.filter((_: any, j: number) => j !== i) })} className="text-red-400 hover:text-red-300 shrink-0"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
      <button onClick={() => update({ roster: [...content.roster, { name: "New Dept", role: "Role", count: "0 Members", icon: "ShieldHalf" }] })}
        className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-2.5 text-sm text-white/60 hover:border-orange-400/40 hover:text-white transition"><Plus size={14} /> Add Department</button>
    </EditableSection>
  </div>;
}

function LiveEditor({ content, update }: any) {
  return <div className="flex flex-col gap-1">
    <EditableSection title="Header">
      <EField label="Subtitle" value={content.streamsSubtitle} onChange={(v) => update({ streamsSubtitle: v })} />
      <EField label="Title" value={content.streamsTitle} onChange={(v) => update({ streamsTitle: v })} />
      <EArea label="Description" value={content.streamsDesc} onChange={(v) => update({ streamsDesc: v })} />
    </EditableSection>
    <EditableSection title="Streamers">
      {content.streamers.map((s: any, i: number) => (
        <div key={i} className="rounded-xl border border-white/10 p-4 grid gap-3 sm:grid-cols-6 items-end">
          <div className="sm:col-span-2"><label className={stClass}>Name</label><input className={inpClass} value={s.name} onChange={(e) => { const n = [...content.streamers]; n[i] = { ...n[i], name: e.target.value }; update({ streamers: n }); }} /></div>
          <div><label className={stClass}>Platform</label><input className={inpClass} value={s.platform} onChange={(e) => { const n = [...content.streamers]; n[i] = { ...n[i], platform: e.target.value }; update({ streamers: n }); }} /></div>
          <div><label className={stClass}>Viewers</label><input className={inpClass} type="number" value={s.viewers} onChange={(e) => { const n = [...content.streamers]; n[i] = { ...n[i], viewers: +e.target.value || 0 }; update({ streamers: n }); }} /></div>
          <div><label className={stClass}>Game</label><input className={inpClass} value={s.game} onChange={(e) => { const n = [...content.streamers]; n[i] = { ...n[i], game: e.target.value }; update({ streamers: n }); }} /></div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-white/60"><input type="checkbox" checked={s.live} onChange={(e) => { const n = [...content.streamers]; n[i] = { ...n[i], live: e.target.checked }; update({ streamers: n }); }} className="accent-orange-500" /> Live</label>
            <button onClick={() => update({ streamers: content.streamers.filter((_: any, j: number) => j !== i) })} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
      <button onClick={() => update({ streamers: [...content.streamers, { name: "New Streamer", platform: "Twitch", viewers: 0, live: false, game: "Offline" }] })}
        className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-2.5 text-sm text-white/60 hover:border-orange-400/40 hover:text-white transition"><Plus size={14} /> Add Streamer</button>
    </EditableSection>
  </div>;
}

function JourneyEditor({ content, update }: any) {
  return <div className="flex flex-col gap-1">
    <EditableSection title="Journey Header">
      <EField label="Subtitle" value={content.journeySubtitle} onChange={(v) => update({ journeySubtitle: v })} />
      <EField label="Title" value={content.journeyTitle} onChange={(v) => update({ journeyTitle: v })} />
    </EditableSection>
    <EditableSection title="Timeline">
      {content.journey.map((j: any, i: number) => (
        <div key={i} className="rounded-xl border border-white/10 p-4 grid gap-3 sm:grid-cols-3 items-end">
          <div><label className={stClass}>Year</label><input className={inpClass} value={j.year} onChange={(e) => { const n = [...content.journey]; n[i] = { ...n[i], year: e.target.value }; update({ journey: n }); }} /></div>
          <div><label className={stClass}>Title</label><input className={inpClass} value={j.title} onChange={(e) => { const n = [...content.journey]; n[i] = { ...n[i], title: e.target.value }; update({ journey: n }); }} /></div>
          <div className="flex items-end justify-end"><button onClick={() => update({ journey: content.journey.filter((_: any, k: number) => k !== i) })} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button></div>
          <div className="sm:col-span-3"><label className={stClass}>Description</label><textarea className={inpClass} rows={2} value={j.desc} onChange={(e) => { const n = [...content.journey]; n[i] = { ...n[i], desc: e.target.value }; update({ journey: n }); }} /></div>
        </div>
      ))}
      <button onClick={() => update({ journey: [...content.journey, { year: "2027", title: "New Milestone", desc: "Description" }] })}
        className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-2.5 text-sm text-white/60 hover:border-orange-400/40 hover:text-white transition"><Plus size={14} /> Add Milestone</button>
    </EditableSection>
    <EditableSection title="Famous Characters">
      {content.famousCharacters.map((c: any, i: number) => (
        <div key={i} className="rounded-xl border border-white/10 p-4 grid gap-3 sm:grid-cols-4 items-end">
          <div><label className={stClass}>Name</label><input className={inpClass} value={c.name} onChange={(e) => { const n = [...content.famousCharacters]; n[i] = { ...n[i], name: e.target.value }; update({ famousCharacters: n }); }} /></div>
          <div className="sm:col-span-2"><label className={stClass}>Title/Role</label><input className={inpClass} value={c.title} onChange={(e) => { const n = [...content.famousCharacters]; n[i] = { ...n[i], title: e.target.value }; update({ famousCharacters: n }); }} /></div>
          <div className="flex items-center gap-2">
            <input className={inpClass} value={c.tag} onChange={(e) => { const n = [...content.famousCharacters]; n[i] = { ...n[i], tag: e.target.value }; update({ famousCharacters: n }); }} placeholder="Tag" />
            <button onClick={() => update({ famousCharacters: content.famousCharacters.filter((_: any, k: number) => k !== i) })} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
      <button onClick={() => update({ famousCharacters: [...content.famousCharacters, { name: "New Character", title: "Their Role", tag: "Rising" }] })}
        className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-2.5 text-sm text-white/60 hover:border-orange-400/40 hover:text-white transition"><Plus size={14} /> Add Character</button>
    </EditableSection>
  </div>;
}

function CareersEditor({ content, update }: any) {
  return <div className="flex flex-col gap-1">
    <EditableSection title="Header">
      <EField label="Subtitle" value={content.careersSubtitle} onChange={(v) => update({ careersSubtitle: v })} />
      <EField label="Title" value={content.careersTitle} onChange={(v) => update({ careersTitle: v })} />
      <EArea label="Description" value={content.careersDesc} onChange={(v) => update({ careersDesc: v })} />
    </EditableSection>
    <EditableSection title="Open Positions">
      {content.careers.map((c: any, i: number) => (
        <div key={i} className="rounded-xl border border-white/10 p-4 grid gap-3 sm:grid-cols-4 items-end">
          <div className="sm:col-span-2"><label className={stClass}>Role</label><input className={inpClass} value={c.role} onChange={(e) => { const n = [...content.careers]; n[i] = { ...n[i], role: e.target.value }; update({ careers: n }); }} /></div>
          <div><label className={stClass}>Type</label><input className={inpClass} value={c.type} onChange={(e) => { const n = [...content.careers]; n[i] = { ...n[i], type: e.target.value }; update({ careers: n }); }} /></div>
          <div className="flex items-center gap-2">
            <input className={inpClass} value={c.dept} onChange={(e) => { const n = [...content.careers]; n[i] = { ...n[i], dept: e.target.value }; update({ careers: n }); }} placeholder="Dept" />
            <button onClick={() => update({ careers: content.careers.filter((_: any, k: number) => k !== i) })} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
      <button onClick={() => update({ careers: [...content.careers, { role: "New Position", type: "Application", dept: "Department" }] })}
        className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-2.5 text-sm text-white/60 hover:border-orange-400/40 hover:text-white transition"><Plus size={14} /> Add Position</button>
    </EditableSection>
  </div>;
}

function FaqEditor({ content, update }: any) {
  return <div className="flex flex-col gap-1">
    <EditableSection title="Header">
      <EField label="Subtitle" value={content.faqSubtitle} onChange={(v) => update({ faqSubtitle: v })} />
      <EField label="Title" value={content.faqTitle} onChange={(v) => update({ faqTitle: v })} />
    </EditableSection>
    <EditableSection title="Questions">
      {content.faqs.map((f: any, i: number) => (
        <div key={i} className="rounded-xl border border-white/10 p-4 grid gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/40">Q#{i + 1}</span>
            <button onClick={() => update({ faqs: content.faqs.filter((_: any, k: number) => k !== i) })} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
          </div>
          <input className={inpClass} value={f.q} onChange={(e) => { const n = [...content.faqs]; n[i] = { ...n[i], q: e.target.value }; update({ faqs: n }); }} placeholder="Question" />
          <textarea className={inpClass} rows={2} value={f.a} onChange={(e) => { const n = [...content.faqs]; n[i] = { ...n[i], a: e.target.value }; update({ faqs: n }); }} placeholder="Answer" />
        </div>
      ))}
      <button onClick={() => update({ faqs: [...content.faqs, { q: "New question?", a: "Answer goes here." }] })}
        className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-2.5 text-sm text-white/60 hover:border-orange-400/40 hover:text-white transition"><Plus size={14} /> Add FAQ</button>
    </EditableSection>
  </div>;
}

function ThemeEditor({ content, update }: any) {
  const colors = { "Gotham Purple": "#60519b", "Crimson": "#8a7ac4", "Cyan": "#06b6d4", "Red": "#dc2626", "Lime": "#84cc16", "Gold": "#f59e0b", "Blue": "#2563eb", "Pink": "#ec4899" };
  return <div className="flex flex-col gap-1">
    <EditableSection title="Color Theme">
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label className={stClass}>Primary Color</label><div className="flex items-center gap-3"><input className={`${inpClass} flex-1`} value={content.primaryHex} onChange={(e) => update({ primaryHex: e.target.value })} /><span className="h-8 w-8 rounded-full border border-white/20" style={{ background: content.primaryHex }} /></div></div>
        <div><label className={stClass}>Accent Color</label><div className="flex items-center gap-3"><input className={`${inpClass} flex-1`} value={content.accentHex} onChange={(e) => update({ accentHex: e.target.value })} /><span className="h-8 w-8 rounded-full border border-white/20" style={{ background: content.accentHex }} /></div></div>
        <div><label className={stClass}>Background</label><div className="flex items-center gap-3"><input className={`${inpClass} flex-1`} value={content.darkBgHex} onChange={(e) => update({ darkBgHex: e.target.value })} /><span className="h-8 w-8 rounded-full border border-white/20" style={{ background: content.darkBgHex }} /></div></div>
      </div>
    </EditableSection>
    <EditableSection title="Quick Presets">
      <div className="grid gap-3 sm:grid-cols-4">
        {Object.entries(colors).map(([name, hex]) => (
          <button key={name} onClick={() => update({ primaryHex: hex })} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/80 hover:border-orange-400/40 transition">
            <span className="h-6 w-6 rounded-lg border border-white/20" style={{ background: hex }} /> {name}
          </button>
        ))}
      </div>
    </EditableSection>
    <EditableSection title="Branding">
      <EField label="Site Name" value={content.siteName} onChange={(v) => update({ siteName: v })} />
      <EField label="Tagline" value={content.siteTagline} onChange={(v) => update({ siteTagline: v })} />
      <EField label="CTA Title" value={content.ctaTitle} onChange={(v) => update({ ctaTitle: v })} />
      <EArea label="CTA Description" value={content.ctaDesc} onChange={(v) => update({ ctaDesc: v })} />
    </EditableSection>
  </div>;
}

function SettingsEditor({ content, update }: any) {
  return <div className="flex flex-col gap-1">
    <EditableSection title="Site Configuration">
      <p className="text-sm text-white/50 italic">These settings are saved to your browser's localStorage in this demo. In production they'll sync to your MySQL via the backend API.</p>
      <div className="mt-2 grid gap-4 sm:grid-cols-2">
        <EField label="Site Name" value={content.siteName} onChange={(v) => update({ siteName: v })} />
        <EField label="Site Tagline" value={content.siteTagline} onChange={(v) => update({ siteTagline: v })} />
        <EField label="Server IP" value={content.serverIp} onChange={(v) => update({ serverIp: v })} />
        <EField label="Discord Invite URL" value={content.discordLink} onChange={(v) => update({ discordLink: v })} />
      </div>
    </EditableSection>
    <EditableSection title="Danger Zone">
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <h3 className="font-serif text-lg text-white">Reset All Content</h3>
        <p className="mt-2 text-sm text-white/50">Resetting will restore all website content to defaults.</p>
        <button onClick={() => { window.localStorage.removeItem("gotham_city_site_content"); window.location.reload(); }}
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/10 transition">Reset All Content</button>
      </div>
    </EditableSection>
  </div>;
}
