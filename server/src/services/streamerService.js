import { fetch } from "undici";
import { env } from "../config/env.js";
import { getSettings, getStreamerLiveStatuses, listResource, setStreamerLiveStatus } from "./repository.js";
import { sendWebhook } from "./webhook.js";

let twitchToken = env.TWITCH_ACCESS_TOKEN || "";
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

async function checkKick(streamer) {
  if (!streamer.kick_username || !env.KICK_API_BASE_URL) {
    return setStreamerLiveStatus(streamer.id, "Kick", { is_live: false, raw_response_json: { skipped: "missing_kick_credentials_or_username" } });
  }

  try {
    const response = await fetch(`${env.KICK_API_BASE_URL.replace(/\/$/, "")}/channels/${encodeURIComponent(streamer.kick_username)}`, {
      headers: env.KICK_API_KEY ? { Authorization: `Bearer ${env.KICK_API_KEY}` } : {}
    });
    if (!response.ok) throw new Error(`kick_${response.status}`);
    const data = await response.json();
    const stream = data.livestream || data.stream || data.data?.livestream;
    return setStreamerLiveStatus(streamer.id, "Kick", {
      is_live: Boolean(stream),
      stream_title: stream?.session_title || stream?.title || "",
      viewer_count: stream?.viewer_count || stream?.viewers || null,
      thumbnail_url: stream?.thumbnail?.url || stream?.thumbnail_url || "",
      stream_url: `https://kick.com/${streamer.kick_username}`,
      started_at: stream?.created_at || stream?.started_at || null,
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
