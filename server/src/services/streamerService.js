import { fetch } from "undici";
import { env } from "../config/env.js";
import { getSettings, getStreamerLiveStatuses, listResource, setStreamerLiveStatus } from "./repository.js";
import { sendWebhook } from "./webhook.js";

let twitchToken = env.TWITCH_ACCESS_TOKEN || "";
let kickToken = "";
let kickTokenExpiresAt = 0;
let running = false;

async function getTwitchToken() {
  if (twitchToken) return twitchToken;
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) return "";

  const params = new URLSearchParams({
    client_id: env.TWITCH_CLIENT_ID,
    client_secret: env.TWITCH_CLIENT_SECRET,
    grant_type: "client_credentials"
  });
  const response = await fetch(`https://id.twitch.tv/oauth2/token?${params.toString()}`, { method: "POST" });
  if (!response.ok) return "";
  const data = await response.json();
  twitchToken = data.access_token || "";
  return twitchToken;
}

async function checkTwitch(streamer) {
  if (!streamer.twitch_username || !env.TWITCH_CLIENT_ID) {
    return setStreamerLiveStatus(streamer.id, "Twitch", { is_live: false, raw_response_json: { skipped: "missing_twitch_credentials_or_username" } });
  }

  const token = await getTwitchToken();
  if (!token) return setStreamerLiveStatus(streamer.id, "Twitch", { is_live: false, raw_response_json: { skipped: "missing_twitch_token" } });

  const params = new URLSearchParams({ user_login: streamer.twitch_username });
  const response = await fetch(`https://api.twitch.tv/helix/streams?${params.toString()}`, {
    headers: {
      "Client-Id": env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return setStreamerLiveStatus(streamer.id, "Twitch", {
      is_live: false,
      raw_response_json: { error: `twitch_${response.status}` }
    });
  }

  const data = await response.json();
  const stream = data.data?.[0];
  return setStreamerLiveStatus(streamer.id, "Twitch", {
    is_live: Boolean(stream),
    stream_title: stream?.title || "",
    viewer_count: stream?.viewer_count || null,
    thumbnail_url: stream?.thumbnail_url?.replace("{width}", "640").replace("{height}", "360") || "",
    stream_url: `https://twitch.tv/${streamer.twitch_username}`,
    started_at: stream?.started_at || null,
    raw_response_json: data
  });
}

async function getKickToken() {
  if (kickToken && Date.now() < kickTokenExpiresAt - 60000) return kickToken;
  if (!env.KICK_CLIENT_ID || !env.KICK_CLIENT_SECRET) return "";

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.KICK_CLIENT_ID,
    client_secret: env.KICK_CLIENT_SECRET
  });

  const response = await fetch("https://id.kick.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) return "";
  const data = await response.json();
  kickToken = data.access_token || "";
  kickTokenExpiresAt = Date.now() + Number(data.expires_in || 3600) * 1000;
  return kickToken;
}

async function checkKick(streamer) {
  if (!streamer.kick_username || !env.KICK_API_BASE_URL) {
    return setStreamerLiveStatus(streamer.id, "Kick", { is_live: false, raw_response_json: { skipped: "missing_kick_credentials_or_username" } });
  }

  try {
    const token = env.KICK_API_KEY || (await getKickToken());
    if (!token) {
      return setStreamerLiveStatus(streamer.id, "Kick", {
        is_live: false,
        raw_response_json: { skipped: "missing_kick_token" }
      });
    }

    const params = new URLSearchParams();
    params.append("slug", streamer.kick_username);
    const response = await fetch(`${env.KICK_API_BASE_URL.replace(/\/$/, "")}/public/v1/channels?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`kick_${response.status}`);
    const data = await response.json();
    const channel = data.data?.[0] || {};
    const stream = channel.stream || {};
    return setStreamerLiveStatus(streamer.id, "Kick", {
      is_live: Boolean(stream.is_live),
      stream_title: channel.stream_title || "",
      viewer_count: stream.viewer_count || null,
      thumbnail_url: stream.thumbnail || "",
      stream_url: `https://kick.com/${streamer.kick_username}`,
      started_at: stream.start_time || null,
      raw_response_json: data
    });
  } catch (error) {
    return setStreamerLiveStatus(streamer.id, "Kick", {
      is_live: false,
      raw_response_json: { error: error.message }
    });
  }
}

export async function checkStreamerLiveStatus(streamer) {
  const previous = getStreamerLiveStatuses(streamer.id).some((status) => status.is_live);
  const statuses = [await checkTwitch(streamer), await checkKick(streamer)];
  const current = statuses.some((status) => status.is_live);
  const settings = getSettings();

  if (current && !previous && settings.webhookStreamerGoLive) {
    await sendWebhook("streamers", {
      Action: "Streamer live",
      Streamer: streamer.display_name,
      Platform: statuses.find((status) => status.is_live)?.platform || streamer.main_platform,
      Channel: streamer.twitch_username || streamer.kick_username || "",
      Admin: "system",
      Time: new Date().toISOString(),
      Status: "live"
    });
  }

  if (!current && previous && settings.webhookStreamerGoOffline) {
    await sendWebhook("streamers", {
      Action: "Streamer offline",
      Streamer: streamer.display_name,
      Platform: streamer.main_platform,
      Channel: streamer.twitch_username || streamer.kick_username || "",
      Admin: "system",
      Time: new Date().toISOString(),
      Status: "offline"
    });
  }

  return statuses;
}

export async function checkAllStreamers() {
  if (running) return;
  running = true;
  try {
    const { rows } = await listResource("streamers", { limit: 100 });
    await Promise.all(rows.filter((streamer) => streamer.is_approved && !streamer.is_hidden).map(checkStreamerLiveStatus));
  } catch (error) {
    console.warn("[streamers] live check failed:", error.message);
  } finally {
    running = false;
  }
}

export async function withLiveStatus(streamers) {
  return streamers.map((streamer) => {
    const statuses = getStreamerLiveStatuses(streamer.id);
    const live = statuses.find((status) => status.is_live);
    return {
      ...streamer,
      live_statuses: statuses,
      is_live: Boolean(live),
      stream_title: live?.stream_title || "",
      viewer_count: live?.viewer_count || null,
      thumbnail_url: live?.thumbnail_url || "",
      stream_url: live?.stream_url || "",
      last_checked_at: statuses[0]?.last_checked_at || null
    };
  });
}
