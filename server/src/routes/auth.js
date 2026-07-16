import { Router } from "express";
import { randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { fetch } from "undici";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authLimiter } from "../middleware/security.js";
import { cookieOptions, requireAuth } from "../middleware/auth.js";
import { discordAuthorizeUrl, discordConfigured, exchangeDiscordCode, getDiscordUser } from "../services/discord.js";
import { getUserById, isUserTokenCurrent, linkProvider, listProvidersForUser, loginEmailUser, loginOrCreateFirebaseUser, loginOrCreateProviderUser, registerEmailUser, revokeUserSessions, saveTermsAgreement, signUser, verifyUserToken } from "../services/users.js";
import { verifyFirebaseToken } from "../services/firebaseAuth.js";
import { assertAccountNotBlocked, recordUserIp } from "../services/accountBlocks.js";
import { env } from "../config/env.js";
import { auditAction } from "../services/audit.js";
import { sendWebhook } from "../services/webhook.js";

const router = Router();
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_EXPIRES_IN = "30d";
const OAUTH_STATE_EXPIRES_IN = "15m";
const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;
const PROCESS_OAUTH_STATE_SECRET = randomBytes(32).toString("hex");
const oauthTransactions = new Map();

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

function stateSecrets() {
  return [env.OAUTH_STATE_SECRET, PROCESS_OAUTH_STATE_SECRET]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);
}

function createState(payload) {
  const nonce = randomUUID();
  const expiresAt = Date.now() + OAUTH_STATE_TTL_MS;
  oauthTransactions.set(nonce, {
    provider: payload.provider,
    mode: payload.mode,
    userId: payload.userId || null,
    expiresAt
  });
  return jwt.sign(
    { nonce },
    stateSecrets()[0],
    { expiresIn: OAUTH_STATE_EXPIRES_IN }
  );
}

function readState(state) {
  for (const secret of stateSecrets()) {
    try {
      const payload = jwt.verify(String(state || ""), secret);
      const nonce = String(payload?.nonce || "");
      const transaction = oauthTransactions.get(nonce);
      oauthTransactions.delete(nonce);
      if (!transaction || transaction.expiresAt < Date.now()) return null;
      return transaction;
    } catch {}
  }
  return null;
}

function sameUser(left, right) {
  return left && right && String(left) === String(right);
}

function validateLinkState(req, res, oauthState, provider) {
  if (oauthState?.mode !== "link") return true;
  if (oauthState.provider !== provider) return false;
  if (!sameUser(oauthState.userId, req.user?.id)) {
    oauthError(res, provider === "steam" ? "invalid_steam_state" : "invalid_oauth_state");
    return false;
  }
  return true;
}

function oauthError(res, code) {
  const url = new URL("/auth/complete", env.FRONTEND_URL);
  url.searchParams.set("error", code);
  return res.redirect(url.toString());
}

function setSession(res, user) {
  const token = signUser(user);
  res.cookie("a2_session", token, { ...cookieOptions, maxAge: SESSION_MAX_AGE_MS });
  return token;
}

async function finishOAuth(req, res, user, action) {
  await recordUserIp(user.id, req.ip);
  setSession(res, user);
  await auditAction({ req: { ...req, user }, action, targetType: "web_users", targetId: user.id, webhookCategory: "security" });
  return res.redirect(`${env.FRONTEND_URL}/auth/complete`);
}

router.get("/providers", (_req, res) => {
  res.json({
    discord: { configured: discordConfigured() },
    steam: {
      configured: Boolean(env.STEAM_REALM && env.STEAM_RETURN_URL),
      setupWarning: env.STEAM_API_KEY ? "" : "Steam API key is missing. OpenID linking can still work, but profile enrichment is disabled."
    },
    twitch: { configured: Boolean(env.TWITCH_CLIENT_ID && env.TWITCH_CLIENT_SECRET) }
  });
});

const firebaseSessionSchema = z.object({
  idToken: z.string().min(1), username: z.string().min(2).max(80).optional(),
  create: z.boolean().default(false), termsVersion: z.string().max(40).default("1.0.0")
});

