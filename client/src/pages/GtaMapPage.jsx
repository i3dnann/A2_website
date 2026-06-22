import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Crosshair, MapPin, Minus, Plus, RotateCcw, Search, Shield, X } from "lucide-react";
import { api } from "../lib/api.js";
import { Card } from "../components/Card.jsx";

const TILE_SIZE = 256;
const TILE_LEVEL = 4;
const TILE_COUNT = 2 ** TILE_LEVEL;
const GTA_TILE_BASE = "https://cdn.jsdelivr.net/gh/ONyambura/gtav_map_tiles@main/mainmap";

const DEFAULT_ZONE_TYPES = [
  "all",
  "Safe Zone",
  "Danger Zone",
  "Police Zone",
  "Hospital",
  "Gang Area",
  "Event Zone",
  "Shop",
  "Point of Interest"
];

const TYPE_COLORS = {
  "Safe Zone": "#35ff6b",
  "Danger Zone": "#ff3333",
  "Police Zone": "#35a7ff",
  Hospital: "#ffffff",
  "Gang Area": "#ffaa00",
  "Event Zone": "#b7fe1a",
  Shop: "#8bffdb",
  "Point of Interest": "#b7fe1a"
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pinValue(value, fallback = 50) {
  const number = Number(value);
  return Number.isFinite(number) ? clamp(number, 0, 100) : fallback;
}

function zoneColor(zone) {
  return zone?.color || TYPE_COLORS[zone?.zone_type] || "#b7fe1a";
}

function zoneText(zone) {
  return `${zone?.zone_name || ""} ${zone?.zone_type || ""} ${zone?.description || ""}`.toLowerCase();
}

function coordsText(zone) {
  const x = zone?.fivem_x;
  const y = zone?.fivem_y;
  const z = zone?.fivem_z;
  if (!x && !y && !z) return "";
  return `${x || 0}, ${y || 0}, ${z || 0}`;
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

export default function GtaMapPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(0.36);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/api/public/map?limit=200")
      .then((data) => {
        if (active) setRows(data?.rows || []);
      })
      .catch(() => {
        if (active) setRows([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const types = useMemo(() => {
    const dynamic = [...new Set(rows.map((zone) => zone.zone_type).filter(Boolean))];
    return [...new Set([...DEFAULT_ZONE_TYPES, ...dynamic])];
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((zone) => {
      const typeMatch = activeType === "all" || zone.zone_type === activeType;
      const searchMatch = !needle || zoneText(zone).includes(needle);
      return typeMatch && searchMatch;
    });
  }, [rows, activeType, q]);

  const startDrag = (event) => {
    if (event.button !== 0) return;
    setDragging({ x: event.clientX, y: event.clientY, offset });
  };

  useEffect(() => {
    if (!dragging) return undefined;
    const move = (event) => {
      setOffset({
        x: dragging.offset.x + event.clientX - dragging.x,
        y: dragging.offset.y + event.clientY - dragging.y
      });
    };
    const stop = () => setDragging(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
  }, [dragging]);

  const resetView = () => {
    setZoom(0.36);
    setOffset({ x: 0, y: 0 });
    setSelected(null);
  };

  const focusZone = (zone) => {
    setSelected(zone);
    setZoom((current) => Math.max(current, 0.58));
  };

  const copyCoords = async (zone) => {
    const text = coordsText(zone);
    if (!text) return;
    await navigator.clipboard?.writeText(text);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-a2-green">City map</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">3D GTA V Map</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
            Complete GTA V main map with 3D perspective, pan, zoom, clickable city pins, and zone information.
          </p>
        </div>
        <div className="rounded-2xl border border-a2-border bg-black/45 px-4 py-3 text-sm text-white/50">
          {filtered.length} visible pins
        </div>
      </header>

      <section className="mt-6 grid gap-3 lg:grid-cols-[1fr_0.36fr]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-a2-border bg-white/[0.03] p-3 md:flex-row md:items-center">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-a2-border bg-black/55 px-3 py-2">
              <Search size={17} className="text-white/35" />
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Search zones, notes, type..."
                value={q}
                onChange={(event) => setQ(event.target.value)}
              />
            </label>
            <select className="form-input md:max-w-56" value={activeType} onChange={(event) => setActiveType(event.target.value)}>
              {types.map((type) => (
                <option key={type} value={type}>{type === "all" ? "All zones" : type}</option>
              ))}
            </select>
          </div>

          <div className="gta-map-shell">
            <div className="gta-map-controls">
              <button type="button" onClick={() => setZoom((value) => clamp(value + 0.08, 0.24, 1.35))} aria-label="Zoom in"><Plus size={16} /></button>
              <button type="button" onClick={() => setZoom((value) => clamp(value - 0.08, 0.24, 1.35))} aria-label="Zoom out"><Minus size={16} /></button>
              <button type="button" onClick={resetView} aria-label="Reset map"><RotateCcw size={16} /></button>
            </div>

            <div
              ref={mapRef}
              className="gta-map-stage"
              onPointerDown={startDrag}
              onClick={(event) => {
                if (event.target === event.currentTarget) setSelected(null);
              }}
              onWheel={(event) => {
                event.preventDefault();
                setZoom((value) => clamp(value + (event.deltaY > 0 ? -0.04 : 0.04), 0.24, 1.35));
              }}
            >
              <div
                className="gta-map-plane gta-map-plane-tiles"
                style={{
                  width: TILE_COUNT * TILE_SIZE,
                  height: TILE_COUNT * TILE_SIZE,
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotateX(12deg)`
                }}
              >
                <GtaTileLayer />
                <div className="gta-map-grid" />
                {(loading ? Array.from({ length: 8 }) : filtered).map((zone, index) => {
                  if (loading) return <span key={index} className="gta-map-marker skeleton-marker" style={{ left: `${20 + index * 8}%`, top: `${30 + (index % 4) * 12}%` }} />;
                  const color = zoneColor(zone);
                  const active = selected?.id === zone.id;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      className={`gta-map-marker ${active ? "is-active" : ""}`}
                      style={{ left: `${pinValue(zone.position_x)}%`, top: `${pinValue(zone.position_y)}%`, "--pin-color": color }}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        focusZone(zone);
                      }}
                    >
                      <span className="gta-map-marker-core"><MapPin size={20} /></span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <aside className="grid gap-3 content-start">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Selected zone</h2>
              {selected && <button type="button" className="text-white/45 hover:text-white" onClick={() => setSelected(null)}><X size={18} /></button>}
            </div>
            {!selected ? (
              <p className="mt-4 text-sm leading-6 text-white/50">Click any pin on the 3D GTA map to view the zone type, note, radius, and FiveM coordinates.</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {selected.image_url && <img src={selected.image_url} alt="" className="h-40 w-full rounded-xl object-cover opacity-90" />}
                <div className="flex items-start gap-3">
                  <Shield style={{ color: zoneColor(selected) }} />
                  <div>
                    <h3 className="text-2xl font-black">{selected.zone_name}</h3>
                    <p className="mt-1 text-sm font-bold" style={{ color: zoneColor(selected) }}>{selected.zone_type || "Point of Interest"}</p>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-white/58">{selected.description || "No note added yet."}</p>
                <div className="grid gap-2 text-sm">
                  {selected.radius && <InfoRow label="Radius" value={`${selected.radius}m`} />}
                  {coordsText(selected) && (
                    <button type="button" className="rounded-xl border border-a2-border bg-black/35 p-3 text-left hover:border-a2-green/60" onClick={() => copyCoords(selected)}>
                      <span className="block text-xs uppercase tracking-wide text-white/35">FiveM coords</span>
                      <span className="mt-1 flex items-center justify-between gap-2 font-bold text-white/80">{coordsText(selected)} <Copy size={15} /></span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-black">Zones</h2>
            <div className="mt-4 grid max-h-[520px] gap-2 overflow-auto pr-1">
              {filtered.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  className={`rounded-xl border p-3 text-left transition ${selected?.id === zone.id ? "border-a2-green bg-a2-green/10" : "border-a2-border bg-white/[0.03] hover:border-a2-green/45"}`}
                  onClick={() => focusZone(zone)}
                >
                  <span className="flex items-center gap-2 font-black"><Crosshair size={15} style={{ color: zoneColor(zone) }} />{zone.zone_name}</span>
                  <span className="mt-1 block text-xs font-bold" style={{ color: zoneColor(zone) }}>{zone.zone_type || "Point of Interest"}</span>
                </button>
              ))}
              {!loading && !filtered.length && <p className="py-8 text-center text-sm text-white/45">No map zones found.</p>}
            </div>
          </Card>
        </aside>
      </section>
    </main>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-xl border border-a2-border bg-black/35 p-3">
      <span className="block text-xs uppercase tracking-wide text-white/35">{label}</span>
      <span className="mt-1 block font-bold text-white/80">{value}</span>
    </div>
  );
}
