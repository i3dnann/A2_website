import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { getIcon } from "../lib/iconMap";
import { Reveal, staggerContainer, staggerItem } from "./Reveal";

export default function News() {
  const { content } = useSite();
  return (
    <section id="news" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">{content.newsSubtitle}</p>
          <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">{content.newsTitle}</h2>
        </Reveal>
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {content.news.map((n) => {
            const Icon = getIcon(n.icon);
            return (
              <motion.a href="#" key={n.title} variants={staggerItem} whileHover={{ y: -6 }} className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-orange-400/30">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300"><Icon size={20} /></div>
                <p className="mt-5 text-xs uppercase tracking-wider text-white/40">{n.date}</p>
                <h3 className="mt-2 font-serif text-lg text-white">{n.title}</h3>
                <p className="mt-2 flex-1 text-sm text-white/55">{n.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-amber-300">Read more <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></span>
              </motion.a>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
