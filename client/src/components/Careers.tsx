import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";
import { Reveal, staggerContainer, staggerItem } from "./Reveal";

export default function Careers() {
  const { content } = useSite();
  const { t, isArabic } = useLanguage();
  return (
    <section id="careers" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">{t(content.careersSubtitle)}</p>
            <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">{t(content.careersTitle)}</h2>
            <p className="mt-4 max-w-sm text-white/55">{t(content.careersDesc)}</p>
            <Link to="/careers" className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-orange-400/40 hover:bg-white/10">{t("View Careers Portal")} <ArrowRight size={16} className={isArabic ? "rotate-180" : ""} /></Link>
          </Reveal>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="flex flex-col gap-4">
            {content.careers.length === 0 ? (
              <div className="spotlight-card rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/45">
                {t("No career positions are posted right now.")}
              </div>
            ) : content.careers.map((c) => (
              <motion.div key={c.role} variants={staggerItem} whileHover={{ x: 6 }} className="spotlight-card flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 transition-colors hover:border-orange-300/30">
                <div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300"><Briefcase size={20} /></div>
                  <div><p className="font-serif text-base text-white">{t(c.role)}</p><p className="text-xs uppercase tracking-wider text-white/40">{t(c.dept)}</p></div>
                </div>
                <span className="whitespace-nowrap rounded-full border border-orange-300/30 bg-orange-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-200">{t(c.type)}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
