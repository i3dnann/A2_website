import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ExternalLink, Search, Video, X } from "lucide-react";
import { api, imageFallback } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

export function StreamersPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState(null);
  const [kickStatuses, setKickStatuses] = useState({});
  const { data, loading } = useApi(() => api.get(`/api/public/streamers?q=${encodeURIComponent(q)}${category ? `&category=${encodeURIComponent(category)}` : ""}`), [q, category], { streamers: [] });
  const streamers = useMemo(() => applyKickStatuses(data?.streamers || [], kickStatuses), [data?.streamers, kickStatuses]);
  const categories = ["", "Police", "EMS", "Gang", "Civilian", "Business", "Staff", "Other"];

  useKickStatusChecks(data?.streamers || [], setKickStatuses);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <Header eyebrow="Creator roster" title="Approved streamers" />
      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-2 rounded-lg border border-a2-border bg-white/[0.03] px-3 py-2">
          <Search size={17} className="text-white/35" />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Search roster..." value={q} onChange={(event) => setQ(event.target.value)} />
        </label>
        <select className="form-input md:w-56" value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => <option key={item} value={item}>{item || "All categories"}</option>)}
        </select>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(loading ? Array.from({ length: 6 }) : streamers).map((streamer, index) => (
          <StreamerCard key={streamer?.id || index} streamer={streamer} loading={loading} onClick={() => setSelected(streamer)} />
        ))}
      </div>
      {selected && <StreamerModal streamer={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

function StreamerCard({ streamer, loading, onClick }) {
  if (loading) return <Card><div className="h-64 rounded skeleton" /></Card>;
  return (
    <button onClick={onClick} className="text-left">
      <Card className="h-full overflow-hidden p-0 transition hover:border-a2-green/50">
        <img src={streamer.banner_url || imageFallback(streamer.display_name, 900, 420)} alt="" className="h-32 w-full object-cover opacity-80" />
        <div className="p-5">
          <div className="flex items-center gap-3">
            <img src={streamer.profile_image_url || streamer.avatar_url || imageFallback(streamer.display_name, 180, 180)} alt="" className="h-16 w-16 rounded-full border border-a2-green/30 object-cover" />
            <div className="min-w-0">
              <p className="truncate text-lg font-black">{streamer.display_name}</p>
              <p className="text-sm text-a2-green">{streamer.category || "Other"}</p>
            </div>
            <div className="ml-auto">
              <LiveBadge streamer={streamer} />
            </div>
          </div>
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/55">{streamer.bio || "Creator profile managed from the admin panel."}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-white/55">
            {streamer.twitch_username && <span>Twitch</span>}
            {streamer.kick_username && <span>Kick</span>}
            {streamer.youtube_url && <span>YouTube</span>}
          </div>
        </div>
      </Card>
    </button>
  );
}

function StreamerModal({ streamer, onClose }) {
  const links = [
    ["Twitch", streamer.twitch_username ? `https://twitch.tv/${streamer.twitch_username}` : ""],
    ["Kick", streamer.kick_username ? `https://kick.com/${streamer.kick_username}` : ""],
    ["YouTube", streamer.youtube_url],
    ["TikTok", streamer.tiktok_url],
    ["Instagram", streamer.instagram_url],
    ["X/Twitter", streamer.x_url],
    ["Discord", streamer.discord_url]
  ].filter(([, href]) => href);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/72 p-4 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-3xl overflow-auto p-0">
        <div className="relative">
          <img src={streamer.banner_url || imageFallback(streamer.display_name, 1000, 420)} alt="" className="h-48 w-full rounded-t-lg object-cover opacity-75" />
          <button onClick={onClose} className="absolute right-3 top-3 rounded-lg border border-a2-border bg-black/70 p-2"><X size={18} /></button>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-end gap-4">
            <img src={streamer.profile_image_url || streamer.avatar_url || imageFallback(streamer.display_name, 220, 220)} alt="" className="-mt-14 h-28 w-28 rounded-full border-4 border-black object-cover" />
            <div>
              <h2 className="text-3xl font-black">{streamer.display_name}</h2>
              <p className="text-a2-green">{streamer.character_name || streamer.category || "Creator"}</p>
            </div>
            <div className="ml-auto">
              <LiveBadge streamer={streamer} large />
            </div>
          </div>
          <p className="mt-5 leading-7 text-white/62">{streamer.bio}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {links.map(([label, href]) => (
              <Button key={label} as="a" href={href} target="_blank" rel="noreferrer" variant="ghost">
                {label}
                <ExternalLink size={14} />
              </Button>
            ))}
            {streamer.stream_url && <Button as="a" href={streamer.stream_url} target="_blank" rel="noreferrer">Watch stream</Button>}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function StreamerDetail() {
  const { id } = useParams();
  const { data, loading } = useApi(() => api.get(`/api/public/streamers/${id}`), [id], { streamer: null });
  const streamer = data?.streamer;
  if (loading) return <main className="mx-auto max-w-4xl px-4 py-12"><Card><div className="h-80 rounded skeleton" /></Card></main>;
  if (!streamer) return <main className="px-4 py-20 text-center text-white/60">Streamer not found.</main>;
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Link to="/roster" className="text-sm font-bold text-a2-green">Back to roster</Link>
      <Card className="mt-4">
        <StreamerModal streamer={streamer} onClose={() => history.back()} />
      </Card>
    </main>
  );
}

export function LivePage() {
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("");
  const [kickStatuses, setKickStatuses] = useState({});
  const { data, loading } = useApi(() => api.get(`/api/public/live?q=${encodeURIComponent(q)}${platform ? `&platform=${platform}` : ""}`), [q, platform], { streamers: [], totalLiveChannels: 0, totalLiveViewers: 0 });
  const streamers = useMemo(() => applyKickStatuses(data?.streamers || [], kickStatuses), [data?.streamers, kickStatuses]);
  const totalLiveChannels = streamers.filter((streamer) => streamer.is_live).length;
  const totalLiveViewers = streamers.reduce((sum, streamer) => sum + Number(streamer.viewer_count || 0), 0);

  useKickStatusChecks(data?.streamers || [], setKickStatuses);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <Header eyebrow="Live city" title="Community livestreams" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-white/50">Live channels</p><p className="mt-2 text-3xl font-black">{totalLiveChannels}</p></Card>
        <Card><p className="text-sm text-white/50">Total viewers</p><p className="mt-2 text-3xl font-black">{totalLiveViewers}</p></Card>
        <Card><p className="text-sm text-white/50">Tracked creators</p><p className="mt-2 text-3xl font-black">{streamers.length}</p></Card>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-2 rounded-lg border border-a2-border bg-white/[0.03] px-3 py-2">
          <Search size={17} className="text-white/35" />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Search live streams..." value={q} onChange={(event) => setQ(event.target.value)} />
        </label>
        <select className="form-input md:w-44" value={platform} onChange={(event) => setPlatform(event.target.value)}>
          <option value="">All platforms</option>
          <option value="twitch">Twitch</option>
          <option value="kick">Kick</option>
        </select>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(loading ? Array.from({ length: 6 }) : streamers).map((streamer, index) => (
          <Card key={streamer?.id || index} className="overflow-hidden p-0">
            {loading ? <div className="h-64 skeleton" /> : (
              <>
                <img src={streamer.thumbnail_url || streamer.banner_url || imageFallback(streamer.display_name, 900, 500)} alt="" className="h-44 w-full object-cover opacity-85" />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black">{streamer.display_name}</p>
                    <LiveBadge streamer={streamer} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-white/55">{streamer.stream_title || streamer.bio || "Offline or status unknown."}</p>
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm text-white/45">
                    <span>{streamer.viewer_count ? `${streamer.viewer_count} viewers` : "Viewers hidden"}</span>
                    {streamer.stream_url && <Button as="a" href={streamer.stream_url} target="_blank" rel="noreferrer"><Video size={15} /> Watch</Button>}
                  </div>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
      {!loading && streamers.length === 0 && <Card className="mt-6 text-center text-white/55">No live streamers are available right now.</Card>}
    </main>
  );
}

function Header({ eyebrow, title }) {
  return (
    <header>
      <p className="text-sm font-black uppercase tracking-widest text-a2-green">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black md:text-5xl">{title}</h1>
    </header>
  );
}

function LiveBadge({ streamer, large = false }) {
  const text = streamer.live_status_checking ? "CHECKING" : streamer.live_status_error ? "UNKNOWN" : streamer.is_live ? (large ? "LIVE NOW" : "LIVE") : "OFFLINE";
  const color = streamer.live_status_checking
    ? "bg-white/10 text-white/65"
    : streamer.live_status_error
      ? "bg-a2-warning/20 text-a2-warning"
      : streamer.is_live
        ? "bg-a2-green text-black"
        : "bg-white/10 text-white/50";
  return <span className={`rounded-full px-2 py-1 text-xs font-black ${color}`}>{text}</span>;
}

function cleanKickSlug(value = "") {
  let input = String(value || "").trim();
  if (!input) return "";
  try {
    if (/^https?:\/\//i.test(input)) {
      const url = new URL(input);
      input = url.pathname.split("/").filter(Boolean)[0] || "";
    }
  } catch {
    input = input.replace(/^https?:\/\//i, "");
  }
  return input
    .replace(/^www\./i, "")
    .replace(/^kick\.com\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 25);
}

function hasLiveStatus(status) {
  return status?.is_live === true || status?.is_live === 1 || status?.is_live === "1" || status?.is_live === "true";
}

function useKickStatusChecks(streamers, setKickStatuses) {
  useEffect(() => {
    const slugs = [...new Set((streamers || []).map((streamer) => cleanKickSlug(streamer.kick_username)).filter(Boolean))];
    if (!slugs.length) return;
    let cancelled = false;

    slugs.forEach((slug) => {
      setKickStatuses((current) => ({
        ...current,
        [slug]: { ...(current[slug] || {}), loading: true, error: "" }
      }));
      api
        .get(`/api/kick/status/${encodeURIComponent(slug)}`)
        .then((status) => {
          if (!cancelled) setKickStatuses((current) => ({ ...current, [slug]: { loading: false, data: status, error: status.error || "" } }));
        })
        .catch((error) => {
          if (!cancelled) setKickStatuses((current) => ({ ...current, [slug]: { loading: false, data: null, error: error.data?.error || error.message || "kick_status_failed" } }));
        });
    });

    return () => {
      cancelled = true;
    };
  }, [streamers, setKickStatuses]);
}

function applyKickStatuses(streamers, kickStatuses) {
  return (streamers || []).map((streamer) => {
    const slug = cleanKickSlug(streamer.kick_username);
    if (!slug) return streamer;
    const status = kickStatuses[slug];
    if (!status) return streamer;
    if (status.loading) return { ...streamer, live_status_checking: true };
    if (status.error && !status.data) return { ...streamer, live_status_error: status.error };

    const kick = status.data;
    const otherPlatformLive = (streamer.live_statuses || []).some((item) => String(item.platform).toLowerCase() !== "kick" && hasLiveStatus(item));
    const stream = kick?.stream || {};
    const channel = kick?.channel || {};
    return {
      ...streamer,
      kick_username: kick?.slug || slug,
      live_status_checking: false,
      live_status_error: kick?.error || "",
      is_live: Boolean(otherPlatformLive || kick?.online),
      stream_title: kick?.online ? stream.stream_title || channel.stream_title || streamer.stream_title || "" : otherPlatformLive ? streamer.stream_title : "",
      viewer_count: kick?.online ? stream.viewer_count || channel.stream?.viewer_count || streamer.viewer_count || null : otherPlatformLive ? streamer.viewer_count : null,
      thumbnail_url: kick?.online ? stream.thumbnail || channel.stream?.thumbnail || streamer.thumbnail_url || "" : otherPlatformLive ? streamer.thumbnail_url : "",
      stream_url: kick?.online ? `https://kick.com/${kick.slug || slug}` : otherPlatformLive ? streamer.stream_url : "",
      last_checked_at: kick?.checkedAt || streamer.last_checked_at
    };
  });
}
