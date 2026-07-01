import { useState, type FormEvent } from "react";
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { VitalRing } from "../components/VitalBar";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "characters", label: "Characters", icon: Gamepad2 },
  { id: "tickets", label: "Tickets", icon: TicketIcon },
  { id: "linked", label: "Linked Accounts", icon: Link2 },
  { id: "account", label: "Account", icon: UserCircle },
];

const statusColor: Record<string, string> = {
  Open: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  Pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  Closed: "border-white/15 bg-white/5 text-white/50",
};

export default function Dashboard() {
  const { user, tickets, characters, logout, linkDiscord, linkSteam, createTicket } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [linkingDiscord, setLinkingDiscord] = useState(false);
  const [linkingSteam, setLinkingSteam] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const onLinkDiscord = async () => {
    setLinkingDiscord(true);
    await linkDiscord();
    setLinkingDiscord(false);
  };
  const onLinkSteam = async () => {
    setLinkingSteam(true);
    await linkSteam();
    setLinkingSteam(false);
  };

  const openTickets = tickets.filter((t) => t.status !== "Closed").length;

  return (
    <div className="relative min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 lg:hidden">
          <h1 className="font-serif text-2xl text-white">Dashboard</h1>
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-600 to-violet-600 font-serif text-lg text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-serif text-base text-white">{user.username}</p>
                      <p className="truncate text-xs text-white/40">{user.role}</p>
                    </div>
                  </div>

                  <nav className="flex flex-col gap-1">
                    {TABS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTab(t.id);
                          setMobileNavOpen(false);
                        }}
                        className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                          tab === t.id
                            ? "bg-fuchsia-500/10 text-white"
                            : "text-white/55 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {tab === t.id && (
                          <motion.span
                            layoutId="dash-tab"
                            className="absolute left-0 h-6 w-[3px] rounded-full bg-gradient-to-b from-fuchsia-400 to-amber-300"
                          />
                        )}
                        <t.icon size={17} />
                        {t.label}
                      </button>
                    ))}
                  </nav>

                  <Link
                    to="/"
                    className="rounded-xl border border-white/10 px-3.5 py-2.5 text-center text-sm font-medium text-white/60 transition hover:border-white/20 hover:text-white"
                  >
                    ← Back to site
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                  >
                    <LogOut size={16} />
                    Log out
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
                {tab === "overview" && <Overview user={user} openTickets={openTickets} characters={characters} />}
                {tab === "characters" && <Characters characters={characters} steamLinked={user.steamLinked} onLinkSteam={onLinkSteam} linking={linkingSteam} />}
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
        onCreate={(subject, category) => {
          createTicket(subject, category);
          setTicketModalOpen(false);
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
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 font-serif text-2xl text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-white/40">{label}</p>
    </div>
  );
}

