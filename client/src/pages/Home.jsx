import { Link } from "react-router-dom";
import { Activity, Calendar, ChevronRight, Radio, Shield, Ticket, Users, Video } from "lucide-react";
import { motion } from "framer-motion";
import { api, imageFallback } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card, StatCard } from "../components/Card.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";

export default function Home() {
  const { settings } = useApp();
  const { data, loading } = useApi(() => api.get("/api/public/home"), [], {
    latestNews: [],
    latestEvents: [],
    streamers: [],
    status: {},
    settings
  });

  const homeSettings = data?.settings || settings;
  const status = data?.status || {};
  const heroImage = homeSettings.heroBackgroundUrl || imageFallback(`${homeSettings.websiteName || "A2 Studio"} Roleplay City`, 1400, 760);

  return (
    <main>
      <section className="relative min-h-[78vh] overflow-hidden">
        <img className="absolute inset-0 h-full w-full object-cover opacity-28" src={heroImage} alt="" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/78 to-black" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl items-center px-4 py-16">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-a2-green/35 bg-a2-green/10 px-3 py-1 text-sm font-bold text-a2-green">
              <Radio size={15} />
              QBCore city control center
            </div>
            <h1 className="text-4xl font-black tracking-normal text-white md:text-6xl">{homeSettings.websiteName || "A2 Studio"}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/68">{homeSettings.homepageDescription}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as="a" href={homeSettings.discordInviteUrl || "#"}>Join Discord</Button>
              <Button as="a" href={homeSettings.fivemConnectUrl || "#"} variant="ghost">Connect to FiveM</Button>
              <Button as={Link} to="/apply" variant="ghost">Whitelist application</Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto -mt-12 grid max-w-7xl gap-4 px-4 pb-12 md:grid-cols-4">
        <StatCard label="Server" value={status.online ? "Online" : "Offline"} hint={status.updatedAt || "Waiting for FiveM resource"} icon={Activity} />
        <StatCard label="Players" value={`${status.players || 0}/${status.maxPlayers || 0}`} hint="Current online players" icon={Users} />
        <StatCard label="Latest tickets" value={data?.latestNews?.length || 0} hint="CMS controlled content" icon={Ticket} />
        <StatCard label="Live creators" value={(data?.streamers || []).filter((streamer) => streamer.is_live).length} hint="Twitch/Kick cached backend status" icon={Video} />
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-a2-green">City newspaper</p>
              <h2 className="text-2xl font-black">Latest news</h2>
            </div>
            <Link to="/news" className="flex items-center gap-1 text-sm font-bold text-a2-green">View all <ChevronRight size={16} /></Link>
          </div>
          <div className="grid gap-3">
            {(loading ? Array.from({ length: 3 }) : data?.latestNews || []).map((article, index) => (
              <Link key={article?.id || index} to={article?.id ? `/news/${article.id}` : "/news"} className="rounded-lg border border-a2-border bg-white/[0.03] p-4 transition hover:border-a2-green/50">
                {loading ? <div className="h-16 rounded skeleton" /> : (
                  <>
                    <p className="text-xs uppercase tracking-wide text-white/38">{article.category || "News"}</p>
                    <p className="mt-1 text-lg font-black">{article.title}</p>
                    <p className="mt-2 text-sm text-white/55">{article.subtitle || article.description || article.content}</p>
                  </>
                )}
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="text-a2-green" size={19} />
            <h2 className="text-2xl font-black">Upcoming events</h2>
          </div>
          <div className="grid gap-3">
            {(data?.latestEvents || []).map((event) => (
              <Link key={event.id} to={`/events/${event.id}`} className="rounded-lg border border-a2-border p-4 hover:border-a2-green/50">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">{event.title}</p>
                  <StatusBadge status={event.status || "Published"} />
                </div>
                <p className="mt-2 text-sm text-white/50">{event.location || event.description}</p>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 lg:grid-cols-3">
        <Card>
          <Shield className="mb-3 text-a2-green" />
          <h3 className="text-xl font-black">Police, EMS, and court</h3>
          <p className="mt-2 text-sm leading-6 text-white/55">Secure role-based panels for MDC searches, medical reports, legal cases, warrants, evidence, and audit trails.</p>
        </Card>
        <Card>
          <Users className="mb-3 text-a2-green" />
          <h3 className="text-xl font-black">Players and city stories</h3>
          <p className="mt-2 text-sm leading-6 text-white/55">Player portal, character profiles, whitelist, tickets, ban appeals, businesses, gangs, map markers, and archive pages.</p>
        </Card>
        <Card>
          <Video className="mb-3 text-a2-green" />
          <h3 className="text-xl font-black">Creators live first</h3>
          <p className="mt-2 text-sm leading-6 text-white/55">Backend-only Twitch/Kick checks, cached live status, featured streamer sorting, and admin-managed creator profiles.</p>
        </Card>
      </section>
    </main>
  );
}
