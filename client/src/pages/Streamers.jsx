import { Link, useParams } from "react-router-dom";
import { Eye, Radio, Search, Twitch, Youtube } from "lucide-react";
import { useState } from "react";
import { api, imageFallback } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { Card } from "../components/Card.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";

function PlatformBadge({ label }) {
  return <span className="rounded-full border border-a2-border bg-white/5 px-2 py-1 text-xs font-bold text-white/58">{label || "Platform"}</span>;
}

export function StreamersPage() {
  const [search, setSearch] = useState("");
  const { data, loading } = useApi(() => api.get(`/api/public/streamers?q=${encodeURIComponent(search)}`), [search], { streamers: [] });
  const streamers = data?.streamers || [];
  const featured = streamers.filter((streamer) => streamer.is_featured).slice(0, data?.settings?.featuredStreamersLimit || 6);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-a2-green">A2 Studio Streamers</p>
          <h1 className="mt-2 text-4xl font-black">Streamers & Content Creators</h1>
          <p className="mt-3 max-w-2xl text-white/55">Approved Twitch, Kick, YouTube, TikTok, and server creators. Live creators are checked by the backend and sorted first.</p>
        </div>
        <label className="flex min-w-[260px] items-center gap-2 rounded-lg border border-a2-border bg-black/40 px-3 py-2">
          <Search size={16} className="text-a2-green" />
          <input className="w-full bg-transparent outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search streamer..." />
        </label>
      </div>

      {featured.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-black">Featured creators</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((streamer) => <StreamerCard key={streamer.id} streamer={streamer} featured />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-2xl font-black">All streamers</h2>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {(loading ? Array.from({ length: 6 }) : streamers).map((streamer, index) => streamer ? <StreamerCard key={streamer.id} streamer={streamer} /> : <Card key={index}><div className="h-56 skeleton" /></Card>)}
          {!loading && streamers.length === 0 && <Card className="md:col-span-2 xl:col-span-3">No approved streamers yet.</Card>}
        </div>
      </section>
    </main>
  );
}

function StreamerCard({ streamer, featured = false }) {
  const thumbnail = streamer.thumbnail_url || streamer.banner_url || imageFallback(streamer.display_name, 900, 500);
  return (
    <Link to={`/streamers/${streamer.id}`} className="group">
      <Card className="h-full overflow-hidden p-0">
        <div className="relative">
          <img className="h-44 w-full object-cover opacity-75 transition group-hover:opacity-100" src={thumbnail} alt="" loading="lazy" />
          <div className="absolute left-3 top-3 flex gap-2">
            <StatusBadge status={streamer.is_live ? "LIVE" : "Offline"} live={streamer.is_live} />
            {featured && <span className="rounded-full border border-a2-green/40 bg-black/70 px-2 py-1 text-xs font-black text-a2-green">FEATURED</span>}
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3">
            <img className="h-12 w-12 rounded-lg border border-a2-border object-cover" src={streamer.avatar_url || imageFallback(streamer.display_name, 120, 120)} alt="" loading="lazy" />
            <div>
              <h3 className="text-lg font-black">{streamer.display_name}</h3>
              <p className="text-xs text-white/45">{streamer.category || "Other"} / {streamer.main_platform || "Creator"}</p>
            </div>
          </div>
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/55">{streamer.stream_title || streamer.bio || "Creator profile ready for content."}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {streamer.twitch_username && <PlatformBadge label="Twitch" />}
            {streamer.kick_username && <PlatformBadge label="Kick" />}
            {streamer.youtube_url && <PlatformBadge label="YouTube" />}
            {streamer.tiktok_url && <PlatformBadge label="TikTok" />}
            {streamer.viewer_count != null && <span className="ml-auto inline-flex items-center gap-1 text-xs text-white/48"><Eye size={14} /> {streamer.viewer_count}</span>}
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function StreamerDetail() {
  const { id } = useParams();
  const { data, loading, error } = useApi(() => api.get(`/api/public/streamers/${id}`), [id], null);
  const streamer = data?.streamer || {};
  if (error) return <main className="mx-auto max-w-4xl px-4 py-16"><Card>Streamer not found.</Card></main>;
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Card className="overflow-hidden p-0">
        {loading ? <div className="h-72 skeleton" /> : <img className="h-72 w-full object-cover opacity-80" src={streamer.banner_url || streamer.thumbnail_url || imageFallback(streamer.display_name, 1200, 520)} alt="" />}
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <img className="h-20 w-20 rounded-lg border border-a2-border object-cover" src={streamer.avatar_url || imageFallback(streamer.display_name, 160, 160)} alt="" />
            <div>
              <StatusBadge status={streamer.is_live ? "LIVE" : "Offline"} live={streamer.is_live} />
              <h1 className="mt-2 text-4xl font-black">{streamer.display_name}</h1>
              <p className="text-white/50">{streamer.character_name || "FiveM creator"} / {streamer.category || "Other"}</p>
            </div>
          </div>
          <p className="mt-6 max-w-3xl leading-8 text-white/64">{streamer.bio || "No biography has been added yet."}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {streamer.twitch_username && <a className="inline-flex items-center gap-2 rounded-lg border border-a2-border px-4 py-2 text-sm font-bold hover:border-a2-green" href={`https://twitch.tv/${streamer.twitch_username}`}><Twitch size={16} /> Twitch</a>}
            {streamer.kick_username && <a className="inline-flex items-center gap-2 rounded-lg border border-a2-border px-4 py-2 text-sm font-bold hover:border-a2-green" href={`https://kick.com/${streamer.kick_username}`}><Radio size={16} /> Kick</a>}
            {streamer.youtube_url && <a className="inline-flex items-center gap-2 rounded-lg border border-a2-border px-4 py-2 text-sm font-bold hover:border-a2-green" href={streamer.youtube_url}><Youtube size={16} /> YouTube</a>}
          </div>
        </div>
      </Card>
    </main>
  );
}
