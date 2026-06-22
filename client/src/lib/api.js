const runtimeBase =
  typeof window !== "undefined"
    ? window.__GOTHAM_API_BASE_URL__ || window.__A2_API_BASE_URL__ || localStorage.getItem("gotham_api_base_url") || localStorage.getItem("a2_api_base_url") || ""
    : "";

export const API_BASE = runtimeBase || import.meta.env.VITE_API_BASE_URL || "";

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function request(path, options = {}) {
  const { body, headers, ...requestOptions } = options;
  const sessionToken =
    typeof window !== "undefined"
      ? localStorage.getItem("gotham_session_token") || localStorage.getItem("a2_session_token") || ""
      : "";
  const ngrokHeaders = API_BASE.includes("ngrok-free.") ? { "ngrok-skip-browser-warning": "true" } : {};
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...requestOptions,
    cache: "no-store",
    credentials: "include",
    headers: {
      ...(isForm ? {} : { "content-type": "application/json" }),
      ...ngrokHeaders,
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...(headers || {})
    },
    body: body && !isForm && typeof body !== "string" ? JSON.stringify(body) : body
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
  delete: (path, body) => request(path, { method: "DELETE", body }),
  upload: (path, formData) => request(path, { method: "POST", body: formData })
};

export function imageFallback(seed, width = 900, height = 500) {
  const label = encodeURIComponent(seed || "Gotham City");
  return `https://dummyimage.com/${width}x${height}/111111/ef4444&text=${label}`;
}
