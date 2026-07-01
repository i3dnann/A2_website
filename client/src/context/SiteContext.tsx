import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type FeatureItem = { icon: string; title: string; desc: string };
export type RosterItem = { name: string; role: string; count: string; icon: string };
export type StreamerItem = { name: string; platform: string; viewers: number; live: boolean; game: string };
export type JourneyItem = { year: string; title: string; desc: string };
export type FamousChar = { name: string; title: string; tag: string };
export type NewsItem = { icon: string; date: string; title: string; excerpt: string };
export type CareerItem = { role: string; type: string; dept: string };
export type FaqItem = { q: string; a: string };
export type StatItem = { label: string; value: number; suffix: string };

export type SiteContent = {
  siteName: string;
  siteTagline: string;
  heroTitle1: string;
  heroTitle2: string;
  heroDescription: string;
  serverIp: string;
  discordLink: string;
  fivemLink: string;
  storeLink: string;
  stats: StatItem[];
  featuresTitle: string;
  featuresSubtitle: string;
  featuresDesc: string;
  features: FeatureItem[];
  rosterTitle: string;
  rosterSubtitle: string;
  rosterDesc: string;
  roster: RosterItem[];
  streamsTitle: string;
  streamsSubtitle: string;
  streamsDesc: string;
  streamers: StreamerItem[];
  journeyTitle: string;
  journeySubtitle: string;
  journey: JourneyItem[];
  famousTitle: string;
  famousSubtitle: string;
  famousCharacters: FamousChar[];
  newsTitle: string;
  newsSubtitle: string;
  news: NewsItem[];
  careersTitle: string;
  careersSubtitle: string;
  careersDesc: string;
  careers: CareerItem[];
  faqTitle: string;
  faqSubtitle: string;
  faqs: FaqItem[];
  ctaTitle: string;
  ctaDesc: string;
  primaryHex: string;
  accentHex: string;
  darkBgHex: string;
};

