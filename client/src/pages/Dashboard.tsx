import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UserCircle,
  Gamepad2,
  Ticket as TicketIcon,
  Link2,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Plus,
  X,
  Loader2,
  Wallet,
  Landmark,
  Clock,
  Menu,
  Heart,
  Package,
  ArrowUpRight,
  Briefcase,
  Search,
  Send,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import UserAvatar from "../components/UserAvatar";
import { api } from "../api/client";
import { VitalRing } from "../components/VitalBar";
import { useToast } from "../components/Toast";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "characters", label: "Characters", icon: Gamepad2 },
  { id: "applications", label: "Applications", icon: Briefcase },
  { id: "tickets", label: "Tickets", icon: TicketIcon },
  { id: "linked", label: "Linked Accounts", icon: Link2 },
  { id: "account", label: "Account", icon: UserCircle },
];

const statusColor: Record<string, string> = {
  Open: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  Pending: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  Closed: "border-white/15 bg-white/5 text-white/50",
};

export default function Dashboard() {
  const { user, tickets, characters, logout, linkDiscord, linkSteam, createTicket } = useAuth();
  const { t } = useLanguage();
  const { push } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [linkingDiscord, setLinkingDiscord] = useState(false);
  const [linkingSteam, setLinkingSteam] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setApplications([]);
      return;
    }
    let cancel = false;
    const loadApplications = async () => {
      setApplicationsLoading(true);
      try {
        const result = await api<{ applications: any[] }>("/api/player/career-applications");
        if (!cancel) setApplications(result.applications || []);
      } catch {
        if (!cancel) setApplications([]);
      } finally {
        if (!cancel) setApplicationsLoading(false);
      }
    };
    loadApplications();
    return () => { cancel = true; };
  }, [user?.id]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const onLinkDiscord = async () => {
    setLinkingDiscord(true);
    try {
      await linkDiscord();
    } catch (error: any) {
      window.alert(error?.message || t("Could not start Discord link. Please try again."));
    } finally {
      setLinkingDiscord(false);
    }
  };
  const onLinkSteam = async () => {
    setLinkingSteam(true);
    try {
      await linkSteam();
    } catch (error: any) {
      window.alert(error?.message || t("Could not start Steam link. Please try again."));
    } finally {
      setLinkingSteam(false);
    }
  };

  const openTickets = tickets.filter((t) => t.status !== "Closed").length;

  return (
    <div className="relative min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 lg:hidden">
          <h1 className="font-serif text-2xl text-white">{t("Dashboard")}</h1>
          <button
            onClick={() => setMobileNavOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white"
          >
            <Menu size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:mt-0 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <AnimatePresence>
            {(mobileNavOpen || true) && (
              <motion.aside
                initial={false}
                className={`${mobileNavOpen ? "block" : "hidden"} lg:block`}
              >
                <div className="sticky top-28 flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <UserAvatar src={user.avatarUrl} name={user.username} />
                    <div className="min-w-0">
                      <p className="truncate font-serif text-base text-white">{user.username}</p>
                      <p className="truncate text-xs text-white/40">{user.role}</p>
                    </div>
                  </div>

                  <nav className="flex flex-col gap-1">
                    {TABS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setTab(item.id);
                          setMobileNavOpen(false);
                        }}
                        className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                          tab === item.id
                            ? "bg-orange-500/10 text-white"
                            : "text-white/55 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {tab === item.id && (
                          <motion.span
                            layoutId="dash-tab"
                            className="absolute left-0 h-6 w-[3px] rounded-full bg-gradient-to-b from-orange-400 to-orange-300"
                          />
                        )}
                        <item.icon size={17} />
                        {t(item.label)}
                      </button>
                    ))}
                  </nav>

                  <Link
                    to="/"
                    className="rounded-xl border border-white/10 px-3.5 py-2.5 text-center text-sm font-medium text-white/60 transition hover:border-white/20 hover:text-white"
                  >
                    {t("Back to site")}
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                  >
                    <LogOut size={16} />
                    {t("Log out")}
                  </button>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {tab === "overview" && <Overview user={user} openTickets={openTickets} characters={characters} applications={applications} />}
                {tab === "characters" && <Characters characters={characters} steamLinked={user.steamLinked} onLinkSteam={onLinkSteam} linking={linkingSteam} />}
                {tab === "applications" && <Applications applications={applications} loading={applicationsLoading} />}
                {tab === "tickets" && (
                  <Tickets tickets={tickets} onNewTicket={() => setTicketModalOpen(true)} />
                )}
                {tab === "linked" && (
                  <LinkedAccounts
                    discordLinked={user.discordLinked}
                    steamLinked={user.steamLinked}
                    onLinkDiscord={onLinkDiscord}
                    onLinkSteam={onLinkSteam}
                    linkingDiscord={linkingDiscord}
                    linkingSteam={linkingSteam}
                  />
                )}
                {tab === "account" && <Account user={user} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <NewTicketModal
        open={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        onCreate={async (subject, category, message) => {
          try {
            await createTicket(subject, category, message);
            setTicketModalOpen(false);
            push({ kind: "success", message: t("Ticket created") });
          } catch (error: any) {
            push({ kind: "error", message: error?.message || t("Could not create ticket") });
            throw error;
          }
        }}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 font-serif text-2xl text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-white/40">{t(label)}</p>
    </div>
  );
}

