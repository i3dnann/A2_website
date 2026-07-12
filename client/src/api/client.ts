/**
 * Central API client. Talks to the secure backend.
 * Set VITE_API_BASE_URL to your deployed backend (e.g. http://YOUR-VPS-IP:3001).
 * When no explicit URL is configured, requests use the same-origin /api proxy.
 */
import axios, { AxiosError } from "axios";

declare global {
  interface Window {
    __GOTHAM_API_BASE_URL__?: string;
    __A2_API_BASE_URL__?: string;
  }
}

function cleanBaseUrl(value?: string) {
  return String(value || "").trim().replace(/\/+$/, "");
}

const runtimeApiUrl =
  typeof window !== "undefined"
    ? cleanBaseUrl(window.__GOTHAM_API_BASE_URL__ || window.__A2_API_BASE_URL__)
    : "";

const configuredApiUrl = cleanBaseUrl(
  runtimeApiUrl ||
    (import.meta.env.VITE_API_BASE_URL as string) ||
    (import.meta.env.VITE_API_URL as string)
);
const staleRuntimeApi =
  /ngrok-free\.dev/i.test(configuredApiUrl) ||
  /ancient-liver-drool/i.test(configuredApiUrl);
const unsafeHttpOnHttps =
  typeof window !== "undefined" &&
  window.location.protocol === "https:" &&
  /^http:\/\//i.test(configuredApiUrl);

export const API_URL = unsafeHttpOnHttps || staleRuntimeApi ? "" : configuredApiUrl;
export const USING_RELATIVE_API = !API_URL;
export const AUTH_INVALIDATED_EVENT = "gotham:auth-invalidated";
export const AUTH_STORAGE_KEYS = ["a2_token", "a2studio_session"] as const;

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  AUTH_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
}

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_URL) return path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

const http = axios.create({
  baseURL: API_URL || undefined,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache",
    Pragma: "no-cache",
  },
});

http.interceptors.request.use((config) => {
  const t = typeof localStorage !== "undefined" ? localStorage.getItem("a2_token") : null;
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    const status = error.response?.status;
    const code = String(error.response?.data?.error || "");
    const invalidSession = status === 401 || (status === 403 && ["invalid_token", "invalid_session", "account_disabled"].includes(code));
    if (invalidSession && typeof window !== "undefined") {
      clearStoredAuth();
      window.dispatchEvent(new CustomEvent(AUTH_INVALIDATED_EVENT));
    }
    return Promise.reject(error);
  }
);

export async function api<T>(path: string, opts: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: any; params?: Record<string, any> } = {}): Promise<T> {
  try {
    const res = await http.request({ url: path, method: opts.method || "GET", data: opts.body, params: opts.params });
    return res.data as T;
  } catch (err) {
    const e = err as AxiosError<{ error?: string; message?: string }>;
    const code = e.response?.data?.error;
    const friendly: Record<string, string> = {
      resource_not_found: "This admin section is not available on the running backend. Pull the latest backend files and restart PM2.",
      not_found: "That item could not be found. Refresh the page and try again.",
      cors_origin_not_allowed: "The backend rejected this website URL. Add it to CORS_ALLOWED_ORIGINS or CORS_ORIGINS in the VPS .env."
    };
    const networkHint = e.message === "Network Error"
      ? "Network Error: the website could not reach the backend. On Netlify, use the built-in /api proxy or an HTTPS backend URL."
      : e.message;
    throw new Error(e.response?.data?.message || (code ? friendly[code] || code : "") || networkHint || "Request failed");
  }
}

export function upload(path: string, form: FormData, opts: { method?: "POST" | "PATCH" } = {}) {
  return http.request({ url: path, method: opts.method || "POST", data: form, headers: { "Content-Type": "multipart/form-data" } });
}

// ──────────────────────────────────────────────────────────────────────
// Live server polling helper (fallback when WS isn't available)
// ──────────────────────────────────────────────────────────────────────
export type LiveState = {
  players: { id: number; name: string }[];
  count: number;
  maxplayers: number;
  status: "online" | "offline" | "reconnecting" | "not_configured";
  queue: number;
  announcement: string;
  lastUpdate: number | null;
  configured?: boolean;
  serverName?: string;
  latency?: number | null;
  error?: string;
};

export function createLiveSubscriber(onUpdate: (s: LiveState) => void) {
  let ws: WebSocket | null = null;
  let pollTimer: number | null = null;
  let usePolling = !API_URL;
  let stopped = false;

  const connect = () => {
    if (stopped || !API_URL) {
      usePolling = true;
      startPolling();
      return;
    }
    try {
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      const host = new URL(API_URL).host;
      ws = new WebSocket(`${proto}://${host}/ws/live`);
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "live") onUpdate({ ...msg.data, status: "online" });
        } catch {}
      };
      ws.onclose = () => {
        ws = null;
        if (stopped) return;
        // fallback to polling
        usePolling = true;
        startPolling();
        setTimeout(() => {
          if (!stopped) { usePolling = false; startPolling(); connect(); }
        }, 30_000);
      };
      ws.onerror = () => ws?.close();
    } catch {
      usePolling = true;
      startPolling();
    }
  };

  const startPolling = () => {
    if (pollTimer !== null) return;
    const tick = async () => {
      if (stopped || usePolling === false) return;
      try {
        const data = await api<LiveState>("/api/live");
        onUpdate(data);
      } catch {
        onUpdate({ players: [], count: 0, maxplayers: 0, status: "offline", queue: 0, announcement: "", lastUpdate: Date.now(), configured: true, error: "status_unavailable" });
      }
    };
    tick();
    pollTimer = window.setInterval(tick, 15_000);
  };

  if (usePolling) startPolling();
  else connect();

  return {
    stop: () => {
      stopped = true;
      ws?.close();
      if (pollTimer !== null) window.clearInterval(pollTimer);
    },
  };
}
