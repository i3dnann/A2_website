import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wifi, WifiOff, Users, Activity, Radio, RefreshCw, Cloud } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { api, createLiveSubscriber, type LiveState, MOCK } from "../api/client";
import PageShell from "../components/PageShell";
import { Skeleton } from "../components/Toast";

const DEMO: LiveState = {
  players: [
    { id: 1, name: "NightWing_TV" }, { id: 2, name: "GothamKnight" },
    { id: 3, name: "Officer_Ross" }, { id: 4, name: "Viper_01" },
    { id: 5, name: "DocVoss" }, { id: 6, name: "MafiaDon" },
  ],
  count: 42,
  maxplayers: 100,
  status: "online",
  queue: 3,
  announcement: "Season 4: Gotham Nights is LIVE 🌙 — Join now via F8 with `connect play.a2studio.gg`",
  lastUpdate: Date.now(),
};

export default function LivePage() {
  const { content } = useSite();
  const [state, setState] = useState<LiveState | null>(MOCK ? DEMO : null);
  const [streamers, setStreamers] = useState<any[]>(content.streamers);
  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    const sub = createLiveSubscriber((s) => {
      setState(s);
      setConnecting(false);
    });
    // Give the WS a brief moment; if no response in 2s, still show connecting state
    const t = setTimeout(() => setConnecting(false), 2000);
    return () => { sub.stop(); clearTimeout(t); };
  }, []);

  useEffect(() => {
    if (MOCK) return;
    let cancel = false;
    const loadStreamers = async () => {
      try {
        const r = await api<{ streamers: any[] }>("/api/public/live");
        if (!cancel) setStreamers((r.streamers || []).map((s) => ({
          name: s.display_name || s.name || s.kick_username || s.twitch_username,
          platform: s.kick_username ? "Kick" : "Twitch",
          viewers: Number(s.viewer_count || 0),
          live: Boolean(s.is_live),
          game: s.stream_title || s.category || "Gotham City Roleplay",
          url: s.stream_url || (s.kick_username ? `https://kick.com/${s.kick_username}` : s.twitch_username ? `https://twitch.tv/${s.twitch_username}` : "")
        })));
      } catch {}
    };
    loadStreamers();
    const timer = window.setInterval(loadStreamers, 30_000);
    return () => { cancel = true; window.clearInterval(timer); };
  }, []);

  const online = state?.status === "online";
  const usage = state && state.maxplayers > 0 ? Math.min(100, (state.count / state.maxplayers) * 100) : 0;
  const lastUpdate = state?.lastUpdate ? new Date(state.lastUpdate).toLocaleTimeString() : "—";

  return (
    <PageShell subtitle={content.streamsSubtitle} title={content.streamsTitle}>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Server status card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-2xl border p-6 ${
            online ? "border-emerald-400/25 bg-emerald-500/5" : "border-red-400/25 bg-red-500/5"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                online ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-red-400/40 bg-red-400/10 text-red-200"
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${online ? "animate-ping bg-emerald-400" : "bg-red-400"}`} />
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-red-400"}`} />
                </span>
                {online ? "Server Online" : "Server Offline"}
              </div>
              <h3 className="mt-3 font-serif text-2xl text-white sm:text-3xl">Gotham City</h3>
              <p className="mt-1 text-sm text-white/55">Gotham City - QBCore Roleplay</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end text-xs text-white/40">
                <RefreshCw size={12} className={connecting ? "animate-spin" : ""} />
                {connecting ? "Connecting..." : `Updated ${lastUpdate}`}
              </div>
              <div className="mt-2 flex items-center justify-end gap-1 text-xs text-white/40">
                {online ? <Wifi size={12} className="text-emerald-300" /> : <WifiOff size={12} className="text-red-300" />}
                Live data (15s)
              </div>
            </div>
          </div>

          {connecting && !state ? (
            <div className="mt-6 flex flex-col gap-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="mt-4 h-3 w-full" />
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Stat icon={Users} label="Online" value={String(state?.count ?? 0)} accent="text-emerald-300" />
                <Stat icon={Activity} label="Max Players" value={String(state?.maxplayers ?? 0)} accent="text-orange-300" />
                <Stat icon={Cloud} label="Queue" value={String(state?.queue ?? 0)} accent="text-orange-300" />
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>Server capacity</span>
                  <span>{state?.count ?? 0} / {state?.maxplayers ?? 0}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${usage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            </>
          )}

        </motion.div>

        {/* Streamers */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base text-white">Live Streamers</h3>
              <Radio size={16} className="text-orange-300" />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {streamers.filter((s) => s.live).length === 0 && (
                <p className="text-sm text-white/40">No streamers are live right now.</p>
              )}
              {streamers.filter((s) => s.live).map((s) => (
                <a href={s.url || undefined} target="_blank" rel="noreferrer" key={s.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3 transition hover:border-orange-400/30">
                  <div>
                    <p className="font-serif text-sm text-white">{s.name}</p>
                    <p className="text-[11px] uppercase tracking-wider text-white/40">{s.platform} · {s.game}</p>
                  </div>
                  <span className="rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">● Live</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <Icon size={16} className={accent} />
      <p className={`mt-2 font-serif text-2xl ${accent}`}>{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wider text-white/40">{label}</p>
    </div>
  );
}
