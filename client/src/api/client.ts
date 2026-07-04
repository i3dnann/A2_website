/**
 * Central API client. Talks to the secure backend.
 * Set VITE_API_BASE_URL to your deployed backend (e.g. http://YOUR-VPS-IP:3001).
 * In mock mode (backend unreachable) we fall back to local context data.
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

export const API_URL = cleanBaseUrl(
  runtimeApiUrl ||
    (import.meta.env.VITE_API_BASE_URL as string) ||
    (import.meta.env.VITE_API_URL as string)
);
export const MOCK = !API_URL;

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

const http = axios.create({
  baseURL: API_URL || undefined,
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const t = typeof localStorage !== "undefined" ? localStorage.getItem("a2_token") : null;
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export async function api<T>(path: string, opts: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: any; params?: Record<string, any> } = {}): Promise<T> {
  try {
    const res = await http.request({ url: path, method: opts.method || "GET", data: opts.body, params: opts.params });
    return res.data as T;
  } catch (err) {
    const e = err as AxiosError<{ error?: string }>;
    throw new Error(e.response?.data?.error || e.message || "Request failed");
  }
}

export function upload(path: string, form: FormData) {
  return http.post(path, form, { headers: { "Content-Type": "multipart/form-data" } });
}

// ──────────────────────────────────────────────────────────────────────
// Live server polling helper (fallback when WS isn't available)
// ──────────────────────────────────────────────────────────────────────
export type LiveState = {
  players: { id: number; name: string }[];
  count: number;
  maxplayers: number;
  status: "online" | "offline" | "reconnecting";
  queue: number;
  announcement: string;
  lastUpdate: number | null;
};

export function createLiveSubscriber(onUpdate: (s: LiveState) => void) {
  let ws: WebSocket | null = null;
  let pollTimer: number | null = null;
  let usePolling = MOCK || !API_URL;
  let stopped = false;

  const connect = () => {
    if (stopped || !API_URL) return;
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
        onUpdate({ players: [], count: 0, maxplayers: 0, status: "offline", queue: 0, announcement: "", lastUpdate: Date.now() });
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
