import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";
import { Reveal, staggerContainer, staggerItem } from "./Reveal";
import { TextAnimate } from "./ui/text-animate";

export default function Careers() {
  const { content } = useSite();
  const { t, isArabic } = useLanguage();
  return (
    <section id="careers" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <p className="text-sm font-medium text-violet-300">{t(content.careersSubtitle)}</p>
            <TextAnimate as="h2" by="word" animation="blurInUp" once className="magic-text mt-3 text-4xl font-semibold leading-[1.02] tracking-[-.045em] text-white sm:text-6xl">{t(content.careersTitle)}</TextAnimate>
            <p className="mt-4 max-w-sm text-white/55">{t(content.careersDesc)}</p>
            <Link to="/careers" className="mt-8 inline-flex items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/[.08] px-6 py-3 text-sm font-semibold text-violet-50 transition hover:bg-violet-400/[.14]">{t("View Careers Portal")} <ArrowRight size={16} className={isArabic ? "rotate-180" : ""} /></Link>
          </Reveal>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="flex flex-col gap-4">
            {content.careers.length === 0 ? (
              <div className="spotlight-card rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/45">
                {t("No career positions are posted right now.")}
              </div>
            ) : content.careers.map((c) => (
              <motion.div key={c.role} variants={staggerItem} whileHover={{ x: 6 }} className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-white/[.08] bg-white/[.025] px-6 py-5 shadow-[0_18px_50px_rgba(0,0,0,.16)] transition-colors hover:border-violet-300/20 hover:bg-violet-400/[.04]">
                <div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-400/10 text-violet-200"><Briefcase size={20} /></div>
                  <div><p className="text-lg font-semibold tracking-tight text-white">{t(c.role)}</p><p className="text-xs text-white/40">{t(c.dept)}</p></div>
                </div>
                <span className="whitespace-nowrap rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-[11px] font-medium text-violet-100">{t(c.type)}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
