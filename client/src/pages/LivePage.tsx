import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, ExternalLink, Radio } from "lucide-react";
import { api } from "../api/client";
import PageShell from "../components/PageShell";
import { Skeleton } from "../components/Toast";
import { useLanguage } from "../context/LanguageContext";

type Streamer = {
  id: string;
  display_name?: string;
  profile_image_url?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  category?: string;
  is_featured?: boolean | number;
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
  const { t } = useLanguage();
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [totalStreamViewers, setTotalStreamViewers] = useState(0);
  const [liveStreamCount, setLiveStreamCount] = useState(0);
  const [streamersLoading, setStreamersLoading] = useState(true);

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

  const featuredStreamers = streamers.filter((streamer) => Boolean(Number(streamer.is_featured)));
  const otherStreamers = streamers.filter((streamer) => !Boolean(Number(streamer.is_featured)));

  return (
    <PageShell subtitle="" title="All Live Streams">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap justify-center gap-3">
        <MetricCard icon={Eye} value={totalStreamViewers} label={t("Total Viewers")} color="text-emerald-400" />
        <MetricCard icon={Radio} value={liveStreamCount} label={t("Live Streams")} color="text-rose-500" />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mt-6"
      >
        <div className="mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#9b8ad8]">{t("Creators")}</p>
            <h2 className="mt-1 font-serif text-2xl text-white">{t("Community Streamers")}</h2>
          </div>
        </div>

        {streamersLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-56" />)}
          </div>
        ) : streamers.length === 0 ? (
          <div className="spotlight-card rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="font-serif text-lg text-white">{t("No streamers added yet")}</p>
            <p className="mt-1 text-sm text-white/45">{t("Add Kick or Twitch channels from the admin Streamers page.")}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {featuredStreamers.length > 0 && <StreamerGroup title={t("Featured Streamers")} streamers={featuredStreamers} featured />}
            <StreamerGroup title={t("All Streamers")} streamers={otherStreamers} />
          </div>
        )}
      </motion.section>
    </PageShell>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="spotlight-card flex min-w-[150px] items-center gap-3 rounded-xl border border-white/10 px-5 py-4">
      <Icon size={21} className={color} />
      <div><p className="font-serif text-xl leading-none text-white">{value.toLocaleString()}</p><p className="mt-1 text-xs text-white/45">{label}</p></div>
    </div>
  );
}

function StreamerGroup({ title, streamers, featured = false }: { title: string; streamers: Streamer[]; featured?: boolean }) {
  if (!streamers.length) return null;
  return <section><div className="mb-4 flex items-center gap-3"><h3 className="font-serif text-xl text-white">{title}</h3><span className="h-px flex-1 bg-gradient-to-r from-[#60519b]/50 to-transparent" /></div><div className={`grid gap-4 ${featured ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`}>{streamers.map((streamer) => <StreamerCard key={streamer.id} streamer={streamer} />)}</div></section>;
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
    <div className="spotlight-card group overflow-hidden rounded-2xl border border-white/10 transition hover:border-[#8a7ac4]/50">
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
          <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-[#090b10]">
            {avatar ? <img src={avatar} alt={name} className="h-full w-full object-cover" loading="lazy" /> : <span className="font-serif text-2xl text-[#c8bcff]">{name.slice(0, 1).toUpperCase()}</span>}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-serif text-xl text-white">{t(name)}</h3>
            <p className="truncate text-xs text-white/45">{t(gameName)}</p>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 min-h-[3rem] text-sm font-medium leading-6 text-white/78">{t(streamTitle)}</p>
        {streamer.bio && <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/58">{t(streamer.bio)}</p>}
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
