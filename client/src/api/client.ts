/**
 * Small same-origin API client. Production requests use the Netlify /api proxy;
 * local Vite requests use vite.config.ts's matching proxy.
 */

declare global {
  interface Window {
    __GOTHAM_API_BASE_URL__?: string;
    __A2_API_BASE_URL__?: string;
  }
}

function cleanBaseUrl(value?: string) {
  return String(value || "").trim().replace(/\/+$/, "");
}

const runtimeApiUrl = typeof window !== "undefined"
  ? cleanBaseUrl(window.__GOTHAM_API_BASE_URL__ || window.__A2_API_BASE_URL__)
  : "";
const configuredApiUrl = cleanBaseUrl(
  runtimeApiUrl ||
  (import.meta.env.VITE_API_BASE_URL as string) ||
  (import.meta.env.VITE_API_URL as string),
);
const staleRuntimeApi = /ngrok-free\.dev|ancient-liver-drool/i.test(configuredApiUrl);
const unsafeHttpOnHttps = typeof window !== "undefined" && window.location.protocol === "https:" && /^http:\/\//i.test(configuredApiUrl);

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

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, unknown>;
};

type ErrorPayload = { error?: string; message?: string };

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let cachedCsrfToken = "";

const FRIENDLY_ERRORS: Record<string, string> = {
  resource_not_found: "This admin section is not available on the running backend. Pull the latest backend files and restart PM2.",
  not_found: "That item could not be found. Refresh the page and try again.",
  cors_origin_not_allowed: "The backend rejected this website URL. Add it to CORS_ALLOWED_ORIGINS or CORS_ORIGINS in the VPS .env.",
};

function requestUrl(path: string, params?: Record<string, unknown>) {
  const url = new URL(apiUrl(path), window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function getCsrfToken(forceRefresh = false): Promise<string> {
  if (cachedCsrfToken && !forceRefresh) return cachedCsrfToken;

  const response = await fetch(requestUrl("/api/auth/csrf"), {
    method: "GET",
    headers: new Headers({ Accept: "application/json" }),
    credentials: "include",
    cache: "no-store",
  });

  const text = await response.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error("The API returned an invalid CSRF response.");
    }
  }

  if (!response.ok || !payload?.token) {
    const code = String(payload?.error || "");
    throw new Error(payload?.message || FRIENDLY_ERRORS[code] || code || "Could not obtain CSRF token.");
  }

  cachedCsrfToken = String(payload.token);
  return cachedCsrfToken;
}

async function request<T>(
  path: string,
  opts: ApiOptions = {},
  form?: FormData,
  csrfRetry = false,
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  const method = opts.method || "GET";

  try {
    const token = window.localStorage.getItem("a2_token");
    const headers = new Headers({ Accept: "application/json" });

    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (!form && opts.body !== undefined) headers.set("Content-Type", "application/json");

    if (UNSAFE_METHODS.has(method)) {
      const csrfToken = await getCsrfToken(csrfRetry);
      headers.set("x-csrf-token", csrfToken);
    }

    const response = await fetch(requestUrl(path, opts.params), {
      method,
      headers,
      body: form || (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await response.text();
    let payload: any = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error("The API returned an invalid response. Check the /api proxy and backend status.");
      }
    }

    if (response.status === 403 && payload?.error === "csrf_token_required" && !csrfRetry) {
      cachedCsrfToken = "";
      return request<T>(path, opts, form, true);
    }

    if (!response.ok) {
      const errorPayload = (payload || {}) as ErrorPayload;
      const code = String(errorPayload.error || "");
      if (response.status === 401 || (response.status === 403 && ["invalid_token", "invalid_session", "account_disabled"].includes(code))) {
        clearStoredAuth();
        cachedCsrfToken = "";
        window.dispatchEvent(new CustomEvent(AUTH_INVALIDATED_EVENT));
      }
      throw new Error(errorPayload.message || FRIENDLY_ERRORS[code] || code || `Request failed (${response.status})`);
    }

    return payload as T;
  } catch (error: any) {
    if (error?.name === "AbortError") throw new Error("The server took too long to respond.");
    if (error instanceof TypeError) throw new Error("Network Error: the website could not reach the backend.");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function api<T>(path: string, opts: ApiOptions = {}) {
  return request<T>(path, opts);
}

export async function upload(path: string, form: FormData) {
  const data = await request<any>(path, { method: "POST" }, form);
  return { data };
}

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

export function createLiveSubscriber(onUpdate: (state: LiveState) => void) {
  let stopped = false;
  let inFlight = false;
  let lastHealthyState: LiveState | null = null;

  const tick = async () => {
    if (stopped || inFlight || document.visibilityState === "hidden") return;
    inFlight = true;
    try {
      const data = await api<LiveState>("/api/live");
      lastHealthyState = data;
      onUpdate(data);
    } catch {
      onUpdate(lastHealthyState
        ? { ...lastHealthyState, status: "reconnecting", error: "status_reconnecting" }
        : { players: [], count: 0, maxplayers: 0, status: "offline", queue: 0, announcement: "", lastUpdate: Date.now(), configured: true, latency: null, error: "status_unavailable" });
    } finally {
      inFlight = false;
    }
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") void tick();
  };
  const onOnline = () => void tick();
  void tick();
  const pollTimer = window.setInterval(tick, 30_000);
  document.addEventListener("visibilitychange", onVisibility, { passive: true });
  window.addEventListener("online", onOnline, { passive: true });

  return {
    stop: () => {
      stopped = true;
      window.clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    },
  };
}
