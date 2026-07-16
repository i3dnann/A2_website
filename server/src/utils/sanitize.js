export function safeJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function toBoolean(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

export function publicFileUrl(req, file) {
  if (!file) return null;
  return `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
}

export function pickAllowed(input, allowedKeys) {
  return Object.fromEntries(
    Object.entries(input || {}).filter(([key, value]) => allowedKeys.includes(key) && value !== undefined)
  );
}

export function isUrlLikeKey(key) {
  return /(^|_)(url|link|href)$/i.test(String(key || "")) || /(Url|Link|Href)$/.test(String(key || ""));
}

export function safeUrl(value, { allowRelative = true, allowFivem = true } = {}) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/[\u0000-\u001f\u007f]/.test(raw)) return "";
  if (/^\/(?!\/)/.test(raw)) return allowRelative ? raw : "";
  try {
    const parsed = new URL(raw);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === "http:" || protocol === "https:") return parsed.toString();
    if (allowFivem && protocol === "fivem:") return raw;
    if (protocol === "mailto:") return raw;
    return "";
  } catch {
    return "";
  }
}

export function sanitizeUrlFields(value) {
  if (Array.isArray(value)) return value.map((item) => sanitizeUrlFields(item));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      isUrlLikeKey(key) ? safeUrl(item) : sanitizeUrlFields(item)
    ])
  );
}
