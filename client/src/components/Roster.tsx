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
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.roster.map((r) => {
            const Icon = getIcon(r.icon);
            return (
              <motion.div key={r.name} variants={staggerItem} whileHover={{ scale: 1.02 }} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-6 transition-colors hover:border-orange-300/30">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600/30 to-orange-700/30 text-orange-200"><Icon size={24} /></div>
                <div><h3 className="font-serif text-lg text-white">{r.name}</h3><p className="text-sm text-white/50">{r.role}</p><p className="mt-1 text-xs uppercase tracking-wider text-orange-300/80">{r.count}</p></div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
