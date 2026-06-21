import { cookieSameSite, cookieSecure } from "../config/env.js";
import { getUserById, verifyUserToken } from "../services/users.js";

export const cookieOptions = {
  httpOnly: true,
  sameSite: cookieSameSite,
  secure: cookieSameSite === "none" ? true : cookieSecure,
  maxAge: 12 * 60 * 60 * 1000
};

function tokenFromRequest(req) {
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
  return req.cookies?.a2_session || bearer || null;
}

export async function optionalAuth(req, _res, next) {
  const token = tokenFromRequest(req);
  if (!token) return next();

  const payload = verifyUserToken(token);
  if (!payload?.sub) return next();

  const user = await getUserById(payload.sub);
  if (user?.account_status === "active") req.user = user;
  return next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "login_required" });
  return next();
}

export function requirePermission(permission) {
  return (req, res, next) => {
    const permissions = req.user?.permissions || [];
    const isAdminPermission = permission !== "view_player_portal";
    if (isAdminPermission && ["frozen", "disabled"].includes(req.user?.admin_status)) {
      return res.status(403).json({ error: "admin_account_frozen_or_disabled" });
    }
    if (permissions.includes("master_access") || permissions.includes(permission)) return next();
    return res.status(403).json({ error: "missing_permission", permission });
  };
}

export function requireMaster(req, res, next) {
  if (req.user?.permissions?.includes("master_access")) return next();
  return res.status(403).json({ error: "master_access_required" });
}
