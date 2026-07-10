import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import type { JourneyItem } from "../context/SiteContext";

export default function RoadmapTimeline({ items }: { items: JourneyItem[] }) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const { t } = useLanguage();

  const scroll = (direction: -1 | 1) => {
    scroller.current?.scrollBy({ left: direction * 420, behavior: "smooth" });
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
        className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#60519b]/50 overflow-x-auto overscroll-x-contain pb-4"
      >
        <div
          className="relative mx-auto h-[360px] min-w-[820px]"
          style={{ width: `${Math.max(880, items.length * 240)}px` }}
        >
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[#60519b]/80 to-transparent" />
          <div className="absolute left-0 right-0 top-1/2 h-[3px] max-w-full -translate-y-1/2 bg-gradient-to-r from-emerald-400/70 via-[#60519b]/60 to-transparent opacity-70" />

          <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(210px, 1fr))` }}>
            {items.map((item, index) => {
              const top = index % 2 === 1;
              return (
                <div key={`${item.year}-${index}`} className="relative px-5">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.45, delay: index * 0.04 }}
                    className="absolute left-1/2 top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/60 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.75)]"
                  />
                  <motion.article
                    initial={{ opacity: 0, y: top ? -18 : 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.55, delay: index * 0.06 }}
                    className={`absolute left-1/2 w-[210px] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#111016]/80 p-5 text-center shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur ${top ? "top-0" : "bottom-0"}`}
                    dir="auto"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-[#cfc5ff]">{item.year}</span>
                    <h3 className="mt-3 font-serif text-lg text-white">{t(item.title)}</h3>
                    {item.desc && <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/55">{t(item.desc)}</p>}
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
