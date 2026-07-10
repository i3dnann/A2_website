import { useRef, type PointerEvent, type WheelEvent } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import type { JourneyItem } from "../context/SiteContext";

function buildCurve(points: Array<{ x: number; y: number }>, yOffset = 0) {
  if (!points.length) return "";
  const start = points[0];
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const middle = (point.x - previous.x) / 2;
    return `${path} C ${previous.x + middle} ${previous.y + yOffset}, ${point.x - middle} ${point.y + yOffset}, ${point.x} ${point.y + yOffset}`;
  }, `M ${start.x} ${start.y + yOffset}`);
}

export default function RoadmapTimeline({ items }: { items: JourneyItem[] }) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const { t } = useLanguage();

  const scroll = (direction: -1 | 1) => {
    scroller.current?.scrollBy({ left: direction * 420, behavior: "smooth" });
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    const target = scroller.current;
    if (!target) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!delta) return;
    event.preventDefault();
    target.scrollLeft += delta;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = scroller.current;
    if (!target) return;
    drag.current = { active: true, startX: event.clientX, scrollLeft: target.scrollLeft };
    target.setPointerCapture(event.pointerId);
    target.classList.add("cursor-grabbing");
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const target = scroller.current;
    if (!target || !drag.current.active) return;
    target.scrollLeft = drag.current.scrollLeft - (event.clientX - drag.current.startX);
  };

  const stopDrag = (event: PointerEvent<HTMLDivElement>) => {
    const target = scroller.current;
    if (!target) return;
    drag.current.active = false;
    target.classList.remove("cursor-grabbing");
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/45">
        {t("No story milestones are published yet.")}
      </div>
    );
  }

  const width = Math.max(980, items.length * 260);
  const height = 340;
  const points = items.map((_, index) => ({
    x: Math.round((width / (items.length + 1)) * (index + 1)),
    y: Math.round(168 + Math.sin(index * 1.35) * 34),
  }));
  const mainCurve = buildCurve(points);
  const upperCurve = buildCurve(points, -12);
  const lowerCurve = buildCurve(points, 12);

  return (
    <div className="mt-14">
      <div className="mb-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-[#8a7ac4]/60 hover:bg-[#60519b]/20 hover:text-white"
          aria-label="Scroll roadmap left"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="rounded-full border border-[#60519b]/35 bg-[#60519b]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#cfc5ff]">
          {t("Scroll roadmap")}
        </div>
        <button
          type="button"
          onClick={() => scroll(1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-[#8a7ac4]/60 hover:bg-[#60519b]/20 hover:text-white"
          aria-label="Scroll roadmap right"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={scroller}
        dir="ltr"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onPointerLeave={(event) => { if (drag.current.active) stopDrag(event); }}
        className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#60519b]/50 cursor-grab touch-pan-x select-none overflow-x-auto overscroll-x-contain pb-6"
      >
        <div
          className="relative mx-auto h-[340px] min-w-[900px]"
          style={{ width: `${width}px` }}
        >
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.14)_1px,transparent_1px)] [background-size:54px_54px]" />
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#080808] to-transparent" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#080808] to-transparent" />

          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={upperCurve} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
            <path d={lowerCurve} fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="1" />
            <path d={mainCurve} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.4" />
            <path d={mainCurve} fill="none" stroke="url(#roadmapGlow)" strokeWidth="2.8" strokeLinecap="round" />
            <defs>
              <linearGradient id="roadmapGlow" x1="0" x2="1" y1="0" y2="0">
                <stop stopColor="#34d399" />
                <stop offset="0.55" stopColor="#60519b" />
                <stop offset="1" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>

          {items.map((item, index) => {
            const point = points[index];
            const top = index % 2 === 0;
            const active = index === items.length - 1;
            const labelTop = top ? Math.max(22, point.y - 112) : Math.min(height - 92, point.y + 42);
            const stemTop = top ? labelTop + 66 : point.y + 10;
            const stemHeight = top ? point.y - stemTop - 10 : labelTop - stemTop + 4;
            return (
              <div key={`${item.year}-${index}`}>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  whileInView={{ opacity: 1, height: Math.max(24, stemHeight) }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                  className="absolute w-px bg-white/18"
                  style={{ left: point.x, top: stemTop }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.55 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className={`absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#080808] ${active ? "bg-orange-400 shadow-[0_0_0_6px_rgba(249,115,22,0.16),0_0_22px_rgba(249,115,22,0.9)]" : "bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.12),0_0_18px_rgba(52,211,153,0.75)]"}`}
                  style={{ left: point.x, top: point.y }}
                />
                <motion.article
                  initial={{ opacity: 0, y: top ? -10 : 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.55, delay: index * 0.06 }}
                  className="absolute w-[190px] -translate-x-1/2 text-center"
                  style={{ left: point.x, top: labelTop }}
                  dir="auto"
                >
                  <h3 className={`text-sm font-bold ${active ? "text-orange-300" : "text-white/88"}`}>{t(item.title)}</h3>
                  {item.desc && <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/42">{t(item.desc)}</p>}
                  <span className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${active ? "border-orange-300/35 bg-orange-400/10 text-orange-300" : "border-white/15 bg-white/[0.04] text-white/70"}`}>
                    {item.year}
                  </span>
                </motion.article>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
