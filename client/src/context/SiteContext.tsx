import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../api/client";

export type FeatureItem = { icon: string; title: string; desc: string };
export type RosterItem = {
  name: string;
  role: string;
  count: string;
  icon: string;
  avatar?: string;
  bio?: string;
  category?: string;
  discordUrl?: string;
  twitchUrl?: string;
  kickUrl?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
};
export type JourneyItem = { year: string; title: string; desc: string };
export type FamousChar = { name: string; title: string; tag: string; image?: string; bio?: string };
export type NewsItem = { icon: string; date: string; title: string; excerpt: string; id?: string };
export type CareerItem = { role: string; type: string; dept: string; id?: string };
export type FaqItem = { q: string; a: string };
export type StatItem = { label: string; value: number; suffix: string };

export type SiteContent = {
  siteName: string;
  siteTagline: string;
  heroTitle1: string;
  heroTitle2: string;
  heroDescription: string;
  heroBackgroundImage?: string;
  logoUrl?: string;
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
  siteName: "Gotham City",
  siteTagline: "Premium FiveM Roleplay",
  heroTitle1: "Enter",
  heroTitle2: "Gotham City",
  heroDescription: "A premium dark FiveM roleplay city built for serious stories, creator energy, deep systems, and players who want every scene to matter.",
  heroBackgroundImage: "/images/gotham-banner-static.jpg",
  logoUrl: "/images/gotham-emblem-static.jpg",
  serverIp: "connect play.gothamcityrp.gg",
  discordLink: "/",
  fivemLink: "/server",
  storeLink: "/",
  stats: [
    { label: "Players", value: 0, suffix: "" },
    { label: "Departments", value: 0, suffix: "" },
    { label: "Open Roles", value: 0, suffix: "" },
    { label: "Staff Members", value: 0, suffix: "" },
  ],
  featuresTitle: "Built for Serious Roleplayers",
  featuresSubtitle: "Why Gotham",
  featuresDesc: "Edit these homepage panels from the admin panel to match your server.",
  features: [
    { icon: "ShieldHalf", title: "Server Identity", desc: "Describe what makes your community different." },
    { icon: "Users", title: "Community", desc: "Describe your player culture, staff approach, and roleplay standards." },
    { icon: "Sparkles", title: "Custom Systems", desc: "Describe your scripts, jobs, vehicles, interiors, or city features." },
  ],
  rosterTitle: "Our Roster",
  rosterSubtitle: "Community",
  rosterDesc: "Meet the people keeping Gotham City running.",
  roster: [],
  streamsTitle: "Live Server",
  streamsSubtitle: "Server Status",
  streamsDesc: "Check the current FiveM server status, capacity, queue, and latest update time.",
  journeyTitle: "The Journey",
  journeySubtitle: "Our Story",
  journey: [],
  famousTitle: "Famous Characters",
  famousSubtitle: "Legends of the City",
  famousCharacters: [],
  newsTitle: "Latest News",
  newsSubtitle: "Bulletin",
  news: [],
  careersTitle: "Careers",
  careersSubtitle: "Join the Team",
  careersDesc: "Open positions posted by staff appear here.",
  careers: [],
  faqTitle: "Frequently Asked Questions",
  faqSubtitle: "Need Help",
  faqs: [],
  ctaTitle: "Your Story in Gotham City Starts Tonight",
  ctaDesc: "Create your account, link Steam and Discord, and step into the city.",
  primaryHex: "#60519b",
  accentHex: "#8a7ac4",
  darkBgHex: "#080808",
};

type SiteContextType = {
  content: SiteContent;
  updateContent: (partial: Partial<SiteContent>) => void;
  resetContent: () => void;
};

const SiteContext = createContext<SiteContextType | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);

  useEffect(() => {
    let cancel = false;
    const loadSettings = async () => {
      try {
        const [settingsResult, homeResult] = await Promise.all([
          api<{ settings: any }>("/api/public/settings"),
          api<{ team?: any[]; famous?: any[]; news?: any[]; journey?: any[]; careers?: any[] }>("/api/public/home"),
        ]);
        const settings = settingsResult.settings || {};
        const team = (homeResult.team || []).map((member) => ({
          name: member.name || "Team Member",
          role: member.role_title || member.category || "Staff",
          count: member.category || "Member",
          icon: "Users",
          avatar: member.profile_image_url || "",
          bio: member.bio || "",
          category: member.category || "Staff",
          discordUrl: member.discord_url || "",
          twitchUrl: member.twitch_url || "",
          kickUrl: member.kick_url || "",
          youtubeUrl: member.youtube_url || "",
          instagramUrl: member.instagram_url || "",
          xUrl: member.x_url || "",
        }));
        const famous = (homeResult.famous || []).map((character) => ({
          name: character.character_name || "Character",
          title: character.header || character.role_name || "",
          tag: character.gang_business || character.role_name || "Featured",
          image: character.picture_url || "",
          bio: character.bio || character.description || "",
        }));
        const news = (homeResult.news || []).map((post) => ({
          id: String(post.id || ""),
          icon: "Newspaper",
          date: post.published_at || post.created_at || "",
          title: post.title || "News",
          excerpt: post.subtitle || post.excerpt || String(post.content || "").slice(0, 140),
        }));
        const journey = (homeResult.journey || []).map((item) => ({
          year: item.journey_date ? new Date(item.journey_date).getFullYear().toString() : "",
          title: item.title || "Journey",
          desc: item.description || "",
        }));
        const careers = (homeResult.careers || []).map((job) => ({
          id: String(job.id || ""),
          role: job.title || "Open Position",
          type: job.is_open === false || job.is_open === 0 ? "Closed" : "Open",
          dept: job.department || "Department",
        }));
        if (cancel) return;
        setContent((prev) => {
          const savedContent = settings.siteContent && typeof settings.siteContent === "object" ? settings.siteContent : {};
          const merged = { ...prev, ...savedContent } as SiteContent;
          return {
          ...merged,
          siteName: settings.websiteName || prev.siteName,
          siteTagline: settings.heroSubtitle || prev.siteTagline,
          heroTitle1: settings.heroTitle ? String(settings.heroTitle).split(" ")[0] || prev.heroTitle1 : prev.heroTitle1,
          heroTitle2: settings.heroTitle ? String(settings.heroTitle).split(" ").slice(1).join(" ") || prev.heroTitle2 : prev.heroTitle2,
          heroDescription: settings.heroDescription || prev.heroDescription,
          heroBackgroundImage: settings.heroBackgroundImage || prev.heroBackgroundImage,
          logoUrl: settings.logoUrl || prev.logoUrl,
          discordLink: settings.heroPrimaryButtonLink || prev.discordLink,
          fivemLink: settings.heroSecondaryButtonLink || prev.fivemLink,
          storeLink: settings.storeButtonLink || prev.storeLink,
          roster: team,
          famousCharacters: famous,
          news,
          journey: journey.length ? journey : merged.journey,
          careers,
        };
        });
      } catch {}
    };
    loadSettings();
    return () => { cancel = true; };
  }, []);

  const updateContent = (partial: Partial<SiteContent>) => {
    setContent((prev) => ({ ...prev, ...partial }));
  };

  const resetContent = () => {
    setContent(DEFAULT_CONTENT);
  };

  return <SiteContext.Provider value={{ content, updateContent, resetContent }}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used within SiteProvider");
  return ctx;
}
