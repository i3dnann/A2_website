import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Ticket = {
  id: string;
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
};

export type AppUser = {
  username: string;
  email: string;
  joinDate: string;
  discordLinked: boolean;
  steamLinked: boolean;
  banned: boolean;
  role: "Citizen" | "Support" | "Moderator" | "Admin" | "Master Admin";
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
  linkDiscord: () => Promise<void>;
  linkSteam: () => Promise<void>;
  createTicket: (subject: string, category: string) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = "a2studio_session";

const MOCK_CHARACTERS: Character[] = [
  { id: "c1", name: "Marcus Halloway", job: "Police Officer", grade: "Sergeant", cash: 2450, bank: 48200, playtime: "142h" },
  { id: "c2", name: "Isabella Cruz", job: "Civilian", grade: "Entrepreneur", cash: 890, bank: 12750, playtime: "76h" },
];

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
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: "TCK-1042", subject: "Vehicle disappeared after restart", category: "Bug Report", status: "Open", createdAt: "Feb 10, 2026", lastReply: "2 hours ago" },
    { id: "TCK-1038", subject: "Question about whitelist application", category: "General Support", status: "Pending", createdAt: "Feb 05, 2026", lastReply: "1 day ago" },
    { id: "TCK-0994", subject: "Reporting a rule breaker", category: "Player Report", status: "Closed", createdAt: "Jan 22, 2026", lastReply: "3 weeks ago" },
  ]);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login: AuthContextType["login"] = async (email, password) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1100));
    setLoading(false);
    if (!email || !password) return { ok: false, error: "Please enter your email and password." };

    // Demo admin login
    if (email === "admin@a2studio.gg" && password === "admin123") {
      setUser({
        username: "MasterAdmin",
        email: "admin@a2studio.gg",
        joinDate: "January 1, 2022",
        discordLinked: true,
        steamLinked: true,
        banned: false,
        role: "Master Admin",
      });
      return { ok: true };
    }

    if (password.length < 4) return { ok: false, error: "Incorrect email or password." };
    const username = email.split("@")[0];
    setUser({
      username: username.charAt(0).toUpperCase() + username.slice(1),
      email,
      joinDate: "March 14, 2024",
      discordLinked: true,
      steamLinked: false,
      banned: false,
      role: "Citizen",
    });
    return { ok: true };
  };

  const register: AuthContextType["register"] = async (username, email, password) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1300));
    setLoading(false);
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
  };

  const logout = () => setUser(null);

  const linkDiscord = async () => {
    await new Promise((r) => setTimeout(r, 900));
    setUser((u) => (u ? { ...u, discordLinked: true } : u));
  };

  const linkSteam = async () => {
    await new Promise((r) => setTimeout(r, 900));
    setUser((u) => (u ? { ...u, steamLinked: true } : u));
  };

  const createTicket = (subject: string, category: string) => {
    setTickets((t) => [
      { id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`, subject, category, status: "Open", createdAt: "Just now", lastReply: "Just now" },
      ...t,
    ]);
  };

  const characters = useMemo(() => (user?.steamLinked ? MOCK_CHARACTERS : []), [user?.steamLinked]);
  const isAdmin = user?.role === "Master Admin" || user?.role === "Admin";

  const value: AuthContextType = { user, tickets, characters, loading, isAdmin, login, register, logout, linkDiscord, linkSteam, createTicket };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
