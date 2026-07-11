import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, LifeBuoy, MessageCircle } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";
import { Reveal } from "./Reveal";

export default function CtaSection() {
  const { content } = useSite();
  const { t, isArabic } = useLanguage();
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10">
            <img src={content.ctaBackgroundImage || "/images/cta-street.jpg"} alt="Join Gotham City" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-br from-orange-900/60 via-black/70 to-orange-950/60" />
            <motion.div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity }} />
            <div className="relative flex flex-col items-center gap-8 px-6 py-16 text-center sm:px-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-white/80"><LifeBuoy size={14} /> {t("Need Support? Open a Ticket")}</div>
              <h2 className="max-w-2xl font-serif text-3xl text-white sm:text-4xl">{t(content.ctaTitle)}</h2>
              <p className="max-w-xl text-white/70">{t(content.ctaDesc)}</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/register" className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90">{t("Create Account")} <ArrowRight size={16} className={`transition-transform ${isArabic ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} /></Link>
                <a href={content.discordLink || "/"} target={content.discordLink && content.discordLink !== "#" ? "_blank" : undefined} rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"><MessageCircle size={16} /> {t("Join Discord")}</a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
