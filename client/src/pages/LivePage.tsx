import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Cloud, Gauge, RefreshCw, Users, Wifi, WifiOff } from "lucide-react";
import { createLiveSubscriber, type LiveState } from "../api/client";
import PageShell from "../components/PageShell";
import { Skeleton } from "../components/Toast";
import { useSite } from "../context/SiteContext";

export default function LivePage() {
  const { content } = useSite();
  const [state, setState] = useState<LiveState | null>(null);
  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    const subscription = createLiveSubscriber((next) => {
      setState(next);
      setConnecting(false);
    });
    const timeout = window.setTimeout(() => setConnecting(false), 5000);
    return () => {
      subscription.stop();
      window.clearTimeout(timeout);
    };
  }, []);

  const online = state?.status === "online";
  const notConfigured = state?.status === "not_configured" || state?.configured === false;
  const usage = state && state.maxplayers > 0 ? Math.min(100, (state.count / state.maxplayers) * 100) : 0;
  const lastUpdate = state?.lastUpdate ? new Date(state.lastUpdate).toLocaleTimeString() : "Not available";

  return (
    <PageShell subtitle={content.streamsSubtitle} title={content.streamsTitle}>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 ${
          online
            ? "border-emerald-400/25 bg-emerald-500/5"
            : notConfigured
              ? "border-white/15 bg-white/[0.03]"
              : "border-red-400/25 bg-red-500/5"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
              online
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                : notConfigured
                  ? "border-white/15 bg-white/5 text-white/60"
                  : "border-red-400/40 bg-red-400/10 text-red-200"
            }`}>
              <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : notConfigured ? "bg-white/40" : "bg-red-400"}`} />
              {online ? "Server Online" : notConfigured ? "Server status not configured" : "Server Offline"}
            </div>
            <h2 className="mt-3 font-serif text-2xl text-white sm:text-3xl">{state?.serverName || "Gotham City"}</h2>
            <p className="mt-1 text-sm text-white/55">Gotham City - CFW Roleplay</p>
          </div>

          <div className="text-right text-xs text-white/45">
            <div className="flex items-center justify-end gap-2">
              <RefreshCw size={12} className={connecting ? "animate-spin" : ""} />
              {connecting ? "Connecting..." : `Updated ${lastUpdate}`}
            </div>
            <div className="mt-2 flex items-center justify-end gap-1">
              {online ? <Wifi size={12} className="text-emerald-300" /> : <WifiOff size={12} className={notConfigured ? "text-white/40" : "text-red-300"} />}
              Automatic refresh every 15 seconds
            </div>
          </div>
        </div>

        {connecting && !state ? (
          <div className="mt-6 flex flex-col gap-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat icon={Users} label="Online" value={notConfigured ? "N/A" : String(state?.count ?? 0)} accent="text-emerald-300" />
              <Stat icon={Activity} label="Max Players" value={notConfigured ? "N/A" : String(state?.maxplayers ?? 0)} accent="text-violet-300" />
              <Stat icon={Cloud} label="Queue" value={notConfigured ? "N/A" : String(state?.queue ?? 0)} accent="text-cyan-300" />
              <Stat icon={Gauge} label="Latency" value={state?.latency == null ? "N/A" : `${state.latency} ms`} accent="text-orange-300" />
            </div>

            {!notConfigured && (
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-white/45">
                  <span>Server capacity</span>
                  <span>{state?.count ?? 0} / {state?.maxplayers ?? 0}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#60519b] to-[#8a7ac4]"
                    initial={{ width: 0 }}
                    animate={{ width: `${usage}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {state?.error === "status_unavailable" && !notConfigured && (
              <p className="mt-4 text-sm text-red-200/80">The status service could not reach the FiveM endpoints.</p>
            )}
          </>
        )}
      </motion.section>
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
