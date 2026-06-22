import { Router } from "express";
import { randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { fetch } from "undici";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authLimiter } from "../middleware/security.js";
import { cookieOptions, requireAuth } from "../middleware/auth.js";
import { discordAuthorizeUrl, discordConfigured, exchangeDiscordCode, getDiscordMemberRoles, getDiscordUser } from "../services/discord.js";
import { getUserById, linkProvider, listProvidersForUser, loginEmailUser, loginOrCreateProviderUser, registerEmailUser, saveTermsAgreement } from "../services/users.js";
import { env } from "../config/env.js";
import { auditAction } from "../services/audit.js";
import { sendWebhook } from "../services/webhook.js";
import { kickConfigured } from "../services/kickService.js";

const router = Router();
const oauthStates = new Map();
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_EXPIRES_IN = "30d";

const registerSchema = z.object({
  username: z.string().min(2).max(80),
  email: z.string().email().max(190),
  password: z.string().min(8).max(200),
  termsVersion: z.string().max(40).default("1.0.0")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function createState(payload) {
  const state = randomUUID();
  oauthStates.set(state, { ...payload, createdAt: Date.now() });
  return state;
}

function readState(state) {
  const payload = oauthStates.get(state);
  oauthStates.delete(state);
  if (!payload || Date.now() - payload.createdAt > 15 * 60 * 1000) return null;
  return payload;
}

function setSession(res, user) {
  const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: SESSION_EXPIRES_IN });
  res.cookie("a2_session", token, { ...cookieOptions, maxAge: SESSION_MAX_AGE_MS });
  return token;
}

async function finishOAuth(req, res, user, action) {
  const token = setSession(res, user);
  await auditAction({ req: { ...req, user }, action, targetType: "web_users", targetId: user.id, webhookCategory: "security" });
  return res.redirect(`${env.FRONTEND_URL}/auth/complete?token=${encodeURIComponent(token)}`);
}

router.get("/providers", (_req, res) => {
  res.json({
    discord: { configured: discordConfigured() },
    steam: {
      configured: Boolean(env.STEAM_REALM && env.STEAM_RETURN_URL),
      setupWarning: env.STEAM_API_KEY ? "" : "Steam API key is missing. OpenID linking can still work, but profile enrichment is disabled."
    },
    twitch: { configured: Boolean(env.TWITCH_CLIENT_ID && env.TWITCH_CLIENT_SECRET) },
    kick: { configured: Boolean(env.KICK_API_KEY || kickConfigured()) }
  });
});

router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body || {});
    const user = await registerEmailUser({ ...body, ipAddress: req.ip });
    const token = setSession(res, user);
    await sendWebhook("accounts", {
      title: "User account created",
      Username: user.username,
      Email: user.email,
      User: user.id
    });
    res.status(201).json({ user, token });
  })
);

router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body || {});
    const user = await loginEmailUser(body);
    const token = setSession(res, user);
    await auditAction({ req: { ...req, user }, action: "email_login", targetType: "web_users", targetId: user.id, webhookCategory: "security" });
    res.json({ user, token });
  })
);

router.get("/discord/link-url", requireAuth, authLimiter, (req, res) => {
  if (!discordConfigured()) return res.status(503).json({ error: "discord_oauth_not_configured" });
  const state = createState({ provider: "discord", mode: "link", userId: req.user.id });
  res.json({ url: discordAuthorizeUrl(state) });
});

router.get("/steam/link-url", requireAuth, authLimiter, (req, res) => {
  if (!env.STEAM_REALM || !env.STEAM_RETURN_URL) return res.status(503).json({ error: "steam_openid_not_configured" });
  const state = createState({ provider: "steam", mode: "link", userId: req.user.id });
  res.json({ url: steamOpenIdUrl(state) });
});

router.get("/discord", authLimiter, (req, res) => {
  if (!discordConfigured()) return res.status(503).json({ error: "discord_oauth_not_configured" });
  const mode = req.query.mode === "link" ? "link" : "login";
  if (mode === "link" && !req.user) return res.status(401).json({ error: "login_required", message: "Use /api/auth/discord/link-url from the logged-in account page." });
  const state = createState({ provider: "discord", mode, userId: req.user?.id || null });
  res.redirect(discordAuthorizeUrl(state));
});

