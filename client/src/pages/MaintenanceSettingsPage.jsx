import { useEffect, useRef, useState } from "react";
import { Clock, Save, Volume2 } from "lucide-react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";
import MaintenanceScreen from "../components/MaintenanceScreen.jsx";

const defaultDraft = {
  maintenanceMode: false,
  maintenanceTitle: "Website maintenance",
  maintenanceSubtitle: "We are updating the website. Access will open automatically when the timer ends.",
  maintenanceEndsAt: "",
  maintenanceSoundUrl: "",
  maintenanceVolume: 35,
  maintenanceFont: "Orbitron"
};

const fonts = ["Orbitron", "Inter", "Serif", "Mono", "Impact"];

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
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setDraft((current) => ({ ...current, ...(data?.settings || {}) }));
  }, [data]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volumeValue(draft.maintenanceVolume) / 100;
  }, [draft.maintenanceVolume, draft.maintenanceSoundUrl]);

  const buildPayload = (overrides = {}) => ({
    maintenanceMode: Boolean(draft.maintenanceMode),
    maintenanceTitle: draft.maintenanceTitle || defaultDraft.maintenanceTitle,
    maintenanceSubtitle: draft.maintenanceSubtitle || defaultDraft.maintenanceSubtitle,
    maintenanceEndsAt: draft.maintenanceEndsAt || "",
    maintenanceSoundUrl: draft.maintenanceSoundUrl || "",
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

  const uploadSound = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.upload("/api/admin/maintenance/sound", formData);
      const url = response.url;
      const settings = response.settings || buildPayload({ maintenanceSoundUrl: url });
      setDraft((current) => ({ ...current, maintenanceSoundUrl: url, ...(response.settings || {}) }));
      setSettings((current) => ({ ...current, ...settings }));
      setStatus("Sound uploaded and saved.");
    } catch (error) {
      setStatus(error.data?.message || error.data?.error || error.message || "Upload failed.");
    } finally {
      setUploading(false);
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

  if (preview) return <MaintenanceScreen settings={draft} onExit={() => setPreview(false)} />;

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-black uppercase tracking-widest text-a2-green">Website control</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">Maintenance mode</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/55">Activate a full-screen animated maintenance page with countdown, thunder effect, custom headline, font, uploaded looping audio, and volume control.</p>
      </header>

      <Card>
        {loading ? <div className="h-80 rounded skeleton" /> : (
          <form className="grid gap-5" onSubmit={save}>
            <label className="flex items-center gap-3 rounded-xl border border-a2-border bg-white/[0.03] p-4 text-sm font-bold">
              <input type="checkbox" checked={Boolean(draft.maintenanceMode)} onChange={(event) => setDraft((current) => ({ ...current, maintenanceMode: event.target.checked }))} />
              Activate maintenance mode
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">
                Big header text
                <input className="form-input" value={draft.maintenanceTitle || ""} onChange={(event) => setDraft((current) => ({ ...current, maintenanceTitle: event.target.value }))} placeholder="Website maintenance" />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Font type
                <select className="form-input" value={draft.maintenanceFont || "Orbitron"} onChange={(event) => setDraft((current) => ({ ...current, maintenanceFont: event.target.value }))}>
                  {fonts.map((font) => <option key={font}>{font}</option>)}
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-bold">
              Text under header
              <textarea className="form-input min-h-24" value={draft.maintenanceSubtitle || ""} onChange={(event) => setDraft((current) => ({ ...current, maintenanceSubtitle: event.target.value }))} />
            </label>

            <label className="grid gap-2 text-sm font-bold">
              Countdown end day and time
              <input className="form-input" type="datetime-local" value={toInputDate(draft.maintenanceEndsAt)} onChange={(event) => setDraft((current) => ({ ...current, maintenanceEndsAt: event.target.value }))} />
              <span className="text-xs text-white/45">When the countdown ends, normal users can access the website automatically.</span>
            </label>

            <div className="grid gap-4 rounded-xl border border-a2-border bg-white/[0.03] p-4">
              <label className="grid gap-2 text-sm font-bold">
                Upload audio file
                <input className="form-input" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a" onChange={uploadSound} />
                <span className="text-xs text-white/45">Accepted: mp3, wav, ogg, m4a. Upload saves automatically.</span>
              </label>

              <label className="grid gap-2 text-sm font-bold">
                Saved audio URL
                <input className="form-input" value={draft.maintenanceSoundUrl || ""} onChange={(event) => setDraft((current) => ({ ...current, maintenanceSoundUrl: event.target.value }))} placeholder="/uploads/sound.mp3 or https://..." />
              </label>

              <label className="grid gap-2 text-sm font-bold">
                <span className="flex items-center gap-2"><Volume2 size={16} /> Audio volume: {volumeValue(draft.maintenanceVolume)}%</span>
                <input className="w-full accent-a2-green" type="range" min="5" max="100" step="1" value={volumeValue(draft.maintenanceVolume)} onChange={(event) => changeVolume(event.target.value)} />
              </label>

              {draft.maintenanceSoundUrl && <audio ref={audioRef} src={draft.maintenanceSoundUrl} loop preload="auto" />}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit"><Save size={15} /> Save maintenance mode</Button>
              <Button type="button" variant="ghost" onClick={() => setPreview(true)}><Clock size={15} /> Preview full screen</Button>
              {uploading && <span className="text-sm text-white/55">Uploading sound...</span>}
              {status && <span className="text-sm text-a2-success">{status}</span>}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
