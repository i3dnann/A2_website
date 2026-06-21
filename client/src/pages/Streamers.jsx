import { useState } from "react";
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
  const { data, loading } = useApi(() => api.get(`/api/public/streamers?q=${encodeURIComponent(q)}${category ? `&category=${encodeURIComponent(category)}` : ""}`), [q, category], { streamers: [] });
  const streamers = data?.streamers || [];
  const categories = ["", "Police", "EMS", "Gang", "Civilian", "Business", "Staff", "Other"];

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
            <span className={`ml-auto rounded-full px-2 py-1 text-xs font-black ${streamer.is_live ? "bg-a2-green text-black" : "bg-white/10 text-white/50"}`}>{streamer.is_live ? "LIVE" : "OFFLINE"}</span>
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
            <span className={`ml-auto rounded-full px-3 py-1 text-xs font-black ${streamer.is_live ? "bg-a2-green text-black" : "bg-white/10 text-white/50"}`}>{streamer.is_live ? "LIVE NOW" : "OFFLINE"}</span>
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
  const { data, loading } = useApi(() => api.get(`/api/public/live?q=${encodeURIComponent(q)}${platform ? `&platform=${platform}` : ""}`), [q, platform], { streamers: [], totalLiveChannels: 0, totalLiveViewers: 0 });
  const streamers = data?.streamers || [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <Header eyebrow="Live city" title="Community livestreams" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-white/50">Live channels</p><p className="mt-2 text-3xl font-black">{data?.totalLiveChannels || 0}</p></Card>
        <Card><p className="text-sm text-white/50">Total viewers</p><p className="mt-2 text-3xl font-black">{data?.totalLiveViewers || 0}</p></Card>
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
                    <span className={`rounded-full px-2 py-1 text-xs font-black ${streamer.is_live ? "bg-a2-green text-black" : "bg-white/10 text-white/50"}`}>{streamer.is_live ? "LIVE" : "OFFLINE"}</span>
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
