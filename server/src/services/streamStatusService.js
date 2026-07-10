import { env } from "../config/env.js";

const twitchTokenCache = {
  token: "",
  expiresAt: 0
};

function cleanHandle(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?kick\.com\//i, "")
    .replace(/^https?:\/\/(www\.)?twitch\.tv\//i, "")
    .replace(/^kick\.com\//i, "")
    .replace(/^twitch\.tv\//i, "")
    .split(/[/?#]/)[0]
    .trim();
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 6000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0 GothamCityWebsite/1.0",
        ...(options.headers || {})
      }
    });
    if (!response.ok) throw new Error(`request_failed_${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function getTwitchToken() {
  if (env.TWITCH_ACCESS_TOKEN) return env.TWITCH_ACCESS_TOKEN;
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) return "";
  if (twitchTokenCache.token && twitchTokenCache.expiresAt > Date.now() + 60_000) return twitchTokenCache.token;

  const params = new URLSearchParams({
    client_id: env.TWITCH_CLIENT_ID,
    client_secret: env.TWITCH_CLIENT_SECRET,
    grant_type: "client_credentials"
  });
  const data = await fetchJson(`https://id.twitch.tv/oauth2/token?${params.toString()}`, { method: "POST" });
  twitchTokenCache.token = data.access_token || "";
  twitchTokenCache.expiresAt = Date.now() + Math.max(60, Number(data.expires_in || 3600) - 60) * 1000;
  return twitchTokenCache.token;
}

async function getTwitchStatuses(streamers) {
  const logins = [...new Set(streamers.map((streamer) => cleanHandle(streamer.twitch_username)).filter(Boolean))];
  if (!logins.length || !env.TWITCH_CLIENT_ID) return new Map();

  try {
    const token = await getTwitchToken();
    if (!token) return new Map();
    const params = new URLSearchParams();
    logins.forEach((login) => params.append("user_login", login));
    const data = await fetchJson(`https://api.twitch.tv/helix/streams?${params.toString()}`, {
      headers: {
        "client-id": env.TWITCH_CLIENT_ID,
        authorization: `Bearer ${token}`
      }
    });
    return new Map((data.data || []).map((stream) => [
      String(stream.user_login || "").toLowerCase(),
      {
        online: true,
        title: stream.title || "",
        gameName: stream.game_name || "",
        viewerCount: Number(stream.viewer_count || 0),
        thumbnailUrl: String(stream.thumbnail_url || "").replace("{width}", "640").replace("{height}", "360"),
        startedAt: stream.started_at || "",
        source: "twitch"
      }
    ]));
  } catch {
    return new Map();
  }
}

async function getKickStatus(slug) {
  const handle = cleanHandle(slug);
  if (!handle) return null;
  const urls = [
    `https://kick.com/api/v2/channels/${encodeURIComponent(handle)}`,
    `https://kick.com/api/v1/channels/${encodeURIComponent(handle)}`
  ];

  for (const url of urls) {
    try {
      const data = await fetchJson(url, {
        headers: env.KICK_ACCESS_TOKEN ? { authorization: `Bearer ${env.KICK_ACCESS_TOKEN}` } : {}
      });
      const live = data.livestream || data.live_stream || data.stream || null;
      const category = live?.categories?.[0] || live?.category || data.category || {};
      return {
        online: Boolean(live),
        title: live?.session_title || live?.title || data.recent_livestream?.session_title || "",
        gameName: category?.name || category?.category_name || "",
        viewerCount: Number(live?.viewer_count || live?.viewers || live?.viewerCount || 0),
        thumbnailUrl: live?.thumbnail?.url || live?.thumbnail_url || data.banner_image?.url || data.banner_image || "",
        startedAt: live?.created_at || live?.start_time || "",
        source: "kick"
      };
    } catch {
      // Try the next public endpoint before giving up.
    }
  }
  return null;
}

export async function enrichStreamers(streamers = []) {
  const twitchStatuses = await getTwitchStatuses(streamers);
  const enriched = await Promise.all(streamers.map(async (streamer) => {
    const twitchLogin = cleanHandle(streamer.twitch_username);
    const kickLogin = cleanHandle(streamer.kick_username);
    const twitchStatus = twitchLogin ? twitchStatuses.get(twitchLogin.toLowerCase()) : null;
    const kickStatus = kickLogin ? await getKickStatus(kickLogin) : null;
    const status = twitchStatus || kickStatus || null;
    const platform = status?.source || (kickLogin ? "kick" : twitchLogin ? "twitch" : "external");

    return {
      ...streamer,
      twitch_username: twitchLogin || streamer.twitch_username || "",
      kick_username: kickLogin || streamer.kick_username || "",
      platform,
      stream: {
        online: Boolean(status?.online),
        title: status?.title || "",
        gameName: status?.gameName || streamer.category || "",
        viewerCount: Number(status?.viewerCount || 0),
        thumbnailUrl: status?.thumbnailUrl || "",
        startedAt: status?.startedAt || "",
        source: status?.source || platform
      }
    };
  }));

  return {
    streamers: enriched,
    totalViewers: enriched.reduce((sum, streamer) => sum + Number(streamer.stream?.viewerCount || 0), 0),
    liveCount: enriched.filter((streamer) => streamer.stream?.online).length
  };
}
