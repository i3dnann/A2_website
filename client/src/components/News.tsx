import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";
import { getIcon } from "../lib/iconMap";
import { Reveal, staggerContainer, staggerItem } from "./Reveal";
import { TextAnimate } from "./ui/text-animate";

export default function News() {
  const { content } = useSite();
  const { t, isArabic } = useLanguage();
  return (
    <section id="news" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <Reveal className="max-w-3xl">
          <p className="text-sm font-medium text-violet-300">{t(content.newsSubtitle)}</p>
          <TextAnimate as="h2" by="word" animation="blurInUp" once className="magic-text mt-3 text-4xl font-semibold leading-[1.02] tracking-[-.045em] text-white sm:text-6xl">{t(content.newsTitle)}</TextAnimate>
        </Reveal>
        {content.news.length === 0 ? (
          <div className="spotlight-card mx-auto mt-10 max-w-xl rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/45">
            {t("No news posts are published yet.")}
          </div>
        ) : <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.news.map((n) => {
            const Icon = getIcon(n.icon);
            return (
              <motion.a href="/news" key={n.id || n.title} variants={staggerItem} whileHover={{ y: -6 }} className="surface-flat group flex min-h-72 flex-col rounded-[1.5rem] border border-white/[.08] p-7 transition-colors hover:border-violet-300/20">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-400/10 text-violet-200"><Icon size={20} /></div>
                <p className="mt-5 text-xs text-white/38">{n.date}</p>
                <h3 className="mt-3 text-xl font-semibold leading-tight tracking-tight text-white">{t(n.title)}</h3>
                <p className="mt-2 flex-1 text-sm text-white/55">{t(n.excerpt)}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-violet-200">{t("Read more")} <ArrowUpRight size={14} className={`transition-transform group-hover:-translate-y-1 ${isArabic ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} /></span>
              </motion.a>
            );
          })}
        </motion.div>}
      </div>
    </section>
  );
}
