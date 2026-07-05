import { fetch } from "undici";
import { env } from "../config/env.js";
import { getSettings, getStreamerLiveStatuses, listResource, setStreamerLiveStatus } from "./repository.js";
import { sendWebhook } from "./webhook.js";
import { cleanKickSlug, getKickStatus, kickConfigured } from "./kickService.js";
import { toBoolean } from "../utils/sanitize.js";

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
  const slug = cleanKickSlug(streamer.kick_username);
  if (!slug || !kickConfigured()) {
    return setStreamerLiveStatus(streamer.id, "Kick", { is_live: false, raw_response_json: { skipped: "missing_kick_credentials_or_username" } });
  }

  try {
    const data = await getKickStatus(slug);
    const stream = data.stream || {};
    const channel = data.channel || {};
    return setStreamerLiveStatus(streamer.id, "Kick", {
      is_live: Boolean(data.online),
      stream_title: stream.stream_title || channel.stream_title || "",
      viewer_count: stream.viewer_count || channel.stream?.viewer_count || null,
      thumbnail_url: stream.thumbnail || channel.stream?.thumbnail || channel.banner_picture || "",
      stream_url: `https://kick.com/${data.slug || slug}`,
      started_at: stream.started_at || stream.start_time || channel.stream?.start_time || null,
      raw_response_json: data
    });
  } catch (error) {
    console.warn("[streamers] Kick live check failed:", slug, error.message);
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
  const settings = await getSettings();

  if (current && !previous && settings.webhookStreamerGoLive) {
    await sendWebhook("streamers", {
      title: "Streamer went live",
      Streamer: streamer.display_name,
      Platform: statuses.find((status) => status.is_live)?.platform || streamer.main_platform,
      Channel: streamer.twitch_username || streamer.kick_username || "",
      Status: "live"
    });
  }

  if (!current && previous && settings.webhookStreamerGoOffline) {
    await sendWebhook("streamers", {
      title: "Streamer went offline",
      Streamer: streamer.display_name,
      Platform: streamer.twitch_username ? "Twitch" : "Kick",
      Channel: streamer.twitch_username || streamer.kick_username || "",
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
    await Promise.all(rows.filter((streamer) => toBoolean(streamer.is_approved) && !toBoolean(streamer.is_hidden)).map(checkStreamerLiveStatus));
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
