import { motion } from "framer-motion";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";
import { getIcon } from "../lib/iconMap";
import { Reveal, staggerContainer, staggerItem } from "./Reveal";
import { MagicCard } from "./ui/magic-card";
import { TextAnimate } from "./ui/text-animate";

export default function Features() {
  const { content } = useSite();
  const { t } = useLanguage();
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <Reveal className="max-w-3xl">
          <p className="text-sm font-medium text-violet-300">{t(content.featuresSubtitle)}</p>
          <TextAnimate as="h2" by="word" animation="blurInUp" once className="magic-text mt-3 text-4xl font-semibold leading-[1.02] tracking-[-.045em] text-white sm:text-6xl">{t(content.featuresTitle)}</TextAnimate>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/48">{t(content.featuresDesc)}</p>
        </Reveal>
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.features.map((f) => {
            const Icon = getIcon(f.icon);
            return (
              <motion.div key={f.title} variants={staggerItem} whileHover={{ y: -6 }} className="rounded-[1.5rem]">
                <MagicCard gradientColor="#121625" gradientFrom="var(--site-primary)" gradientTo="var(--site-accent)" gradientOpacity={0.35} className="surface-flat group h-full rounded-[1.5rem] p-7 sm:p-8">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-400/10 text-violet-200 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <Icon size={22} />
                  </div>
                  <h3 className="relative mt-7 text-xl font-semibold tracking-tight text-white">{t(f.title)}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-white/52">{t(f.desc)}</p>
                </MagicCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
