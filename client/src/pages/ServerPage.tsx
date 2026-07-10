import { motion } from "framer-motion";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";
import { getIcon } from "../lib/iconMap";
import PageShell from "../components/PageShell";
import { staggerContainer, staggerItem } from "../components/Reveal";

export default function ServerPage() {
  const { content } = useSite();
  const { t } = useLanguage();
  return (
    <PageShell subtitle={content.featuresSubtitle} title={content.featuresTitle}>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mx-auto -mt-8 mb-10 max-w-xl text-center text-white/55"
      >
        {t(content.featuresDesc)}
      </motion.p>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {content.features.map((f) => {
          const Icon = getIcon(f.icon);
          return (
            <motion.div
              key={f.title}
              variants={staggerItem}
              whileHover={{ y: -8, borderColor: "rgba(96,81,155,0.35)" }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur transition-colors duration-300"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-600/0 blur-2xl transition-all duration-500 group-hover:bg-orange-600/20" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-orange-400/20 bg-orange-500/10 text-orange-300 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                <Icon size={22} />
              </div>
              <h3 className="relative mt-5 font-serif text-lg text-white">{t(f.title)}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-white/55">{t(f.desc)}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </PageShell>
  );
}