router.get(
  "/discord/callback",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { code, state } = req.query;
    const oauthState = readState(state);
    if (!code || !oauthState) return res.status(400).send("Invalid OAuth state.");

    const token = await exchangeDiscordCode(code);
    const [discordUser, roles] = await Promise.all([getDiscordUser(token.access_token), getDiscordMemberRoles(token.access_token)]);
    const profile = {
      username: discordUser.global_name || discordUser.username,
      email: discordUser.email || "",
      avatar_url: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : "",
      roles
    };

    if (oauthState.mode === "link") {
      const user = await linkProvider(oauthState.userId, "discord", discordUser.id, profile);
      return finishOAuth(req, res, user, "discord_link");
    }

    const user = await loginOrCreateProviderUser("discord", discordUser.id, profile, req.cookies?.a2_language || "en");
    return finishOAuth(req, res, user, "discord_login");
  })
);

function steamOpenIdUrl(state) {
  const returnTo = new URL(env.STEAM_RETURN_URL);
  returnTo.searchParams.set("state", state);
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo.toString(),
    "openid.realm": env.STEAM_REALM,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select"
  });
  return `https://steamcommunity.com/openid/login?${params.toString()}`;
}

async function verifySteamOpenId(query) {
  const body = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (key.startsWith("openid.")) body.set(key, String(value));
  });
  body.set("openid.mode", "check_authentication");
  const response = await fetch("https://steamcommunity.com/openid/login", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
  const text = await response.text();
  if (!text.includes("is_valid:true")) return null;
  const claimedId = String(query["openid.claimed_id"] || "");
  const match = claimedId.match(/\/id\/(\d+)$/);
  return match?.[1] || null;
}

router.get("/steam", authLimiter, (req, res) => {
  if (!env.STEAM_REALM || !env.STEAM_RETURN_URL) return res.status(503).json({ error: "steam_openid_not_configured" });
  const mode = req.query.mode === "link" ? "link" : "login";
  if (mode === "link" && !req.user) return res.status(401).json({ error: "login_required", message: "Use /api/auth/steam/link-url from the logged-in account page." });
  const state = createState({ provider: "steam", mode, userId: req.user?.id || null });
  res.redirect(steamOpenIdUrl(state));
});

router.get(
  "/steam/callback",
  authLimiter,
  asyncHandler(async (req, res) => {
    const oauthState = readState(req.query.state);
    if (!oauthState) return res.status(400).send("Invalid Steam state.");
    const steamId = await verifySteamOpenId(req.query);
    if (!steamId) return res.status(400).send("Steam OpenID verification failed.");
    const profile = { username: `Steam ${steamId}`, steam_id: steamId };

    if (oauthState.mode === "link") {
      const user = await linkProvider(oauthState.userId, "steam", steamId, profile);
      return finishOAuth(req, res, user, "steam_link");
    }

    const user = await loginOrCreateProviderUser("steam", steamId, profile, req.cookies?.a2_language || "en");
    return finishOAuth(req, res, user, "steam_login");
  })
);

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    if (!req.user) return res.json({ user: null, providers: [] });
    const providers = await listProvidersForUser(req.user.id);
    res.json({ user: await getUserById(req.user.id), providers });
  })
);

router.post("/terms-agreement", requireAuth, asyncHandler(async (req, res) => {
  const agreement = await saveTermsAgreement({ userId: req.user.id, termsVersion: req.body?.termsVersion || "1.0.0", ipAddress: req.ip });
  res.json({ agreement });
}));

router.post("/language", asyncHandler(async (req, res) => {
  const language = req.body?.language === "ar" ? "ar" : "en";
  res.cookie("a2_language", language, { sameSite: "lax", maxAge: 365 * 24 * 60 * 60 * 1000 });
  res.json({ language });
}));

router.get("/csrf", (_req, res) => {
  const token = randomBytes(24).toString("hex");
  res.cookie("a2_csrf", token, { sameSite: "lax", maxAge: 12 * 60 * 60 * 1000 });
  res.json({ token });
});

router.post("/logout", requireAuth, asyncHandler(async (req, res) => {
  res.clearCookie("a2_session");
  await auditAction({ req, action: "logout", targetType: "web_users", targetId: req.user.id, webhookCategory: "security" });
  res.json({ ok: true });
}));

export default router;