function Overview({ user, openTickets, characters, applications }: { user: any; openTickets: number; characters: any[]; applications: any[] }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-orange-600/15 via-transparent to-orange-700/15 p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-300">
          {t("Welcome back")}
        </p>
        <h2 className="mt-2 font-serif text-3xl text-white">{user.username}</h2>
        <p className="mt-2 max-w-lg text-sm text-white/55">
          {t("Here's a snapshot of your Gotham City account. Keep your identifiers linked to unlock in-game character syncing and faster support.")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={user.banned ? ShieldAlert : ShieldCheck}
          label="Account Status"
          value={t(user.banned ? "Banned" : "Good Standing")}
          tone={user.banned ? "bg-orange-500/10 text-orange-300" : "bg-emerald-500/10 text-emerald-300"}
        />
        <StatCard icon={Link2} label="Linked Providers" value={`${(user.discordLinked ? 1 : 0) + (user.steamLinked ? 1 : 0)}/2`} tone="bg-orange-500/10 text-orange-300" />
        <StatCard icon={TicketIcon} label="Open Tickets" value={String(openTickets)} tone="bg-orange-500/10 text-orange-300" />
        <StatCard icon={Gamepad2} label="Characters" value={String(characters.length)} tone="bg-orange-500/10 text-orange-300" />
        <StatCard icon={Briefcase} label="Applications" value={String(applications.length)} tone="bg-orange-500/10 text-orange-300" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="font-serif text-lg text-white">{t("Account Timeline")}</h3>
        <div className="mt-4 flex flex-col gap-4">
          <TimelineRow label="Account created" value={user.joinDate} />
          <TimelineRow label="Discord linked" value={user.discordLinked ? "Connected" : "Not connected"} good={user.discordLinked} />
          <TimelineRow label="Steam linked" value={user.steamLinked ? "Connected" : "Not connected"} good={user.steamLinked} />
        </div>
      </div>
    </div>
  );
}

function applicationStatusLabel(status: string) {
  return status === "Denied without notify" ? "Under review" : status || "Pending";
}

function applicationStatusClass(status: string) {
  const label = applicationStatusLabel(status).toLowerCase();
  if (label === "approved") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  if (label === "denied" || label === "rejected") return "border-red-400/30 bg-red-400/10 text-red-300";
  if (label.includes("review")) return "border-orange-400/30 bg-orange-400/10 text-orange-300";
  return "border-white/15 bg-white/5 text-white/55";
}

