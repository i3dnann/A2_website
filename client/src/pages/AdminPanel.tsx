import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Settings, Globe, Users, Clock, FileText, Briefcase, HelpCircle, Palette,
  Home, Menu, X, LogOut, Save, Trash2, Plus, Loader2, LayoutDashboard,
  CheckCircle2, XCircle, MessageCircle, Shield, AlertTriangle, TrendingUp,
  Server, Eye, ArrowUpRight, Ticket as TicketIcon, Star, Radio,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";
import { api, upload } from "../api/client";
import { useToast, Skeleton } from "../components/Toast";
import FileUpload from "../components/FileUpload";

const ADMIN_TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "home", label: "Homepage", icon: Home },
  { id: "partners", label: "Partners", icon: Globe },
  { id: "server", label: "Server / Features", icon: Globe },
  { id: "streamers", label: "Streamers", icon: Radio },
  { id: "roster", label: "Roster", icon: Users },
  { id: "famous", label: "Famous Chars", icon: Star },
  { id: "journey", label: "Journey", icon: Clock },
  { id: "news", label: "News", icon: FileText },
  { id: "careers", label: "Careers", icon: Briefcase },
  { id: "applications", label: "Applications", icon: CheckCircle2 },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "tickets", label: "Tickets", icon: TicketIcon },
  { id: "comments", label: "Comments", icon: MessageCircle },
  { id: "theme", label: "Theme & Brand", icon: Palette },
  { id: "terms", label: "Terms", icon: FileText },
  { id: "users", label: "Users", icon: Users },
  { id: "staff", label: "Staff & Roles", icon: Shield },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "logs", label: "Audit Logs", icon: Shield },
];

const stClass = "mb-1 text-xs font-semibold uppercase tracking-wider text-white/40";
const inpClass = "w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-orange-400/50 transition";
const USER_ROLE_OPTIONS = ["Player", "Support", "Moderator", "Admin", "Super Admin", "Master Admin"];
const FEATURE_ICON_OPTIONS = [
  { value: "ShieldHalf", label: "Shield" },
  { value: "Users", label: "Users" },
  { value: "Sparkles", label: "Sparkles" },
  { value: "Car", label: "Vehicle" },
  { value: "Landmark", label: "Landmark" },
  { value: "Gavel", label: "Law" },
  { value: "Siren", label: "Emergency" },
  { value: "Map", label: "Map" },
  { value: "Radio", label: "Radio" },
  { value: "Trophy", label: "Trophy" },
  { value: "Briefcase", label: "Career" },
  { value: "Newspaper", label: "News" },
];

type DashboardStats = {
  users: number; characters: number;
  news: { id: string; title: string; published_at: string }[];
  pendingComments: number;
  logs: { id: string; action: string; target: string | null; meta: any; created_at: string }[];
  live: any;
};

