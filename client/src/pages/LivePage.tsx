import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Cloud, ExternalLink, Gauge, Radio, RefreshCw, Users, Wifi, WifiOff } from "lucide-react";
import { api, createLiveSubscriber, type LiveState } from "../api/client";
import PageShell from "../components/PageShell";
import { Skeleton } from "../components/Toast";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";

type Streamer = {
  id: string;
  display_name?: string;
  profile_image_url?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  category?: string;
  twitch_username?: string;
  kick_username?: string;
  youtube_url?: string;
  discord_url?: string;
  stream?: {
    online: boolean;
    title?: string;
    gameName?: string;
    viewerCount?: number;
    thumbnailUrl?: string;
    source?: string;
  };
};

export default function LivePage() {
  const { content } = useSite();
  const { t } = useLanguage();
  const [state, setState] = useState<LiveState | null>(null);
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [totalStreamViewers, setTotalStreamViewers] = useState(0);
  const [liveStreamCount, setLiveStreamCount] = useState(0);
  const [streamersLoading, setStreamersLoading] = useState(true);
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

  useEffect(() => {
    let cancel = false;
    const loadStreamers = async () => {
      try {
        const result = await api<{ rows: Streamer[]; totalViewers: number; liveCount: number }>("/api/public/streamers/live");
        if (!cancel) {
          setStreamers(result.rows || []);
          setTotalStreamViewers(Number(result.totalViewers || 0));
          setLiveStreamCount(Number(result.liveCount || 0));
        }
      } catch {
        if (!cancel) {
          setStreamers([]);
          setTotalStreamViewers(0);
          setLiveStreamCount(0);
        }
      } finally {
        if (!cancel) setStreamersLoading(false);
      }
    };
    loadStreamers();
    const timer = window.setInterval(loadStreamers, 30_000);
    return () => {
      cancel = true;
      window.clearInterval(timer);
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
              {online ? t("Server Online") : notConfigured ? t("Server status not configured") : t("Server Offline")}
            </div>
            <h2 className="mt-3 font-serif text-2xl text-white sm:text-3xl">{t(state?.serverName || "Gotham City")}</h2>
            <p className="mt-1 text-sm text-white/55">Gotham City - CFW Roleplay</p>
          </div>

          <div className="text-right text-xs text-white/45">
            <div className="flex items-center justify-end gap-2">
              <RefreshCw size={12} className={connecting ? "animate-spin" : ""} />
              {connecting ? t("Connecting...") : `${t("Updated")} ${lastUpdate}`}
            </div>
            <div className="mt-2 flex items-center justify-end gap-1">
              {online ? <Wifi size={12} className="text-emerald-300" /> : <WifiOff size={12} className={notConfigured ? "text-white/40" : "text-red-300"} />}
              {t("Automatic refresh every 15 seconds")}
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
              <Stat icon={Users} label={t("Online")} value={notConfigured ? "N/A" : String(state?.count ?? 0)} accent="text-emerald-300" />
              <Stat icon={Activity} label={t("Max Players")} value={notConfigured ? "N/A" : String(state?.maxplayers ?? 0)} accent="text-violet-300" />
              <Stat icon={Cloud} label={t("Queue")} value={notConfigured ? "N/A" : String(state?.queue ?? 0)} accent="text-cyan-300" />
              <Stat icon={Gauge} label={t("Latency")} value={state?.latency == null ? "N/A" : `${state.latency} ms`} accent="text-orange-300" />
            </div>

            <div className="mt-4 rounded-xl border border-[#60519b]/30 bg-[#60519b]/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#8a7ac4]/35 bg-black/25 text-[#d7ceff]">
                    <Radio size={17} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/40">{t("Total Stream Viewers")}</p>
                    <p className="font-serif text-2xl text-white">{totalStreamViewers.toLocaleString()}</p>
                  </div>
                </div>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-white/55">
                  {liveStreamCount} {t("live")} / {streamers.length} {t("listed")}
                </span>
              </div>
            </div>

            {!notConfigured && (
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-white/45">
                  <span>{t("Server capacity")}</span>
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
              <p className="mt-4 text-sm text-red-200/80">{t("The status service could not reach the FiveM endpoints.")}</p>
            )}
          </>
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mt-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#9b8ad8]">{t("Creators")}</p>
            <h2 className="mt-1 font-serif text-2xl text-white">{t("Community Streamers")}</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#60519b]/35 bg-[#60519b]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#d7ceff]">
            <Radio size={14} />
            {totalStreamViewers.toLocaleString()} {t("total viewers")}
          </div>
        </div>

        {streamersLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-56" />)}
          </div>
        ) : streamers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="font-serif text-lg text-white">{t("No streamers added yet")}</p>
            <p className="mt-1 text-sm text-white/45">{t("Add Kick or Twitch channels from the admin Streamers page.")}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {streamers.map((streamer) => <StreamerCard key={streamer.id} streamer={streamer} />)}
          </div>
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

function StreamerCard({ streamer }: { streamer: Streamer }) {
  const { t } = useLanguage();
  const name = streamer.display_name || streamer.kick_username || streamer.twitch_username || "Streamer";
  const avatar = streamer.profile_image_url || streamer.avatar_url || "";
  const online = Boolean(streamer.stream?.online);
  const url = streamer.kick_username
    ? channelUrl("kick", streamer.kick_username)
    : streamer.twitch_username
      ? channelUrl("twitch", streamer.twitch_username)
      : externalUrl(streamer.youtube_url || streamer.discord_url);
  const platform = streamer.kick_username ? "Kick" : streamer.twitch_username ? "Twitch" : streamer.youtube_url ? "YouTube" : "Streamer";
  const embedUrl = streamEmbedUrl(streamer);
  const streamTitle = streamer.stream?.title || (online ? t("Live now") : t("Stream offline"));
  const gameName = streamer.stream?.gameName || streamer.category || "Gotham City Roleplay";
  const viewers = Number(streamer.stream?.viewerCount || 0);

  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition hover:border-[#8a7ac4]/50 hover:bg-[#60519b]/10">
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#161022] via-[#0b0810] to-black">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={`${name} stream preview`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="h-full w-full"
          />
        ) : (
          <>
            {(streamer.stream?.thumbnailUrl || streamer.banner_url) && <img src={streamer.stream?.thumbnailUrl || streamer.banner_url} alt="" className="h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105" loading="lazy" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#08060d] to-transparent" />
          </>
        )}
        <div className="absolute left-4 top-4 rounded-full border border-[#60519b]/40 bg-black/45 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#d7ceff]">
          {platform}
        </div>
        <div className={`absolute right-4 top-4 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${online ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200" : "border-white/15 bg-black/45 text-white/50"}`}>
          {online ? t("Live") : t("Offline")}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-[#100b18] shadow-lg">
            {avatar ? <img src={avatar} alt={name} className="h-full w-full object-cover" loading="lazy" /> : <span className="font-serif text-2xl text-[#c8bcff]">{name.slice(0, 1).toUpperCase()}</span>}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-serif text-xl text-white">{t(name)}</h3>
            <p className="truncate text-xs text-white/45">{t(gameName)}</p>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 min-h-[3rem] text-sm font-medium leading-6 text-white/78">{streamTitle}</p>
        {streamer.bio && <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/58">{streamer.bio}</p>}
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/55">
            {viewers.toLocaleString()} {t("viewers")}
          </span>
          {url && (
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#60519b] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#7566b6]">
              {t("Open")} <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function channelUrl(platform: "kick" | "twitch", value?: string) {
  const input = String(value || "").trim();
  if (!input) return "";
  if (/^https?:\/\//i.test(input)) return input;
  const handle = input.replace(/^@/, "").replace(/^kick\.com\//i, "").replace(/^twitch\.tv\//i, "").trim();
  return `https://${platform === "kick" ? "kick.com" : "twitch.tv"}/${handle}`;
}

function externalUrl(value?: string) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}

function streamEmbedUrl(streamer: Streamer) {
  if (streamer.twitch_username) {
    const channel = cleanChannel(streamer.twitch_username, "twitch");
    const parent = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(parent)}&muted=true`;
  }
  if (streamer.kick_username) {
    return `https://player.kick.com/${encodeURIComponent(cleanChannel(streamer.kick_username, "kick"))}`;
  }
  return "";
}

function cleanChannel(value: string, platform: "kick" | "twitch") {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .replace(new RegExp(`^https?://(www\\.)?${platform === "kick" ? "kick\\.com" : "twitch\\.tv"}/`, "i"), "")
    .replace(new RegExp(`^${platform === "kick" ? "kick\\.com" : "twitch\\.tv"}/`, "i"), "")
    .split(/[/?#]/)[0];
}