const DEFAULT_CONTENT: SiteContent = {
  siteName: "A2 Studio",
  siteTagline: "Gotham City Roleplay",
  heroTitle1: "Welcome to",
  heroTitle2: "A2 Studio",
  heroDescription:
    "A premium Gotham City inspired FiveM roleplay experience. Deep custom economy, gritty crime stories, and a community built for players who take their roleplay seriously.",
  serverIp: "connect play.a2studio.gg",
  discordLink: "#",
  fivemLink: "#",
  storeLink: "#",
  stats: [
    { label: "Active Citizens", value: 4200, suffix: "+" },
    { label: "Custom Jobs", value: 32, suffix: "+" },
    { label: "Server Uptime", value: 99, suffix: "%" },
    { label: "Discord Members", value: 15000, suffix: "+" },
  ],
  featuresTitle: "Built for Serious Roleplayers",
  featuresSubtitle: "Why A2 Studio",
  featuresDesc:
    "Every system on our server is designed with immersion, balance, and longevity in mind — so your story never runs out of places to go.",
  features: [
    { icon: "ShieldHalf", title: "Deep QBCore Framework", desc: "A heavily customized QBCore core with balanced economy, whitelisted jobs, and stable performance built for long-term roleplay." },
    { icon: "Car", title: "Custom Vehicles & Handling", desc: "Hundreds of hand-tuned vehicles with realistic handling, dealerships, and a full import/export underground scene." },
    { icon: "Landmark", title: "Gotham City Map", desc: "A fully reworked Gotham-inspired cityscape — gothic districts, docks, back alleys, and a living, breathing metropolis." },
    { icon: "Gavel", title: "Realistic Law & Order", desc: "Structured PD, EMS, and judicial systems with trained staff running immersive, fair, and consistent scenarios." },
    { icon: "Siren", title: "Organized Crime", desc: "Deep gang & criminal enterprise systems — heists, territory wars, and black market economies with real consequences." },
    { icon: "Sparkles", title: "Custom Scripts & MLOs", desc: "Exclusive custom interiors, animations, and scripts you won't find anywhere else, polished for a premium feel." },
  ],
  rosterTitle: "Our Roster",
  rosterSubtitle: "Community",
  rosterDesc: "Meet the departments keeping Gotham City running — from command staff to the officers walking the beat every night.",
  roster: [
    { name: "Command Team", role: "Server Directors", count: "6 Members", icon: "ShieldHalf" },
    { name: "Police Department", role: "Law Enforcement", count: "48 Members", icon: "Gavel" },
    { name: "Fire & EMS", role: "Emergency Services", count: "26 Members", icon: "Siren" },
    { name: "Government", role: "City Officials", count: "12 Members", icon: "Landmark" },
    { name: "Support Team", role: "Ticket & Player Support", count: "20 Members", icon: "Users" },
    { name: "Development", role: "Scripting & Design", count: "9 Members", icon: "Sparkles" },
  ],
  streamsTitle: "Live Streams",
  streamsSubtitle: "On Screen",
  streamsDesc: "Watch our community bring Gotham City to life in real time.",
  streamers: [
    { name: "NightWing_TV", platform: "Twitch", viewers: 1284, live: true, game: "A2 Studio Roleplay" },
    { name: "GothamCityRP", platform: "Kick", viewers: 842, live: true, game: "A2 Studio Roleplay" },
    { name: "OfficerDown", platform: "Twitch", viewers: 0, live: false, game: "Offline" },
    { name: "BlackMaskRP", platform: "Twitch", viewers: 511, live: true, game: "A2 Studio Roleplay" },
  ],
  journeyTitle: "The Journey",
  journeySubtitle: "Our Story",
  journey: [
    { year: "2022", title: "Founded", desc: "A2 Studio launched with a small dedicated community and a vision for premium roleplay." },
    { year: "2023", title: "Gotham City Map", desc: "Released our fully custom Gotham-inspired city map, replacing the base map entirely." },
    { year: "2024", title: "10,000 Members", desc: "Our Discord community crossed 10,000 members with daily active roleplay sessions." },
    { year: "2025", title: "Custom Framework 2.0", desc: "Rebuilt our QBCore core for stability, launching dozens of exclusive scripts." },
    { year: "2026", title: "New Horizons", desc: "Expanding departments, new districts, and a brand new player experience." },
  ],
  famousTitle: "Famous Characters",
  famousSubtitle: "Legends of the City",
  famousCharacters: [
    { name: "Victor Kane", title: "Crime Lord of Old Gotham", tag: "Legendary" },
    { name: "Renée Cross", title: "GCPD Commissioner", tag: "Iconic" },
    { name: 'Marcus "Wraith" Doyle', title: "Underground Fixer", tag: "Fan Favorite" },
    { name: "Dr. Elena Voss", title: "Chief Trauma Surgeon", tag: "Legendary" },
  ],
  newsTitle: "Latest News",
  newsSubtitle: "Bulletin",
  news: [
    { icon: "Newspaper", date: "Feb 12, 2026", title: "Season 4: Gotham Nights Begins", excerpt: "New district unlocked, seasonal events, and a reworked criminal economy go live this weekend." },
    { icon: "Trophy", date: "Jan 28, 2026", title: "Community Awards Results", excerpt: "Congratulations to every winner of our 2025 roleplay community awards ceremony." },
    { icon: "Map", date: "Jan 09, 2026", title: "Docklands Expansion Live", excerpt: "Explore the newly released Docklands district with new jobs, MLOs, and hidden storylines." },
    { icon: "Radio", date: "Dec 20, 2025", title: "Livestream Partner Program", excerpt: "We're partnering with content creators — apply now for perks, in-game rewards and more." },
  ],
  careersTitle: "Careers",
  careersSubtitle: "Join the Team",
  careersDesc: "Whether you want to serve the city or build it, we're always looking for dedicated, mature members to join our staff and departments.",
  careers: [
    { role: "Police Department Cadet", type: "Whitelisted", dept: "Law Enforcement" },
    { role: "EMS Trainee", type: "Whitelisted", dept: "Emergency Services" },
    { role: "Support Agent", type: "Staff Team", dept: "Community Support" },
    { role: "Script Developer", type: "Staff Team", dept: "Development" },
    { role: "Content Creator Partner", type: "Application", dept: "Media" },
  ],
  faqTitle: "Frequently Asked Questions",
  faqSubtitle: "Need Help",
  faqs: [
    { q: "How do I join the A2 Studio server?", a: "Join our Discord, verify your account, link Steam, and use the connect button on our home page or the F8 console with our server IP." },
    { q: "Is whitelisting required to play?", a: "General roleplay is open to all verified members. Specific departments like PD, EMS, and Government require an application and interview." },
    { q: "What framework do you use?", a: "We run a heavily customized QBCore framework with a fully rebuilt Gotham City inspired map and hundreds of exclusive scripts." },
    { q: "How do I report a rule breaker or open a ticket?", a: "Use the Tickets section on our dashboard after logging in, or open a support ticket directly inside our Discord server." },
    { q: "Can I apply for staff or a whitelisted job?", a: "Yes — check the Careers section for open positions and submit an application through our careers portal." },
  ],
  ctaTitle: "Your Story in Gotham City Starts Tonight",
  ctaDesc: "Create your account, link Steam & Discord, and step into one of the most immersive FiveM roleplay communities out there.",
  primaryHex: "#c026d3",
  accentHex: "#f59e0b",
  darkBgHex: "#050308",
};

const STORAGE_KEY = "a2studio_site_content";

type SiteContextType = {
  content: SiteContent;
  updateContent: (partial: Partial<SiteContent>) => void;
  resetContent: () => void;
};

const SiteContext = createContext<SiteContextType | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_CONTENT, ...parsed };
      }
    } catch {}
    return DEFAULT_CONTENT;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  }, [content]);

  const updateContent = (partial: Partial<SiteContent>) => {
    setContent((prev) => ({ ...prev, ...partial }));
  };

  const resetContent = () => {
    setContent(DEFAULT_CONTENT);
  };

  return (
    <SiteContext.Provider value={{ content, updateContent, resetContent }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used within SiteProvider");
  return ctx;
}
