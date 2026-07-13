import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AUTH_INVALIDATED_EVENT, api, apiUrl, clearStoredAuth } from "../api/client";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseAuth, firebaseConfigured } from "../lib/firebase";
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
  verifiedBadge?: boolean;
  verifiedAt?: string | null;
  verificationStatus?: string;
};

type AuthContextType = {
  user: AppUser | null;
  tickets: Ticket[];
  characters: Character[];
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  loginDiscord: () => void;
  loginSteam: () => void;
  completeOAuth: (token: string) => Promise<void>;
  linkDiscord: () => Promise<void>;
  linkSteam: () => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  createTicket: (subject: string, category: string, message?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

type ProviderRow = {
  provider: string;
  provider_user_id?: string;
  avatar_url?: string;
};

type BackendUser = Partial<AppUser> & {
  id?: string;
  roles?: string[];
  created_at?: string | null;
  account_status?: string;
  discord_id?: string;
  steam_id?: string;
  avatar_url?: string;
  verified_badge?: boolean | number | string;
  verified_at?: string | null;
  verification_status?: string;
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
  const discordAvatar = providers.find((provider) => provider.provider === "discord")?.avatar_url || "";
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
    avatarUrl: raw.avatarUrl || raw.avatar_url || discordAvatar,
    verifiedBadge: Boolean(raw.verifiedBadge || raw.verified_badge === true || raw.verified_badge === 1 || raw.verified_badge === "1"),
    verifiedAt: raw.verifiedAt || raw.verified_at || null,
    verificationStatus: raw.verificationStatus || raw.verification_status || "none",
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<{ user: BackendUser | null; providers: ProviderRow[] }>("/api/auth/me")
      .then((r) => {
        if (!cancelled) setUser(r.user ? normalizeUser(r.user, r.providers) : null);
      })
      .catch(() => {
        clearStoredAuth();
        if (!cancelled) setUser(null);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const invalidate = () => {
      setUser(null);
      setTickets([]);
      setCharacters([]);
      setLoading(false);
    };
    window.addEventListener(AUTH_INVALIDATED_EVENT, invalidate);
    return () => window.removeEventListener(AUTH_INVALIDATED_EVENT, invalidate);
  }, []);

  useEffect(() => {
    if (!user) {
      setTickets([]);
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
      clearStoredAuth();
      if (!firebaseConfigured) throw new Error("Firebase email authentication is not configured.");
      const credential = await signInWithEmailAndPassword(firebaseAuth!, email, password);
      const r = await api<{ token: string; user: BackendUser }>("/api/auth/firebase-session", { method: "POST", body: { idToken: await credential.user.getIdToken() } });
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
      clearStoredAuth();
      if (!firebaseConfigured) throw new Error("Firebase email authentication is not configured.");
      const credential = await createUserWithEmailAndPassword(firebaseAuth!, email, password);
      const r = await api<{ token: string; user: BackendUser }>("/api/auth/firebase-session", { method: "POST", body: { idToken: await credential.user.getIdToken(), username, create: true } });
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
    try { await api("/api/auth/logout", { method: "POST" }); } catch {}
    try { if (firebaseAuth) await signOut(firebaseAuth); } catch {}
    clearStoredAuth();
    setUser(null);
    setTickets([]);
    setCharacters([]);
  };

  const resetPassword: AuthContextType["resetPassword"] = async (email) => {
    try {
      if (!firebaseConfigured) throw new Error("Firebase email authentication is not configured.");
      await sendPasswordResetEmail(firebaseAuth!, email);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Could not send password reset email." };
    }
  };

  const completeOAuth = async (token: string) => {
    clearStoredAuth();
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
    clearStoredAuth();
    window.location.href = apiUrl("/api/auth/discord");
  };

  const loginSteam = () => {
    clearStoredAuth();
    window.location.href = apiUrl("/api/auth/steam");
  };

  const linkDiscord = async () => {
    const r = await api<{ url: string }>("/api/auth/discord/link-url");
    window.location.href = r.url;
  };

  const linkSteam = async () => {
    const r = await api<{ url: string }>("/api/auth/steam/link-url");
    window.location.href = r.url;
  };

  const updateEmail = async (email: string) => {
    const r = await api<{ user: BackendUser }>("/api/account/email", { method: "PATCH", body: { email } });
    setUser((current) => current ? normalizeUser({ ...current, ...r.user }) : normalizeUser(r.user));
  };

  const createTicket = async (subject: string, category: string, message = "Created from the player dashboard.") => {
    const r = await api<{ ticket: any }>("/api/player/tickets", { method: "POST", body: { subject, category, message } });
    setTickets((t) => [normalizeTicket(r.ticket), ...t]);
  };

  const isAdmin = user?.role === "Master Admin" || user?.role === "Admin";

  const value: AuthContextType = { user, tickets, characters, loading, isAdmin, login, register, resetPassword, logout, loginDiscord, loginSteam, completeOAuth, linkDiscord, linkSteam, updateEmail, createTicket };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