function normalizeDashboardStats(raw: any): DashboardStats {
  if (!raw?.cards) {
    return {
      users: raw?.users ?? 0,
      characters: raw?.characters ?? 0,
      news: raw?.news ?? [],
      pendingComments: raw?.pendingComments ?? 0,
      logs: raw?.logs ?? [],
      live: raw?.live ?? null,
    };
  }

  const cardValue = (label: string) => {
    const card = raw.cards.find((item: any) => String(item.label || "").toLowerCase() === label);
    return Number(card?.value || 0);
  };

  return {
    users: cardValue("roster members"),
    characters: 0,
    news: raw.recentNews || [],
    pendingComments: cardValue("open tickets") + cardValue("career applications"),
    logs: (raw.recentLogs || []).map((log: any) => ({
      id: log.id,
      action: log.action || "admin_action",
      target: log.target || log.target_id || log.targetType || null,
      meta: log.meta || log.meta_json || {},
      created_at: log.created_at || new Date().toISOString(),
    })),
    live: raw.live || null,
  };
}

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const { content, updateContent } = useSite();
  const { t } = useLanguage();
  const { push } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      try {
        const r = await api<any>("/api/admin/dashboard");
        if (!cancel) setStats(normalizeDashboardStats(r));
      } catch (e: any) {
        push({ kind: "error", message: e?.message || "Failed to load dashboard" });
      } finally { if (!cancel) setStatsLoading(false); }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => { cancel = true; clearInterval(t); };
  }, []);

  const handleLogout = () => { logout(); navigate("/"); };
  const handleSave = async () => {
    setSaving(true);
    try {
      await api("/api/admin/settings", { method: "PATCH", body: { siteContent: content } });
      push({ kind: "success", message: "All changes saved to the website" });
    } catch (error: any) {
      push({ kind: "error", message: error?.message || "Failed to save website changes" });
    } finally {
      setSaving(false);
    }
  };

  if (!user || (user.role !== "Master Admin" && user.role !== "Admin")) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 pt-28">
        <div className="text-center max-w-md">
          <AlertTriangle size={40} className="mx-auto text-orange-300" />
          <h1 className="mt-4 font-serif text-2xl text-white">{t("Access Denied")}</h1>
          <p className="mt-2 text-white/50">{t("You need admin permissions to view this page.")}</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80">← Back to site</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel relative min-h-screen pt-24 pb-10">
      <div className="w-full px-4 sm:px-6 2xl:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-white">{t("Admin Panel")}</h1>
            <p className="mt-1 text-sm text-white/45">
              Welcome back, <span className="text-orange-300">{user.username}</span> ·{" "}
              <span className="text-orange-200">{user.role}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(96,81,155,0.3)] hover:shadow-[0_0_25px_rgba(96,81,155,0.5)] transition disabled:opacity-70">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? t("Saving...") : t("Save All Changes")}
            </button>
            <Link to="/" className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:text-white flex items-center gap-2">
              <Eye size={14} /> {t("View Site")}
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 bg-[#080808]/95 backdrop-blur-xl p-6 flex flex-col lg:hidden">
              <button onClick={() => setSidebarOpen(false)} className="mb-4 self-end text-white/60 hover:text-white"><X size={20} /></button>
              <SidebarNav tab={tab} setTab={(id: string) => { setTab(id); setSidebarOpen(false); }} compact={false} />
              <button onClick={handleLogout} className="mt-4 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-400 hover:bg-red-500/10 transition">
                <LogOut size={16} /> {t("Logout")}
              </button>
            </div>
          )}

          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <motion.div
              onMouseEnter={() => setSidebarExpanded(true)}
              onMouseLeave={() => setSidebarExpanded(false)}
              animate={{ width: sidebarExpanded ? 268 : 78 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="sticky top-28 flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#08050d]/72 p-3 shadow-[0_18px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl"
            >
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#60519b]/25 text-[#cfc5ff]">
                  <Shield size={17} />
                </div>
                <motion.div animate={{ opacity: sidebarExpanded ? 1 : 0 }} className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">Command Center</p>
                  <p className="truncate text-[11px] text-white/40">{user.role}</p>
                </motion.div>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
                <SidebarNav tab={tab} setTab={setTab} compact={!sidebarExpanded} />
              </div>
              <button onClick={handleLogout} className={`mt-3 flex h-11 items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium text-white/55 transition hover:bg-red-500/10 hover:text-red-300 ${sidebarExpanded ? "justify-start" : "justify-center"}`}>
                <LogOut size={16} />
                <span className={`${sidebarExpanded ? "inline" : "sr-only"}`}>{t("Logout")}</span>
              </button>
            </motion.div>
          </aside>

          {/* Mobile tab selector */}
          <div className="lg:hidden">
            <button onClick={() => setSidebarOpen(true)} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
              <span className="flex items-center gap-2">
                {(() => { const activeTab = ADMIN_TABS.find((x) => x.id === tab); return activeTab ? <><activeTab.icon size={16} /> {t(activeTab.label)}</> : t("Select"); })()}
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
                {tab === "partners" && <ResourceAdmin title="Homepage Partners" resource="partners" blank={{ partner_name: "New Partner", logo_url: "", website_url: "", sort_order: 50, is_visible: true }} fields={["partner_name", "logo_url", "website_url", "sort_order", "is_visible"]} />}
                {tab === "server" && <ServerEditor content={content} update={updateContent} />}
                {tab === "streamers" && <ResourceAdmin title="Live Streamers" resource="streamers" blank={{ display_name: "New Streamer", profile_image_url: "", avatar_url: "", banner_url: "", bio: "", discord_username: "", character_name: "", category: "Gotham City Roleplay", twitch_username: "", kick_username: "", youtube_url: "", discord_url: "", is_featured: false, is_approved: true, is_hidden: false, sort_order: 50 }} fields={["display_name", "profile_image_url", "avatar_url", "banner_url", "bio", "discord_username", "character_name", "category", "twitch_username", "kick_username", "youtube_url", "discord_url", "is_featured", "is_approved", "is_hidden", "sort_order"]} />}
                {tab === "roster" && <ResourceAdmin title="Roster Members" resource="team" blank={{ name: "New Member", role_title: "Staff", category: "Staff", profile_image_url: "", banner_url: "", bio: "", discord_url: "", twitch_url: "", kick_url: "", youtube_url: "", instagram_url: "", x_url: "", sort_order: 50, is_visible: true }} fields={["name", "role_title", "category", "profile_image_url", "banner_url", "bio", "discord_url", "twitch_url", "kick_url", "youtube_url", "instagram_url", "x_url", "sort_order", "is_visible"]} />}
                {tab === "famous" && <ResourceAdmin title="Famous Characters" resource="famous" blank={{ character_name: "New Character", header: "", picture_url: "", bio: "", description: "", role_name: "", gang_business: "", social_links_json: "", is_featured: false, sort_order: 50, is_visible: true }} fields={["character_name", "header", "picture_url", "social_links_json", "bio", "description", "role_name", "gang_business", "is_featured", "sort_order", "is_visible"]} />}
                {tab === "journey" && <JourneyEditor content={content} update={updateContent} />}
                {tab === "news" && <NewsAdmin />}
                {tab === "careers" && <CareersAdmin />}
                {tab === "applications" && <ApplicationsAdmin />}
                {tab === "faq" && <FaqEditor content={content} update={updateContent} />}
                {tab === "tickets" && <TicketsAdmin />}
                {tab === "comments" && <CommentsAdmin />}
                {tab === "theme" && <ThemeEditor content={content} update={updateContent} />}
                {tab === "terms" && <ResourceAdmin title="Terms of Service" resource="terms" blank={{ title: "Terms of Service", content: "", version: "1.0.0", effective_date: new Date().toISOString().slice(0, 10), is_visible: true, sort_order: 1 }} fields={["title", "content", "version", "effective_date", "is_visible", "sort_order"]} />}
                {tab === "users" && <UsersAdmin />}
                {tab === "staff" && <StaffAdmin />}
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

function SidebarNav({ tab, setTab, compact = false }: any) {
  const { t } = useLanguage();
  return <>
    {ADMIN_TABS.map((item) => (
      <button key={item.id} onClick={() => setTab(item.id)}
        title={compact ? t(item.label) : undefined}
        className={`group flex h-11 items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium transition ${
          compact ? "justify-center" : "justify-start"
        } ${
          tab === item.id ? "bg-[#60519b]/22 text-[#d7ceff] shadow-[inset_0_0_0_1px_rgba(138,122,196,0.35)]" : "text-white/55 hover:bg-white/5 hover:text-white"
        }`}>
        <item.icon size={16} className="shrink-0" />
        <span className={`${compact ? "sr-only" : "truncate"}`}>{t(item.label)}</span>
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
    { label: "Server Status", value: stats?.live?.status === "online" ? `${stats.live.count}/${stats.live.maxplayers}` : "Offline", icon: Server, color: stats?.live?.status === "online" ? "text-emerald-300" : "text-red-300", trend: stats?.live?.status === "online" ? "Live now" : "Check status" },
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

function identityLabel(row: any, fallback = "Unknown user") {
  return row?.user_identity?.label || row?.author_identity?.label || row?.admin_identity?.label || row?.user_label || row?.author_label || row?.admin_label || row?.username || row?.author_name || fallback;
}

function identitySecondary(row: any) {
  return row?.user_identity?.secondary || row?.author_identity?.secondary || row?.admin_identity?.secondary || row?.user_secondary || "";
}

/* ─────────────────────────────────────────────────────────────── */
/* COMMENTS ADMIN */
/* ─────────────────────────────────────────────────────────────── */
function TicketsAdmin() {
  const { push, confirm } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [participant, setParticipant] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadRows = async () => {
    setLoading(true);
    try {
      const r = await api<{ rows: any[] }>("/api/admin/tickets", { params: { status: "all" } });
      setRows(r.rows || []);
      if (!selectedId && r.rows?.[0]?.id) setSelectedId(r.rows[0].id);
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to load tickets" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRows(); }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancel = false;
    const loadDetail = async () => {
      try {
        const r = await api<any>(`/api/admin/tickets/${selectedId}`);
        if (!cancel) setDetail(r);
      } catch (e: any) {
        if (!cancel) push({ kind: "error", message: e?.message || "Failed to load ticket" });
      }
    };
    loadDetail();
    return () => { cancel = true; };
  }, [selectedId]);

  const refreshDetail = async () => {
    if (!selectedId) return;
    const r = await api<any>(`/api/admin/tickets/${selectedId}`);
    setDetail(r);
    await loadRows();
  };

  const sendReply = async () => {
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    try {
      await api(`/api/admin/tickets/${selectedId}/reply`, { method: "POST", body: { message: reply.trim(), internal_only: false } });
      setReply("");
      await refreshDetail();
      push({ kind: "success", message: "Reply sent" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to reply" });
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    if (!selectedId) return;
    setSending(true);
    try {
      await api(`/api/admin/tickets/${selectedId}/close`, { method: "POST", body: {} });
      await refreshDetail();
      push({ kind: "success", message: "Ticket closed" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to close ticket" });
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedId) return;
    setSending(true);
    try {
      await api(`/api/admin/tickets/${selectedId}/status`, { method: "POST", body: { status } });
      await refreshDetail();
      push({ kind: "success", message: `Ticket set to ${status}` });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to update ticket" });
    } finally {
      setSending(false);
    }
  };

  const addNote = async () => {
    if (!selectedId || !note.trim()) return;
    setSending(true);
    try {
      await api(`/api/admin/tickets/${selectedId}/note`, { method: "POST", body: { note: note.trim() } });
      setNote("");
      await refreshDetail();
      push({ kind: "success", message: "Internal note added" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to add note" });
    } finally {
      setSending(false);
    }
  };

  const addParticipant = async () => {
    if (!selectedId || !participant.trim()) return;
    const value = participant.trim();
    const body = /^\d{15,22}$/.test(value) ? { discord_id: value } : { lookup: value };
    setSending(true);
    try {
      await api(`/api/admin/tickets/${selectedId}/participants`, { method: "POST", body });
      setParticipant("");
      await refreshDetail();
      push({ kind: "success", message: "User added to ticket" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to add user" });
    } finally {
      setSending(false);
    }
  };

  const removeParticipant = async (participantId: string) => {
    if (!selectedId) return;
    try {
      await api(`/api/admin/tickets/${selectedId}/participants/${participantId}`, { method: "DELETE" });
      await refreshDetail();
      push({ kind: "success", message: "User removed from ticket" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to remove user" });
    }
  };

  const deleteTicket = async () => {
    if (!selectedId) return;
    const ok = await confirm({ title: "Delete ticket?", message: "This removes the ticket from admin and player views.", confirmText: "Delete" });
    if (!ok) return;
    setSending(true);
    try {
      await api(`/api/admin/tickets/${selectedId}`, { method: "DELETE" });
      setSelectedId("");
      setDetail(null);
      await loadRows();
      push({ kind: "success", message: "Ticket deleted" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to delete ticket" });
    } finally {
      setSending(false);
    }
  };

  return (
    <EditableSection title="Support Tickets">
      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">No tickets found.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <div className="flex max-h-[650px] flex-col gap-2 overflow-auto pr-1">
            {rows.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedId(ticket.id)}
                className={`rounded-xl border p-4 text-left transition ${selectedId === ticket.id ? "border-orange-400/40 bg-orange-500/10" : "border-white/10 bg-black/20 hover:border-white/20"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-white/35">{ticket.ticket_number || ticket.id}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/55">{ticket.status || "Open"}</span>
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-semibold text-white">{ticket.subject}</p>
                <p className="mt-1 line-clamp-1 text-xs text-white/55">{identityLabel(ticket)}</p>
                <p className="mt-1 line-clamp-1 text-xs text-white/40">{ticket.category} · {ticket.message_preview || "No preview"}</p>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            {detail?.ticket ? (
              <div className="flex min-h-[580px] flex-col">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[11px] font-mono text-white/35">{detail.ticket.ticket_number || detail.ticket.id}</p>
                    <h3 className="mt-1 font-serif text-xl text-white">{detail.ticket.subject}</h3>
                    <p className="mt-2 text-sm font-semibold text-white/80">{identityLabel(detail.ticket)}</p>
                    {identitySecondary(detail.ticket) && <p className="mt-0.5 text-xs text-white/40">{identitySecondary(detail.ticket)}</p>}
                    <p className="mt-1 text-xs text-white/45">{detail.ticket.category} · {detail.ticket.status}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => updateStatus("Claimed")} disabled={sending} className="rounded-lg border border-emerald-400/30 bg-emerald-500/5 px-3 py-2 text-xs font-semibold text-emerald-300 disabled:opacity-60">Claim</button>
                    <button onClick={() => updateStatus("On Hold")} disabled={sending} className="rounded-lg border border-orange-400/30 bg-orange-500/5 px-3 py-2 text-xs font-semibold text-orange-300 disabled:opacity-60">Hold</button>
                    {String(detail.ticket.status).toLowerCase() === "closed" ? (
                      <button onClick={() => updateStatus("Open")} disabled={sending} className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 disabled:opacity-60">Reopen</button>
                    ) : (
                      <button onClick={closeTicket} disabled={sending} className="rounded-lg border border-red-400/30 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-300 disabled:opacity-60">Close</button>
                    )}
                    {String(detail.ticket.status).toLowerCase() === "closed" ? (
                      <button onClick={deleteTicket} disabled={sending} className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 disabled:opacity-60">Delete</button>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_260px]">
                  <div className="flex max-h-[460px] flex-col gap-3 overflow-auto">
                    {(detail.messages || []).map((message: any) => (
                      <div key={message.id} className={`max-w-[88%] rounded-2xl border p-3 ${message.author_type === "admin" ? "self-end border-orange-400/20 bg-orange-500/10" : "self-start border-white/10 bg-white/[0.03]"}`}>
                        <p className="text-[10px] uppercase tracking-wider text-white/35">{message.author_type === "admin" ? "Admin" : "Player"} - {identityLabel(message)}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-white/75">{message.message}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/35">Members</p>
                      <div className="mt-2 flex flex-col gap-2">
                        {(detail.participants || []).map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-black/25 px-2 py-1.5">
                            <span className="truncate text-xs text-white/65" title={identitySecondary(p)}>{identityLabel(p)}</span>
                            <button onClick={() => removeParticipant(p.id)} className="text-red-300 hover:text-red-200"><X size={12} /></button>
                          </div>
                        ))}
                        {(detail.participants || []).length === 0 && <p className="text-xs text-white/35">Only the owner can see it.</p>}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <input value={participant} onChange={(e) => setParticipant(e.target.value)} placeholder="Username / Discord / Steam" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-orange-400/50" />
                        <button onClick={addParticipant} disabled={sending || !participant.trim()} className="rounded-lg bg-orange-500/80 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Add</button>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/35">Internal Notes</p>
                      <div className="mt-2 max-h-36 overflow-auto">
                        {(detail.notes || []).map((n: any) => <p key={n.id} className="mb-2 rounded-lg bg-black/25 p-2 text-xs text-white/60">{n.note}</p>)}
                        {(detail.notes || []).length === 0 && <p className="text-xs text-white/35">No internal notes.</p>}
                      </div>
                      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Staff-only note..." className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-orange-400/50" />
                      <button onClick={addNote} disabled={sending || !note.trim()} className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 disabled:opacity-50">Add Note</button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Reply to player..." className="min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-orange-400/50" />
                  <button onClick={sendReply} disabled={sending || !reply.trim()} className="self-stretch rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 px-5 text-sm font-semibold text-white disabled:opacity-60">
                    {sending ? "Sending..." : "Reply"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/40">Select a ticket to read and reply.</p>
            )}
          </div>
        </div>
      )}
    </EditableSection>
  );
}

function CommentsAdmin() {
  const { push, confirm } = useToast();
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
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
                <p className="mt-1 text-[11px] text-white/35">User: {identityLabel(c)}{identitySecondary(c) ? ` - ${identitySecondary(c)}` : ""}</p>
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

function flagOn(value: any) {
  return value === true || value === 1 || value === "1";
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
      const r = await api<{ rows?: any[]; data?: any[] }>("/api/admin/news", { params: { limit: 100 } });
      setRows(r.rows || r.data || []);
    } catch (e: any) { push({ kind: "error", message: e?.message }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    const ok = await confirm({ title: "Delete news post?", message: "This action is permanent.", confirmText: "Delete" });
    if (!ok) return;
    try {
      await api(`/api/admin/news/${id}`, { method: "DELETE" });
      push({ kind: "success", message: "Post deleted" });
      load();
    } catch (e: any) { push({ kind: "error", message: e?.message }); }
  };

  return (
    <div className="flex flex-col gap-1">
      <EditableSection title="News Posts">
        <button onClick={() => setEditing({ id: null, title: "", excerpt: "", content: "", image_url: "", image: "", video_url: "", category: "Announcement", tags: "", pinned: false, active: true })}
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
  const [uploading, setUploading] = useState("");

  const setField = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));

  const uploadMedia = async (file: File | null | undefined, key: "image_url" | "video_url") => {
    if (!file) return;
    setUploading(key);
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await upload("/api/admin/uploads", body);
      setField(key, result.data?.url || "");
      if (key === "image_url") setField("image", result.data?.url || "");
      push({ kind: "success", message: key === "image_url" ? "Image uploaded" : "Video uploaded" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Upload failed" });
    } finally {
      setUploading("");
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        subtitle: form.subtitle || form.excerpt || "",
        image_url: form.image_url || form.image || "",
        video_url: form.video_url || "",
        status: form.active === 0 ? "Draft" : form.status || "Published",
        is_featured: form.pinned || form.is_featured ? 1 : 0,
        published_at: form.published_at || new Date().toISOString()
      };
      if (post.id) await api(`/api/admin/news/${post.id}`, { method: "PATCH", body: payload });
      else await api("/api/admin/news", { method: "POST", body: payload });
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
          <div><label className={stClass}>Title</label><input className={inpClass} value={form.title} onChange={(e) => setField("title", e.target.value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={stClass}>Category</label><input className={inpClass} value={form.category} onChange={(e) => setField("category", e.target.value)} /></div>
            <div><label className={stClass}>Tags (comma-separated)</label><input className={inpClass} value={form.tags} onChange={(e) => setField("tags", e.target.value)} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={stClass}>Image URL or upload</label>
              <input className={inpClass} value={form.image_url || form.image || ""} onChange={(e) => { setField("image_url", e.target.value); setField("image", e.target.value); }} />
              <div className="mt-2">
                <FileUpload
                  label="Upload image"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  uploading={uploading === "image_url"}
                  value={form.image_url || form.image || ""}
                  onFile={(file) => uploadMedia(file, "image_url")}
                />
              </div>
            </div>
            <div>
              <label className={stClass}>Video URL or upload</label>
              <input className={inpClass} value={form.video_url || ""} onChange={(e) => setField("video_url", e.target.value)} />
              <div className="mt-2">
                <FileUpload
                  label="Upload video"
                  accept="video/mp4,video/webm,video/quicktime"
                  uploading={uploading === "video_url"}
                  value={form.video_url || ""}
                  onFile={(file) => uploadMedia(file, "video_url")}
                />
              </div>
            </div>
          </div>
          {(form.image_url || form.image || form.video_url) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(form.image_url || form.image) && <img src={form.image_url || form.image} alt="" className="aspect-video w-full rounded-xl border border-white/10 object-cover" />}
              {form.video_url && <video src={form.video_url} controls preload="metadata" className="aspect-video w-full rounded-xl border border-white/10 bg-black object-contain" />}
            </div>
          )}
          <div><label className={stClass}>Excerpt</label><textarea className={`${inpClass} resize-none`} rows={2} value={form.excerpt || form.subtitle || ""} onChange={(e) => { setField("excerpt", e.target.value); setField("subtitle", e.target.value); }} /></div>
          <div><label className={stClass}>Content</label><textarea className={`${inpClass} resize-none`} rows={8} value={form.content} onChange={(e) => setField("content", e.target.value)} /></div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={Boolean(form.pinned || form.is_featured)} onChange={(e) => { setField("pinned", e.target.checked); setField("is_featured", e.target.checked ? 1 : 0); }} className="accent-orange-500" /> Pinned</label>
            <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={form.active !== 0 && form.status !== "Draft"} onChange={(e) => { setField("active", e.target.checked ? 1 : 0); setField("status", e.target.checked ? "Published" : "Draft"); }} className="accent-orange-500" /> Active</label>
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

function ApplicationsAdmin() {
  const { push, confirm } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [publicNote, setPublicNote] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRows = async () => {
    setLoading(true);
    try {
      const result = await api<{ rows: any[] }>("/api/admin/careerApplications", { params: { limit: 100 } });
      const nextRows = result.rows || [];
      setRows(nextRows);
      if (!selectedId && nextRows[0]?.id) setSelectedId(nextRows[0].id);
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to load applications" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRows(); }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancel = false;
    const loadDetail = async () => {
      try {
        const result = await api<any>(`/api/admin/career-applications/${selectedId}`);
        if (!cancel) setDetail(result);
      } catch (e: any) {
        if (!cancel) {
          setDetail(null);
          push({ kind: "error", message: e?.message || "Failed to load application" });
        }
      }
    };
    loadDetail();
    return () => { cancel = true; };
  }, [selectedId, rows.length]);

  const visibleRows = rows.filter((row) => filter === "all" || String(row.status || "Pending").toLowerCase() === filter.toLowerCase());

  const setStatus = async (status: string) => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await api(`/api/admin/career-applications/${selectedId}/status`, {
        method: "POST",
        body: { status, public_note: publicNote.trim(), private_note: privateNote.trim() },
      });
      setPublicNote("");
      setPrivateNote("");
      push({ kind: "success", message: `Application marked ${status}` });
      await loadRows();
      const result = await api<any>(`/api/admin/career-applications/${selectedId}`);
      setDetail(result);
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to update application" });
    } finally {
      setSaving(false);
    }
  };

  const deleteApplication = async () => {
    if (!selectedId || !detail?.application) return;
    const status = String(detail.application.status || "").toLowerCase();
    const canDelete = status === "approved" || status.includes("denied") || status === "closed" || status === "archived";
    if (!canDelete) {
      push({ kind: "error", message: "Approve, deny, or close the application before deleting it." });
      return;
    }
    const ok = await confirm({ title: "Delete application?", message: "This removes the application from admin and the player's dashboard.", confirmText: "Delete" });
    if (!ok) return;
    setSaving(true);
    try {
      await api(`/api/admin/career-applications/${selectedId}`, { method: "DELETE" });
      setRows((current) => current.filter((row) => row.id !== selectedId));
      setSelectedId("");
      setDetail(null);
      push({ kind: "success", message: "Application deleted" });
      await loadRows();
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to delete application" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditableSection title="Career Applications">
      <div className="flex flex-wrap items-center gap-2">
        {["all", "Pending", "Under review", "Approved", "Denied", "Denied without notify"].map((status) => (
          <FilterPill key={status} active={filter === status} onClick={() => setFilter(status)}>{status}</FilterPill>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">No career applications yet.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
          <div className="flex max-h-[680px] flex-col gap-2 overflow-auto pr-1">
            {visibleRows.map((application) => (
              <button
                key={application.id}
                onClick={() => setSelectedId(application.id)}
                className={`rounded-xl border p-4 text-left transition ${selectedId === application.id ? "border-orange-400/40 bg-orange-500/10" : "border-white/10 bg-black/20 hover:border-white/20"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="line-clamp-1 text-xs font-semibold text-white/55">{identityLabel(application)}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${adminApplicationStatusClass(application.status)}`}>
                    {application.status || "Pending"}
                  </span>
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-semibold text-white">{application.job_title || application.job_id || "Career position"}</p>
                <p className="mt-1 text-xs text-white/40">
                  Submitted {application.created_at ? new Date(application.created_at).toLocaleString() : "recently"}
                </p>
              </button>
            ))}
            {visibleRows.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/40">No applications match this filter.</p>}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            {detail?.application ? (
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-white/35">{detail.job?.department || detail.application.job_id}</p>
                    <h3 className="mt-1 font-serif text-xl text-white">{detail.job?.title || detail.application.job_id || "Application"}</h3>
                    <p className="mt-1 text-sm font-semibold text-white/75">{identityLabel(detail.application)}</p>
                    <p className="mt-1 text-xs text-white/45">
                      {identitySecondary(detail.application) || `${detail.application.discord_id || "No Discord"} - ${detail.application.steam_id || "No Steam"}`}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${adminApplicationStatusClass(detail.application.status)}`}>
                    {detail.application.status || "Pending"}
                  </span>
                </div>

                <div className="grid gap-3">
                  <h4 className="text-sm font-semibold text-white">Answers</h4>
                  {(detail.answers || []).length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/40">No answers saved for this application.</p>
                  ) : (detail.answers || []).map((answer: any) => (
                    <div key={answer.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-orange-200">{answer.question_snapshot || "Question"}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-white/75">{answer.answer_text || "No answer"}</p>
                    </div>
                  ))}
                </div>

                {(detail.notes || []).length > 0 && (
                  <div className="grid gap-2">
                    <h4 className="text-sm font-semibold text-white">Review Notes</h4>
                    {detail.notes.map((note: any) => (
                      <div key={note.id} className={`rounded-xl border p-3 ${Number(note.is_internal || 0) === 1 ? "border-orange-400/20 bg-orange-500/10" : "border-white/10 bg-white/[0.03]"}`}>
                        <p className="text-[10px] uppercase tracking-wider text-white/35">{Number(note.is_internal || 0) === 1 ? "Internal note" : "Public reply"}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-white/70">{note.note}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={stClass}>Public reply to applicant</label>
                    <textarea value={publicNote} onChange={(e) => setPublicNote(e.target.value)} rows={3} className={`${inpClass} resize-none`} placeholder="Optional visible message..." />
                  </div>
                  <div>
                    <label className={stClass}>Internal admin note</label>
                    <textarea value={privateNote} onChange={(e) => setPrivateNote(e.target.value)} rows={3} className={`${inpClass} resize-none`} placeholder="Optional staff-only note..." />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {["Under review", "Approved", "Denied", "Denied without notify"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatus(status)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/75 transition hover:border-orange-400/40 hover:text-white disabled:opacity-60"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : null}
                      {status}
                    </button>
                  ))}
                  <button
                    onClick={deleteApplication}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/15 disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/40">Select an application to review.</p>
            )}
          </div>
        </div>
      )}
    </EditableSection>
  );
}

function adminApplicationStatusClass(status: string) {
  const s = String(status || "Pending").toLowerCase();
  if (s === "approved") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  if (s.includes("denied") || s.includes("reject")) return "border-red-400/30 bg-red-400/10 text-red-300";
  if (s.includes("review")) return "border-orange-400/30 bg-orange-400/10 text-orange-300";
  return "border-white/15 bg-white/5 text-white/55";
}

function ResourceAdmin({ title, resource, fields, blank }: { title: string; resource: string; fields: string[]; blank: any }) {
  const { push, confirm } = useToast();
  const { t } = useLanguage();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const result = await api<{ rows: any[] }>(`/api/admin/${resource}`, { params: { limit: 100 } });
      setRows(result.rows || []);
    } catch (e: any) {
      push({ kind: "error", message: e?.message || `Failed to load ${title}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [resource]);

  const change = (index: number, patch: any) => setRows((current) => current.map((row, i) => i === index ? { ...row, ...patch } : row));

  const save = async (row: any) => {
    setSavingId(row.id || "new");
    try {
      const body = Object.fromEntries(fields.map((field) => {
        const value = row[field];
        if (field.startsWith("is_")) return [field, flagOn(value)];
        if (field === "sort_order") return [field, Number(value || 50)];
        return [field, value ?? ""];
      }));
      if (row.id) await api(`/api/admin/${resource}/${row.id}`, { method: "PATCH", body });
      else await api(`/api/admin/${resource}`, { method: "POST", body });
      push({ kind: "success", message: `${title} saved` });
      await load();
    } catch (e: any) {
      push({ kind: "error", message: e?.message || `Failed to save ${title}` });
    } finally {
      setSavingId("");
    }
  };

  const remove = async (row: any) => {
    const ok = await confirm({ title: `Delete ${title}?`, message: "This removes the record from the public website.", confirmText: "Delete" });
    if (!ok) return;
    try {
      if (row.id) await api(`/api/admin/${resource}/${row.id}`, { method: "DELETE" });
      setRows((current) => current.filter((item) => item !== row));
      push({ kind: "success", message: `${title} deleted` });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || `Failed to delete ${title}` });
    }
  };

  return (
    <EditableSection title={title}>
      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">{t("No records yet. Add one below.")}</p>
      ) : rows.map((row, index) => (
        <div key={row.id || index} className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            {fields.map((field) => (
              <FieldEditor key={field} field={field} value={row[field]} onChange={(value: any) => change(index, { [field]: value })} />
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => save(row)} disabled={Boolean(savingId)} className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">{savingId === (row.id || "new") && <Loader2 size={12} className="animate-spin" />} {t("Save")}</button>
            <button onClick={() => remove(row)} className="rounded-lg border border-red-400/30 bg-red-500/5 px-3 py-2 text-xs text-red-300"><Trash2 size={12} /></button>
          </div>
        </div>
      ))}
      <button onClick={() => setRows((current) => [...current, { ...blank }])}
        className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-2.5 text-sm text-white/60 hover:border-orange-400/40 hover:text-white transition"><Plus size={14} /> {t("Add Record")}</button>
    </EditableSection>
  );
}

const externalUrlFields = new Set([
  "discord_url",
  "twitch_url",
  "kick_url",
  "youtube_url",
  "tiktok_url",
  "instagram_url",
  "x_url",
  "website_url",
  "store_url",
  "social_url",
]);

function uploadAcceptForField(field: string) {
  if (field.includes("video")) return "video/mp4,video/webm,video/quicktime,video/x-m4v";
  if (field.includes("audio") || field.includes("sound")) return "audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,audio/flac";
  if (field.includes("file") || field.includes("document")) return "image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,application/pdf";
  if (field.includes("favicon")) return "image/png,image/jpeg,image/webp,image/gif,image/avif,image/x-icon";
  return "image/png,image/jpeg,image/webp,image/gif,image/avif";
}

function isUploadableUrlField(field: string) {
  if (externalUrlFields.has(field)) return false;
  if (!field.includes("url") && !field.toLowerCase().includes("image")) return false;
  return ["image", "picture", "photo", "avatar", "banner", "logo", "favicon", "video", "audio", "file", "document"].some((token) => field.includes(token));
}

function linksObjectFromSocialJson(value: any): Record<string, string> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return linksObjectFromSocialJson(JSON.parse(value));
    } catch {
      return value.trim() ? { profile: value.trim() } : {};
    }
  }
  if (Array.isArray(value)) {
    return value.reduce((acc, item) => ({ ...acc, ...linksObjectFromSocialJson(item) }), {});
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, raw]) => [key === "link" || key === "url" || key === "href" ? "profile" : key, String(raw || "").trim()])
        .filter(([, url]) => url)
    );
  }
  return {};
}

function socialJsonFromLinks(value: Record<string, string>) {
  const clean = Object.fromEntries(Object.entries(value).map(([key, url]) => [key, url.trim()]).filter(([, url]) => url));
  return Object.keys(clean).length ? JSON.stringify(clean) : "";
}

function FieldEditor({ field, value, onChange }: { field: string; value: any; onChange: (value: any) => void }) {
  const { t } = useLanguage();
  const { push } = useToast();
  const [uploading, setUploading] = useState(false);
  const label = field.replace(/_/g, " ");

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await upload("/api/admin/uploads", body);
      onChange(result.data?.url || "");
      push({ kind: "success", message: `${t(label)} uploaded` });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || `Failed to upload ${label}` });
    } finally {
      setUploading(false);
    }
  };

  if (field.startsWith("is_")) {
    return <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={flagOn(value)} onChange={(e) => onChange(e.target.checked)} className="accent-orange-500" /> {t(label)}</label>;
  }
  if (field.includes("bio") || field.includes("description") || field === "content") {
    return <div className={field === "content" ? "md:col-span-2" : ""}><label className={stClass}>{t(label)}</label><textarea className={`${inpClass} resize-none`} rows={field === "content" ? 10 : 3} value={value || ""} onChange={(e) => onChange(e.target.value)} /></div>;
  }
  if (field === "social_links_json") {
    const links = linksObjectFromSocialJson(value);
    const setLink = (key: string, url: string) => onChange(socialJsonFromLinks({ ...links, [key]: url }));
    return (
      <div className="md:col-span-2">
        <label className={stClass}>{t("Character links")}</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["profile", "Profile link"],
            ["discord", "Discord link"],
            ["twitch", "Twitch link"],
            ["youtube", "YouTube link"],
            ["instagram", "Instagram link"],
            ["x", "X link"],
          ].map(([key, linkLabel]) => (
            <input key={key} className={inpClass} type="text" value={links[key] || ""} onChange={(e) => setLink(key, e.target.value)} placeholder={t(linkLabel)} />
          ))}
        </div>
      </div>
    );
  }
  const uploadable = isUploadableUrlField(field);
  return (
    <div className={uploadable ? "md:col-span-2" : ""}>
      <label className={stClass}>{t(label)}</label>
      <input className={inpClass} type={field === "sort_order" ? "number" : field.includes("date") ? "date" : "text"} value={value || ""} onChange={(e) => onChange(e.target.value)} />
      {uploadable && (
        <div className="mt-2">
          <FileUpload
            label={`Upload ${t(label)}`}
            accept={uploadAcceptForField(field)}
            uploading={uploading}
            value={value || ""}
            onFile={handleUpload}
          />
        </div>
      )}
    </div>
  );
}

function CareersAdmin() {
  return (
    <div className="flex flex-col gap-1">
      <ResourceAdmin
        title="Career Positions"
        resource="careerJobs"
        blank={{ title: "New Position", department: "Department", description: "", image_url: "", is_open: true, requirements: "", sort_order: 50, is_visible: true }}
        fields={["title", "department", "description", "image_url", "is_open", "requirements", "sort_order", "is_visible"]}
      />
      <ResourceAdmin
        title="Application Sections"
        resource="careerSections"
        blank={{ job_id: "", title: "Application Section", description: "", sort_order: 50, is_visible: true }}
        fields={["job_id", "title", "description", "sort_order", "is_visible"]}
      />
      <ResourceAdmin
        title="Application Questions"
        resource="careerQuestions"
        blank={{ job_id: "", section_id: "", question: "New question", help_text: "", question_type: "long_text", options_json: "[]", is_required: true, sort_order: 50, is_visible: true }}
        fields={["job_id", "section_id", "question", "help_text", "question_type", "options_json", "is_required", "sort_order", "is_visible"]}
      />
    </div>
  );
}

function UsersAdmin() {
  const { push, confirm } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [roles, setRoles] = useState<string[]>(USER_ROLE_OPTIONS);
  const [q, setQ] = useState("");
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const result = await api<{ rows: any[] }>("/api/admin/users", { params: { q, limit: 200 } });
      setRows(result.rows || []);
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to load users" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api<{ roles: string[] }>("/api/admin/permissions")
      .then((result) => setRoles(result.roles?.length ? result.roles : USER_ROLE_OPTIONS))
      .catch(() => setRoles(USER_ROLE_OPTIONS));
  }, []);

  const setUserStatus = async (user: any, active: boolean) => {
    try {
      await api(`/api/admin/users/${user.id}/${active ? "activate" : "deactivate"}`, { method: "POST", body: {} });
      await load();
      push({ kind: "success", message: active ? "User enabled" : "User disabled" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to update user" });
    }
  };

  const resetPassword = async (user: any) => {
    const password = passwords[user.id] || "";
    if (password.length < 8) {
      push({ kind: "error", message: "Password must be at least 8 characters." });
      return;
    }
    try {
      await api(`/api/admin/users/${user.id}/password`, { method: "POST", body: { password } });
      setPasswords((current) => ({ ...current, [user.id]: "" }));
      push({ kind: "success", message: "Password reset and hashed" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to reset password" });
    }
  };

  const saveUserRole = async (user: any) => {
    const nextRole = user.roles?.[0] || "Player";
    try {
      await api(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: {
          username: user.username,
          email: user.email,
          discord_id: user.discord_id,
          steam_id: user.steam_id,
          roles: [nextRole],
        },
      });
      await load();
      push({ kind: "success", message: "User role updated" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to update user role" });
    }
  };

  const deleteUser = async (user: any) => {
    const ok = await confirm({
      title: "Delete user?",
      message: `This disables ${user.username || user.email || "this user"} and removes their website access.`,
      confirmText: "Delete",
    });
    if (!ok) return;
    try {
      await api(`/api/admin/users/${user.id}`, { method: "DELETE" });
      await load();
      push({ kind: "success", message: "User deleted" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to delete user" });
    }
  };

  return (
    <EditableSection title="Website Users">
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users, Discord, Steam..." className={inpClass} />
        <button onClick={load} className="rounded-lg border border-white/10 px-4 text-sm text-white/70">Search</button>
      </div>
      {loading ? <Skeleton className="h-28" /> : (
        <div className="flex flex-col gap-2">
          {rows.map((user) => (
            <div key={user.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{user.username || user.email || user.id}</p>
                  <p className="mt-1 text-xs text-white/40">{user.email || "No email"} - Discord {user.discord_id || "not linked"} - Steam {user.steam_id || "not linked"}</p>
                  <p className="mt-1 text-xs text-white/35">Roles: {(user.roles || []).join(", ") || "Player"} - Created {user.created_at ? new Date(user.created_at).toLocaleDateString() : "unknown"}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setUserStatus(user, true)} className="rounded-lg border border-emerald-400/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300">Enable</button>
                  <button onClick={() => setUserStatus(user, false)} className="rounded-lg border border-red-400/30 bg-red-500/5 px-3 py-2 text-xs text-red-300">Disable</button>
                  <button onClick={() => deleteUser(user)} className="rounded-lg border border-red-400/30 bg-red-500/5 px-3 py-2 text-xs text-red-300"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,220px)_auto_minmax(0,260px)_auto]">
                <select
                  className={inpClass}
                  value={user.roles?.[0] || "Player"}
                  onChange={(e) => setRows((current) => current.map((row) => row.id === user.id ? { ...row, roles: [e.target.value] } : row))}
                >
                  {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
                <button onClick={() => saveUserRole(user)} className="rounded-lg border border-[#8a7ac4]/40 bg-[#60519b]/15 px-3 py-2 text-xs font-semibold text-[#d7ceff]">Save Role</button>
                <input type="password" value={passwords[user.id] || ""} onChange={(e) => setPasswords((current) => ({ ...current, [user.id]: e.target.value }))} placeholder="New password" className={`${inpClass} sm:max-w-xs`} />
                <button onClick={() => resetPassword(user)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70">Reset Password</button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">No users found.</p>}
        </div>
      )}
    </EditableSection>
  );
}

function StaffAdmin() {
  const { push, confirm } = useToast();
  const [admins, setAdmins] = useState<any[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [draft, setDraft] = useState<any>({ username: "", email: "", discord_id: "", roles: ["Admin"], permissions: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [adminResult, permissionResult] = await Promise.all([
        api<{ rows: any[] }>("/api/admin/admins", { params: { limit: 200 } }),
        api<{ roles: string[]; permissions: string[]; defaults: Record<string, string[]> }>("/api/admin/permissions"),
      ]);
      setAdmins(adminResult.rows || []);
      setRoles(permissionResult.roles || []);
      setPermissions(permissionResult.permissions || []);
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to load staff" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveAdmin = async (admin: any) => {
    try {
      const body = { ...admin, roles: Array.isArray(admin.roles) ? admin.roles : [admin.roles].filter(Boolean), permissions: admin.permissions || [] };
      if (admin.id) await api(`/api/admin/admins/${admin.id}`, { method: "PATCH", body });
      else await api("/api/admin/admins", { method: "POST", body });
      setDraft({ username: "", email: "", discord_id: "", roles: ["Admin"], permissions: [] });
      await load();
      push({ kind: "success", message: "Staff permissions saved" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to save staff" });
    }
  };

  const togglePermission = (admin: any, permission: string, index?: number) => {
    const current = new Set(admin.permissions || []);
    current.has(permission) ? current.delete(permission) : current.add(permission);
    if (typeof index === "number") setAdmins((rows) => rows.map((row, i) => i === index ? { ...row, permissions: [...current] } : row));
    else setDraft((row: any) => ({ ...row, permissions: [...current] }));
  };

  const deleteAdmin = async (admin: any) => {
    const ok = await confirm({
      title: "Delete admin?",
      message: `This disables ${admin.username || admin.email || "this admin"} and removes their admin access.`,
      confirmText: "Delete",
    });
    if (!ok) return;
    try {
      await api(`/api/admin/admins/${admin.id}`, { method: "DELETE" });
      await load();
      push({ kind: "success", message: "Admin deleted" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to delete admin" });
    }
  };

  return (
    <EditableSection title="Staff & Permissions">
      {loading ? <Skeleton className="h-28" /> : (
        <>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h4 className="font-serif text-base text-white">Add Staff</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <input className={inpClass} value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} placeholder="Username" />
              <input className={inpClass} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email optional" />
              <input className={inpClass} value={draft.discord_id} onChange={(e) => setDraft({ ...draft, discord_id: e.target.value })} placeholder="Discord ID" />
              <select className={inpClass} value={draft.roles?.[0] || "Admin"} onChange={(e) => setDraft({ ...draft, roles: [e.target.value] })}>{roles.map((role) => <option key={role}>{role}</option>)}</select>
            </div>
            <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-auto">
              {permissions.map((permission) => <label key={permission} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60"><input type="checkbox" checked={(draft.permissions || []).includes(permission)} onChange={() => togglePermission(draft, permission)} className="mr-1 accent-orange-500" />{permission}</label>)}
            </div>
            <button onClick={() => saveAdmin(draft)} className="mt-3 rounded-lg bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-2 text-xs font-semibold text-white">Add Staff</button>
          </div>
          <div className="flex flex-col gap-2">
            {admins.map((admin, index) => (
              <div key={admin.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <input className={inpClass} value={admin.username || ""} onChange={(e) => setAdmins((rows) => rows.map((row, i) => i === index ? { ...row, username: e.target.value } : row))} />
                  <input className={inpClass} value={admin.email || ""} onChange={(e) => setAdmins((rows) => rows.map((row, i) => i === index ? { ...row, email: e.target.value } : row))} />
                  <input className={inpClass} value={admin.discord_id || ""} onChange={(e) => setAdmins((rows) => rows.map((row, i) => i === index ? { ...row, discord_id: e.target.value } : row))} />
                  <select className={inpClass} value={admin.roles?.[0] || "Admin"} onChange={(e) => setAdmins((rows) => rows.map((row, i) => i === index ? { ...row, roles: [e.target.value] } : row))}>{roles.map((role) => <option key={role}>{role}</option>)}</select>
                </div>
                <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-auto">
                  {permissions.map((permission) => <label key={permission} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60"><input type="checkbox" checked={(admin.permissions || []).includes(permission)} onChange={() => togglePermission(admin, permission, index)} className="mr-1 accent-orange-500" />{permission}</label>)}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => saveAdmin(admin)} className="rounded-lg bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-2 text-xs font-semibold text-white">Save Staff</button>
                  <button onClick={() => deleteAdmin(admin)} className="inline-flex items-center gap-1 rounded-lg border border-red-400/30 bg-red-500/5 px-4 py-2 text-xs font-semibold text-red-300"><Trash2 size={13} /> Delete Admin</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </EditableSection>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Reusable primitives */
/* ─────────────────────────────────────────────────────────────── */
function EditableSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useLanguage();
  return <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 mb-5">
    <h3 className="mb-4 font-serif text-base text-white">{t(title)}</h3>
    <div className="flex flex-col gap-3">{children}</div>
  </div>;
}
function EField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { t } = useLanguage();
  return <div><label className={stClass}>{t(label)}</label><input className={inpClass} value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}
function EArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { t } = useLanguage();
  return <div><label className={stClass}>{t(label)}</label><textarea className={`${inpClass} resize-none`} rows={2} value={value} onChange={(e) => onChange(e.target.value)} /></div>;
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
    <EditableSection title="Sticky Banner">
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input
          type="checkbox"
          checked={Boolean(content.stickyBannerEnabled)}
          onChange={(e) => update({ stickyBannerEnabled: e.target.checked })}
          className="accent-orange-500"
        />
        Enable sticky banner on the website
      </label>
      <EField label="Banner Text" value={content.stickyBannerText || ""} onChange={(v) => update({ stickyBannerText: v })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <EField label="Banner Link" value={content.stickyBannerLink || ""} onChange={(v) => update({ stickyBannerLink: v })} />
        <EField label="Button Label" value={content.stickyBannerButton || ""} onChange={(v) => update({ stickyBannerButton: v })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={stClass}>Banner Background Color</label>
          <div className="flex items-center gap-3">
            <input className={`${inpClass} flex-1`} value={content.stickyBannerColor || "#60519b"} onChange={(e) => update({ stickyBannerColor: e.target.value })} />
            <input type="color" value={content.stickyBannerColor || "#60519b"} onChange={(e) => update({ stickyBannerColor: e.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-black/30 p-1" />
          </div>
        </div>
        <div>
          <label className={stClass}>Banner Text Color</label>
          <div className="flex items-center gap-3">
            <input className={`${inpClass} flex-1`} value={content.stickyBannerTextColor || "#ffffff"} onChange={(e) => update({ stickyBannerTextColor: e.target.value })} />
            <input type="color" value={content.stickyBannerTextColor || "#ffffff"} onChange={(e) => update({ stickyBannerTextColor: e.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-black/30 p-1" />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-white/10 px-4 py-2 text-center text-sm font-semibold" style={{ background: content.stickyBannerColor || "#60519b", color: content.stickyBannerTextColor || "#ffffff" }}>
        {content.stickyBannerText || "Sticky banner preview"}
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
            <select className={inpClass} value={f.icon} onChange={(e) => { const n = [...content.features]; n[i] = { ...n[i], icon: e.target.value }; update({ features: n }); }}>
              {FEATURE_ICON_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
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
      <EField label="CTA Background Image URL" value={content.ctaBackgroundImage || ""} onChange={(v) => update({ ctaBackgroundImage: v })} />
      <EArea label="CTA Description" value={content.ctaDesc} onChange={(v) => update({ ctaDesc: v })} />
    </EditableSection>
  </div>;
}

function SettingsEditor({ content, update }: any) {
  const { push, confirm } = useToast();
  const [settings, setSettings] = useState<any>({
    websiteName: content.siteName,
    siteTagline: content.siteTagline,
    logoUrl: "",
    faviconUrl: "",
    heroBackgroundImage: "",
    heroTitle: content.siteName,
    heroSubtitle: content.siteTagline,
    heroDescription: content.heroDescription,
    heroPrimaryButtonLink: content.discordLink,
    heroSecondaryButtonLink: content.fivemLink,
    storeButtonLink: content.storeLink,
    maintenanceMode: content.maintenanceMode,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState("");

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      try {
        const result = await api<{ settings: any }>("/api/admin/settings");
        if (!cancel) setSettings((current: any) => ({ ...current, ...(result.settings || {}) }));
      } catch (e: any) {
        push({ kind: "error", message: e?.message || "Failed to load settings" });
      }
    };
    load();
    return () => { cancel = true; };
  }, []);

  const change = (key: string, value: any) => setSettings((current: any) => ({ ...current, [key]: value }));

  const uploadAsset = async (file: File, key: "logoUrl" | "faviconUrl" | "heroBackgroundImage") => {
    setUploadingAsset(key);
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await upload("/api/admin/uploads", body);
      change(key, result.data?.url || "");
      push({ kind: "success", message: "File uploaded" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Upload failed" });
    } finally {
      setUploadingAsset("");
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api("/api/admin/settings", { method: "PATCH", body: settings });
      update({
        siteName: settings.websiteName || content.siteName,
        siteTagline: settings.heroSubtitle || settings.siteTagline || content.siteTagline,
        heroDescription: settings.heroDescription || content.heroDescription,
        heroBackgroundImage: settings.heroBackgroundImage || content.heroBackgroundImage,
        logoUrl: settings.logoUrl || content.logoUrl,
        discordLink: settings.heroPrimaryButtonLink || content.discordLink,
        fivemLink: settings.heroSecondaryButtonLink || content.fivemLink,
        storeLink: settings.storeButtonLink || content.storeLink,
        maintenanceMode: Boolean(settings.maintenanceMode),
      });
      push({ kind: "success", message: "Site settings saved" });
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const clearSavedContent = async () => {
    const ok = await confirm({
      title: "Clear saved content?",
      message: "This clears backend-saved page content. Real database records such as news, careers, tickets, and users are not deleted.",
      confirmText: "Clear",
    });
    if (!ok) return;
    setSaving(true);
    try {
      await api("/api/admin/settings", { method: "PATCH", body: { siteContent: {} } });
      push({ kind: "success", message: "Saved page content cleared" });
      window.location.reload();
    } catch (e: any) {
      push({ kind: "error", message: e?.message || "Failed to clear saved content" });
    } finally {
      setSaving(false);
    }
  };

  return <div className="flex flex-col gap-1">
    <EditableSection title="Site Configuration">
      <p className="text-sm text-white/50">These settings are saved through the backend and loaded by the public site.</p>
      <div className="mt-2 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2 flex items-center justify-between gap-5 rounded-xl border border-orange-400/20 bg-orange-400/5 p-4">
          <span><span className="block text-sm font-semibold text-white">Maintenance mode</span><span className="mt-1 block text-xs text-white/50">Blocks every public page. Only administrators can log in and browse the website.</span></span>
          <button type="button" role="switch" aria-checked={Boolean(settings.maintenanceMode)} onClick={() => change("maintenanceMode", !settings.maintenanceMode)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${settings.maintenanceMode ? "bg-orange-500" : "bg-white/15"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.maintenanceMode ? "translate-x-6" : "translate-x-1"}`} /></button>
        </label>
        <EField label="Website Name" value={settings.websiteName || ""} onChange={(v) => change("websiteName", v)} />
        <EField label="Hero Subtitle" value={settings.heroSubtitle || ""} onChange={(v) => change("heroSubtitle", v)} />
        <div>
          <EField label="Website Logo URL" value={settings.logoUrl || ""} onChange={(v) => change("logoUrl", v)} />
          <div className="mt-2"><FileUpload label="Upload logo" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/x-icon" uploading={uploadingAsset === "logoUrl"} value={settings.logoUrl || ""} onFile={(file) => uploadAsset(file, "logoUrl")} /></div>
        </div>
        <div>
          <EField label="Favicon URL" value={settings.faviconUrl || ""} onChange={(v) => change("faviconUrl", v)} />
          <div className="mt-2"><FileUpload label="Upload favicon" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/x-icon" uploading={uploadingAsset === "faviconUrl"} value={settings.faviconUrl || ""} onFile={(file) => uploadAsset(file, "faviconUrl")} /></div>
        </div>
        <div className="sm:col-span-2">
          <EField label="Hero Background URL" value={settings.heroBackgroundImage || ""} onChange={(v) => change("heroBackgroundImage", v)} />
          <div className="mt-2"><FileUpload label="Upload hero background" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" uploading={uploadingAsset === "heroBackgroundImage"} value={settings.heroBackgroundImage || ""} onFile={(file) => uploadAsset(file, "heroBackgroundImage")} /></div>
        </div>
        <EField label="Join Discord Link" value={settings.heroPrimaryButtonLink || ""} onChange={(v) => change("heroPrimaryButtonLink", v)} />
        <EField label="FiveM Connect Link" value={settings.heroSecondaryButtonLink || ""} onChange={(v) => change("heroSecondaryButtonLink", v)} />
        <EField label="Store Link" value={settings.storeButtonLink || ""} onChange={(v) => change("storeButtonLink", v)} />
        <div className="sm:col-span-2">
          <EArea label="Hero Description" value={settings.heroDescription || ""} onChange={(v) => change("heroDescription", v)} />
        </div>
      </div>
      <button onClick={save} disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Settings
      </button>
    </EditableSection>
    <EditableSection title="Danger Zone">
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <h3 className="font-serif text-lg text-white">Clear Saved Page Content</h3>
        <p className="mt-2 text-sm text-white/50">This removes backend-saved homepage/theme text only. Database content stays untouched.</p>
        <button onClick={clearSavedContent} disabled={saving}
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/10 transition disabled:opacity-60">Clear Saved Content</button>
      </div>
    </EditableSection>
  </div>;
}