function Overview({ user, openTickets, characters }: { user: any; openTickets: number; characters: any[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-600/15 via-transparent to-violet-600/15 p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-fuchsia-300">
          Welcome back
        </p>
        <h2 className="mt-2 font-serif text-3xl text-white">{user.username}</h2>
        <p className="mt-2 max-w-lg text-sm text-white/55">
          Here's a snapshot of your A2 Studio account. Keep your identifiers linked
          to unlock in-game character syncing and faster support.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={user.banned ? ShieldAlert : ShieldCheck}
          label="Account Status"
          value={user.banned ? "Banned" : "Good Standing"}
          tone={user.banned ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"}
        />
        <StatCard icon={Link2} label="Linked Providers" value={`${(user.discordLinked ? 1 : 0) + (user.steamLinked ? 1 : 0)}/2`} tone="bg-violet-500/10 text-violet-300" />
        <StatCard icon={TicketIcon} label="Open Tickets" value={String(openTickets)} tone="bg-amber-500/10 text-amber-300" />
        <StatCard icon={Gamepad2} label="Characters" value={String(characters.length)} tone="bg-fuchsia-500/10 text-fuchsia-300" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="font-serif text-lg text-white">Account Timeline</h3>
        <div className="mt-4 flex flex-col gap-4">
          <TimelineRow label="Account created" value={user.joinDate} />
          <TimelineRow label="Discord linked" value={user.discordLinked ? "Connected" : "Not connected"} good={user.discordLinked} />
          <TimelineRow label="Steam linked" value={user.steamLinked ? "Connected" : "Not connected"} good={user.steamLinked} />
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-white/55">{label}</span>
      <span className={`text-sm font-medium ${good === false ? "text-white/40" : good ? "text-emerald-300" : "text-white/80"}`}>
        {value}
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
  if (!steamLinked) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-20 text-center">
        <Gamepad2 className="text-white/20" size={40} />
        <h3 className="mt-4 font-serif text-xl text-white">Link Steam to view characters</h3>
        <p className="mt-2 max-w-sm text-sm text-white/50">
          Connect your Steam account to sync your in-game QBCore characters, job,
          and balances directly to your dashboard.
        </p>
        <button
          onClick={onLinkSteam}
          disabled={linking}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:shadow-[0_0_25px_rgba(192,38,211,0.4)] disabled:opacity-70"
        >
          {linking ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
          {linking ? "Connecting..." : "Connect Steam"}
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
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-fuchsia-400/30"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <VitalRing icon={Heart} value={c.health ?? 100} tone="red" size={48} />
                <div>
                  <h3 className="font-serif text-lg text-white">{c.name}</h3>
                  <p className="text-xs uppercase tracking-wider text-white/40">{c.grade}</p>
                </div>
              </div>
              <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-200">
                {c.job}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-white/5 p-3">
                <Wallet size={14} className="mx-auto text-emerald-300" />
                <p className="mt-1.5 text-sm font-semibold text-white">${c.cash.toLocaleString()}</p>
                <p className="text-[10px] uppercase text-white/40">Cash</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <Landmark size={14} className="mx-auto text-violet-300" />
                <p className="mt-1.5 text-sm font-semibold text-white">${c.bank.toLocaleString()}</p>
                <p className="text-[10px] uppercase text-white/40">Bank</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <Clock size={14} className="mx-auto text-amber-300" />
                <p className="mt-1.5 text-sm font-semibold text-white">{c.playtime}</p>
                <p className="text-[10px] uppercase text-white/40">Playtime</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Link
        to="/characters"
        className="group flex items-center justify-between rounded-2xl border border-dashed border-fuchsia-400/25 bg-fuchsia-500/5 px-6 py-4 text-sm font-medium text-fuchsia-200 transition hover:border-fuchsia-400/50 hover:bg-fuchsia-500/10"
      >
        <span className="flex items-center gap-2">
          <Package size={16} /> View full health, armor & inventory details
        </span>
        <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
      </Link>
    </div>
  );
}

function Tickets({ tickets, onNewTicket }: { tickets: any[]; onNewTicket: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl text-white">Support Tickets</h3>
        <button
          onClick={onNewTicket}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-[0_0_20px_rgba(192,38,211,0.4)]"
        >
          <Plus size={16} /> New Ticket
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white/40">{t.id}</span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColor[t.status]}`}>
                  {t.status}
                </span>
              </div>
              <p className="mt-1.5 font-serif text-base text-white">{t.subject}</p>
              <p className="mt-0.5 text-xs text-white/40">{t.category} · Opened {t.createdAt}</p>
            </div>
            <p className="text-xs text-white/40">Last reply {t.lastReply}</p>
          </div>
        ))}
      </div>
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
  onCreate: (subject: string, category: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General Support");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    onCreate(subject, category);
    setSubject("");
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
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/50"
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
                <textarea
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  rows={4}
                  placeholder="Describe your issue..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-fuchsia-400/50"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 py-3 text-sm font-semibold text-white transition hover:shadow-[0_0_20px_rgba(192,38,211,0.4)]"
              >
                Submit Ticket
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
        desc="Required to sync your in-game QBCore characters and playtime."
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
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-fuchsia-400/40 disabled:opacity-70"
        >
          {linking ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
          {linking ? "Connecting..." : `Connect ${name}`}
        </button>
      )}
    </div>
  );
}

function Account({ user }: { user: any }) {
  return (
    <div className="flex flex-col gap-5">
      <h3 className="font-serif text-xl text-white">Account Details</h3>
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-2">
        <Field label="Username" value={user.username} />
        <Field label="Email Address" value={user.email} />
        <Field label="Member Since" value={user.joinDate} />
        <Field label="Role" value={user.role} />
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h4 className="font-serif text-base text-white">Danger Zone</h4>
        <p className="mt-1 text-sm text-white/45">
          Deleting your account is permanent and will remove your linked
          characters, tickets, and identifiers.
        </p>
        <button className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10">
          Delete Account
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
