import { motion } from "framer-motion";
import { ArrowRight, Briefcase } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { Reveal, staggerContainer, staggerItem } from "./Reveal";

export default function Careers() {
  const { content } = useSite();
  return (
    <section id="careers" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-400">{content.careersSubtitle}</p>
            <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">{content.careersTitle}</h2>
            <p className="mt-4 max-w-sm text-white/55">{content.careersDesc}</p>
            <a href="#" className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-fuchsia-400/40 hover:bg-white/10">View Careers Portal <ArrowRight size={16} /></a>
          </Reveal>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="flex flex-col gap-4">
            {content.careers.map((c) => (
              <motion.div key={c.role} variants={staggerItem} whileHover={{ x: 6 }} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 transition-colors hover:border-amber-300/30">
                <div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><Briefcase size={20} /></div>
                  <div><p className="font-serif text-base text-white">{c.role}</p><p className="text-xs uppercase tracking-wider text-white/40">{c.dept}</p></div>
                </div>
                <span className="whitespace-nowrap rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200">{c.type}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
