import { useEffect, useRef, useState } from "react";
import { Clock, Save, Upload, Volume2 } from "lucide-react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";
import MaintenanceScreen from "../components/MaintenanceScreen.jsx";
import { fontOptions } from "../data/fonts.js";

const defaultDraft = {
  maintenanceMode: false,
  maintenanceTitle: "The city is being rebuilt in the shadows",
  maintenanceSubtitle: "Gotham City will return soon.",
  maintenanceEndsAt: "",
  maintenanceCountdownEnabled: true,
  maintenanceYoutubeUrl: "",
  maintenanceVideoUrl: "",
  maintenanceSoundUrl: "",
  maintenanceAudioUrl: "",
  maintenanceVolume: 35,
  maintenanceFont: "Orbitron"
};

function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function volumeValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 35;
  return Math.min(100, Math.max(5, number));
}

export default function MaintenanceSettingsPage() {
  const { setSettings } = useApp();
  const { data, loading } = useApi(() => api.get("/api/admin/settings"), [], { settings: {} });
  const audioRef = useRef(null);
  const [draft, setDraft] = useState(defaultDraft);
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState("");

  useEffect(() => {
    setDraft((current) => ({ ...current, ...(data?.settings || {}) }));
  }, [data]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volumeValue(draft.maintenanceVolume) / 100;
  }, [draft.maintenanceVolume, draft.maintenanceSoundUrl, draft.maintenanceAudioUrl]);

  const buildPayload = (overrides = {}) => ({
    maintenanceMode: Boolean(draft.maintenanceMode),
    maintenanceTitle: draft.maintenanceTitle || defaultDraft.maintenanceTitle,
    maintenanceSubtitle: draft.maintenanceSubtitle || defaultDraft.maintenanceSubtitle,
    maintenanceEndsAt: draft.maintenanceEndsAt || "",
    maintenanceCountdownEnabled: draft.maintenanceCountdownEnabled !== false,
    maintenanceYoutubeUrl: draft.maintenanceYoutubeUrl || "",
    maintenanceVideoUrl: draft.maintenanceVideoUrl || draft.maintenanceYoutubeUrl || "",
    maintenanceSoundUrl: draft.maintenanceSoundUrl || draft.maintenanceAudioUrl || "",
    maintenanceAudioUrl: draft.maintenanceAudioUrl || draft.maintenanceSoundUrl || "",
    maintenanceVolume: volumeValue(draft.maintenanceVolume),
    maintenanceFont: draft.maintenanceFont || "Orbitron",
    ...overrides
  });

  const savePayload = async (payload, savedMessage = "Maintenance settings saved.") => {
    const response = await api.patch("/api/admin/settings", payload);
    setSettings((current) => ({ ...current, ...(response.settings || payload) }));
    setStatus(savedMessage);
  };

  const save = async (event) => {
    event.preventDefault();
    setStatus("");
    await savePayload(buildPayload());
  };

  const uploadMedia = async (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(type);
    setStatus("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const endpoint = type === "video" ? "/api/admin/maintenance/video" : "/api/admin/maintenance/sound";
      const response = await api.upload(endpoint, formData);
      const url = response.url;
      const key = type === "video" ? "maintenanceVideoUrl" : "maintenanceSoundUrl";
      const aliasKey = type === "video" ? "maintenanceYoutubeUrl" : "maintenanceAudioUrl";
      const settings = response.settings || buildPayload({ [key]: url, [aliasKey]: url });
      setDraft((current) => ({ ...current, [key]: url, [aliasKey]: url, ...(response.settings || {}) }));
      setSettings((current) => ({ ...current, ...settings }));
      setStatus(type === "video" ? "Video uploaded and saved." : "Audio uploaded and saved.");
    } catch (error) {
      setStatus(error.data?.message || error.data?.error || error.message || "Upload failed.");
    } finally {
      setUploading("");
      event.target.value = "";
    }
  };

  const changeVolume = async (value) => {
    const volume = volumeValue(value);
    setDraft((current) => ({ ...current, maintenanceVolume: volume }));
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      await audioRef.current.play().catch(() => null);
    }
  };

  const audioPreviewUrl = draft.maintenanceSoundUrl || draft.maintenanceAudioUrl || "";

  if (preview) return <MaintenanceScreen settings={draft} onExit={() => setPreview(false)} />;

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-black uppercase tracking-widest text-a2-green">Website control</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">Maintenance mode</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/55">Control the maintenance page, countdown, video background, headline, audio, and volume.</p>
      </header>

      <Card>
        {loading ? <div className="h-80 rounded skeleton" /> : (
          <form className="grid gap-5" onSubmit={save}>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-a2-border bg-white/[0.03] p-4 text-sm font-bold">
                <input type="checkbox" checked={Boolean(draft.maintenanceMode)} onChange={(event) => setDraft((current) => ({ ...current, maintenanceMode: event.target.checked }))} />
                Activate maintenance mode
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-a2-border bg-white/[0.03] p-4 text-sm font-bold">
                <input type="checkbox" checked={draft.maintenanceCountdownEnabled !== false} onChange={(event) => setDraft((current) => ({ ...current, maintenanceCountdownEnabled: event.target.checked }))} />
                Show countdown timer
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">
                Big header text
                <input className="form-input" value={draft.maintenanceTitle || ""} onChange={(event) => setDraft((current) => ({ ...current, maintenanceTitle: event.target.value }))} placeholder="The city is being rebuilt in the shadows" />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Font type
                <select className="form-input" value={draft.maintenanceFont || "Orbitron"} onChange={(event) => setDraft((current) => ({ ...current, maintenanceFont: event.target.value }))}>
                  {fontOptions.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-bold">
              Text under header
              <textarea className="form-input min-h-24" value={draft.maintenanceSubtitle || ""} onChange={(event) => setDraft((current) => ({ ...current, maintenanceSubtitle: event.target.value }))} />
            </label>

            <div className="grid gap-4 rounded-xl border border-a2-border bg-white/[0.03] p-4">
              <label className="grid gap-2 text-sm font-bold">
                Video link from anywhere
                <input className="form-input" value={draft.maintenanceVideoUrl || draft.maintenanceYoutubeUrl || ""} onChange={(event) => setDraft((current) => ({ ...current, maintenanceVideoUrl: event.target.value, maintenanceYoutubeUrl: event.target.value }))} placeholder="YouTube link, direct .mp4, .webm, .mov, or .m4v URL" />
                <span className="text-xs text-white/45">You can paste YouTube links or direct video URLs. Direct video files show cleaner and brighter.</span>
              </label>

              <label className="grid gap-2 text-sm font-bold">
                Upload background video
                <input className="form-input" type="file" accept="video/*,.mp4,.webm,.mov,.m4v" onChange={(event) => uploadMedia(event, "video")} />
                <span className="text-xs text-white/45">Uploaded video saves automatically. For Netlify-only hosting, use an external video URL or backend/VPS for persistent uploads.</span>
              </label>
            </div>

            {draft.maintenanceCountdownEnabled !== false && (
              <label className="grid gap-2 text-sm font-bold">
                Countdown end day and time
                <input className="form-input" type="datetime-local" value={toInputDate(draft.maintenanceEndsAt)} onChange={(event) => setDraft((current) => ({ ...current, maintenanceEndsAt: event.target.value }))} />
                <span className="text-xs text-white/45">When the countdown ends, normal users can access the website automatically.</span>
              </label>
            )}

            <div className="grid gap-4 rounded-xl border border-a2-border bg-white/[0.03] p-4">
              <label className="grid gap-2 text-sm font-bold">
                Audio link from anywhere
                <input className="form-input" value={draft.maintenanceAudioUrl || draft.maintenanceSoundUrl || ""} onChange={(event) => setDraft((current) => ({ ...current, maintenanceAudioUrl: event.target.value, maintenanceSoundUrl: event.target.value }))} placeholder="https://example.com/audio.mp3" />
                <span className="text-xs text-white/45">Paste a direct MP3/WAV/OGG/M4A link. Browsers require a user click before audio can start.</span>
              </label>

              <label className="grid gap-2 text-sm font-bold">
                Upload long audio file
                <input className="form-input" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac" onChange={(event) => uploadMedia(event, "audio")} />
                <span className="text-xs text-white/45">Accepted: mp3, wav, ogg, m4a, aac, flac. Upload saves automatically.</span>
              </label>

              <label className="grid gap-2 text-sm font-bold">
                <span className="flex items-center gap-2"><Volume2 size={16} /> Audio volume: {volumeValue(draft.maintenanceVolume)}%</span>
                <input className="w-full accent-a2-green" type="range" min="5" max="100" step="1" value={volumeValue(draft.maintenanceVolume)} onChange={(event) => changeVolume(event.target.value)} />
              </label>

              {audioPreviewUrl && <audio ref={audioRef} src={audioPreviewUrl} loop preload="auto" />}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit"><Save size={15} /> Save maintenance mode</Button>
              <Button type="button" variant="ghost" onClick={() => setPreview(true)}><Clock size={15} /> Preview full screen</Button>
              {uploading && <span className="text-sm text-white/55">Uploading {uploading}...</span>}
              {status && <span className="text-sm text-a2-success">{status}</span>}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