function Applications({ applications, loading }: { applications: any[]; loading: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-serif text-xl text-white">{t("My Applications")}</h3>
        <Link
          to="/careers"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-[0_0_20px_rgba(96,81,155,0.4)]"
        >
          <Plus size={16} /> {t("Apply for a Role")}
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/55">
          <Loader2 size={16} className="animate-spin" /> {t("Loading applications...")}
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center text-sm text-white/45">
          {t("No applications submitted yet. Open the careers portal to apply for a position.")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {applications.map((application) => (
            <div key={application.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-white/35">{t(application.department || "Career Application")}</p>
                  <h4 className="mt-1 font-serif text-lg text-white">{t(application.job_title || application.job_id || "Position")}</h4>
                  <p className="mt-1 text-xs text-white/40">
                    {t("Submitted")} {application.created_at ? new Date(application.created_at).toLocaleDateString() : t("recently")}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${applicationStatusClass(application.status)}`}>
                  {t(applicationStatusLabel(application.status))}
                </span>
              </div>
              {application.public_notes?.length > 0 && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/35">{t("Staff Reply")}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-white/65">{application.public_notes[application.public_notes.length - 1].note}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineRow({ label, value, good }: { label: string; value: string; good?: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-white/55">{t(label)}</span>
      <span className={`text-sm font-medium ${good === false ? "text-white/40" : good ? "text-emerald-300" : "text-white/80"}`}>
        {t(value)}
      </span>
    </div>
  );
}

function Characters({
  characters,
  steamLinked,
  onLinkSteam,
  linking,
}: {
  characters: any[];
  steamLinked: boolean;
  onLinkSteam: () => void;
  linking: boolean;
}) {
  const { t, isArabic } = useLanguage();
  if (!steamLinked) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-20 text-center">
        <Gamepad2 className="text-white/20" size={40} />
        <h3 className="mt-4 font-serif text-xl text-white">{t("Link Steam to view characters")}</h3>
        <p className="mt-2 max-w-sm text-sm text-white/50">
          {t("Connect your Steam account to sync your in-game CFW characters, job, and balances directly to your dashboard.")}
        </p>
        <button
          onClick={onLinkSteam}
          disabled={linking}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 px-6 py-3 text-sm font-semibold text-white transition hover:shadow-[0_0_25px_rgba(96,81,155,0.4)] disabled:opacity-70"
        >
          {linking ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
          {linking ? t("Connecting...") : t("Connect Steam")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {characters.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-orange-400/30"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <VitalRing icon={Heart} value={c.health ?? 100} tone="red" size={48} />
                <div>
                  <h3 className="font-serif text-lg text-white">{c.name}</h3>
                  <p className="text-xs uppercase tracking-wider text-white/40">{t(c.grade)}</p>
                </div>
              </div>
              <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-200">
                {t(c.job)}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-white/5 p-3">
                <Wallet size={14} className="mx-auto text-emerald-300" />
                <p className="mt-1.5 text-sm font-semibold text-white">${c.cash.toLocaleString()}</p>
                <p className="text-[10px] uppercase text-white/40">{t("Cash")}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <Landmark size={14} className="mx-auto text-red-300" />
                <p className="mt-1.5 text-sm font-semibold text-white">${c.bank.toLocaleString()}</p>
                <p className="text-[10px] uppercase text-white/40">{t("Bank")}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <Clock size={14} className="mx-auto text-orange-300" />
                <p className="mt-1.5 text-sm font-semibold text-white">{c.playtime}</p>
                <p className="text-[10px] uppercase text-white/40">{t("Playtime")}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Link
        to="/characters"
        className="group flex items-center justify-between rounded-2xl border border-dashed border-orange-400/25 bg-orange-500/5 px-6 py-4 text-sm font-medium text-orange-200 transition hover:border-orange-400/50 hover:bg-orange-500/10"
      >
        <span className="flex items-center gap-2">
          <Package size={16} /> {t("View full health, armor & inventory details")}
        </span>
        <ArrowUpRight size={16} className={`transition-transform group-hover:-translate-y-1 ${isArabic ? "rotate-[-90deg] group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
      </Link>
    </div>
  );
}

function Tickets({ tickets, onNewTicket }: { tickets: any[]; onNewTicket: () => void }) {
  const { push } = useToast();
  const [selectedId, setSelectedId] = useState(tickets[0]?.id || "");
  const [detail, setDetail] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");
  const visibleTickets = tickets.filter((ticket) => `${ticket.subject} ${ticket.category} ${ticket.ticketNumber || ticket.id}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!selectedId && tickets[0]?.id) setSelectedId(tickets[0].id);
  }, [tickets, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    let cancel = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const r = await api<any>(`/api/player/tickets/${selectedId}`);
        if (!cancel) setDetail(r);
      } catch (e: any) {
        if (!cancel) {
          setDetail(null);
          setError(e?.message || "Could not load ticket.");
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    load();
    return () => { cancel = true; };
  }, [selectedId]);

  const submitReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    try {
      await api(`/api/player/tickets/${selectedId}/messages`, { method: "POST", body: { message: reply.trim() } });
      setReply("");
      const r = await api<any>(`/api/player/tickets/${selectedId}`);
      setDetail(r);
      push({ kind: "success", message: "Reply sent" });
    } catch (e: any) {
      setError(e?.message || "Could not send reply.");
      push({ kind: "error", message: e?.message || "Could not send reply." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl text-white">Support Tickets</h3>
        <button
          onClick={onNewTicket}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-[0_0_20px_rgba(96,81,155,0.4)]"
        >
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center text-sm text-white/45">
          No tickets yet. Open one and staff can reply here.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[330px_1fr]">
          <div className="flex flex-col gap-3">
            <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tickets" className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-orange-400/40" /></div>
            {visibleTickets.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedId(t.id)}
            className={`flex flex-col gap-3 rounded-2xl border p-5 text-left transition sm:flex-row sm:items-center sm:justify-between ${selectedId === t.id ? "border-orange-400/40 bg-orange-500/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white/40">{t.ticketNumber || t.id}</span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColor[t.status] || statusColor.Pending}`}>
                  {t.status}
                </span>
              </div>
              <p className="mt-1.5 font-serif text-base text-white">{t.subject}</p>
              <p className="mt-0.5 text-xs text-white/40">{t.category} · Opened {t.createdAt}</p>
            </div>
            <p className="text-xs text-white/40">Last reply {t.lastReply}</p>
          </button>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-white/50"><Loader2 size={16} className="animate-spin" /> Loading ticket...</div>
            ) : detail?.ticket ? (
              <div className="flex min-h-[420px] flex-col">
                <div>
                  <p className="text-xs font-mono text-white/35">{detail.ticket.ticket_number || detail.ticket.id}</p>
                  <h4 className="mt-1 font-serif text-lg text-white">{detail.ticket.subject}</h4>
                  <p className="mt-1 text-xs text-white/40">{detail.ticket.category} · {detail.ticket.status}</p>
                </div>
                <div className="mt-5 flex flex-1 flex-col gap-3">
                  {(detail.messages || []).map((message: any) => (
                    <div key={message.id} className={`max-w-[88%] ${message.author_type === "player" ? "self-end" : "self-start"}`}>
                      <div className="mb-1 flex items-center gap-2 px-1 text-[10px] text-white/35"><span>{message.author_type === "player" ? "You" : "Gotham Support"}</span><span>{message.created_at ? new Date(message.created_at).toLocaleString() : ""}</span></div>
                      <div className={`rounded-2xl border p-3 ${message.author_type === "player" ? "rounded-br-md border-orange-400/20 bg-orange-500/10" : "rounded-bl-md border-white/10 bg-black/25"}`}><p className="whitespace-pre-wrap break-words text-sm leading-6 text-white/75">{message.message}</p></div>
                      {message.author_type === "player" && <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${message.read_at ? "text-sky-400" : "text-white/30"}`}><CheckCheck size={12} /> {message.read_at ? "Seen" : "Sent"}</div>}
                    </div>
                  ))}
                </div>
                <form onSubmit={submitReply} className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-2.5 focus-within:border-orange-400/40">
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} rows={3} placeholder="Write a reply…" className="max-h-72 min-h-20 w-full resize-y bg-transparent px-2 py-1 text-sm leading-6 text-white outline-none placeholder:text-white/25" />
                  <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2"><span className="text-[11px] text-white/30">Enter to send · Shift + Enter for new line</span><button disabled={sending || !reply.trim()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                    {sending ? <Loader2 size={15} className="animate-spin" /> : null}
                    Send <Send size={14} />
                  </button></div>
                </form>
              </div>
            ) : (
              <p className="text-sm text-white/40">{error || "Select a ticket to view the conversation."}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NewTicketModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (subject: string, category: string, message: string) => Promise<void>;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("General Support");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      await onCreate(subject.trim(), category, message.trim());
      setSubject("");
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0710] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-white">Open a New Ticket</h3>
              <button onClick={onClose} className="text-white/40 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-orange-400/50"
                >
                  <option>General Support</option>
                  <option>Bug Report</option>
                  <option>Player Report</option>
                  <option>Billing</option>
                  <option>Ban Appeal</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">
                  Subject
                </label>
                <input
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Short title..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-orange-400/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">
                  Message
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  placeholder="Describe your issue..."
                  className="max-h-[50vh] min-h-48 w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white placeholder:text-white/25 outline-none focus:border-orange-400/50"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 py-3 text-sm font-semibold text-white transition hover:shadow-[0_0_20px_rgba(96,81,155,0.4)] disabled:opacity-70"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LinkedAccounts({
  discordLinked,
  steamLinked,
  onLinkDiscord,
  onLinkSteam,
  linkingDiscord,
  linkingSteam,
}: {
  discordLinked: boolean;
  steamLinked: boolean;
  onLinkDiscord: () => void;
  onLinkSteam: () => void;
  linkingDiscord: boolean;
  linkingSteam: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h3 className="font-serif text-xl text-white">Linked Accounts</h3>
      <ProviderCard
        name="Discord"
        desc="Required for community access, roles, and ticket notifications."
        linked={discordLinked}
        onLink={onLinkDiscord}
        linking={linkingDiscord}
        color="bg-[#5865F2]/15 text-[#8891FF] border-[#5865F2]/30"
      />
      <ProviderCard
        name="Steam"
        desc="Required to sync your in-game CFW characters and playtime."
        linked={steamLinked}
        onLink={onLinkSteam}
        linking={linkingSteam}
        color="bg-white/10 text-white border-white/20"
      />
    </div>
  );
}

