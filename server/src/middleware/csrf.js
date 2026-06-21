const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const openUnsafePaths = new Set(["/api/auth/login", "/api/auth/register", "/api/auth/logout"]);

export function csrfProtection(req, res, next) {
  if (!unsafeMethods.has(req.method)) return next();
  if (openUnsafePaths.has(req.path)) return next();
  if (!req.cookies?.a2_session) return next();
  if (req.headers.authorization?.startsWith("Bearer ")) return next();

  const cookieToken = req.cookies?.a2_csrf;
  const headerToken = req.headers["x-csrf-token"];
  if (cookieToken && headerToken && cookieToken === headerToken) return next();
  return res.status(403).json({ error: "csrf_token_required" });
}