router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body || {});
    await assertAccountNotBlocked({ email: body.email, ipAddress: req.ip });
    const user = await registerEmailUser({ ...body, ipAddress: req.ip });
    await recordUserIp(user.id, req.ip);
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
    await assertAccountNotBlocked({ email: body.email, ipAddress: req.ip });
    const user = await loginEmailUser(body);
    await recordUserIp(user.id, req.ip);
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
    if (!code || !oauthState || oauthState.provider !== "discord") {
      console.warn("[oauth] Invalid Discord state", { hasCode: Boolean(code), hasState: Boolean(state), provider: oauthState?.provider || null });
      return oauthError(res, "invalid_oauth_state");
    }

    const token = await exchangeDiscordCode(code);
    const discordUser = await getDiscordUser(token.access_token);
    const profile = {
      username: discordUser.global_name || discordUser.username,
      avatar_url: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${discordUser.avatar.startsWith("a_") ? "gif" : "webp"}?size=128` : "",
      roles: []
    };
    await assertAccountNotBlocked({ provider: "discord", providerUserId: discordUser.id, ipAddress: req.ip });

    if (!validateLinkState(req, res, oauthState, "discord")) return;

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
    if (!oauthState || oauthState.provider !== "steam") {
      console.warn("[oauth] Invalid Steam state", { hasState: Boolean(req.query.state), provider: oauthState?.provider || null });
      return oauthError(res, "invalid_steam_state");
    }
    const steamId = await verifySteamOpenId(req.query);
    if (!steamId) return oauthError(res, "steam_verification_failed");
    const profile = { username: `Steam ${steamId}`, steam_id: steamId };
    await assertAccountNotBlocked({ provider: "steam", providerUserId: steamId, ipAddress: req.ip });

    if (!validateLinkState(req, res, oauthState, "steam")) return;

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

router.post("/firebase-session", authLimiter, asyncHandler(async (req, res) => {
  const body = firebaseSessionSchema.parse(req.body || {});
  const decoded = await verifyFirebaseToken(body.idToken);
  if (!decoded.email) throw Object.assign(new Error("firebase_email_required"), { status: 422 });
  await assertAccountNotBlocked({ email: decoded.email, ipAddress: req.ip });
  const user = await loginOrCreateFirebaseUser({ uid: decoded.uid, email: decoded.email, emailVerified: decoded.email_verified, username: body.username, create: body.create, termsVersion: body.termsVersion, ipAddress: req.ip });
  await recordUserIp(user.id, req.ip);
  const token = setSession(res, user);
  await auditAction({ req: { ...req, user }, action: body.create ? "firebase_email_register" : "firebase_email_login", targetType: "web_users", targetId: user.id, webhookCategory: "security" });
  res.status(body.create ? 201 : 200).json({ user, token });
}));

router.post(
  "/complete-session",
  authLimiter,
  asyncHandler(async (req, res) => {
    const payload = verifyUserToken(req.body?.token);
    if (!payload?.sub) return res.status(401).json({ error: "invalid_login_token", message: "The login token could not be verified. Restart the backend with the same JWT_SECRET used for OAuth." });
    const user = await getUserById(payload.sub);
    if (!user) return res.status(404).json({ error: "user_not_found", message: "The login token is valid, but the user account could not be found." });
    if (!isUserTokenCurrent(user, payload)) return res.status(401).json({ error: "invalid_login_token", message: "The login token has expired. Please sign in again." });
    res.cookie("a2_session", req.body.token, { ...cookieOptions, maxAge: SESSION_MAX_AGE_MS });
    const providers = await listProvidersForUser(user.id);
    res.json({ user, providers });
  })
);

router.post("/terms-agreement", requireAuth, asyncHandler(async (req, res) => {
  const agreement = await saveTermsAgreement({ userId: req.user.id, termsVersion: req.body?.termsVersion || "1.0.0", ipAddress: req.ip });
  await recordUserIp(req.user.id, req.ip);
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
  await revokeUserSessions(req.user.id);
  res.clearCookie("a2_session");
  await auditAction({ req, action: "logout", targetType: "web_users", targetId: req.user.id, webhookCategory: "security" });
  res.json({ ok: true });
}));

export default router;
export const __authTest = { createState, readState, validateLinkState, oauthTransactions };
