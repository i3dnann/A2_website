import {
  ShieldHalf,
  Car,
  Landmark,
  Radio,
  Users,
  Gavel,
  Siren,
  Sparkles,
  Map as MapIcon,
  Newspaper,
  Trophy,
} from "lucide-react";

export const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "features", label: "Server" },
  { id: "roster", label: "Roster" },
  { id: "live", label: "Live" },
  { id: "journey", label: "Journey" },
  { id: "news", label: "News" },
  { id: "careers", label: "Careers" },
  { id: "faq", label: "FAQ" },
];

export const STATS = [
  { label: "Active Citizens", value: 4200, suffix: "+" },
  { label: "Custom Jobs", value: 32, suffix: "+" },
  { label: "Server Uptime", value: 99, suffix: "%" },
  { label: "Discord Members", value: 15000, suffix: "+" },
];

export const FEATURES = [
  {
    icon: ShieldHalf,
    title: "Deep CFW Framework",
    desc: "A heavily customized CFW core with balanced economy, whitelisted jobs, and stable performance built for long-term roleplay.",
  },
  {
    icon: Car,
    title: "Custom Vehicles & Handling",
    desc: "Hundreds of hand-tuned vehicles with realistic handling, dealerships, and a full import/export underground scene.",
  },
  {
    icon: Landmark,
    title: "Gotham City Map",
    desc: "A fully reworked Gotham-inspired cityscape — gothic districts, docks, back alleys, and a living, breathing metropolis.",
  },
  {
    icon: Gavel,
    title: "Realistic Law & Order",
    desc: "Structured PD, EMS, and judicial systems with trained staff running immersive, fair, and consistent scenarios.",
  },
  {
    icon: Siren,
    title: "Organized Crime",
    desc: "Deep gang & criminal enterprise systems — heists, territory wars, and black market economies with real consequences.",
    },
  {
    icon: Sparkles,
    title: "Custom Scripts & MLOs",
    desc: "Exclusive custom interiors, animations, and scripts you won't find anywhere else, polished for a premium feel.",
  },
];

export const ROSTER = [
  { name: "Command Team", role: "Server Directors", count: "6 Members", icon: ShieldHalf },
  { name: "Police Department", role: "Law Enforcement", count: "48 Members", icon: Gavel },
  { name: "Fire & EMS", role: "Emergency Services", count: "26 Members", icon: Siren },
  { name: "Government", role: "City Officials", count: "12 Members", icon: Landmark },
  { name: "Support Team", role: "Ticket & Player Support", count: "20 Members", icon: Users },
  { name: "Development", role: "Scripting & Design", count: "9 Members", icon: Sparkles },
];

export const STREAMERS = [
  { name: "NightWing_TV", platform: "Twitch", viewers: 1284, live: true, game: "Gotham City Roleplay" },
  { name: "GothamCityRP", platform: "Kick", viewers: 842, live: true, game: "Gotham City Roleplay" },
  { name: "OfficerDown", platform: "Twitch", viewers: 0, live: false, game: "Offline" },
  { name: "BlackMaskRP", platform: "Twitch", viewers: 511, live: true, game: "Gotham City Roleplay" },
];

export const JOURNEY = [
  { year: "2022", title: "Founded", desc: "Gotham City launched with a small dedicated community and a vision for premium roleplay." },
  { year: "2023", title: "Gotham City Map", desc: "Released our fully custom Gotham-inspired city map, replacing the base map entirely." },
  { year: "2024", title: "10,000 Members", desc: "Our Discord community crossed 10,000 members with daily active roleplay sessions." },
  { year: "2025", title: "Custom Framework 2.0", desc: "Rebuilt our CFW core for stability, launching dozens of exclusive scripts." },
  { year: "2026", title: "New Horizons", desc: "Expanding departments, new districts, and a brand new player experience." },
];

export const FAMOUS_CHARACTERS = [
  { name: "Victor Kane", title: "Crime Lord of Old Gotham", tag: "Legendary" },
  { name: "Renée Cross", title: "GCPD Commissioner", tag: "Iconic" },
  { name: "Marcus \"Wraith\" Doyle", title: "Underground Fixer", tag: "Fan Favorite" },
  { name: "Dr. Elena Voss", title: "Chief Trauma Surgeon", tag: "Legendary" },
];

export const NEWS = [
  {
    icon: Newspaper,
    date: "Feb 12, 2026",
    title: "Season 4: Gotham Nights Begins",
    excerpt: "New district unlocked, seasonal events, and a reworked criminal economy go live this weekend.",
  },
  {
    icon: Trophy,
    date: "Jan 28, 2026",
    title: "Community Awards Results",
    excerpt: "Congratulations to every winner of our 2025 roleplay community awards ceremony.",
  },
  {
    icon: MapIcon,
    date: "Jan 09, 2026",
    title: "Docklands Expansion Live",
    excerpt: "Explore the newly released Docklands district with new jobs, MLOs, and hidden storylines.",
  },
  {
    icon: Radio,
    date: "Dec 20, 2025",
    title: "Livestream Partner Program",
    excerpt: "We're partnering with content creators — apply now for perks, in-game rewards and more.",
  },
];

export const CAREERS = [
  { role: "Police Department Cadet", type: "Whitelisted", dept: "Law Enforcement" },
  { role: "EMS Trainee", type: "Whitelisted", dept: "Emergency Services" },
  { role: "Support Agent", type: "Staff Team", dept: "Community Support" },
  { role: "Script Developer", type: "Staff Team", dept: "Development" },
  { role: "Content Creator Partner", type: "Application", dept: "Media" },
];

export const FAQS = [
  {
    q: "How do I join the Gotham City server?",
    a: "Join our Discord, verify your account, link Steam, and use the connect button on our home page or the F8 console with our server IP.",
  },
  {
    q: "Is whitelisting required to play?",
    a: "General roleplay is open to all verified members. Specific departments like PD, EMS, and Government require an application and interview.",
  },
  {
    q: "What framework do you use?",
    a: "We run a heavily customized CFW framework with a fully rebuilt Gotham City inspired map and hundreds of exclusive scripts.",
  },
  {
    q: "How do I report a rule breaker or open a ticket?",
    a: "Use the Tickets section on our dashboard after logging in, or open a support ticket directly inside our Discord server.",
  },
  {
    q: "Can I apply for staff or a whitelisted job?",
    a: "Yes — check the Careers section below for open positions and submit an application through our careers portal.",
  },
];
