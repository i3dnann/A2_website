import { useEffect, useMemo, useRef, useState } from "react";
import { Check, MapPin, Plus, RefreshCw, Save, Search, Trash2 } from "lucide-react";
import { api } from "../lib/api.js";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";

const TILE_SIZE = 256;
const TILE_LEVEL = 4;
const TILE_COUNT = 2 ** TILE_LEVEL;
const GTA_TILE_BASE = "https://cdn.jsdelivr.net/gh/ONyambura/gtav_map_tiles@main/atlas";
const ZONE_TYPES = ["Safe Zone", "Danger Zone", "Police Zone", "Hospital", "Gang Area", "Event Zone", "Shop", "Point of Interest"];

const defaults = {
  zone_name: "",
  zone_type: "Point of Interest",
  description: "",
  image_url: "",
  position_x: 50,
  position_y: 50,
  fivem_x: "",
  fivem_y: "",
  fivem_z: "",
  radius: "",
  color: "#b7fe1a",
  icon: "pin",
  sort_order: 0,
  is_visible: true
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function numberValue(value, fallback = 50) {
  const number = Number(value);
  return Number.isFinite(number) ? clamp(number, 0, 100) : fallback;
}

function cleanPayload(draft) {
  return {
    ...draft,
    zone_name: String(draft.zone_name || "").trim(),
    zone_type: String(draft.zone_type || "Point of Interest").trim(),
    position_x: numberValue(draft.position_x),
    position_y: numberValue(draft.position_y),
    color: draft.color || "#b7fe1a",
    is_visible: Boolean(draft.is_visible)
  };
}

function tileUrl(x, y) {
  return `${GTA_TILE_BASE}/${TILE_LEVEL}/${x}_${y}.png`;
}

function GtaTileLayer() {
  const tiles = [];
  for (let y = 0; y < TILE_COUNT; y += 1) {
    for (let x = 0; x < TILE_COUNT; x += 1) {
      tiles.push(
        <img
          key={`${x}-${y}`}
          src={tileUrl(x, y)}
          alt=""
          draggable="false"
          loading="lazy"
          className="gta-map-tile"
          style={{ left: x * TILE_SIZE, top: y * TILE_SIZE }}
        />
      );
    }
  }
  return <>{tiles}</>;
}

export default function AdminMapPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const mapRef = useRef(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((zone) => `${zone.zone_name || ""} ${zone.zone_type || ""} ${zone.description || ""}`.toLowerCase().includes(needle));
  }, [rows, q]);

  const loadRows = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/admin/mapZones?q=${encodeURIComponent(q)}`);
      setRows(data?.rows || []);
    } catch (error) {
      setStatus(error.data?.error || error.message || "Could not load map zones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectZone = (zone) => {
    setSelected(zone || null);
    setDraft(zone ? { ...defaults, ...zone, is_visible: zone.is_visible !== false && zone.is_visible !== 0 } : defaults);
    setStatus("");
  };

  const placePin = (event) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    setDraft((current) => ({ ...current, position_x: Number(x.toFixed(2)), position_y: Number(y.toFixed(2)) }));
  };

  const save = async (event) => {
    event.preventDefault();
    setStatus("");
    const payload = cleanPayload(draft);
    if (!payload.zone_name) return setStatus("Zone name is required.");
    if (!payload.zone_type) return setStatus("Zone type is required.");

    try {
      const response = selected?.id
        ? await api.patch(`/api/admin/mapZones/${selected.id}`, payload)
        : await api.post("/api/admin/mapZones", payload);
      const row = response?.row || payload;
      setSelected(row);
      setDraft({ ...defaults, ...row });
      await loadRows();
      setStatus("Saved.");
    } catch (error) {
      setStatus(error.data?.error || error.message || "Save failed.");
    }
  };

  const remove = async () => {
    if (!selected?.id || !confirm(`Delete ${selected.zone_name || selected.id}?`)) return;
    try {
      await api.delete(`/api/admin/mapZones/${selected.id}`, {});
      selectZone(null);
      await loadRows();
      setStatus("Deleted.");
    } catch (error) {
      setStatus(error.data?.error || error.message || "Delete failed.");
    }
  };

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-black uppercase tracking-widest text-a2-green">CMS</p>
        <h1 className="mt-3 text-3xl font-black md:text-5xl">3D GTA map pin editor</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
          Add safe zones, dangerous zones, event locations, shops, and other pins. Click the real GTA V map preview to place the selected pin.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <label className="flex flex-1 items-center gap-2 rounded-lg border border-a2-border bg-black/55 px-3 py-2">
              <Search size={16} className="text-white/35" />
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Search map zones..." value={q} onChange={(event) => setQ(event.target.value)} />
            </label>
            <Button type="button" variant="ghost" onClick={loadRows}><RefreshCw size={15} /></Button>
            <Button type="button" variant="ghost" onClick={() => selectZone(null)}><Plus size={15} /> New</Button>
          </div>

          <div className="grid max-h-[720px] gap-2 overflow-auto pr-1">
            {(loading ? Array.from({ length: 7 }) : filtered).map((zone, index) => (
              loading ? <div key={index} className="h-20 rounded-xl skeleton" /> : (
                <button
                  key={zone.id}
                  type="button"
                  className={`rounded-xl border p-4 text-left transition ${selected?.id === zone.id ? "border-a2-green bg-a2-green/10" : "border-a2-border bg-white/[0.03] hover:border-a2-green/45"}`}
                  onClick={() => selectZone(zone)}
                >
                  <span className="flex items-center gap-2 font-black"><MapPin size={16} style={{ color: zone.color || "#b7fe1a" }} />{zone.zone_name}</span>
                  <span className="mt-1 block text-xs font-bold text-a2-green">{zone.zone_type || "Point of Interest"}</span>
                  <span className="mt-2 line-clamp-2 block text-sm text-white/45">{zone.description || "No note"}</span>
                </button>
              )
            ))}
            {!loading && !filtered.length && <p className="py-8 text-center text-sm text-white/45">No zones found.</p>}
          </div>
        </Card>

        <div className="grid gap-5">
          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Visual pin placement</h2>
                <p className="mt-1 text-sm text-white/45">Click anywhere on the GTA map to move this pin. Then press Save.</p>
              </div>
              <span className="rounded-full border border-a2-border bg-black/40 px-3 py-1 text-xs font-bold text-white/55">
                X {numberValue(draft.position_x).toFixed(2)} / Y {numberValue(draft.position_y).toFixed(2)}
              </span>
            </div>
            <div className="admin-gta-map admin-gta-map-tiles" ref={mapRef} onClick={placePin}>
              <div className="admin-gta-map-tile-plane">
                <GtaTileLayer />
              </div>
              {rows.map((zone) => (
                <span
                  key={zone.id}
                  className="admin-gta-map-pin is-muted"
                  style={{ left: `${numberValue(zone.position_x)}%`, top: `${numberValue(zone.position_y)}%`, "--pin-color": zone.color || "#b7fe1a" }}
                  title={zone.zone_name}
                />
              ))}
              <span
                className="admin-gta-map-pin is-editing"
                style={{ left: `${numberValue(draft.position_x)}%`, top: `${numberValue(draft.position_y)}%`, "--pin-color": draft.color || "#b7fe1a" }}
              >
                <MapPin size={20} />
              </span>
            </div>
          </Card>

          <Card>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
              <Field label="Zone name" value={draft.zone_name} onChange={(value) => setDraft((current) => ({ ...current, zone_name: value }))} required />
              <label className="grid gap-2 text-sm font-bold">
                Zone type
                <select className="form-input" value={draft.zone_type || "Point of Interest"} onChange={(event) => setDraft((current) => ({ ...current, zone_type: event.target.value }))}>
                  {ZONE_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold md:col-span-2">
                Note / description
                <textarea className="form-input min-h-28" value={draft.description || ""} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
              </label>
              <Field label="Image URL" value={draft.image_url} onChange={(value) => setDraft((current) => ({ ...current, image_url: value }))} />
              <label className="grid gap-2 text-sm font-bold">
                Pin color
                <input className="form-input h-12" type="color" value={draft.color || "#b7fe1a"} onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))} />
              </label>
              <Field label="Position X %" type="number" value={draft.position_x} onChange={(value) => setDraft((current) => ({ ...current, position_x: value }))} />
              <Field label="Position Y %" type="number" value={draft.position_y} onChange={(value) => setDraft((current) => ({ ...current, position_y: value }))} />
              <Field label="FiveM X" value={draft.fivem_x} onChange={(value) => setDraft((current) => ({ ...current, fivem_x: value }))} />
              <Field label="FiveM Y" value={draft.fivem_y} onChange={(value) => setDraft((current) => ({ ...current, fivem_y: value }))} />
              <Field label="FiveM Z" value={draft.fivem_z} onChange={(value) => setDraft((current) => ({ ...current, fivem_z: value }))} />
              <Field label="Radius" value={draft.radius} onChange={(value) => setDraft((current) => ({ ...current, radius: value }))} />
              <Field label="Icon" value={draft.icon} onChange={(value) => setDraft((current) => ({ ...current, icon: value }))} />
              <Field label="Sort order" type="number" value={draft.sort_order} onChange={(value) => setDraft((current) => ({ ...current, sort_order: value }))} />
              <label className="flex items-center gap-3 rounded-lg border border-a2-border bg-white/[0.03] p-3 text-sm font-bold md:col-span-2">
                <input type="checkbox" checked={Boolean(draft.is_visible)} onChange={(event) => setDraft((current) => ({ ...current, is_visible: event.target.checked }))} />
                Visible on public map
              </label>
              <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                <Button type="submit"><Save size={15} /> Save pin</Button>
                {selected?.id && <Button type="button" variant="danger" onClick={remove}><Trash2 size={15} /> Delete</Button>}
                {status === "Saved." && <span className="flex items-center gap-1 text-sm text-a2-success"><Check size={15} /> Saved.</span>}
                {status && status !== "Saved." && <span className="text-sm text-a2-warning">{status}</span>}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input className="form-input" type={type} value={value || ""} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
