import { motion } from "framer-motion";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";
import { getIcon } from "../lib/iconMap";
import { Reveal, staggerContainer, staggerItem } from "./Reveal";
import { TextAnimate } from "./ui/text-animate";

export default function Roster() {
  const { content } = useSite();
  const { t } = useLanguage();
  return (
    <section id="roster" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <p className="text-sm font-medium text-violet-300">{t(content.rosterSubtitle)}</p>
            <TextAnimate as="h2" by="word" animation="blurInUp" once className="magic-text mt-3 text-4xl font-semibold leading-[1.02] tracking-[-.045em] text-white sm:text-6xl">{t(content.rosterTitle)}</TextAnimate>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-sm text-white/55">{t(content.rosterDesc)}</p>
          </Reveal>
        </div>
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {content.roster.map((r) => {
            const Icon = getIcon(r.icon);
            return (
              <motion.div key={r.name} variants={staggerItem} whileHover={{ y: -5, scale: 1.015 }} className="group flex min-w-0 flex-col rounded-[1.5rem] border border-white/[.08] bg-white/[.025] p-3 text-left shadow-[0_18px_45px_rgba(0,0,0,.16)]">
                <div className="relative">
                  <div className="absolute inset-2 rounded-2xl bg-violet-500/20 blur-xl opacity-0 transition group-hover:opacity-100" />
                  <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#10141c] to-black transition group-hover:border-violet-300/35">
                    {r.avatar ? (
                      <img src={r.avatar} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Icon size={34} className="text-violet-200" />
                    )}
                  </div>
                </div>
                <h3 className="mt-3 max-w-full truncate text-base font-semibold text-white">{t(r.name)}</h3>
                <p className="mt-1 max-w-full truncate text-xs text-white/42">{t(r.role)}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
