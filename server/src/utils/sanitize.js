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
