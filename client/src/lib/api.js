const runtimeBase =
  typeof window !== "undefined"
    ? window.__A2_API_BASE_URL__ || localStorage.getItem("a2_api_base_url") || ""
    : "";

export const API_BASE = runtimeBase || import.meta.env.VITE_API_BASE_URL || "";

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function request(path, options = {}) {
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("a2_session_token") : "";
  const ngrokHeaders = API_BASE.includes("ngrok-free.") ? { "ngrok-skip-browser-warning": "true" } : {};
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...ngrokHeaders,
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...(options.headers || {})
    },
    ...options,
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path, body) => request(path, { method: "DELETE", body })
};

export function imageFallback(seed, width = 900, height = 500) {
  const label = encodeURIComponent(seed || "A2 Studio");
  return `https://dummyimage.com/${width}x${height}/111111/b7fe1a&text=${label}`;
}
