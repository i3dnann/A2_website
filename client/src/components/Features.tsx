import { motion } from "framer-motion";
import { useSite } from "../context/SiteContext";
import { getIcon } from "../lib/iconMap";
import { Reveal, staggerContainer, staggerItem } from "./Reveal";

export default function Features() {
  const { content } = useSite();
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">{content.featuresSubtitle}</p>
          <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">{content.featuresTitle}</h2>
          <p className="mt-4 text-white/55">{content.featuresDesc}</p>
        </Reveal>
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.features.map((f) => {
            const Icon = getIcon(f.icon);
            return (
              <motion.div key={f.title} variants={staggerItem} whileHover={{ y: -8 }} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur transition-colors hover:border-orange-400/30">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-600/0 blur-2xl transition-all duration-500 group-hover:bg-orange-600/20" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-orange-400/20 bg-orange-500/10 text-orange-300 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <Icon size={22} />
                </div>
                <h3 className="relative mt-5 font-serif text-lg text-white">{f.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-white/55">{f.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
