import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, apiUrl, MOCK } from "../api/client";
// Toast is not needed here

export type Ticket = {
  id: string;
  ticketNumber?: string;
  subject: string;
  category: string;
  status: "Open" | "Pending" | "Closed";
  createdAt: string;
  lastReply: string;
};

export type Character = {
  id: string;
  name: string;
  job: string;
  grade: string;
  cash: number;
  bank: number;
  playtime: string;
  health?: number;
  citizenid?: string;
};

export type AppUser = {
  id?: string;
  username: string;
  email: string;
  joinDate: string;
  discordLinked: boolean;
  steamLinked: boolean;
  banned: boolean;
  role: "Citizen" | "Support" | "Moderator" | "Admin" | "Master Admin";
  roles?: string[];
  avatarUrl?: string;
};

type AuthContextType = {
  user: AppUser | null;
  tickets: Ticket[];
  characters: Character[];
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  loginDiscord: () => void;
  loginSteam: () => void;
  completeOAuth: (token: string) => Promise<void>;
  linkDiscord: () => Promise<void>;
  linkSteam: () => Promise<void>;
  createTicket: (subject: string, category: string, message?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = "a2studio_session";

const MOCK_CHARACTERS: Character[] = [
  { id: "c1", name: "Marcus Halloway", job: "Police Officer", grade: "Sergeant", cash: 2450, bank: 48200, playtime: "142h" },
  { id: "c2", name: "Isabella Cruz", job: "Civilian", grade: "Entrepreneur", cash: 890, bank: 12750, playtime: "76h" },
];

const MOCK_TICKETS: Ticket[] = [
  { id: "TCK-1042", subject: "Vehicle disappeared after restart", category: "Bug Report", status: "Open", createdAt: "Feb 10, 2026", lastReply: "2 hours ago" },
  { id: "TCK-1038", subject: "Question about whitelist application", category: "General Support", status: "Pending", createdAt: "Feb 05, 2026", lastReply: "1 day ago" },
  { id: "TCK-0994", subject: "Reporting a rule breaker", category: "Player Report", status: "Closed", createdAt: "Jan 22, 2026", lastReply: "3 weeks ago" },
];

type ProviderRow = {
  provider: string;
  provider_user_id?: string;
};

type BackendUser = Partial<AppUser> & {
  id?: string;
  roles?: string[];
  created_at?: string | null;
  account_status?: string;
  discord_id?: string;
  steam_id?: string;
  avatar_url?: string;
};

function roleFromBackend(raw: BackendUser): AppUser["role"] {
  const roles = raw.roles || [];
  if (roles.includes("Master Admin")) return "Master Admin";
  if (roles.includes("Admin")) return "Admin";
  if (roles.includes("Moderator")) return "Moderator";
  if (roles.includes("Support")) return "Support";
  if (raw.role) return raw.role;
  return "Citizen";
}

function formatJoinDate(value?: string | null) {
  if (!value) return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function normalizeUser(raw: BackendUser, providers: ProviderRow[] = []): AppUser {
  const providerNames = new Set(providers.map((provider) => provider.provider));
  return {
    id: raw.id,
    username: raw.username || raw.email || "Gotham Player",
    email: raw.email || "",
    joinDate: raw.joinDate || formatJoinDate(raw.created_at),
    discordLinked: Boolean(raw.discordLinked || raw.discord_id || providerNames.has("discord")),
    steamLinked: Boolean(raw.steamLinked || raw.steam_id || providerNames.has("steam")),
    banned: Boolean(raw.banned || (raw.account_status && raw.account_status !== "active")),
    role: roleFromBackend(raw),
    roles: raw.roles || [roleFromBackend(raw)],
    avatarUrl: raw.avatarUrl || raw.avatar_url || "",
  };
}

function normalizeTicket(raw: any): Ticket {
  return {
    id: String(raw.id || raw.ticket_number || ""),
    ticketNumber: raw.ticket_number || raw.id,
    subject: raw.subject || "Support Ticket",
    category: raw.category || "General Support",
    status: raw.status === "Closed" ? "Closed" : raw.status === "Pending" || raw.status === "Waiting for staff" ? "Pending" : "Open",
    createdAt: raw.created_at ? new Date(raw.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "Unknown",
    lastReply: raw.updated_at ? new Date(raw.updated_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "Unknown",
  };
}

function loadUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => loadUser());
  const [loading, setLoading] = useState(!MOCK);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  useEffect(() => {
    if (!MOCK) {
      setLoading(true);
      api<{ user: BackendUser | null; providers: ProviderRow[] }>("/api/auth/me")
        .then((r) => setUser(r.user ? normalizeUser(r.user, r.providers) : null))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setTickets([]);
      return;
    }

    if (MOCK) {
      setTickets(MOCK_TICKETS);
      return;
    }

    api<{ tickets: any[] }>("/api/player/tickets")
      .then((r) => setTickets((r.tickets || []).map(normalizeTicket)))
      .catch(() => setTickets([]));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.steamLinked) {
      setCharacters([]);
      return;
    }

    if (MOCK) {
      setCharacters(MOCK_CHARACTERS);
      return;
    }

    api<{ characters: any[] }>("/api/player/characters")
      .then((r) => {
        setCharacters((r.characters || []).map((character) => ({
          id: character.citizenid,
          citizenid: character.citizenid,
          name: character.fullName || character.name || character.citizenid || "Unknown Character",
          job: character.jobName || "Unknown",
          grade: String(character.jobGrade || "Unknown"),
          cash: Number(character.cash || 0),
          bank: Number(character.bank || 0),
          health: Number(character.health ?? character.raw?.metadata?.health ?? character.raw?.metadata?.hp ?? 100),
          armor: Number(character.armor ?? character.raw?.metadata?.armor ?? character.raw?.metadata?.armour ?? 0),
          playtime: character.raw?.metadata?.playtime ? `${character.raw.metadata.playtime}h` : "N/A",
        })));
      })
      .catch(() => setCharacters([]));
  }, [user?.steamLinked]);

  const login: AuthContextType["login"] = async (email, password) => {
    setLoading(true);
    try {
      if (MOCK) {
        await new Promise((r) => setTimeout(r, 800));
        if (!email || !password) return { ok: false, error: "Please enter your email and password." };
        if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
        setUser({
          username: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1),
          email,
          joinDate: "March 14, 2024",
          discordLinked: true,
          steamLinked: false,
          banned: false,
          role: "Citizen",
        });
        return { ok: true };
      }
      const r = await api<{ token: string; user: BackendUser }>("/api/auth/login", { method: "POST", body: { email, password } });
      localStorage.setItem("a2_token", r.token);
      setUser(normalizeUser(r.user));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const register: AuthContextType["register"] = async (username, email, password) => {
    setLoading(true);
    try {
      if (MOCK) {
        await new Promise((r) => setTimeout(r, 1000));
        if (!username || !email || !password) return { ok: false, error: "All fields are required." };
        if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
        setUser({
          username,
          email,
          joinDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          discordLinked: false,
          steamLinked: false,
          banned: false,
          role: "Citizen",
        });
        return { ok: true };
      }
      const r = await api<{ token: string; user: BackendUser }>("/api/auth/register", { method: "POST", body: { username, email, password } });
      localStorage.setItem("a2_token", r.token);
      setUser(normalizeUser(r.user));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!MOCK) {
      try { await api("/api/auth/logout", { method: "POST" }); } catch {}
    }
    localStorage.removeItem("a2_token");
    setUser(null);
  };

  const completeOAuth = async (token: string) => {
    localStorage.setItem("a2_token", token);
    let r: { user: BackendUser | null; providers: ProviderRow[] };
    try {
      r = await api<{ user: BackendUser | null; providers: ProviderRow[] }>("/api/auth/complete-session", { method: "POST", body: { token } });
    } catch (error) {
      localStorage.removeItem("a2_token");
      throw error;
    }
    if (!r.user) {
      localStorage.removeItem("a2_token");
      throw new Error("The backend returned a login token but could not load your account. Check JWT_SECRET and restart PM2 with --update-env.");
    }
    setUser(r.user ? normalizeUser(r.user, r.providers) : null);
  };

  const loginDiscord = () => {
    window.location.href = MOCK ? "/login" : apiUrl("/api/auth/discord");
  };

  const loginSteam = () => {
    window.location.href = MOCK ? "/login" : apiUrl("/api/auth/steam");
  };

  const linkDiscord = async () => {
    if (!MOCK) {
      const r = await api<{ url: string }>("/api/auth/discord/link-url");
      window.location.href = r.url;
      return;
    }
    setUser((u) => (u ? { ...u, discordLinked: true } : u));
  };

  const linkSteam = async () => {
    if (!MOCK) {
      const r = await api<{ url: string }>("/api/auth/steam/link-url");
      window.location.href = r.url;
      return;
    }
    setUser((u) => (u ? { ...u, steamLinked: true } : u));
  };

  const createTicket = async (subject: string, category: string, message = "Created from the player dashboard.") => {
    if (MOCK) {
      setTickets((t) => [
        { id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`, subject, category, status: "Open", createdAt: "Just now", lastReply: "Just now" },
        ...t,
      ]);
      return;
    }

    const r = await api<{ ticket: any }>("/api/player/tickets", { method: "POST", body: { subject, category, message } });
    setTickets((t) => [normalizeTicket(r.ticket), ...t]);
  };

  const isAdmin = user?.role === "Master Admin" || user?.role === "Admin";

  const value: AuthContextType = { user, tickets, characters, loading, isAdmin, login, register, logout, loginDiscord, loginSteam, completeOAuth, linkDiscord, linkSteam, createTicket };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
