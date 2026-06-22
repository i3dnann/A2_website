import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Minus, Plus, RotateCcw } from "lucide-react";

const TILE_SIZE = 256;
const TILE_LEVEL = 3;
const TILE_COUNT = 2 ** TILE_LEVEL;
const MAP_SIZE = TILE_SIZE * TILE_COUNT;
const TILE_BASE = "https://cdn.jsdelivr.net/gh/ONyambura/gtav_map_tiles@main/mainmap";
const DEFAULT_ZOOM = 0.28;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 1.8;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pinValue(value, fallback = 50) {
  const number = Number(value);
  return Number.isFinite(number) ? clamp(number, 0, 100) : fallback;
}

export function GtaTiles() {
  const tiles = [];
  for (let y = 0; y < TILE_COUNT; y += 1) {
    for (let x = 0; x < TILE_COUNT; x += 1) {
      tiles.push(
        <img
          key={`${x}-${y}`}
          src={`${TILE_BASE}/${TILE_LEVEL}/${x}_${y}.png`}
          alt=""
          draggable="false"
          loading="eager"
          className="gta-map-tile"
          style={{ left: x * TILE_SIZE, top: y * TILE_SIZE }}
        />
      );
    }
  }
  return <>{tiles}</>;
}

export default function GtaMap2D({ zones = [], selectedId, onSelect, editable = false, draft, onPlace }) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(null);
  const movedRef = useRef(false);
  const planeRef = useRef(null);

  const visibleZones = useMemo(() => zones.filter(Boolean), [zones]);

  const resetView = () => {
    setZoom(DEFAULT_ZOOM);
    setOffset({ x: 0, y: 0 });
  };

  const startDrag = (event) => {
    if (event.button !== 0) return;
    movedRef.current = false;
    setDragging({ x: event.clientX, y: event.clientY, offset });
  };

  useEffect(() => {
    if (!dragging) return undefined;
    const move = (event) => {
      const dx = event.clientX - dragging.x;
      const dy = event.clientY - dragging.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
      setOffset({ x: dragging.offset.x + dx, y: dragging.offset.y + dy });
    };
    const stop = () => {
      setDragging(null);
      window.setTimeout(() => {
        movedRef.current = false;
      }, 0);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
  }, [dragging]);

  const placePin = (event) => {
    if (!editable || !onPlace || movedRef.current) return;
    const rect = planeRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    onPlace({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
  };

  return (
    <div className="gta-map-shell" style={{ minHeight: editable ? 660 : 620 }}>
      <div className="gta-map-controls">
        <button type="button" onClick={() => setZoom((value) => clamp(value + 0.1, MIN_ZOOM, MAX_ZOOM))} aria-label="Zoom in"><Plus size={16} /></button>
        <button type="button" onClick={() => setZoom((value) => clamp(value - 0.1, MIN_ZOOM, MAX_ZOOM))} aria-label="Zoom out"><Minus size={16} /></button>
        <button type="button" onClick={resetView} aria-label="Reset map"><RotateCcw size={16} /></button>
      </div>

      <div
        className="gta-map-stage"
        style={{ perspective: "none" }}
        onPointerDown={startDrag}
        onWheel={(event) => {
          event.preventDefault();
          setZoom((value) => clamp(value + (event.deltaY > 0 ? -0.06 : 0.06), MIN_ZOOM, MAX_ZOOM));
        }}
      >
        <div
          ref={planeRef}
          className="gta-map-plane gta-map-plane-tiles"
          onClick={placePin}
          style={{
            left: "50%",
            top: "50%",
            width: MAP_SIZE,
            height: MAP_SIZE,
            transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`
          }}
        >
          <GtaTiles />
          <div className="gta-map-grid" />

          {visibleZones.map((zone) => (
            <button
              key={zone.id || `${zone.zone_name}-${zone.position_x}-${zone.position_y}`}
              type="button"
              className={`gta-map-marker ${selectedId === zone.id ? "is-active" : ""}`}
              style={{ left: `${pinValue(zone.position_x)}%`, top: `${pinValue(zone.position_y)}%`, "--pin-color": zone.color || "#b7fe1a" }}
              title={zone.zone_name}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onSelect?.(zone);
              }}
            >
              <span className="gta-map-marker-core"><MapPin size={20} /></span>
            </button>
          ))}

          {editable && draft && (
            <span className="gta-map-marker is-active" style={{ left: `${pinValue(draft.position_x)}%`, top: `${pinValue(draft.position_y)}%`, "--pin-color": draft.color || "#b7fe1a" }}>
              <span className="gta-map-marker-core"><MapPin size={20} /></span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
