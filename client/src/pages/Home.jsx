import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Radio, Shield, Sparkles, Star, Users, Video } from "lucide-react";
import { motion } from "framer-motion";
import { api, imageFallback } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card, StatCard } from "../components/Card.jsx";

export default function Home() {
  const { settings } = useApp();
  const { data, loading } = useApi(() => api.get("/api/public/home"), [], {
    settings,
    partners: [],
    journey: [],
    famous: [],
    news: [],
    events: [],
    team: [],
    streamers: []
  });
  const home = data?.settings || settings;
  const heroImage = home.heroBackgroundImage || imageFallback(`${home.websiteName || "A2 Studio"} FiveM roleplay`, 1600, 850);
  const liveCount = (data?.streamers || []).filter((streamer) => streamer.is_live).length;

  return (
    <main>
      <section className="relative min-h-[82vh] overflow-hidden">
        <img className="absolute inset-0 h-full w-full object-cover opacity-30" src={heroImage} alt="" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/78 to-black" style={{ opacity: Number(home.heroOverlayOpacity || 78) / 100 }} />
        {!home.performanceMode && (
          <div
            className="absolute inset-x-0 bottom-0 h-48"
            style={{ background: "radial-gradient(circle at 50% 100%, rgba(139, 92, 246, 0.24), transparent 36rem)" }}
          />
        )}
        <div className="relative mx-auto flex min-h-[82vh] max-w-7xl items-center px-4 py-16">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-a2-green/35 bg-a2-green/10 px-3 py-1 text-sm font-bold text-a2-green">
              <Radio size={15} />
              {home.heroSubtitle || "Premium FiveM community"}
            </div>
            {home.logoUrl && <img src={home.logoUrl} alt={home.websiteName || "A2 Studio"} className="mb-5 h-24 w-24 rounded-full border border-a2-green/40 object-cover shadow-glow" />}
            <h1 className="text-4xl font-black tracking-normal text-white md:text-6xl">{home.heroTitle || home.websiteName || "A2 Studio"}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/68">{home.heroDescription}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as="a" href={home.heroPrimaryButtonLink || "#"}>{home.heroPrimaryButtonText || "Join Discord"}</Button>
              <Button as="a" href={home.heroSecondaryButtonLink || "#"} variant="ghost">{home.heroSecondaryButtonText || "Connect to FiveM"}</Button>
              <Button as={Link} to="/login" variant="ghost">Login</Button>
              {home.storeButtonLink && <Button as="a" href={home.storeButtonLink} variant="ghost">{home.storeButtonText || "Store"}</Button>}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto -mt-10 grid max-w-7xl gap-4 px-4 pb-12 md:grid-cols-4">
        <StatCard label="Live creators" value={liveCount} hint="Twitch/Kick checked by backend" icon={Video} />
        <StatCard label="Roster" value={data?.streamers?.length || 0} hint="Approved content creators" icon={Users} />
        <StatCard label="Events" value={data?.events?.length || 0} hint="Current and upcoming" icon={Calendar} />
        <StatCard label="Support" value="24/7" hint="Tickets saved with transcript" icon={Shield} />
      </section>

      {home.partnersEnabled && <PartnerMarquee partners={data?.partners || []} settings={home} />}

      <Section title="Live streams" eyebrow="On air" href="/live">
        <div className="grid gap-4 md:grid-cols-3">
          {(data?.streamers || []).slice(0, 3).map((streamer) => (
            <Card key={streamer.id} className="overflow-hidden p-0">
              <img src={streamer.thumbnail_url || streamer.banner_url || imageFallback(streamer.display_name, 800, 420)} alt="" className="h-40 w-full object-cover opacity-80" />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black">{streamer.display_name}</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-black ${streamer.is_live ? "bg-a2-green text-black" : "bg-white/10 text-white/50"}`}>{streamer.is_live ? "LIVE" : "OFFLINE"}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-white/55">{streamer.stream_title || streamer.bio || "Creator profile managed by admin."}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 lg:grid-cols-[1fr_1fr]">
        <PreviewList title="Journey" eyebrow="Server timeline" href="/journey" items={data?.journey || []} icon={Sparkles} />
        <PreviewList title="Upcoming events" eyebrow="City calendar" href="/events" items={data?.events || []} icon={Calendar} field="location" />
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 lg:grid-cols-[1.05fr_0.95fr]">
        <PreviewList title="Latest news" eyebrow="Community updates" href="/news" items={data?.news || []} icon={Radio} field="subtitle" />
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-a2-green">Famous characters</p>
              <h2 className="text-2xl font-black">Roleplay legends</h2>
            </div>
            <Link to="/famous" className="flex items-center gap-1 text-sm font-bold text-a2-green">View all <ChevronRight size={16} /></Link>
          </div>
          <div className="grid gap-3">
            {(data?.famous || []).map((character) => (
              <Link key={character.id} to={`/famous/${character.id}`} className="flex items-center gap-3 rounded-lg border border-a2-border bg-white/[0.03] p-3 hover:border-a2-green/50">
                <img src={character.picture_url || imageFallback(character.character_name, 120, 120)} className="h-14 w-14 rounded-lg object-cover" alt="" />
                <div>
                  <p className="font-black">{character.character_name}</p>
                  <p className="text-sm text-white/50">{character.header || character.role_name}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <Section title="Team" eyebrow="Community staff" href="/team">
        <div className="grid gap-4 md:grid-cols-3">
          {(data?.team || []).slice(0, 3).map((member) => (
            <Card key={member.id} className="text-center">
              <img src={member.profile_image_url || imageFallback(member.name, 220, 220)} alt="" className="mx-auto h-24 w-24 rounded-full border border-a2-green/30 object-cover" />
              <p className="mt-3 font-black">{member.name}</p>
              <p className="text-sm text-a2-green">{member.role_title}</p>
            </Card>
          ))}
        </div>
      </Section>
    </main>
  );
}

function PartnerMarquee({ partners, settings }) {
  const visible = partners.length ? partners : [{ id: "placeholder", partner_name: "Add partners in admin", logo_url: "", website_url: "#" }];
  const doubled = [...visible, ...visible];
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16">
      <div className="marquee rounded-lg border border-a2-border bg-white/[0.03] px-4 py-5">
        <div
          className={`marquee-track ${settings.partnerPauseOnHover ? "pause-on-hover" : ""}`}
          style={{
            "--marquee-speed": `${Number(settings.partnerAnimationSpeed || 32)}s`,
            "--marquee-direction": settings.partnerDirection === "right" ? "reverse" : "normal"
          }}
        >
          {doubled.map((partner, index) => (
            <a key={`${partner.id}-${index}`} href={partner.website_url || "#"} className={`flex min-w-48 items-center justify-center gap-3 rounded-lg border border-a2-border bg-black/45 px-5 py-3 ${settings.partnerGrayscale ? "grayscale transition hover:grayscale-0" : ""}`}>
              {partner.logo_url ? <img src={partner.logo_url} alt="" className="h-8 max-w-28 object-contain" /> : <Star className="text-a2-green" size={20} />}
              <span className="text-sm font-black">{partner.partner_name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Section({ title, eyebrow, href, children }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-a2-green">{eyebrow}</p>
          <h2 className="text-2xl font-black md:text-3xl">{title}</h2>
        </div>
        <Link to={href} className="flex items-center gap-1 text-sm font-bold text-a2-green">View all <ChevronRight size={16} /></Link>
      </div>
      {children}
    </section>
  );
}

function PreviewList({ title, eyebrow, href, items, icon: Icon, field = "description" }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-a2-green">{eyebrow}</p>
          <h2 className="text-2xl font-black">{title}</h2>
        </div>
        <Link to={href} className="flex items-center gap-1 text-sm font-bold text-a2-green">Open <ChevronRight size={16} /></Link>
      </div>
      <div className="grid gap-3">
        {(items || []).map((item) => (
          <Link key={item.id} to={`${href}/${item.id}`} className="rounded-lg border border-a2-border bg-white/[0.03] p-4 transition hover:border-a2-green/50">
            <div className="flex items-start gap-3">
              <div className="rounded-lg border border-a2-border bg-a2-green/10 p-2 text-a2-green"><Icon size={18} /></div>
              <div>
                <p className="font-black">{item.title || item.name || item.character_name || item.zone_name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-white/55">{item[field] || item.description || item.content}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
