import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, CheckCircle2, ChevronRight, FileText, Radio, ScrollText, Shield, Sparkles, Star, Users, Video } from "lucide-react";
import { motion } from "framer-motion";
import { api, imageFallback } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card, StatCard } from "../components/Card.jsx";
import "../styles/gotham-realistic.css";
import "../styles/gotham-layouts.css";

export default function Home() {
  const { settings } = useApp();
  const { data } = useApi(() => api.get("/api/public/home"), [], {
    settings,
    partners: [],
    journey: [],
    famous: [],
    news: [],
    events: [],
    team: [],
    streamers: [],
    gallery: []
  });
  const home = data?.settings || settings;
  const uiTheme = home.uiTheme || settings.uiTheme || "gotham-realistic";
  const heroImage = home.heroBackgroundImage || imageFallback(`${home.websiteName || "Gotham City"} dark cinematic city skyline`, 1800, 980);
  const fallbackLiveCount = (data?.streamers || []).filter((streamer) => streamer.is_live).length;
  const [liveCount, setLiveCount] = useState(fallbackLiveCount);

  useEffect(() => {
    setLiveCount(fallbackLiveCount);
  }, [fallbackLiveCount]);

  useEffect(() => {
    let cancelled = false;
    const loadLiveCount = async () => {
      try {
        const live = await api.get("/api/public/live");
        const count = Number(live?.totalLiveChannels ?? (live?.streamers || []).filter((streamer) => streamer.is_live).length ?? 0);
        if (!cancelled) setLiveCount(count);
      } catch {
        if (!cancelled) setLiveCount(fallbackLiveCount);
      }
    };
    loadLiveCount();
    const timer = setInterval(loadLiveCount, 20000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [fallbackLiveCount]);

  return (
    <main className={`gotham-preview-shell gotham-home-${uiTheme}`}>
      <Hero home={home} heroImage={heroImage} uiTheme={uiTheme} />
      <StatsRow liveCount={liveCount} data={data} />
      {home.partnersEnabled && <PartnerMarquee partners={data?.partners || []} settings={home} />}
      <AboutServer home={home} />
      <FeatureGrid />
      <JobsSystems />
      <HowToJoin home={home} />
      <RulesOverview />
      <TeamSection team={data?.team || []} />
      <GallerySection data={data} />
      <ChangelogSection journey={data?.journey || []} news={data?.news || []} events={data?.events || []} />
      <FAQContact />
    </main>
  );
}

function safeLink(value, fallback = "/") {
  const link = String(value || "").trim();
  return !link || link === "#" ? fallback : link;
}

function SmartLink({ to, children, className }) {
  const href = safeLink(to, "/");
  if (/^https?:\/\//i.test(href)) return <a href={href} target="_blank" rel="noreferrer" className={className}>{children}</a>;
  return <Link to={href} className={className}>{children}</Link>;
}

function Hero({ home, heroImage, uiTheme }) {
  return (
    <section className="gotham-hero-realistic dxna-hero-section">
      <img className="gotham-hero-image" src={heroImage} alt="" loading="eager" />
      <div className="gotham-rain" />
      <div className="gotham-fog" />
      <span className="gotham-side-label">Gotham City Roleplay</span>
      <div className="gotham-hero-inner dxna-hero-inner">
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.65 }} className="gotham-hero-copy max-w-5xl">
          <div className="gotham-eyebrow"><Radio size={15} />{home.heroSubtitle || "FiveM RP Gotham City"}</div>
          {home.logoUrl && <img src={home.logoUrl} alt={home.websiteName || "Gotham City"} className="gotham-logo-crest" />}
          <h1 className="gotham-title">{home.heroTitle || home.websiteName || "Gotham City"}</h1>
          <p className="gotham-description">{home.heroDescription || "In Gotham, every shadow has a story… and every story leaves a mark."}</p>
          <div className="gotham-action-row">
            <Button as="a" href={safeLink(home.heroPrimaryButtonLink, "/")}>{home.heroPrimaryButtonText || "Connect Now"}</Button>
            <Button as="a" href={safeLink(home.heroSecondaryButtonLink, "/")} variant="ghost">{home.heroSecondaryButtonText || "Join Discord"}</Button>
            <Button as={Link} to="/login" variant="ghost">Login</Button>
          </div>
          {uiTheme === "gotham-tactical" && <div className="gotham-tactical-strip"><span>Signal online</span><span>City systems active</span><span>Roleplay network secured</span></div>}
        </motion.div>
      </div>
    </section>
  );
}

function StatsRow({ liveCount, data }) {
  return <section className="gotham-stat-row dxna-stats mx-auto grid max-w-7xl gap-4 px-4 pb-16 md:grid-cols-4"><StatCard label="Uniqueness" value="∞" hint="Ways to start your adventure" icon={Sparkles} /><StatCard label="Creators" value={data?.streamers?.length || 0} hint="Registered creators only" icon={Users} /><StatCard label="Server Health" value="99.2%" hint="Reliable restarts and support" icon={Shield} /><StatCard label="Live Now" value={liveCount} hint="Auto-updates from Live page" icon={Video} /></section>;
}

function AboutServer({ home }) { return <section id="about" className="dxna-section gotham-section mx-auto grid max-w-7xl gap-6 px-4 pb-16 lg:grid-cols-[0.95fr_1.05fr]"><div><p className="dxna-kicker">About the server</p><h2 className="dxna-heading">Our story</h2><p className="dxna-copy">{home.heroDescription || "Gotham City is a cinematic FiveM roleplay city built for serious stories, strong characters, live events, and a community where every choice leaves a mark."}</p><div className="mt-5 flex flex-wrap gap-3"><Button as={Link} to="/tickets" variant="ghost">Contact staff</Button><Button as={Link} to="/terms" variant="ghost">Read rules</Button></div></div><Card className="gotham-panel dxna-about-card"><div className="grid gap-4 sm:grid-cols-2"><MiniStat label="Room for" value="128 Players" text="Plenty of seats for big nights in the city." /><MiniStat label="Discord Crew" value="Community" text="Announcements, support, and city updates." /><MiniStat label="Reliability" value="99.2%" text="Steady restarts and active monitoring." /><MiniStat label="Powered by" value="QBCore" text="Custom flavor on top of a battle-tested base." /></div></Card></section>; }
function FeatureGrid() { const features = [["Serious Roleplay", "Core Value", "Story-first roleplay with character consequence and clean standards."], ["Custom Economy", "Custom", "Balanced money flow, businesses, careers, and city progression."], ["Performance Focused", "Optimized", "Cleaner browsing, lighter UI layers, and performance mode for effects."], ["Live Events", "Weekly", "Server events and city moments that keep players coming back."]]; return <Section id="features" title="Custom content crafted in-house" eyebrow="Features" href="/news"><div className="dxna-feature-grid grid gap-4 md:grid-cols-2 lg:grid-cols-4">{features.map(([title, tag, text]) => <FeatureCard key={title} title={title} tag={tag} text={text} />)}</div></Section>; }
function JobsSystems() { const jobs = [["Law Enforcement", "Training, patrols, dispatch, and serious city law enforcement roleplay."], ["Medical & Fire", "EMS response, treatment, rescue scenes, and emergency roleplay."], ["Mechanics & Businesses", "Player-run businesses, garages, workshops, and service roleplay."], ["Street Stories", "Crews, conflict, investigations, and underground city arcs with consequences."]]; return <Section id="jobs" title="Choose your path" eyebrow="Jobs & Systems" href="/careers"><div className="grid gap-4 md:grid-cols-2">{jobs.map(([title, text]) => <Card key={title} className="gotham-panel dxna-job-card"><BriefcaseBusiness className="text-a2-green" size={22} /><h3 className="mt-3 text-xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-white/65">{text}</p></Card>)}</div></Section>; }
function HowToJoin({ home }) { const steps = [["Install FiveM", "Download the latest FiveM build for your platform.", "https://fivem.net", "Download FiveM"], ["Join the Discord", "Get updates, support, and live announcements.", safeLink(home.heroSecondaryButtonLink, "/"), "Join Discord"], ["Read the Rules", "Stay in good standing before every restart.", "/terms", "View Rules"], ["Submit Application", "Pick a role and give staff your best RP pitch.", "/careers", "Apply Now"]]; return <section id="join" className="dxna-section gotham-section mx-auto max-w-7xl px-4 pb-16"><p className="dxna-kicker">How to join</p><h2 className="dxna-heading">Get into the city in four steps</h2><div className="mt-6 grid gap-4 md:grid-cols-4">{steps.map(([title, text, link, label], index) => <Card key={title} className="gotham-panel dxna-step-card"><span className="dxna-step-number">0{index + 1}</span><h3 className="mt-4 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-white/65">{text}</p><SmartLink to={link} className="mt-4 inline-flex text-sm font-black text-a2-green">{label} →</SmartLink></Card>)}</div></section>; }
function RulesOverview() { const rules = ["Value life at all times. Do not break roleplay to avoid consequences.", "Keep communication in-character unless support is needed.", "No stream sniping, metagaming, or external callouts.", "Respect staff zones, hospitals, events, and ongoing scenes."]; return <section id="rules" className="dxna-section gotham-section mx-auto grid max-w-7xl gap-6 px-4 pb-16 lg:grid-cols-[0.9fr_1.1fr]"><div><p className="dxna-kicker">Rules overview</p><h2 className="dxna-heading">Hold the standard</h2><p className="dxna-copy">The city works when everyone protects the story. These are the basics. Full rules stay available from the rules page.</p><Button as={Link} to="/terms" variant="ghost" className="mt-5"><ScrollText size={16} /> View full rules</Button></div><Card className="gotham-panel dxna-rules-card"><div className="grid gap-3">{rules.map((rule, index) => <div key={rule} className="flex gap-4 rounded-lg border border-a2-border bg-white/[0.05] p-4"><span className="font-black text-a2-green">0{index + 1}</span><p className="text-sm leading-6 text-white/72">{rule}</p></div>)}</div></Card></section>; }
function TeamSection({ team }) { return <Section id="staff" title="Who keeps the city running" eyebrow="Staff Team" href="/team"><div className="grid gap-4 md:grid-cols-4">{team.slice(0, 4).map((member) => <Card key={member.id} className="gotham-panel text-center dxna-staff-card"><img src={member.profile_image_url || imageFallback(member.name, 220, 220)} alt="" className="gotham-card-image mx-auto h-24 w-24 rounded-full border border-a2-green/30 object-cover" /><p className="mt-3 font-black">{member.name}</p><p className="text-sm text-a2-green">{member.role_title}</p></Card>)}</div></Section>; }
function GallerySection({ data }) { const fromGallery = (data?.gallery || []).map((item) => item.image_url).filter(Boolean); const images = fromGallery.length ? fromGallery : [imageFallback("Gotham patrol screenshot", 700, 420), imageFallback("Gotham street meet", 700, 420), imageFallback("Gotham garage", 700, 420), imageFallback("Gotham city night", 700, 420)]; return <Section id="gallery" title="Snapshots from the city" eyebrow="Gallery" href="/gallery"><div className="grid gap-4 md:grid-cols-4">{images.slice(0, 4).map((src, index) => <Card key={`${src}-${index}`} className="gotham-panel overflow-hidden p-0"><img src={src} alt="" className="gotham-card-image h-44 w-full object-cover" /></Card>)}</div></Section>; }
function ChangelogSection({ journey, news, events }) { const rows = [...journey, ...news, ...events].slice(0, 3); return <section id="changelog" className="dxna-section gotham-section mx-auto max-w-7xl px-4 pb-16"><p className="dxna-kicker">Changelog</p><h2 className="dxna-heading">Recent updates</h2><div className="mt-6 grid gap-3">{rows.map((item) => <Card key={`${item.id}-${item.title}`} className="gotham-panel dxna-change-row"><p className="text-xs font-black uppercase tracking-wide text-a2-green">{String(item.created_at || item.starts_at || "City update").slice(0, 10)}</p><h3 className="mt-2 font-black">{item.title || item.name}</h3><p className="mt-1 text-sm leading-6 text-white/65">{item.subtitle || item.description || item.content || item.location}</p></Card>)}</div></section>; }
function FAQContact() { return <section id="contact" className="dxna-section gotham-section mx-auto grid max-w-7xl gap-6 px-4 pb-20 lg:grid-cols-[0.9fr_1.1fr]"><div><p className="dxna-kicker">FAQ</p><h2 className="dxna-heading">Answers to common questions</h2><div className="mt-5 grid gap-3 text-sm text-white/68"><Link to="/faq" className="rounded-lg border border-a2-border bg-white/[0.05] p-4 hover:border-a2-green/50">Do I need whitelist before joining?</Link><Link to="/faq" className="rounded-lg border border-a2-border bg-white/[0.05] p-4 hover:border-a2-green/50">What region is the server hosted in?</Link><Link to="/faq" className="rounded-lg border border-a2-border bg-white/[0.05] p-4 hover:border-a2-green/50">Is there an age requirement?</Link></div></div><Card className="gotham-panel dxna-contact-card"><p className="dxna-kicker">Contact & Socials</p><h2 className="text-2xl font-black">Reach Gotham City staff</h2><p className="mt-2 text-sm leading-6 text-white/65">Need whitelist help, faction support, or a business proposal? Open a ticket and staff will review it.</p><div className="mt-5 flex flex-wrap gap-3"><Button as={Link} to="/tickets"><FileText size={16} /> Open ticket</Button><Button as={Link} to="/faq" variant="ghost"><CheckCircle2 size={16} /> FAQ</Button></div></Card></section>; }
function PartnerMarquee({ partners, settings }) { const visible = partners.length ? partners : [{ id: "placeholder", partner_name: "Add partners in admin", logo_url: "", website_url: "/" }]; const doubled = [...visible, ...visible]; return <section className="gotham-section mx-auto max-w-7xl px-4 pb-16"><div className="marquee gotham-panel rounded-lg border border-a2-border bg-white/[0.05] px-4 py-5"><div className={`marquee-track ${settings.partnerPauseOnHover ? "pause-on-hover" : ""}`} style={{ "--marquee-speed": `${Number(settings.partnerAnimationSpeed || 32)}s`, "--marquee-direction": settings.partnerDirection === "right" ? "reverse" : "normal" }}>{doubled.map((partner, index) => <a key={`${partner.id}-${index}`} href={safeLink(partner.website_url, "/")} className={`flex min-w-48 items-center justify-center gap-3 rounded-lg border border-a2-border bg-black/35 px-5 py-3 ${settings.partnerGrayscale ? "grayscale transition hover:grayscale-0" : ""}`}>{partner.logo_url ? <img src={partner.logo_url} alt="" className="h-8 max-w-28 object-contain" /> : <Star className="text-a2-green" size={20} />}<span className="text-sm font-black">{partner.partner_name}</span></a>)}</div></div></section>; }
function Section({ id, title, eyebrow, href, children }) { return <section id={id} className="gotham-section dxna-section mx-auto max-w-7xl px-4 pb-16"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="dxna-kicker">{eyebrow}</p><h2 className="dxna-heading text-2xl font-black md:text-3xl">{title}</h2></div><Link to={safeLink(href, "/")} className="flex items-center gap-1 text-sm font-bold text-a2-green">View all <ChevronRight size={16} /></Link></div>{children}</section>; }
function MiniStat({ label, value, text }) { return <div className="rounded-xl border border-a2-border bg-white/[0.055] p-4"><p className="text-xs font-black uppercase tracking-wide text-a2-green">{label}</p><p className="mt-2 text-lg font-black">{value}</p><p className="mt-1 text-sm text-white/62">{text}</p></div>; }
function FeatureCard({ title, tag, text }) { return <Card className="gotham-panel dxna-feature-card"><Sparkles className="text-a2-green" size={20} /><p className="mt-4 text-xs font-black uppercase tracking-wide text-a2-green">{tag}</p><h3 className="mt-2 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-white/65">{text}</p></Card>; }
