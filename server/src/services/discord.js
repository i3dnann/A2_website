import { fetch } from "undici";
import { env } from "../config/env.js";

const DISCORD_API = "https://discord.com/api/v10";

export function discordConfigured() {
  return Boolean(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET && env.DISCORD_REDIRECT_URI);
}

export function discordAuthorizeUrl(state) {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify email guilds.members.read",
    prompt: "consent",
    state
  });
  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeDiscordCode(code) {
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.DISCORD_REDIRECT_URI
  });

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) throw new Error(`Discord token exchange failed: ${response.status}`);
  return response.json();
}

export async function getDiscordUser(accessToken) {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) throw new Error(`Discord user fetch failed: ${response.status}`);
  return response.json();
}

export async function getDiscordMemberRoles(accessToken) {
  if (!env.DISCORD_GUILD_ID) return [];
  const response = await fetch(`${DISCORD_API}/users/@me/guilds/${env.DISCORD_GUILD_ID}/member`, {
    headers: { authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) return [];
  const member = await response.json();
  return member.roles || [];
}
