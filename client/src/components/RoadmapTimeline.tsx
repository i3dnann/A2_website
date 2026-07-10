import { useRef, type PointerEvent, type WheelEvent } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import type { JourneyItem } from "../context/SiteContext";

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
        className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#60519b]/50 cursor-grab touch-pan-x select-none overflow-x-auto overscroll-x-contain pb-4"
      >
        <div
          className="relative mx-auto h-[330px] min-w-[860px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0c12]/72"
          style={{ width: `${Math.max(920, items.length * 250)}px` }}
        >
          <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:44px_44px]" />
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/15" />
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-gradient-to-r from-emerald-400/90 via-[#60519b]/80 to-emerald-300/30" />

          <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(210px, 1fr))` }}>
            {items.map((item, index) => {
              const top = index % 2 === 1;
              return (
                <div key={`${item.year}-${index}`} className="relative px-5">
                  <div className={`absolute left-1/2 w-px -translate-x-1/2 bg-white/15 ${top ? "top-[74px] h-[83px]" : "bottom-[74px] h-[83px]"}`} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.45, delay: index * 0.04 }}
                    className="absolute left-1/2 top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b0c12] bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.12),0_0_18px_rgba(52,211,153,0.85)]"
                  />
                  <motion.article
                    initial={{ opacity: 0, y: top ? -18 : 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.55, delay: index * 0.06 }}
                    className={`absolute left-1/2 w-[218px] -translate-x-1/2 rounded-lg border border-white/10 bg-black/30 p-4 text-center ${top ? "top-5" : "bottom-5"}`}
                    dir="auto"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">{item.year}</span>
                    <h3 className="mt-2 text-base font-bold text-white">{t(item.title)}</h3>
                    {item.desc && <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/55">{t(item.desc)}</p>}
                  </motion.article>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
