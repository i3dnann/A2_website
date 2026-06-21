import { Router } from "express";
import { randomUUID } from "node:crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authLimiter } from "../middleware/security.js";
import { cookieOptions, requireAuth } from "../middleware/auth.js";
import { discordAuthorizeUrl, discordConfigured, exchangeDiscordCode, getDiscordMemberRoles, getDiscordUser } from "../services/discord.js";
import { getDevUser, signUser, upsertDiscordUser } from "../services/users.js";
import { env, isProduction } from "../config/env.js";
import { auditAction } from "../services/audit.js";

const router = Router();
const oauthStates = new Set();

router.get("/discord", authLimiter, (req, res) => {
  if (!discordConfigured()) {
    return res.status(503).json({ error: "discord_oauth_not_configured" });
  }
  const state = randomUUID();
  oauthStates.add(state);
  res.redirect(discordAuthorizeUrl(state));
});

router.get(
  "/discord/callback",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { code, state } = req.query;
    if (!code || !state || !oauthStates.has(state)) return res.status(400).send("Invalid OAuth state.");
    oauthStates.delete(state);

    const token = await exchangeDiscordCode(code);
    const [discordUser, roles] = await Promise.all([getDiscordUser(token.access_token), getDiscordMemberRoles(token.access_token)]);
    const preferredLanguage = req.cookies?.a2_language || "en";
    const user = await upsertDiscordUser(discordUser, roles, preferredLanguage);
    res.cookie("a2_session", signUser(user), cookieOptions);
    await auditAction({ req: { ...req, user }, action: "discord_login", targetType: "web_users", targetId: user.id, webhookCategory: "security" });
    return res.redirect(`${env.FRONTEND_URL}/player/dashboard`);
  })
);

router.post(
  "/dev-login",
  authLimiter,
  asyncHandler(async (req, res) => {
    if (isProduction && process.env.ENABLE_DEV_LOGIN !== "true") {
      return res.status(403).json({ error: "dev_login_disabled" });
    }
    const user = await getDevUser();
    res.cookie("a2_session", signUser(user), cookieOptions);
    await auditAction({ req: { ...req, user }, action: "dev_login", targetType: "web_users", targetId: user.id, webhookCategory: "security" });
    return res.json({ user });
  })
);

router.get("/me", (req, res) => {
  res.json({ user: req.user || null });
});

router.post("/language", asyncHandler(async (req, res) => {
  const language = req.body?.language === "ar" ? "ar" : "en";
  res.cookie("a2_language", language, { sameSite: "lax", maxAge: 365 * 24 * 60 * 60 * 1000 });
  res.json({ language });
}));

router.post("/logout", requireAuth, asyncHandler(async (req, res) => {
  res.clearCookie("a2_session");
  await auditAction({ req, action: "logout", targetType: "web_users", targetId: req.user.id, webhookCategory: "security" });
  res.json({ ok: true });
}));

export default router;
