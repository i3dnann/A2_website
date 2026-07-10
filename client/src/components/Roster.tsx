import { motion } from "framer-motion";
import { useSite } from "../context/SiteContext";
import { getIcon } from "../lib/iconMap";
import { Reveal, staggerContainer, staggerItem } from "./Reveal";

export default function Roster() {
  const { content } = useSite();
  return (
    <section id="roster" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">{content.rosterSubtitle}</p>
            <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">{content.rosterTitle}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-sm text-white/55">{content.rosterDesc}</p>
          </Reveal>
        </div>
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mt-14 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {content.roster.map((r) => {
            const Icon = getIcon(r.icon);
            return (
              <motion.div key={r.name} variants={staggerItem} whileHover={{ y: -4, scale: 1.02 }} className="group flex min-w-0 flex-col items-center text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#60519b]/30 blur-xl opacity-0 transition group-hover:opacity-100" />
                  <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-white/12 bg-gradient-to-br from-[#1a1328] to-black shadow-[0_18px_40px_rgba(0,0,0,0.36)] transition group-hover:border-[#8a7ac4]/65 sm:h-32 sm:w-32">
                    {r.avatar ? (
                      <img src={r.avatar} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Icon size={34} className="text-[#c8bcff]" />
                    )}
                  </div>
                </div>
                <h3 className="mt-4 max-w-full truncate font-serif text-lg text-white">{r.name}</h3>
                <p className="mt-1 max-w-full truncate text-xs font-semibold uppercase tracking-wider text-white/45">{r.role}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