function ProviderCard({
  name,
  desc,
  linked,
  onLink,
  linking,
  color,
}: {
  name: string;
  desc: string;
  linked: boolean;
  onLink: () => void;
  linking: boolean;
  color: string;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${color} font-serif text-lg`}>
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-serif text-base text-white">{name}</p>
          <p className="mt-0.5 max-w-sm text-xs text-white/45">{desc}</p>
        </div>
      </div>
      {linked ? (
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
          <ShieldCheck size={14} /> Connected
        </span>
      ) : (
        <button
          onClick={onLink}
          disabled={linking}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-orange-400/40 disabled:opacity-70"
        >
          {linking ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
          {linking ? "Connecting..." : `Connect ${name}`}
        </button>
      )}
    </div>
  );
}

function Account({ user }: { user: any }) {
  const { updateEmail } = useAuth();
  const { push } = useToast();
  const { t } = useLanguage();
  const [email, setEmail] = useState(user.email || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEmail(user.email || "");
  }, [user.email]);

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    try {
      await updateEmail(email.trim());
      push({ kind: "success", message: t("Email updated") });
    } catch (error: any) {
      push({ kind: "error", message: error?.message || t("Could not update email") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <h3 className="font-serif text-xl text-white">{t("Account Details")}</h3>
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-2">
        <Field label={t("Username")} value={user.username} />
        <Field label={t("Member Since")} value={user.joinDate} />
        <Field label={t("Role")} value={user.role} />
        <Field label={t("Email Address")} value={user.email || t("Not added yet")} />
      </div>
      <form onSubmit={submitEmail} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h4 className="font-serif text-base text-white">{t("Email Address")}</h4>
        <p className="mt-1 text-sm text-white/45">
          {t("Discord login only uses your Discord username. Add or change your email here manually.")}
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-orange-400/50"
          />
          <button
            type="submit"
            disabled={saving || !email.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            {saving ? t("Saving...") : t("Save Email")}
          </button>
        </div>
      </form>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h4 className="font-serif text-base text-white">{t("Danger Zone")}</h4>
        <p className="mt-1 text-sm text-white/45">
          {t("Deleting your account is permanent and will remove your linked characters, tickets, and identifiers.")}
        </p>
        <button className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10">
          {t("Delete Account")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1.5 text-sm text-white">{value}</p>
    </div>
  );
}
