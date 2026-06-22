import { useEffect, useState } from "react";
import { Clock, Save, UploadCloud, Volume2 } from "lucide-react";
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

export default function MaintenanceSettingsPage() {
  const { setSettings } = useApp();
  const { data, loading } = useApi(() => api.get("/api/admin/settings"), [], { settings: {} });
  const [draft, setDraft] = useState(defaultDraft);
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setDraft((current) => ({ ...current, ...(data?.settings || {}) }));
  }, [data]);

  const save = async (event) => {
    event.preventDefault();
    setStatus("");
    const payload = {
      maintenanceMode: Boolean(draft.maintenanceMode),
      maintenanceTitle: draft.maintenanceTitle || defaultDraft.maintenanceTitle,
      maintenanceSubtitle: draft.maintenanceSubtitle || defaultDraft.maintenanceSubtitle,
      maintenanceEndsAt: draft.maintenanceEndsAt || "",
      maintenanceSoundUrl: draft.maintenanceSoundUrl || "",
      maintenanceFont: draft.maintenanceFont || "Orbitron"
    };
    const response = await api.patch("/api/admin/settings", payload);
    setSettings((current) => ({ ...current, ...(response.settings || payload) }));
    setStatus("Maintenance settings saved.");
  };

  const uploadSound = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.upload("/api/admin/uploads", formData);
      setDraft((current) => ({ ...current, maintenanceSoundUrl: response.url }));
      setStatus("Sound uploaded. Save settings to use it.");
    } catch (error) {
      setStatus(error.data?.message || error.data?.error || error.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (preview) return <MaintenanceScreen settings={draft} />;

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-black uppercase tracking-widest text-a2-green">Website control</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">Maintenance mode</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/55">Activate a full-screen animated maintenance page with countdown, thunder effect, custom headline, font, and looping sound file.</p>
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

            <div className="grid gap-3 rounded-xl border border-a2-border bg-white/[0.03] p-4">
              <label className="grid gap-2 text-sm font-bold">
                Maintenance sound URL
                <input className="form-input" value={draft.maintenanceSoundUrl || ""} onChange={(event) => setDraft((current) => ({ ...current, maintenanceSoundUrl: event.target.value }))} placeholder="/uploads/sound.mp3 or https://..." />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Upload sound file
                <input className="form-input" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a" onChange={uploadSound} />
              </label>
              {draft.maintenanceSoundUrl && <audio className="w-full" src={draft.maintenanceSoundUrl} controls loop />}
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
